import {
  CHAIN_ID_BSC,
  CHAIN_ID_ETH,
  tryNativeToHexString,
  tryNativeToUint8Array,
} from "@certusone/wormhole-sdk";
import { BN, web3 } from "@project-serum/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const commitment = "confirmed" as web3.Commitment;
export const rpcCommitmentConfig = {
  commitment,
  preflightCommitment: commitment,
  skipPreflight: true,
};

export const ethTokenBridgeNativeStr =
  "0x0290FB167208Af455bB137780163b7B7a9a10C16";
//0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
const ethTokenBridgeEthHexStr = tryNativeToHexString(
  ethTokenBridgeNativeStr,
  CHAIN_ID_ETH,
);
//ethTokenBridge.toString() = gibberish
// ethTokenBridge.toString("hex") = 0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
export const ethTokenBridge = Buffer.from(ethTokenBridgeEthHexStr, "hex");
const bscTokenBridgeStr = "0x0290FB167208Af455bB137780163b7B7a9a10C16";
const bscTokenBridgeBscHexStr = tryNativeToHexString(
  bscTokenBridgeStr,
  CHAIN_ID_BSC,
);

export const bscTokenBridge = Buffer.from(bscTokenBridgeBscHexStr, "hex");
const evmRoutingContractNativeStr =
  "0x280999aB9aBfDe9DC5CE7aFB25497d6BB3e8bDD4";
// const ethRoutingContractEthUint8Arr = tryNativeToUint8Array(
//   evmRoutingContractNativeStr,
//   CHAIN_ID_ETH,
// );
// console.info(`
// ethRoutingContractEthUint8Arr: ${ethRoutingContractEthUint8Arr}
// Buffer.from(ethRoutingContractEthUint8Arr): ${Buffer.from(
//   ethRoutingContractEthUint8Arr,
// )}
// `);
export const evmRoutingContractHexStr = tryNativeToHexString(
  evmRoutingContractNativeStr,
  CHAIN_ID_ETH,
);
export const evmRoutingContractBuffer = Buffer.from(
  evmRoutingContractHexStr,
  "hex",
);
export const routingContracts = [
  { targetChainId: CHAIN_ID_ETH, address: evmRoutingContractBuffer },
  { targetChainId: CHAIN_ID_BSC, address: evmRoutingContractBuffer },
];
//TODO: figure out actual value for compute budget
export const setComputeUnitLimitIx: web3.TransactionInstruction =
  web3.ComputeBudgetProgram.setComputeUnitLimit({
    units: 900000,
  });
export const SWIM_USD_TO_TOKEN_NUMBER = 0;
export const USDC_TO_TOKEN_NUMBER = 256;
export const USDT_TO_TOKEN_NUMBER = 257;
export const marginalPricePoolTokenIndex = 0;
export const swimPayloadVersion = 1;
export const usdcPoolTokenIndex = 0;
export const usdtPoolTokenIndex = 1;
export const metapoolMint1ToTokenNumber = 3;
export const metapoolMint1PoolTokenIndex = 1; // const evmOwner = Buffer.from(evmOwnerEthHexStr, "hex");

export const gasKickstartAmount: BN = new BN(0.25 * LAMPORTS_PER_SOL);
export const initAtaFee: BN = new BN(0.0025 * LAMPORTS_PER_SOL);
export const secpVerifyInitFee: BN = new BN(0.000045 * LAMPORTS_PER_SOL);
export const secpVerifyFee: BN = new BN(0.00004 * LAMPORTS_PER_SOL);
export const postVaaFee: BN = new BN(0.00005 * LAMPORTS_PER_SOL);
export const completeWithPayloadFee: BN = new BN(0.0000055 * LAMPORTS_PER_SOL);
export const processSwimPayloadFee: BN = new BN(0.00001 * LAMPORTS_PER_SOL); // const confirmedCommitment = { commitment: "confirmed" as web3.Finality };
export const maxStaleness = new BN("9223372036854775807");
export const ampFactor = { value: new BN(300), decimals: 0 };
export const lpFee = { value: new BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
export const governanceFee = { value: new BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps

// USDC token index in flagship pool

export const evmTargetTokenId = 2;
const evmOwnerByteArr = tryNativeToUint8Array(
  "0x507b873dcb4e2b5Ac38b3f24C6394a3D327eb52F",
  CHAIN_ID_ETH,
);
export const evmOwner = Buffer.from(evmOwnerByteArr);
export const DEFAULT_SOL_USD_FEED = new web3.PublicKey(
  "GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR",
);

export const TWO_POOL_PID = new web3.PublicKey(
  "8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM",
);
export const PROPELLER_PID = new web3.PublicKey(
  "9z6G41AyXk73r1E4nTv81drQPtEqupCSAnsLdGV5WGfK",
);

export const SWIM_MEMO_LENGTH = 16;
