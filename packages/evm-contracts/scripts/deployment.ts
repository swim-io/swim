import { ethers, network, deployments } from "hardhat";
import { DeploymentSubmission } from "hardhat-deploy/dist/types";
import { deployProxy } from "../utils/factory_v2";
import * as dotenv from "dotenv";

dotenv.config();
const { FACTORY_MNEMONIC } = process.env;

const LP_EQUALIZER = -2;

const SWIM_FACTORY_ADDRESS = "0x77C1f7813D79c8e6E37DE1aA631B6F961fD45648";
const DEFAULT_SALT = "0x" + "00".repeat(32);

const GOERLI = {
  wormholeTokenBridge: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
  poolTokens: [
    //usdc and usdt both already have 6 decimals on Goerli
    { address: "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557", tokenNumber: 1, equalizer: 0 }, //USDC
    { address: "0x509Ee0d083DdF8AC028f2a56731412edD63223B9", tokenNumber: 2, equalizer: 0 }, //USDT
  ],
};

const BNB_TESTNET = {
  wormholeTokenBridge: "0x9dcF9D205C9De35334D646BeE44b2D2859712A09",
  poolTokens: [
    { address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC", tokenNumber: 3, equalizer: -12 }, //BUSD
    { address: "0x98529E942FD121d9C470c3d4431A008257E0E714", tokenNumber: 2, equalizer: -12 }, //USDT
  ],
};

const CHAIN_SPECIFIC = {
  31337: GOERLI,
  5: GOERLI,
  97: BNB_TESTNET,
};

const isDeployed = async (address: string) => (await ethers.provider.getCode(address)).length > 2;

async function main() {
  const { get, save, getArtifact } = deployments;

  const chainId = (await ethers.provider.detectNetwork()).chainId;
  console.log("executing deployment script for chain:", chainId);

  const chainSpecific = CHAIN_SPECIFIC[chainId as keyof typeof CHAIN_SPECIFIC];
  if (!chainSpecific) throw Error("Network with chainId " + chainId + " not implemented yet");

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
      [deployer.address, chainSpecific.wormholeTokenBridge]
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
    const lpName = "Test Pool LP";
    const lpSymbol = "LP";
    const lpSalt = "0x" + "00".repeat(31) + "11";
    const ampFactor = 1_000; //1 with 3 decimals
    const lpFee = 300; //fee as 100th of a bip (6 decimals, 1 = 100 % fee)
    const governanceFee = 100;
    const initializeEncoded = new ethers.utils.Interface(artifacts.abi).encodeFunctionData(
      "initialize",
      [
        lpName,
        lpSymbol,
        lpSalt,
        LP_EQUALIZER,
        chainSpecific.poolTokens.map((t) => t.address),
        chainSpecific.poolTokens.map((t) => t.equalizer),
        ampFactor,
        lpFee,
        governanceFee,
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
      args: [poolProxy.address, lpName, lpSymbol],
    };
    await save("LpTokenProxy", lpTokenProxy);
  };

  await deployLogic("Routing");
  await deployLogic("LpToken");
  await deployLogic("Pool");
  await deployRouting();
  await deployPool();

  const poolAddress = (await get("PoolProxy")).address;

  const routingProxy = await ethers.getContractAt("Routing", (await get("RoutingProxy")).address);
  for (let i = 0; i < chainSpecific.poolTokens.length; ++i) {
    const poolToken = chainSpecific.poolTokens[i];
    await routingProxy.registerToken(poolToken.tokenNumber, poolToken.address, poolAddress, i + 1);
  }

  // console.log("Routing proxy", routingProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
