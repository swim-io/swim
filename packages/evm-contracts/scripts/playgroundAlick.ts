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

const ROUTING_ADDRESS = "0x591bf69E5dAa731e26a87fe0C5b394263A8c3375";
const POOL_ADDRESS = "0x37FFb2ee5A3ab1785bD5179243EDD27dDeADF823";
const USDC_ADDRESS_GOERLI = "0x45B167CF5b14007Ca0490dCfB7C4B870Ec0C0Aa6";
const USDT_ADDRESS_GOERLI = "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B";

const WORMHOLE_CORE_BRIDGE_ADDRESS_TESTNET_GOERLI = "0x706abc4E45D419950511e474C7B9Ed348A4a716c";
const WORMHOLE_TOKEN_BRIDGE_ADDRESS_TESTNET_GOERLI = "0xF890982f9310df57d00f659cf4fd87e65adEd8d7"

const WORMHOLE_RPC_HOSTS = [
  "https://wormhole-v2-testnet-api.certus.one"
];

const WORMHOLE_CORE_BRIDGE_LOCAL = "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550";

/*
Checklist of things needed for having a local guardian setup
- local evm chains
- local solana chains
- deploy routing contract to chains
- deploy usdc, usdt, swimusd to chains
- local wormhole guardian
- setup spy relayer env file
*/

/*
Set up local env steps
Reset evm chains, deploy wormhole contracts
cd /Users/alickxu/Documents/1-Projects/xdapp-book/projects/wormhole-local-validator
npm run evm

Deploy swim factory, swimUSD, swim contracts
yarn hardhat deploy --network localhost
yarn hardhat deploy --network localhost2
will get ProviderError: transaction underpriced, just keep rerunning until success

Attest tokens
cd /Users/alickxu/Documents/1-Projects/swim/packages/evm-contracts
uncomment attestSwimUsd()
yarn hardhat run scripts/playground.ts --network localhost
comment attestSwimUsd(), uncomment createWrappedSwimUsd()
update sequence in createWrappedSwimUsd
yarn hardhat run scripts/playground.ts --network localhost2
*/

// call with --network localhost
async function attestSwimUsd() {
  // from 1337 to 31337
  const [deployer] = await ethers.getSigners();

  //const tokenBridge = await ethers.getContractAt("ITokenBridge", LOCAL.wormholeTokenBridge);
  //console.log("getContractAt done")
  const swimUsdAddress = await getTokenAddress(DEFAULTS.swimUsd);
  console.log("swimUsdAddress", swimUsdAddress);

  const networkTokenAttestation = await attestFromEth(
      LOCAL.wormholeTokenBridge,
      deployer,
      swimUsdAddress
  );
  console.log("attestation complete");

  // core bridge address
  const sequence = parseSequenceFromLogEth(networkTokenAttestation, WORMHOLE_CORE_BRIDGE_LOCAL);
  console.log("sequence", sequence);
}

// call with --network localhost2
async function createWrappedSwimUsd() {
  const sequence = "0"; // TODO fill out sequence
  const [deployer] = await ethers.getSigners();

  console.log('about to getSignedVAAWithRetry');
  const vaa = await getSignedVAAWithRetry(
    ["http://localhost:7071"],
    2, // wormhole chain id for eth?
    getEmitterAddressEth(LOCAL.wormholeTokenBridge),
    sequence,
    {
      transport: NodeHttpTransport(), //This should only be needed when running in node.
    },
    1000,
    10
  );
  console.log("vaa.vaaBytes", vaa.vaaBytes);

  console.log('about to createWrapped');
  await createWrappedOnEth(
    LOCAL.wormholeTokenBridge,
    deployer,
    vaa.vaaBytes,
    {
      gasLimit: 2000000
    }
  );
  await new Promise((r) => setTimeout(r, 5000)); //Time out to let block propogate

  const swimUsdAddress = await getTokenAddress(DEFAULTS.swimUsd);
  console.log('getTokenAddress swimUsdAddress', swimUsdAddress);

  console.log('tryNativeToHexString', tryNativeToHexString(swimUsdAddress, "ethereum"));
  console.log('Buffer from', Buffer.from(
                                       tryNativeToHexString(swimUsdAddress, "ethereum"),
                                       "hex"
                                   ));


  const targetTokenBridge = Bridge__factory.connect(LOCAL.wormholeTokenBridge, deployer);
  const wrappedTokenAddress = await targetTokenBridge.wrappedAsset(
      2, // i guess this needs to be same chainID provided when calling attest
      Buffer.from(
          tryNativeToHexString(swimUsdAddress, "ethereum"),
          "hex"
      )
  );
  console.log("Wrapped token created at: ", wrappedTokenAddress);
}

