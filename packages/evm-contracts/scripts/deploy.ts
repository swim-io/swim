// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, run, network } from "hardhat";
import "dotenv/config";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  // const Greeter = await ethers.getContractFactory("Greeter");
  // const greeter = await Greeter.deploy("Hello, Hardhat!");

  // await greeter.deployed();

  // console.log("Greeter deployed to:", greeter.address);

  const Routing = await ethers.getContractFactory("Routing");
  const routing = await Routing.deploy();

  await routing.deployed();

  console.log("Routing deployed to:", routing.address);
  if (network.config.chainId === 4 && process.env.ETHERSCAN_API_KEY) {
    await routing.deployTransaction.wait(6);
    await verify(routing.address, []);
  }
}

async function verify(contractAddress: string, args: any) {
  try {`  `
    await run("verify:verify", {
      address: contractAddress,
      constructor: args,
    });
  } catch (e: any) {
    if (e?.message?.toLowerCase().includes("already verified")) {
      console.log("Already Verified");
    } else {
      console.log(e);
    }
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
