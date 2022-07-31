
import { ethers, run, network, upgrades, deployments } from "hardhat";
import { BN } from "bn.js";
import verify from "./helpers";
import "dotenv/config";
import { developmentChains, SALT, VERIFICATION_BLOCK_CONFIRMATIONS } from "../helper-config";

async function main() {
  const chainId = 97;
  const tokenBridgeAdr = "0x9dcF9D205C9De35334D646BeE44b2D2859712A09";

  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;

  const [deployer] = await ethers.getSigners();

  const RoutingFactory = await ethers.getContractFactory("Routing");
  let routingProxy = await upgrades.deployProxy(RoutingFactory, [tokenBridgeAdr], {
    initializer: "initialize",
    kind: "uups",
  });
  routingProxy = await routingProxy.deployed();

  // const r = await routing.deployed();

  // console.log("Routing deployed to:", routing.address, r.address);

  // await r.initialize(tokenBridgeAdr);

  console.log("owner routing", await routingProxy.owner(), deployer.address);
  // console.log("r routing", await r.owner());

  // console.log("routing abi", Routing);

  // const initializeEncoded = new ethers.utils.Interface(routing.abi).encodeFunctionData(
  //   "initialize",
  //   [tokenBridgeAddress]
  // );

  // const routingProxy = await deploy("Routing", {
  //   contract: "Routing",
  //   from: deployer.address,
  //   proxy: {
  //     proxyContract: "ERC1967Proxy",
  //     proxyArgs: [routing.address, initializeEncoded],
  //     execute: {
  //       init: {
  //         methodName: "initialize",
  //         args: [tokenBridgeAdr],
  //       },
  //     },
  //   },
  //   deterministicDeployment: SALT,
  //   waitConfirmations: waitBlockConfirmations,
  //   log: true,
  //   autoMine: true,
  // });

  console.log("Routing proxy deployed", routingProxy.address);

  if (network.config.chainId === chainId) {
    await routingProxy.deployTransaction.wait(6);
    await verify(routingProxy.address, []);
  }

  // console.log("Routing proxy", routingProxy.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
