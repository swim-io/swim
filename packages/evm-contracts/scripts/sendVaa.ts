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
import { deployToken, deploySwimFactory, getTokenAddress, getProxy } from "../src/deploy";
import { ethers } from "hardhat";
import { DEFAULTS, LOCAL, CHAINS } from "../src/config";

const ROUTING_ADDRESS = "0x280999aB9aBfDe9DC5CE7aFB25497d6BB3e8bDD4";

const BSC_WORMHOLE_CORE_BRIDGE = "0x68605AD7b15c732a30b1BbC62BE8F2A509D74b4D";
const BUSD_ADDRESS_TESTNET = "0x92934a8b10DDF85e81B65Be1D6810544744700dC";

const GOERLI_WORMHOLE_CORE_BRIDGE_TESTNET = "0x706abc4E45D419950511e474C7B9Ed348A4a716c";
const USDC_ADDRESS_GOERLI = "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6";
const USDT_ADDRESS_GOERLI = "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B";

const MUMBAI_POLYGON_WORMHOLE_CORE_BRIDGE = "0x0CBE91CF822c73C2315FB05100C2F714765d5c20";
const USDC_ADDRESS_MUMBAI = "0x0a0d7cEA57faCBf5DBD0D3b5169Ab00AC8Cf7dd1";
const USDT_ADDRESS_MUMBAI = "0x2Ac9183EC64F71AfB73909c7C028Db14d35FAD2F";

const WORMHOLE_RPC_HOSTS = [
  "https://wormhole-v2-testnet-api.certus.one"
];


// for goerli to bsctestnet
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

  console.log("balance before")
  await printBalances(theSigner.address);

  const inputAmount = 1e6;

  console.log("approve");
  await (await usdc.connect(theSigner).approve(ROUTING_ADDRESS, inputAmount)).wait();
  console.log("approve complete");

  console.log("propellerInitiate");
  const txnResponse = await routing.connect(signers[0])["propellerInitiate(address,uint256,uint16,bytes32,bool,uint64,uint16)"](
    usdc.address, // fromToken
    inputAmount, // inputAmmount
    //4, //wormhole chain id (binance chain id)
    5, //polygon
    //6, // avax
    //10, //fantom
    "0x" + "00".repeat(12) + signers[0].address.substring(2), // toOwner
    false, // gasKickStart
    10, // maxPropellerFee
    259, // toToken tokenNumber in swim (BUSD)
    //256, // toToken (USDC)
    {
      gasLimit: ethers.BigNumber.from("2000000"),
      gasPrice: '200000000000'
    }
  );
  console.log("propellerInitiate done: tx hash", txnResponse.hash);

  // fetch sequence so that I can look up VAA
  const txnReceipt = await txnResponse.wait(6); //wait(6)

  const sequence = parseSequenceFromLogEth(txnReceipt, GOERLI_WORMHOLE_CORE_BRIDGE_TESTNET);
  console.log("sequence");
  console.log(sequence);

  console.log("balance after");
  await printBalances(theSigner.address);
  console.log("done");
}

// from bsc
async function sendVaaFromBNB() {
  const signers = await ethers.getSigners();
  const routing = await ethers.getContractAt("Routing", ROUTING_ADDRESS);

  console.log("contract owner", await routing.owner());

  const swimUsdAddress = await routing.swimUsdAddress();
  const swimUsd = await ethers.getContractAt("ERC20", swimUsdAddress);
  console.log("swimUsdAddress", swimUsdAddress);

  const usdc = await ethers.getContractAt("ERC20Token", BUSD_ADDRESS_TESTNET);

  const theSigner = signers[0];
  console.log("signer address", await theSigner.getAddress());
  console.log("signer balance", await theSigner.getBalance());

  console.log("balance before")
  await printBalances(theSigner.address);

  const inputAmount = BigNumber.from(10).pow(18);

  console.log("approve");
  await (await usdc.connect(theSigner).approve(ROUTING_ADDRESS, inputAmount)).wait();
  console.log("approve complete");

  console.log("propellerInitiate");
  const txnResponse = await routing.connect(signers[0])["propellerInitiate(address,uint256,uint16,bytes32,bool,uint64,uint16)"](
    usdc.address, // fromToken
    inputAmount, // inputAmmount
    4, // bnb chain id
    //6, // avax chain id
    //10, // fantom chain id
    "0x" + "00".repeat(12) + signers[0].address.substring(2), // toOwner
    false, // gasKickStart
    10, // maxPropellerFee
    //256, // toToken tokenNumber in swim
    257,
    {
      gasLimit: ethers.BigNumber.from("2000000"),
      gasPrice: '200000000000'
    }
  );
  console.log("propellerInitiate done: tx hash", txnResponse.hash);

  // fetch sequence so that I can look up VAA
  const txnReceipt = await txnResponse.wait(6); //wait(6)

  const sequence = parseSequenceFromLogEth(txnReceipt, BSC_WORMHOLE_CORE_BRIDGE);
  console.log("sequence");
  console.log(sequence);

  console.log("balance after");
  await printBalances(theSigner.address);
  console.log("done");
}

async function printBalances(address: string) {
  const chainId = (await ethers.provider.detectNetwork()).chainId;
  const chainConfig = CHAINS[chainId];
  if (!chainConfig) throw Error(`Network with chainId ${chainId} not implemented yet`);

  const pool = await getProxy("Pool", chainConfig.pools![0].salt);
  const state = await pool.getState();
  const tokenAddresses = state.balances.map((struct: any[]) => struct[0]) as string[];
  console.log("token balances of address:", address);
  for (const token of tokenAddresses) {
    const ct = await ethers.getContractAt("ERC20", token);
    console.log(token, await ct.balanceOf(address));
  }
}

sendVaa();
