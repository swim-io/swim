import * as dotenv from "dotenv";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { deployProxy } from "../../utils/factoryDeploy";
import { Pool, Routing } from "../../typechain-types/contracts";

const WORMHOLE_TOKEN_BRIDGE = "0xF890982f9310df57d00f659cf4fd87e65adEd8d7";
const USDC_ADDRESS = "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557";
const USDT_ADDRESS = "0x509Ee0d083DdF8AC028f2a56731412edD63223B9";
const USDC_TOKENNUMBER = 1;
const USDT_TOKENNUMBER = 2;

const LP_EQUALIZER = -2;
//usdc and usdt both already have 6 decimals
const USDC_EQUALIZER = 0;
const USDT_EQUALIZER = 0;

dotenv.config();
const { FACTORY_MNEMONIC, MNEMONIC } = process.env;

module.exports = async function (hre: HardhatRuntimeEnvironment) {
  const { save, get, getArtifact, rawTx } = hre.deployments;
  const { deployer, governance, governanceFeeRecipient } = await hre.getNamedAccounts();
  const { ethers } = hre;

  const deployFactory = async () => {
    if (typeof FACTORY_MNEMONIC === "undefined")
      throw Error("Factory Mnemonic not set in environment");
    const factDeployer = ethers.Wallet.fromMnemonic(FACTORY_MNEMONIC);
    const deployerWallet = ethers.Wallet.fromMnemonic(MNEMONIC!);
    await deployerWallet.sendTransaction({ to: factDeployer.address, value: "3750000000000000" });
    const contract = await (await ethers.getContractFactory("SwimFactory"))
      .connect(factDeployer)
      .deploy(deployer);
    //await contract.deployed();
    const txHash = contract.deployTransaction.hash;

    const ethersTx = await hre.ethers.provider.getTransaction(txHash);
    const receipt = await hre.network.provider.send("eth_getTransactionReceipt", [txHash]);
    //const deployedTx = await hre.network.provider.send("eth_getTransactionByHash", [txHash]);
    const factoryAddress = (ethersTx as unknown as { creates: string }).creates;
    console.log("SwimFactory:", factoryAddress);

    const deployment = {
      ...(await getArtifact("SwimFactory")),
      address: factoryAddress,
      args: [deployer],
      transactionHash: receipt.hash,
      receipt,
      newlyDeployed: true,
    };
    await save("SwimFactory", deployment);
  };

  const deployLogic = async (logicContract: string, salt: string = "0x" + "00".repeat(32)) => {
    const { save, read, execute, getArtifact } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    const logic = await getArtifact(logicContract);
    const bytecode = logic.bytecode;

    const ctAddress = await read("SwimFactory", {}, "determineLogicAddress", bytecode, salt);

    const receipt = await execute("SwimFactory", { from: deployer }, "createLogic", bytecode, salt);

    const deployment = {
      ...logic,
      address: ctAddress,
      args: [],
      transactionHash: receipt.transactionHash,
      receipt,
      newlyDeployed: true,
    };
    await save(logicContract, deployment);
    console.log(logicContract, "(logic):", (await hre.deployments.get(logicContract)).address);
  };

  const deployRouting = async () => {
    const routing = await getArtifact("Routing");
    const initializeEncoded = new ethers.utils.Interface(routing.abi).encodeFunctionData(
      "initialize",
      [deployer, WORMHOLE_TOKEN_BRIDGE]
    );

    await deployProxy("RoutingProxy", "Routing", "0x" + "00".repeat(32), hre, initializeEncoded);
    console.log("RoutingProxy:", (await hre.deployments.get("RoutingProxy")).address);
  };

  const deployPool = async () => {
    const pool = await getArtifact("Pool");
    const lpName = "Test Pool LP";
    const lpSymbol = "LP";
    const lpSalt = "0x" + "00".repeat(31) + "11";
    const ampFactor = 1_000; //1 with 3 decimals
    const lpFee = 300; //fee as 100th of a bip (6 decimals, 1 = 100 % fee)
    const governanceFee = 100;
    const initializeEncoded = new ethers.utils.Interface(pool.abi).encodeFunctionData(
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
        governance,
        governanceFeeRecipient,
      ]
    );

    const poolSalt = "0x" + "00".repeat(31) + "01";
    const poolProxy = await deployProxy("PoolProxy", "Pool", poolSalt, hre, initializeEncoded);
    console.log("PoolProxy:", poolProxy.address);
    //TODO save lp token as deployment
    //console.log(JSON.stringify(await hre.network.provider.send("eth_getCode", [poolProxy.address])));
    const epp = (await ethers.getContract("PoolProxy")) as Pool;
    const state = await epp.getState();
    const lpProxyAddress = state.totalLPSupply.tokenAddress;
    const lpTokenProxy = {
      ...(await getArtifact("LpToken")),
      address: lpProxyAddress,
      receipt: poolProxy.receipt,
      transactionHash: poolProxy.transactionHash,
      args: [poolProxy.address, lpName, lpSymbol],
    };
    console.log("LpTokenProxy:", lpProxyAddress);
    await save("LpTokenProxy", lpTokenProxy);
  };

  await deployFactory();
  await deployLogic("Routing");
  await deployLogic("LpToken");
  await deployLogic("Pool");
  await deployRouting();
  await deployPool();

  const poolAddress = (await get("PoolProxy")).address;

  const routing = (await ethers.getContract("RoutingProxy")) as Routing;
  await routing.registerToken(USDC_TOKENNUMBER, USDC_ADDRESS, poolAddress, 1);
  await routing.registerToken(USDT_TOKENNUMBER, USDT_ADDRESS, poolAddress, 2);
};

module.exports.id = "all";
module.exports.tags = ["all"];
