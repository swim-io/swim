import { ethers } from "hardhat";

async function main() {
  const poolFactory = await ethers.getContractFactory("Pool");
  const pool = await poolFactory.deploy(/* Constructor arguments */);

  await pool.deployed();

  console.log("pool deployed to:", pool.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
