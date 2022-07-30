import { ethers, run, network, upgrades } from "hardhat";
import { BN } from "bn.js";
import verify from "./helpers";
import "dotenv/config";

async function main() {
  const chainID = 97;
  const name = "SWIM-BNB-POOL-LP";
  const symbol = "SWIM-BNB-POOL-LP";
  const [deployer] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("LPToken");
  let tokenProxy = await upgrades.deployProxy(Token, [name, symbol], {
    initializer: "initialize",
    kind: "uups",
  });
  tokenProxy = await tokenProxy.deployed();

  console.log("LP Token deployed to:", tokenProxy.address);
  console.log("LP Token owner:", await tokenProxy.owner(), deployer.address);

  // await token.mint(deployer.address, initialSupply.toString());

  // console.log("Token balance", await token.totalSupply());

  if (network.config.chainId === chainID) {
    await tokenProxy.deployTransaction.wait(6);
    await verify(tokenProxy.address, []);
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
