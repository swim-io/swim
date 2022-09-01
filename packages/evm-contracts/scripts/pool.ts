import { ethers } from "hardhat";

const POOL_ADDRESS = "0x37FFb2ee5A3ab1785bD5179243EDD27dDeADF823";
const USDC_ADDRESS_GOERLI = "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6";


(async () => {
  const signers = await ethers.getSigners();

  const pool = await ethers.getContractAt("Pool", POOL_ADDRESS);
  console.log("pool balances");
  console.log(JSON.stringify(await pool.getState(), null, 2));

})();
