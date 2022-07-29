import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import { deployProxy } from "../../utils/factoryDeploy";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { ethers } = hre;
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  const tokenBridge = await deploy("MockTokenBridge", {from: deployer});
  console.log("MockTokenBridge:", tokenBridge.address);

  const routing = await get("Routing");

  const initializeEncoded = new ethers.utils.Interface(routing.abi).encodeFunctionData(
    "initialize",
    [deployer, tokenBridge.address]
  );

  await deployProxy("RoutingProxy", "Routing", "0x"+"00".repeat(32), hre, initializeEncoded);
  console.log("RoutingProxy:", (await hre.deployments.get("RoutingProxy")).address);
};

export default func;
func.id = "deploy_routing_contract";
func.tags = ["RoutingProxy", "PoolTest"];
func.dependencies = ["FactoryFromPresigned"];
