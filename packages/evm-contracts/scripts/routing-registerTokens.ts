import { ethers } from "hardhat";

async function main() {
  const routingProxyAddr = "0x4Eb25024846770C92b74177dE1aeB71D2c1814cF";
  const SwimUSD = "0x84252522366DB2eA1dAaDe5E2C55CD90a50aC46e";
  const USDTToken = "0x98529E942FD121d9C470c3d4431A008257E0E714";
  const BUSDToken = "0x92934a8b10DDF85e81B65Be1D6810544744700dC";
  const PoolAddr = "0xCCDAa7C3046F7032c39d9172cdb0a6a2A683af03";

  const [deployer] = await ethers.getSigners();

  const contract = await ethers.getContractAt("Routing", routingProxyAddr);

  const swimUsdTx = await contract.registerToken(0, SwimUSD, PoolAddr, 0);
  const usdTx = await contract.registerToken(1, USDTToken, PoolAddr, 1);
  const busdTx = await contract.registerToken(2, BUSDToken, PoolAddr, 2);

  console.log("token info", await contract.swimUsdAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
