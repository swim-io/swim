import { ethers, network, deployments } from "hardhat";
import { DeploymentSubmission } from "hardhat-deploy/dist/types";
import { deployProxy } from "../utils/factoryDeployProxy";
import * as dotenv from "dotenv";
import { ONCHAIN_ADDRESSES, SWIM_FACTORY_ADDRESS, DEFAULT_SALT } from "../utils/deploymentConfig";

dotenv.config();
const { FACTORY_MNEMONIC } = process.env;

const isDeployed = async (address: string) => (await ethers.provider.getCode(address)).length > 2;

async function main() {
  const { get, save, getArtifact } = deployments;

  const chainId = (await ethers.provider.detectNetwork()).chainId;
  console.log("executing deployment script for chain:", chainId);

  const addresses = ONCHAIN_ADDRESSES[chainId as keyof typeof ONCHAIN_ADDRESSES];
  if (!addresses) throw Error("Network with chainId " + chainId + " not implemented yet");

  const [deployer, governance, governanceFeeRecipient] = await ethers.getSigners();

  const deploySwimFactory = async () => {
    if (await isDeployed(SWIM_FACTORY_ADDRESS)) {
      console.log("SwimFactory was already deployed at:", SWIM_FACTORY_ADDRESS);
      return await ethers.getContractAt("SwimFactory", SWIM_FACTORY_ADDRESS);
    }

    if (typeof FACTORY_MNEMONIC === "undefined")
      throw Error("Factory Mnemonic not set in environment");
    const factoryDeployer = await ethers.Wallet.fromMnemonic(FACTORY_MNEMONIC).connect(
      deployer.provider!
    );

    if ((await factoryDeployer.getTransactionCount()) != 0)
      throw Error(
        "factory deployer " +
          factoryDeployer.address +
          " has nonzero transaction count on network " +
          chainId
      );

    const swimFactoryFactory = await ethers.getContractFactory("SwimFactory");
    const gasEstimate = deployer.estimateGas(
      await swimFactoryFactory.getDeployTransaction(deployer.address)
    );
    const { maxFeePerGas } = await ethers.getDefaultProvider().getFeeData();
    const maxCost = (await gasEstimate).mul(maxFeePerGas!);
    const curBalance = await factoryDeployer.getBalance();

    if (curBalance.lt(maxCost)) {
      const topup = maxCost.sub(curBalance);
      if ((await deployer.getBalance()).lt(topup))
        throw Error("deployer has insufficient funds to send to factory deployer");
      //strictly speaking this could still fail because we have to pay for the
      // gas of the transaction too and then there might not be enough left...
      await deployer.sendTransaction({ to: factoryDeployer.address, value: topup });
    }

    console.log("deployer:", deployer.address, "factoryDeployer:", factoryDeployer.address);

    const swimFactory = await (
      await swimFactoryFactory.connect(factoryDeployer).deploy(deployer.address)
    ).deployed();
    if (swimFactory.address != SWIM_FACTORY_ADDRESS)
      throw Error(
        "deployed SwimFactory has unexpected address - expected: " +
          SWIM_FACTORY_ADDRESS +
          " but got: " +
          swimFactory.address
      );

    const txHash = swimFactory.deployTransaction.hash;

    const receipt = await network.provider.send("eth_getTransactionReceipt", [txHash]);
    const artifact = await getArtifact("SwimFactory");

    const deployment = {
      ...artifact,
      address: swimFactory.address,
      args: [deployer.address],
      transactionHash: receipt.hash,
      receipt,
      newlyDeployed: true,
    };
    await save("SwimFactory", deployment);

    console.log("SwimFactory", swimFactory.address, await swimFactory.owner());
    console.log("THash", txHash);
    return swimFactory;
  };

  const swimFactory = await deploySwimFactory();

  const deployLogic = async (contractName: string) => {
    const contract = await ethers.getContractFactory(contractName);
    const artifacts = await getArtifact(contractName);
    const bytecode = contract.bytecode;

    const logicAddress = await swimFactory.determineLogicAddress(bytecode, DEFAULT_SALT);
    if (await isDeployed(logicAddress)) {
      console.log("Logic contract", contractName, "was already deployed at:", logicAddress);
      return;
    }

    const receipt = await swimFactory.createLogic(bytecode, DEFAULT_SALT);

    const deployment: DeploymentSubmission = {
      ...artifacts,
      address: logicAddress,
      args: [],
      transactionHash: receipt.transactionHash,
      receipt: receipt,
    };
    await save(contractName, deployment);

    console.log(contractName, "(logic):", deployment.address);
  };

  const deployRouting = async () => {
    const routingProxyAddress = await swimFactory.determineProxyAddress(DEFAULT_SALT);
    if (await isDeployed(routingProxyAddress)) {
      console.log("Routing Proxy was already deployed at:", routingProxyAddress);
      return;
    }

    const artifacts = await getArtifact("Routing");
    const routingContract = await get("Routing");
    const initializeEncoded = new ethers.utils.Interface(artifacts.abi).encodeFunctionData(
      "initialize",
      [deployer.address, addresses.WORMHOLE_TOKEN_BRIDGE]
    );

    const routingProxy = await deployProxy(
      "RoutingProxy",
      "Routing",
      routingContract.address,
      swimFactory,
      DEFAULT_SALT,
      initializeEncoded
    );
    console.log("RoutingProxy:", routingProxy.address);
  };

  const deployPool = async () => {
    const poolSalt = "0x" + "00".repeat(31) + "01";
    const poolProxyAddress = await swimFactory.determineProxyAddress(poolSalt);
    if (await isDeployed(poolProxyAddress)) {
      console.log("Pool Proxy was already deployed at:", poolProxyAddress);
      return;
    }

    const artifacts = await getArtifact("Pool");
    const tokenAddresses = addresses.TOKENS.map((token) => token.address);
    const tokenEqualizer = addresses.TOKENS.map((token) => token.equalizer);
    const initializeEncoded = new ethers.utils.Interface(artifacts.abi).encodeFunctionData(
      "initialize",
      [
        addresses.POOL.lpName,
        addresses.POOL.lpSymbol,
        addresses.POOL.lpSalt,
        addresses.POOL.lpEquilizer,
        tokenAddresses,
        tokenEqualizer,
        addresses.POOL.ampFactor,
        addresses.POOL.lpFee,
        addresses.POOL.governanceFee,
        governance.address,
        governanceFeeRecipient.address,
      ]
    );

    const poolProxy = await deployProxy(
      "PoolProxy",
      "Pool",
      (
        await get("Pool")
      ).address,
      swimFactory,
      poolSalt,
      initializeEncoded
    );
    console.log("PoolProxy:", poolProxy.address);

    const lpTokenProxy = {
      ...(await getArtifact("LpToken")),
      address: (await get("LpToken")).address,
      receipt: poolProxy.receipt,
      transactionHash: poolProxy.transactionHash,
      args: [poolProxy.address, addresses.POOL.lpName, addresses.POOL.lpSymbol],
    };
    console.log("LpTokenProxy:", lpTokenProxy);
    await save("LpTokenProxy", lpTokenProxy);
  };

  await deployLogic("Routing");
  await deployLogic("LpToken");
  await deployLogic("Pool");
  await deployRouting();
  await deployPool();

  const poolAddress = (await get("PoolProxy")).address;
  const routingProxy = (await get("RoutingProxy")).address;

  if (!poolAddress || !routingProxy) {
    console.log("routing proxy", routingProxy);
    console.log("pool proxy", poolAddress);
    throw Error("Pool or Routing address not found");
  }
  const routing = await ethers.getContractAt("Routing", routingProxy);
  await Promise.allSettled(
    addresses.TOKENS.map(
      async (token) =>
        await routing.registerToken(token.routingIndex, token.address, poolAddress, token.poolIndex)
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
