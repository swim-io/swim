import {
  parseSequenceFromLogEth,
  getSignedVAAWithRetry,
  getEmitterAddressEth,
  uint8ArrayToHex,
  tryNativeToHexString,
  attestFromEth,
  createWrappedOnEth,
  Bridge__factory
} from "@certusone/wormhole-sdk";
import { BigNumber, formatFixed, parseFixed } from "@ethersproject/bignumber";
import { NodeHttpTransport } from "@improbable-eng/grpc-web-node-http-transport";
import type { Contract } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployToken, deploySwimFactory, getTokenAddress } from "../src/deploy";
import { ethers } from "hardhat";
import { DEFAULTS, LOCAL } from "../src/config";

//const ROUTING_ADDRESS = "0x591bf69E5dAa731e26a87fe0C5b394263A8c3375";
//const POOL_ADDRESS = "0x37FFb2ee5A3ab1785bD5179243EDD27dDeADF823";
const ROUTING_ADDRESS = "0xa33E4d9624608c468FE5466dd6CC39cE1Da4FF78";
const POOL_ADDRESS = "0xe167b44578EAe235E0CF063099989A2c7aBA06Cb";
const USDC_ADDRESS_GOERLI = "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6";
const USDT_ADDRESS_GOERLI = "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B";
const BUSD_ADDRESS_TESTNET = "0xed24fc36d5ee211ea25a80239fb8c4cfd80f12ee";

const WORMHOLE_CORE_BRIDGE_ADDRESS_TESTNET_GOERLI = "0x706abc4E45D419950511e474C7B9Ed348A4a716c";
const WORMHOLE_TOKEN_BRIDGE_ADDRESS_TESTNET_GOERLI = "0xF890982f9310df57d00f659cf4fd87e65adEd8d7"

const WORMHOLE_RPC_HOSTS = [
  "https://wormhole-v2-testnet-api.certus.one"
];

// async function registerToken() {
//   const signers = await ethers.getSigners();
//   const routing = await ethers.getContractAt("Routing", ROUTING_ADDRESS);
// }

// for testnet guardians
async function sendVaa() {
  const signers = await ethers.getSigners();
  const routing = await ethers.getContractAt("Routing", ROUTING_ADDRESS);

  console.log("contract owner", await routing.owner());

  const swimUsdAddress = await routing.swimUsdAddress();
  const swimUsd = await ethers.getContractAt("ERC20", swimUsdAddress);
  console.log("swimUsdAddress", swimUsdAddress);

  const usdc = await ethers.getContractAt("ERC20Token", USDC_ADDRESS_GOERLI);

  const theSigner = signers[0];
  console.log("signer address", await theSigner.getAddress());
  console.log("signer balance", await theSigner.getBalance());
  const usdcBalance = await usdc.balanceOf(theSigner.address);
  console.log("usdc balance", usdcBalance);

  //const pool = await ethers.getContractAt("Pool", POOL_ADDRESS);
  //console.log(pool);
  //console.log("pool balances");
  //console.log(JSON.stringify(await pool.getState(), null, 2));

  const inputAmount = 10;

  console.log("approve");
  await (await usdc.connect(theSigner).approve(ROUTING_ADDRESS, inputAmount)).wait();
  console.log("approve complete");

  console.log("estimateGas", await routing.estimateGas["propellerOut(address,uint256,uint16,bytes32,bool,uint16)"](
   usdc.address, // fromToken
   inputAmount, // inputAmmount
   4, //wormhole chain id (binance chain id)
   "0x" + "00".repeat(12) + signers[0].address.substring(2), // toOwner
   false, // gasKickStart
   3, // toToken tokenNumber in swim
//     {
//       gasLimit: ethers.BigNumber.from("2000000"),
//       gasPrice: '200000000000'
//     }
  ));

  console.log("propellerOut");
  const txnResponse = await routing.connect(signers[0])["propellerOut(address,uint256,uint16,bytes32,bool,uint16)"](
    usdc.address, // fromToken
    inputAmount, // inputAmmount
    4, //wormhole chain id (binance chain id)
    "0x" + "00".repeat(12) + signers[0].address.substring(2), // toOwner
    false, // gasKickStart
    3, // toToken tokenNumber in swim
//     {
//       gasLimit: ethers.BigNumber.from("2000000"),
//       gasPrice: '200000000000'
//     }
  );
  console.log("propellerOut done");
  //console.log(txnResponse);

  // fetch sequence so that I can look up VAA
  const txnReceipt = await txnResponse.wait(6); //wait(6)
  console.log("txnReceipt");
  //console.log(txnReceipt);

  const sequence = parseSequenceFromLogEth(txnReceipt, WORMHOLE_CORE_BRIDGE_ADDRESS_TESTNET_GOERLI);
  console.log("sequence");
  console.log(sequence);

  console.log("done");
}

sendVaa();