async function getWrappedAsset() {
  const [deployer] = await ethers.getSigners();
  const swimUsdAddress = await getTokenAddress(DEFAULTS.swimUsd);

  const targetTokenBridge = Bridge__factory.connect(LOCAL.wormholeTokenBridge, deployer);
  const wrappedTokenAddress = await targetTokenBridge.wrappedAsset(
      2,
      Buffer.from(
          tryNativeToHexString(swimUsdAddress, "ethereum"),
          "hex"
      )
  );
  console.log("Wrapped token created at: ", wrappedTokenAddress);
}

async function sendVaaLocal() {
  const signers = await ethers.getSigners();
  const routing = await ethers.getContractAt("Routing", ROUTING_ADDRESS);

  console.log("owner");
  console.log(await routing.owner());

  const swimUsdAddress = await routing.swimUsdAddress();
  console.log("swimUsdAddress", swimUsdAddress);
  const swimUsd = await ethers.getContractAt("ERC20Token", swimUsdAddress);

  const theSigner = signers[0];
  const balance = await swimUsd.balanceOf(theSigner.address);
  console.log(theSigner.address);
  console.log(balance);

  const pool = await ethers.getContractAt("Pool", POOL_ADDRESS);

  const inputAmount = 10;

  await swimUsd.connect(signers[0]).approve(ROUTING_ADDRESS, inputAmount);

  console.log("swapAndTransfer");
  const txnResponse = await routing.connect(signers[0]).swapAndTransfer(
    swimUsdAddress,
    inputAmount,
    0, //slippage
    4, //what chain ID do i put here?
    "0x" + "00".repeat(12) + signers[0].address.substring(2),
    "0x" + "00".repeat(16),
    {
      gasLimit: ethers.BigNumber.from("2000000"),
    }
  );
  console.log("swapAndTransfer done");
  //console.log(txnResponse);

  // fetch sequence so that I can look up VAA
  const txnReceipt = await txnResponse.wait(6); //wait(6)
  console.log("txnReceipt");
  //console.log(txnReceipt);

  const sequence = parseSequenceFromLogEth(txnReceipt, WORMHOLE_CORE_BRIDGE_LOCAL);
  console.log("sequence");
  console.log(sequence);

  console.log("done");

}

// for testnet guardians
async function sendVaa() {
  const signers = await ethers.getSigners();
  const routing = await ethers.getContractAt("Routing", ROUTING_ADDRESS);

  console.log("owner");
  console.log(await routing.owner());

  const swimUsdAddress = await routing.swimUsdAddress();
  const swimUsd = await ethers.getContractAt("ERC20", swimUsdAddress);
  console.log("swimUsdAddress", swimUsdAddress);

  const usdc = await ethers.getContractAt("ERC20Token", USDC_ADDRESS_GOERLI);

  const theSigner = signers[0];
  const balance = await usdc.balanceOf(theSigner.address);
  console.log(theSigner.address);
  console.log(balance);

  const pool = await ethers.getContractAt("Pool", POOL_ADDRESS);
  //console.log(pool);
  //console.log("pool balances");
  //console.log(JSON.stringify(await pool.getState(), null, 2));

  const inputAmount = 10;

  await usdc.connect(signers[0]).approve(ROUTING_ADDRESS, inputAmount);

  console.log("swapAndTransfer");
  const txnResponse = await routing.connect(signers[0]).swapAndTransfer(
    usdc.address,
    inputAmount,
    0, //slippage
    4, //binance chain id
    "0x" + "00".repeat(12) + signers[0].address.substring(2),
    "0x" + "00".repeat(16),
    {
      gasLimit: ethers.BigNumber.from("2000000"),
      gasPrice: '200000000000'
    }
  );
  console.log("swapAndTransfer done");
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

//attestSwimUsd();
//createWrappedSwimUsd();
//getWrappedAsset();
sendVaaLocal();
