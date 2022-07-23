import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import "hardhat-deploy";

const name = "Routing";
const contract = "Routing";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { ethers } = hre;
  const { save, get, execute, deterministic, getOrNull } = hre.deployments;

  // const TokenBridge = await get("MockTokenBridge");

  // const routingContract = await get("RoutingLogic");
  // const initializeEncoded = new ethers.utils.Interface(routingContract.abi).encodeFunctionData(
  //   "initialize",
  //   ["0x3ee18B2214AFF97000D974cf647E7C347E8fa585"]
  // );

  // const routingProxy = await deploy("ERC1967Proxy", {
  //   from: deployer,
  //   args: [routingContract.address, []],
  //   log: true,
  //   autoMine: true,
  // });

  // await save("RoutingProxy", { abi: routingContract.abi, address: routingProxy.address });
  // await execute("RoutingProxy", { from: deployer, log: true }, "initialize", "RoutingProxy");

  const { address, implementationAddress, deploy } = await deterministic(name, {
    contract,
    from: deployer,
    log: true,
    proxy: {
      proxyContract: "ERC1967Proxy",
      implementationName: `${contract}_Implementation`,
      execute: {
        methodName: "initialize",
        args: ["0x3ee18B2214AFF97000D974cf647E7C347E8fa585"],
      },
    },
    salt: "0x02",
  });

  console.log("DEPLOY R", address, implementationAddress);

  await deploy();
  await execute(name, { from: deployer, log: true }, "initialize", name);
};

export default func;
func.id = "deploy_routing_contract";
func.tags = [name];
// func.dependencies = ["MockTokenBridge"];
