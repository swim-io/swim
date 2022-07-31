// import * as dotenv from "dotenv";

// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { DeployFunction } from "hardhat-deploy/types";
// import "hardhat-deploy";
// import "@nomiclabs/hardhat-ethers";
// import { deployProxy } from "../utils/factoryDeploy";
// import { Pool, Routing } from "../typechain-types/contracts";

// const WORMHOLE_TOKEN_BRIDGE = "0xF890982f9310df57d00f659cf4fd87e65adEd8d7";
// const USDC_ADDRESS = "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557";
// const USDT_ADDRESS = "0x509Ee0d083DdF8AC028f2a56731412edD63223B9";
// const USDC_TOKENNUMBER = 1;
// const USDT_TOKENNUMBER = 2;

// const LP_EQUALIZER = -2;
// //usdc and usdt both already have 6 decimals
// const USDC_EQUALIZER = 0;
// const USDT_EQUALIZER = 0;

// dotenv.config();
// const { FACTORY_MNEMONIC, MNEMONIC } = process.env;

// const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//   const { save, get, getArtifact, rawTx } = hre.deployments;
//   const { deployer, governance, governanceFeeRecipient } = await hre.getNamedAccounts();
//   const { ethers } = hre;

//   await deployFactory();
//   await deployLogic("Routing");
//   await deployLogic("LpToken");
//   await deployLogic("Pool");
//   await deployRouting();
//   await deployPool();

//   const poolAddress = (await get("PoolProxy")).address;

//   const routing = (await ethers.getContract("RoutingProxy")) as Routing;
//   await routing.registerToken(USDC_TOKENNUMBER, USDC_ADDRESS, poolAddress, 1);
//   await routing.registerToken(USDT_TOKENNUMBER, USDT_ADDRESS, poolAddress, 2);
// };

// export default func;
// func.id = "all";
// func.tags = ["all"];

import hre, { ethers, run, network, upgrades, deployments } from "hardhat";
import { BN } from "bn.js";
import verify from "./helpers";
import { developmentChains, SALT, VERIFICATION_BLOCK_CONFIRMATIONS } from "../helper-config";
import { DeploymentSubmission } from "hardhat-deploy/dist/types";
import { deployProxy } from "../utils/factory_v2";
import "dotenv/config";

async function main() {
  const { get, save, getArtifact } = deployments;
  const chainId = 5;
  const WORMHOLE_TOKEN_BRIDGE = "0xF890982f9310df57d00f659cf4fd87e65adEd8d7";
  const USDC_ADDRESS = "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557";
  const USDT_ADDRESS = "0x509Ee0d083DdF8AC028f2a56731412edD63223B9";
  const USDC_TOKENNUMBER = 1;
  const USDT_TOKENNUMBER = 2;

  const LP_EQUALIZER = -2;
  //usdc and usdt both already have 6 decimals
  const USDC_EQUALIZER = 0;
  const USDT_EQUALIZER = 0;

  const [deployer, factoryDeployer, governance, governanceFeeRecipient] = await ethers.getSigners();
  let logicAddresses: Record<string, string> = {};

  console.log("deployer", deployer.address, "factory", factoryDeployer.address);

  const SwimFactory = await ethers.getContractFactory("SwimFactory");
  let swimFactoryContract = await SwimFactory.deploy(factoryDeployer.address);
  swimFactoryContract = await swimFactoryContract.deployed();
  const txHash = swimFactoryContract.deployTransaction.hash;

  const receipt = await network.provider.send("eth_getTransactionReceipt", [txHash]);
  const artifact = await getArtifact("SwimFactory");

  const deployment = {
    ...artifact,
    address: swimFactoryContract.address,
    args: [deployer.address],
    transactionHash: receipt.hash,
    receipt,
    newlyDeployed: true,
  };
  await save("SwimFactory", deployment);

  console.log("SwimFactory", swimFactoryContract.address, await swimFactoryContract.owner());
  console.log("THash", txHash);

  const deployLogic = async (contractName: string) => {
    const contract = await ethers.getContractFactory(contractName);
    const artifacts = await getArtifact(contractName);
    const bytecode = contract.bytecode;

    const logicAddress = await swimFactoryContract.determineLogicAddress(bytecode, SALT);
    const createLogic = await swimFactoryContract
      .attach(deployer.address)
      .createLogic(bytecode, SALT);

    const deployment: DeploymentSubmission = {
      ...artifacts,
      address: logicAddress,
      args: [],
      transactionHash: createLogic.transactionHash,
      receipt: createLogic,
    };
    await save(contractName, deployment);
    const address = (await hre.deployments.get(contractName)).address;
    logicAddresses[contractName] = address;

    console.log(contractName, "(logic):", address);
  };

  const deployRouting = async () => {
    const artifacts = await getArtifact("Routing");
    const routingContract = await get("Routing");
    const initializeEncoded = new ethers.utils.Interface(artifacts.abi).encodeFunctionData(
      "initialize",
      [deployer.address, WORMHOLE_TOKEN_BRIDGE]
    );

    const routingProxy = await deployProxy(
      "RoutingProxy",
      "Routing",
      routingContract.address,
      swimFactoryContract,
      SALT,
      initializeEncoded
    );
    console.log("RoutingProxy:", routingProxy.address);
  };

  const deployPool = async () => {
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
        [USDC_ADDRESS, USDT_ADDRESS],
        [USDC_EQUALIZER, USDT_EQUALIZER],
        ampFactor,
        lpFee,
        governanceFee,
        governance.address,
        governance.address, // TODO: failes with governanceFeeRecipient
      ]
    );

    const poolSalt = "0x" + "00".repeat(31) + "01";
    const poolProxy = await deployProxy(
      "PoolProxy",
      "Pool",
      logicAddresses["Pool"],
      swimFactoryContract,
      poolSalt,
      initializeEncoded
    );
    console.log("PoolProxy:", poolProxy.address);
    //TODO save lp token as deployment

    const lpTokenProxy = {
      ...(await getArtifact("LpToken")),
      address: logicAddresses["LpToken"],
      receipt: poolProxy.receipt,
      transactionHash: poolProxy.transactionHash,
      args: [poolProxy.address, lpName, lpSymbol],
    };
    // console.log("LpTokenProxy:", lpTokenProxy);
    await save("LpTokenProxy", lpTokenProxy);
  };

  await deployLogic("Routing");
  await deployLogic("LpToken");
  await deployLogic("Pool");
  await deployRouting();
  await deployPool();

  const poolAddress = (await get("PoolProxy")).address;

  const routing = await ethers.getContract("RoutingProxy");
  await routing.registerToken(USDC_TOKENNUMBER, USDC_ADDRESS, poolAddress, 1);
  await routing.registerToken(USDT_TOKENNUMBER, USDT_ADDRESS, poolAddress, 2);

  if (network.config.chainId === chainId) {
    await swimFactoryContract.deployTransaction.wait(6);
    await verify(swimFactoryContract.address, [factoryDeployer.address]);
  }

  // console.log("Routing proxy", routingProxy.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
