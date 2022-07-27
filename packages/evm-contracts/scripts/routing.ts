// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, run, network } from "hardhat";
import { BN } from "bn.js";
import verify from "./helpers";
import "dotenv/config";

async function main() {
  const BnbTestnetChainId = 97;
  const tokenBridgeAdr = "0x9dcF9D205C9De35334D646BeE44b2D2859712A09";
  const [owner] = await ethers.getSigners();

  const Routing = await ethers.getContractFactory("Routing");
  const routing = await Routing.deploy();

  await routing.deployed();

  console.log("Routing deployed to:", routing.address);

  await routing.initialize(tokenBridgeAdr);

  if (network.config.chainId === BnbTestnetChainId) {
    await routing.deployTransaction.wait(6);
    await verify(routing.address, []);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
