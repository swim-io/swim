import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const deployLogic = async (logicContract: string, salt: string = "0x"+"00".repeat(32)) => {
    const { save, read, execute, getArtifact } = hre.deployments;
    const { deployer } = await hre.getNamedAccounts();

    const logic = await getArtifact(logicContract);
    const bytecode = logic.bytecode;

    const ctAddress = await read(
      "SwimFactory",
      {},
      "determineLogicAddress",
      bytecode,
      salt
    );

    const receipt = await execute(
      "SwimFactory",
      {from: deployer},
      "createLogic",
      bytecode,
      salt,
    );

    const deployment = {
      ...logic,
      address: ctAddress,
      args: [],
      transactionHash: receipt.transactionHash,
      receipt,
      newlyDeployed: true
    };
    await save(logicContract, deployment);
  }

  await deployLogic("Routing");
  await deployLogic("LpToken");
  await deployLogic("Pool");

  console.log("Routing (logic):", (await hre.deployments.get("Routing")).address);
  console.log("LpToken (logic):", (await hre.deployments.get("LpToken")).address);
  console.log("Pool (logic)", (await hre.deployments.get("Pool")).address);

  // const txHre = await hre.network.provider.send("eth_getTransactionByHash", [SwimFactory.transactionHash]);
  // const txEthers = await ethers.provider.getTransaction(SwimFactory.transactionHash as string);

  // console.log("hre:", JSON.stringify(txHre, null, 2));
  // console.log("ethers:", JSON.stringify(txEthers, null, 2));

  // try {
  //     const rawHre = getRawTransaction(txHre);
  //     console.log("rawHre:", JSON.stringify(rawHre, null, 2));
  // }
  // catch(e) {
  //   console.log("hre raw failed");
  // }

  // try {
  //   const rawEthers = getRawTransaction(txEthers);
  //   console.log("rawEthers:", JSON.stringify(rawEthers, null, 2));
  // }
  // catch(e) {
  //   console.log("ethers raw failed");
  // }
};
export default func;
func.id = "LogicContracts";
func.tags = ["PoolTest"];
func.dependencies = ["FactoryFromPresigned"];
