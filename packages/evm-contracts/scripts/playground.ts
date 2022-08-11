// import { parseSequenceFromLogEth } from "@certusone/wormhole-sdk";
import { ethers } from "hardhat";

const ROUTING_ADDRESS = "0x591bf69E5dAa731e26a87fe0C5b394263A8c3375";
const POOL_ADDRESS = "0x37FFb2ee5A3ab1785bD5179243EDD27dDeADF823";
//const POOL_ADDRESS = "0x57305259a6fEB206fd58559AbC8a6A611001e15b";
const USDC_ADDRESS = "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6";
const USDT_ADDRESS = "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B";

const BNB_BUSD_ADDRESS = "0x92934a8b10DDF85e81B65Be1D6810544744700dC";
const BNB_USDT_ADDRESS = "0x98529E942FD121d9C470c3d4431A008257E0E714";

const WORMHOLE_CORE_BRIDGE_ADDRESS_TESTNET = "0x706abc4E45D419950511e474C7B9Ed348A4a716c";
const ETHERSCAN_API_KEY = "BN2UC67VNXRK6N5SH9JN4PA167R35Y8I9Z";
// const swimUsdAddress = "0x4DF39C514Eb1747bb4D89cA9Ee35718611590935"; // hexapool

const main = async () => {
  const signers = await ethers.getSigners();
  const routing = await ethers.getContractAt("Routing", ROUTING_ADDRESS);

  /*
  const provider = new ethers.providers.EtherscanProvider("goerli", ETHERSCAN_API_KEY);
  console.log("provider.getCode");
  console.log(await provider.getCode(ROUTING_ADDRESS));
  */
  console.log("owner");
  console.log(await routing.owner());

  const swimUsdAddress = await routing.swimUsdAddress();
  const swimUsd = await ethers.getContractAt("ERC20", swimUsdAddress);

  const usdc = await ethers.getContractAt("ERC20Token", BNB_BUSD_ADDRESS);

  const theSigner = signers[0];
  const balance = await usdc.balanceOf(theSigner.address);
  console.log(theSigner.address);
  console.log(balance);

  const pool = await ethers.getContractAt("Pool", POOL_ADDRESS);
  console.log(pool);
  console.log("pool balances");
  console.log(JSON.stringify(await pool.getState(), null, 2));

  const inputAmount = 10;

  //await usdc.connect(signers[0]).approve(ROUTING_ADDRESS, inputAmount);

  console.log("swapAndTransfer");
  // gets UNPREDICTABLE_GAS_LIMIT error
  /*
  const gasEstimated = await routing.connect(signers[0]).estimateGas.swapAndTransfer(
    usdc.address,
    inputAmount,
    0, //slippage
    4, //binance chain id
    "0x" + "00".repeat(12) + signers[0].address.substring(2),
    "0x" + "00".repeat(16),
  );
  console.log("estimated gas:");
  console.log(gasEstimated);
  */

  // const txnResponse = await routing.connect(signers[0]).swapAndTransfer(
  //   usdc.address,
  //   inputAmount,
  //   0, //slippage
  //   4, //binance chain id
  //   "0x" + "00".repeat(12) + signers[0].address.substring(2),
  //   "0x" + "00".repeat(16),
  //   {
  //     gasLimit: ethers.BigNumber.from("2000000"),
  //   }
  // );
  const txnResponse = await routing.connect(signers[0]).swapAndTransfer(
    usdc.address,
    inputAmount,
    0, //slippage
    4, //binance chain id
    "0x" + "00".repeat(12) + signers[0].address.substring(2),
    "0x" + "00".repeat(16)
  );
  console.log("swapAndTransfer done");
  console.log(txnResponse);

  // fetch sequence so that I can look up VAA
  const txnReceipt = await txnResponse.wait(6);
  console.log("txnReceipt");
  console.log(txnReceipt);

  // const sequence = parseSequenceFromLogEth(txnReceipt, WORMHOLE_CORE_BRIDGE_ADDRESS_TESTNET);
  // console.log("sequence");
  // console.log(sequence);

  console.log("done");
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
