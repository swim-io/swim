import { ethers, run, network, upgrades, getNamedAccounts } from "hardhat";
import { BN } from "bn.js";
import verify from "./helpers";

async function main() {
  const chainId = 97;
  const BUSDToken = "0x92934a8b10DDF85e81B65Be1D6810544744700dC";
  const USDTToken = "0x98529E942FD121d9C470c3d4431A008257E0E714";
  const SwimUSD = "0x84252522366DB2eA1dAaDe5E2C55CD90a50aC46e";
  const tokenEqualizer = -12; //keep 6 of the 18 decimals (all tokens have 18 decimals)
  const ampFactor = 1_000; //1 with 3 decimals
  const lpFee = 300; //fee as 100th of a bip (6 decimals, 1 = 100 % fee)
  const governanceFee = 100;

  const name = "SWIM-BNB-POOL-LP";
  const symbol = "SWIM-BNB-POOL-LP";
  const [deployer] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("LpToken");
  // let lpTokenProxy = await upgrades.deployProxy(Token, [name, symbol], {
  //   initializer: "initialize",
  //   kind: "uups",
  // });
  let lpTokenProxy = await Token.deploy();
  lpTokenProxy = await lpTokenProxy.deployed();

  console.log("LP Token deployed to:", lpTokenProxy.address);
  console.log("LP Token owner:", await lpTokenProxy.owner(), deployer.address);

  const Pool = await ethers.getContractFactory("Pool");
  let poolProxy = await upgrades.deployProxy(
    Pool,
    [
      name,
      symbol,
      lpTokenProxy.address,
      tokenEqualizer,
      [SwimUSD, USDTToken, BUSDToken],
      [tokenEqualizer, tokenEqualizer, tokenEqualizer],
      ampFactor,
      lpFee,
      governanceFee,
      deployer.address,
      deployer.address,
    ],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  poolProxy = await poolProxy.deployed();
  console.log("Pool deployed to:", poolProxy.address);
  console.log("LP Token owner:", await lpTokenProxy.owner());
  // console.log("Pool owner:", await poolProxy.owner(), deployer.address);

  // await lpTokenProxy.transferOwnership(deployer.address);
  // console.log("Transfer ownership from :", deployer.address, "to :", deployer.address);

  if (network.config.chainId === chainId) {
    await lpTokenProxy.deployTransaction.wait(6);
    await verify(lpTokenProxy.address, []);
  }

  if (network.config.chainId === chainId) {
    await poolProxy.deployTransaction.wait(6);
    await verify(poolProxy.address, []);
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
