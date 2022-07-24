import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";
import { developmentChains, VERIFICATION_BLOCK_CONFIRMATIONS, SALT } from "../../helper-config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { ethers, network } = hre;
  const { save, get, deploy, log } = hre.deployments;
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;

  const TokenBridge = await get("TokenBridgeLogic");
  const routingLogic = await get("RoutingLogic");

  const initializeEncoded = new ethers.utils.Interface(routingLogic.abi).encodeFunctionData(
    "initialize",
    [TokenBridge.address]
  );

  const routingProxy = await deploy("Routing", {
    contract: "Routing",
    from: deployer,
    proxy: {
      proxyContract: "ERC1967Proxy",
      proxyArgs: [routingLogic.address, initializeEncoded],
      execute: {
        init: {
          methodName: "initialize",
          args: [TokenBridge.address],
        },
      },
    },
    deterministicDeployment: SALT,
    waitConfirmations: waitBlockConfirmations,
    log: true,
    autoMine: true,
  });
  const routingImplementationg = await get("Routing_Implementation");

  log("--------------------------------------------------------------------------");

  log("Routing address", routingLogic.address);
  log("Routing proxy", routingProxy.address);
  log("Routing Implementationg", routingImplementationg.address);

  await save("RoutingProxy", { abi: routingLogic.abi, address: routingProxy.address });
};

export default func;
func.id = "deploy_routing_contract";
func.tags = ["Routing"];
func.dependencies = ["TokenBridgeLogic"];
