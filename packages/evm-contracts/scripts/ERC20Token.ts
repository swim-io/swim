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
  const chainID = 5;
  const name = "SwimUSD";
  const symbol = "swimUSD";
  const initialSupply = new BN(1000000000);
  const [owner] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("ERC20Token");
  const token = await Token.deploy(name, symbol);

  await token.deployed();

  console.log("Token deployed to:", token.address);

  await token.mint(owner.address, initialSupply.toString());

  console.log("Token balance", await token.totalSupply());

  if (network.config.chainId === chainID) {
    await token.deployTransaction.wait(6);
    await verify(token.address, [name, symbol]);
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
