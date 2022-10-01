import { CHAIN_ID_BSC, CHAIN_ID_ETH, tryNativeToHexString, tryNativeToUint8Array } from "@certusone/wormhole-sdk";
import { BN, web3 } from "@project-serum/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export const commitment = "confirmed" as web3.Commitment;
export const rpcCommitmentConfig = {
  commitment,
  preflightCommitment: commitment,
  skipPreflight: true,
};

const ethTokenBridgeStr = "0x0290FB167208Af455bB137780163b7B7a9a10C16";
//0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
const ethTokenBridgeEthHexStr = tryNativeToHexString(
  ethTokenBridgeStr,
  CHAIN_ID_ETH,
);
//ethTokenBridge.toString() = gibberish
// ethTokenBridge.toString("hex") = 0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
export const ethTokenBridge = Buffer.from(ethTokenBridgeEthHexStr, "hex");
const bscTokenBridgeStr = ethTokenBridgeStr;
const bscTokenBridgeBscHexStr = tryNativeToHexString(
  bscTokenBridgeStr,
  CHAIN_ID_BSC,
);
export const bscTokenBridge = Buffer.from(bscTokenBridgeBscHexStr, "hex");
const ethRoutingContractStr = "0x0290FB167208Af455bB137780163b7B7a9a10C17";
// const ethRoutingContractEthUint8Arr = tryNativeToUint8Array(
//   ethRoutingContractStr,
//   CHAIN_ID_ETH,
// );
// console.info(`
// ethRoutingContractEthUint8Arr: ${ethRoutingContractEthUint8Arr}
// Buffer.from(ethRoutingContractEthUint8Arr): ${Buffer.from(
//   ethRoutingContractEthUint8Arr,
// )}
// `);
export const ethRoutingContractEthHexStr = tryNativeToHexString(
  ethRoutingContractStr,
  CHAIN_ID_ETH,
);
export const ethRoutingContract = Buffer.from(
  ethRoutingContractEthHexStr,
  "hex",
);
export const routingContracts = [
  { targetChainId: CHAIN_ID_ETH, address: ethRoutingContract },
  { targetChainId: CHAIN_ID_BSC, address: ethRoutingContract },
];
export const setComputeUnitLimitIx: web3.TransactionInstruction =
  web3.ComputeBudgetProgram.setComputeUnitLimit({
    // units: 420690,
    units: 900000,
  });
export const SWIM_USD_TO_TOKEN_NUMBER = 0;
export const USDC_TO_TOKEN_NUMBER = 128;
export const USDT_TO_TOKEN_NUMBER = 129;
export const marginalPricePoolTokenIndex = 0;
export const swimPayloadVersion = 1;
export const usdcPoolTokenIndex = 0;
export const usdtPoolTokenIndex = 1;
export const metapoolMint1OutputTokenIndex = 3;
export const metapoolMint1PoolTokenIndex = 1; // const evmOwner = Buffer.from(evmOwnerEthHexStr, "hex");

export const gasKickstartAmount: BN = new BN(0.75 * LAMPORTS_PER_SOL);
export const initAtaFee: BN = new BN(0.25 * LAMPORTS_PER_SOL);
export const secpVerifyInitFee: BN = new BN(0.000045 * LAMPORTS_PER_SOL);
export const secpVerifyFee: BN = new BN(0.00004 * LAMPORTS_PER_SOL);
export const postVaaFee: BN = new BN(0.00005 * LAMPORTS_PER_SOL);
export const completeWithPayloadFee: BN = new BN(0.0000055 * LAMPORTS_PER_SOL);
export const processSwimPayloadFee: BN = new BN(0.00001 * LAMPORTS_PER_SOL); // const confirmedCommitment = { commitment: "confirmed" as web3.Finality };
export const ampFactor = { value: new BN(300), decimals: 0 };
export const lpFee = { value: new BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
export const governanceFee = { value: new BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps

// USDC token index in flagship pool

export const evmTargetTokenId = 2;
const evmOwnerByteArr = tryNativeToUint8Array(
  "0x507b873dcb4e2b5Ac38b3f24C6394a3D327eb52F",
  CHAIN_ID_ETH,
);
const evmOwnerEthHexStr = tryNativeToHexString(
  "0x0000000000000000000000000000000000000004",
  CHAIN_ID_ETH,
);
export const evmOwner = Buffer.from(evmOwnerByteArr);
export const DEFAULT_SOL_USD_FEED = new web3.PublicKey(
  "GvDMxPzN1sCj7L26YDK2HnMRXEQmQ2aemov8YBtPS7vR",
);
