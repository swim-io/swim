import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, save } = hre.deployments;

  const lpTokenLogic = await deploy("LpToken", {
    from: deployer,
    args: [],
    autoMine: true,
  });
  await save("LpTokenLogic", lpTokenLogic);

  const poolLogic = await deploy("Pool", {
    from: deployer,
    args: [],
    autoMine: true,
  });
  await save("PoolLogic", poolLogic);

  const routingLogic = await deploy("Routing", {
    from: deployer,
    args: [],
    autoMine: true,
  });
  await save("RoutingLogic", routingLogic);

  const tokenBridgeLogic = await deploy("MockTokenBridge", {
    from: deployer,
    args: [],
    autoMine: true,
  });
  await save("TokenBridgeLogic", tokenBridgeLogic);
};
export default func;
func.id = "LogicContracts";
func.tags = ["PoolTest"];
