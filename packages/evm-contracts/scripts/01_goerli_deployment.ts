import { ethers, network, deployments } from "hardhat";
import { DeploymentSubmission } from "hardhat-deploy/dist/types";
import { deployProxy } from "../utils/factory_v2";
import * as dotenv from "dotenv";

dotenv.config();
const { FACTORY_MNEMONIC } = process.env;

const USDC_TOKENNUMBER = 1;
const USDT_TOKENNUMBER = 2;

const LP_EQUALIZER = -2;
//usdc and usdt both already have 6 decimals
const USDC_EQUALIZER = 0;
const USDT_EQUALIZER = 0;

const SWIM_FACTORY_ADDRESS = "0x77C1f7813D79c8e6E37DE1aA631B6F961fD45648";
const DEFAULT_SALT = "0x" + "00".repeat(32);

const GOERLI = {
  WORMHOLE_TOKEN_BRIDGE: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
  USDC: "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557",
  USDT: "0x509Ee0d083DdF8AC028f2a56731412edD63223B9",
};

const ONCHAIN_ADDRESSES = {
  5: GOERLI,
};

const isDeployed = async (address: string) => (await ethers.provider.getCode(address)).length > 2;

async function main() {
  const { get, save, getArtifact } = deployments;

  const chainId = (await ethers.provider.detectNetwork()).chainId;
  console.log("executing deployment script for chain:", chainId);

  const addresses = ONCHAIN_ADDRESSES[chainId as keyof typeof ONCHAIN_ADDRESSES];
  if (!addresses)
    throw Error("Network with chainId " + chainId + " not implemented yet");

  const [deployer, governance, governanceFeeRecipient] = await ethers.getSigners();

  const deploySwimFactory = async () => {
    if (await isDeployed(SWIM_FACTORY_ADDRESS)) {
      console.log("SwimFactory was already deployed at:", SWIM_FACTORY_ADDRESS);
      return await ethers.getContractAt("SwimFactory", SWIM_FACTORY_ADDRESS);
    }

    if (typeof FACTORY_MNEMONIC === "undefined")
      throw Error("Factory Mnemonic not set in environment");
    const factoryDeployer = await (ethers.Wallet.fromMnemonic(FACTORY_MNEMONIC).connect(deployer.provider!));

    if (await factoryDeployer.getTransactionCount() != 0)
      throw Error("factory deployer " + factoryDeployer.address + " has nonzero transaction count on network " + chainId);

    const swimFactoryFactory = await ethers.getContractFactory("SwimFactory");
    const gasEstimate = deployer.estimateGas(await swimFactoryFactory.getDeployTransaction(deployer.address));
    const {maxFeePerGas} = (await ethers.getDefaultProvider().getFeeData());
    const maxCost = (await gasEstimate).mul(maxFeePerGas!);
    const curBalance = await factoryDeployer.getBalance();

    if (curBalance.lt(maxCost)) {
      const topup = maxCost.sub(curBalance);
      if ((await deployer.getBalance()).lt(topup))
        throw Error("deployer has insufficient funds to send to factory deployer");
      //strictly speaking this could still fail because we have to pay for the
      // gas of the transaction too and then there might not be enough left...
      await deployer.sendTransaction({to: factoryDeployer.address, value: topup});
    }

    console.log("deployer:", deployer.address, "factoryDeployer:", factoryDeployer.address);

    const swimFactory = await (await swimFactoryFactory.connect(factoryDeployer).deploy(deployer.address)).deployed();
    if (swimFactory.address != SWIM_FACTORY_ADDRESS)
      throw Error("deployed SwimFactory has unexpected address - expected: " + SWIM_FACTORY_ADDRESS + " but got: " + swimFactory.address);

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
  }

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
        [addresses.USDC, addresses.USDT],
        [USDC_EQUALIZER, USDT_EQUALIZER],
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
      (await get("Pool")).address,
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
    console.log("LpTokenProxy:", lpTokenProxy);
    await save("LpTokenProxy", lpTokenProxy);
  };

  await deployLogic("Routing");
  await deployLogic("LpToken");
  await deployLogic("Pool");
  await deployRouting();
  await deployPool();

  const poolAddress = (await get("PoolProxy")).address;

  // const routingProxy = await ethers.getContractAt("Routing", (await get("RoutingProxy")).address);
  // await routingProxy.registerToken(USDC_TOKENNUMBER, addresses.USDC, poolAddress, 1);
  // await routingProxy.registerToken(USDT_TOKENNUMBER, addresses.USDT, poolAddress, 2);

  // console.log("Routing proxy", routingProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
