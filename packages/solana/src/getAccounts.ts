import {
  getClaimAddressSolana,
  getEmitterAddressEth,
} from "@certusone/wormhole-sdk";
import type { Accounts } from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import type { ChainConfig } from "@swim-io/core";
import { getTokenDetails } from "@swim-io/core";
import { TokenProjectId } from "@swim-io/token-projects";
import type { ReadonlyRecord } from "@swim-io/utils";
import * as byteify from "byteify";
import keccak256 from "keccak256";

import type { SolanaChainConfig } from "./protocol";
import type { SupportedTokenProjectId } from "./supportedTokenProjectIds";
import { SUPPORTED_TOKEN_PROJECT_IDS } from "./supportedTokenProjectIds";

const getUserTokenAccounts = (
  walletPublicKey: PublicKey,
  solanaChainConfig: SolanaChainConfig,
) =>
  SUPPORTED_TOKEN_PROJECT_IDS.reduce((accumulator, tokenProjectId) => {
    const { address } = getTokenDetails(solanaChainConfig, tokenProjectId);
    return {
      ...accumulator,
      [tokenProjectId]: getAssociatedTokenAddressSync(
        new PublicKey(address),
        walletPublicKey,
      ),
    };
  }, {} as ReadonlyRecord<SupportedTokenProjectId, PublicKey>);

export const getAddAccounts = (
  solanaChainConfig: SolanaChainConfig,
  walletPublicKey: PublicKey,
  auxiliarySigner: PublicKey,
  lpMint: PublicKey,
  poolTokenAccounts: readonly PublicKey[],
  poolGovernanceFeeAccount: PublicKey,
): Accounts => {
  const userTokenAccounts = getUserTokenAccounts(
    walletPublicKey,
    solanaChainConfig,
  );
  return {
    propeller: new PublicKey(solanaChainConfig.routingContractStateAddress),
    tokenProgram: TOKEN_PROGRAM_ID,
    poolTokenAccount0: poolTokenAccounts[0],
    poolTokenAccount1: poolTokenAccounts[1],
    lpMint,
    governanceFee: poolGovernanceFeeAccount,
    userTransferAuthority: auxiliarySigner,
    userTokenAccount0: userTokenAccounts[TokenProjectId.Usdc],
    userTokenAccount1: userTokenAccounts[TokenProjectId.Usdt],
    userLpTokenAccount: userTokenAccounts[TokenProjectId.SwimUsd],
    twoPoolProgram: new PublicKey(solanaChainConfig.twoPoolContractAddress),
  };
};

export const getPropellerTransferAccounts = async (
  solanaChainConfig: SolanaChainConfig,
  walletPublicKey: PublicKey,
  swimUsdAtaPublicKey: PublicKey,
  auxiliarySigner: PublicKey,
): Promise<Accounts> => {
  const bridgePublicKey = new PublicKey(solanaChainConfig.wormhole.bridge);
  const portalPublicKey = new PublicKey(solanaChainConfig.wormhole.portal);
  const swimUsdMintPublicKey = new PublicKey(
    solanaChainConfig.swimUsdDetails.address,
  );
  const [wormholeConfig] = await PublicKey.findProgramAddress(
    [Buffer.from("Bridge")],
    bridgePublicKey,
  );
  const [tokenBridgeConfig] = await PublicKey.findProgramAddress(
    [Buffer.from("config")],
    portalPublicKey,
  );
  const [custody] = await PublicKey.findProgramAddress(
    [swimUsdMintPublicKey.toBytes()],
    portalPublicKey,
  );
  const [custodySigner] = await PublicKey.findProgramAddress(
    [Buffer.from("custody_signer")],
    portalPublicKey,
  );
  const [authoritySigner] = await PublicKey.findProgramAddress(
    [Buffer.from("authority_signer")],
    portalPublicKey,
  );
  const [wormholeEmitter] = await PublicKey.findProgramAddress(
    [Buffer.from("emitter")],
    portalPublicKey,
  );
  const [wormholeSequence] = await PublicKey.findProgramAddress(
    [Buffer.from("Sequence"), wormholeEmitter.toBytes()],
    bridgePublicKey,
  );
  const [wormholeFeeCollector] = await PublicKey.findProgramAddress(
    [Buffer.from("fee_collector")],
    bridgePublicKey,
  );
  return {
    propeller: new PublicKey(solanaChainConfig.routingContractStateAddress),
    tokenProgram: TOKEN_PROGRAM_ID,
    payer: walletPublicKey,
    wormhole: bridgePublicKey,
    tokenBridgeConfig,
    userSwimUsdAta: swimUsdAtaPublicKey,
    swimUsdMint: swimUsdMintPublicKey,
    custody,
    tokenBridge: portalPublicKey,
    custodySigner,
    authoritySigner,
    wormholeConfig,
    wormholeMessage: auxiliarySigner,
    wormholeEmitter,
    wormholeSequence,
    wormholeFeeCollector,
    clock: SYSVAR_CLOCK_PUBKEY,
  };
};

const hashVaa = (signedVaa: Buffer): Buffer => {
  const sigStart = 6;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const numSigners = signedVaa[5]!;
  const sigLength = 66;
  const body = signedVaa.subarray(sigStart + sigLength * numSigners);
  return keccak256(Buffer.from(body));
};

export const getCompleteNativeWithPayloadAccounts = async (
  solanaChainConfig: SolanaChainConfig,
  walletPublicKey: PublicKey,
  signedVaa: Buffer,
  sourceWormholeChainId: number,
  sourceChainConfig: ChainConfig,
): Promise<Accounts> => {
  const bridgePublicKey = new PublicKey(solanaChainConfig.wormhole.bridge);
  const portalPublicKey = new PublicKey(solanaChainConfig.wormhole.portal);
  const swimUsdMintPublicKey = new PublicKey(
    solanaChainConfig.swimUsdDetails.address,
  );
  const swimUsdAtaPublicKey = await getAssociatedTokenAddress(
    swimUsdMintPublicKey,
    walletPublicKey,
  );
  const [tokenBridgeConfig] = await PublicKey.findProgramAddress(
    [Buffer.from("config")],
    portalPublicKey,
  );
  const [custody] = await PublicKey.findProgramAddress(
    [swimUsdMintPublicKey.toBytes()],
    portalPublicKey,
  );
  const [custodySigner] = await PublicKey.findProgramAddress(
    [Buffer.from("custody_signer")],
    portalPublicKey,
  );

  const hash = hashVaa(signedVaa);
  const [message] = await PublicKey.findProgramAddress(
    [Buffer.from("PostedVAA"), hash],
    bridgePublicKey,
  );
  const claim = await getClaimAddressSolana(
    portalPublicKey.toBase58(),
    signedVaa,
  );

  const [endpoint] = await PublicKey.findProgramAddress(
    [
      byteify.serializeUint16(sourceWormholeChainId),
      Buffer.from(
        getEmitterAddressEth(sourceChainConfig.wormhole.portal),
        "hex",
      ),
    ],
    portalPublicKey,
  );

  const [propellerRedeemer] = await PublicKey.findProgramAddress(
    [Buffer.from("redeemer")],
    new PublicKey(solanaChainConfig.routingContractAddress),
  );
  const propellerRedeemerEscrowAccount = await getAssociatedTokenAddress(
    swimUsdMintPublicKey,
    propellerRedeemer,
    true,
  );

  return {
    propeller: new PublicKey(solanaChainConfig.routingContractStateAddress),
    payer: walletPublicKey,
    tokenBridgeConfig,
    message,
    claim,
    endpoint,
    to: propellerRedeemerEscrowAccount,
    redeemer: propellerRedeemer,
    feeRecipient: swimUsdAtaPublicKey,
    custody,
    swimUsdMint: swimUsdMintPublicKey,
    custodySigner,
    rent: SYSVAR_RENT_PUBKEY,
    systemProgram: SystemProgram.programId,
    wormhole: bridgePublicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    tokenBridge: portalPublicKey,
  };
};

const getSwimPayloadMessagePda = async (
  wormholeClaim: PublicKey,
  propellerProgramId: PublicKey,
): Promise<readonly [PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from("propeller"),
      Buffer.from("swim_payload"),
      wormholeClaim.toBuffer(),
    ],
    propellerProgramId,
  );
};

const getToTokenNumberMapPda = async (
  propellerState: PublicKey,
  toTokenNumber: number,
  propellerProgramId: PublicKey,
) => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from("propeller"),
      Buffer.from("token_id"),
      propellerState.toBuffer(),
      new BN(toTokenNumber).toArrayLike(Buffer, "le", 2),
    ],
    propellerProgramId,
  );
};

export const getProcessSwimPayloadAccounts = async (
  solanaChainConfig: SolanaChainConfig,
  walletPublicKey: PublicKey,
  signedVaa: Buffer,
  poolTokenAccounts: readonly PublicKey[],
  governanceFeeKey: PublicKey,
  toTokenNumber: number,
) => {
  const propeller = new PublicKey(
    solanaChainConfig.routingContractStateAddress,
  );
  const portalPublicKey = new PublicKey(solanaChainConfig.wormhole.portal);
  const swimUsdMintPublicKey = new PublicKey(
    solanaChainConfig.swimUsdDetails.address,
  );
  const claim = await getClaimAddressSolana(
    portalPublicKey.toBase58(),
    signedVaa,
  );
  const propellerProgramId = new PublicKey(
    solanaChainConfig.routingContractAddress,
  );
  const [swimPayloadMessage] = await getSwimPayloadMessagePda(
    claim,
    propellerProgramId,
  );
  const [propellerRedeemer] = await PublicKey.findProgramAddress(
    [Buffer.from("redeemer")],
    propellerProgramId,
  );
  const propellerRedeemerEscrowAccount = await getAssociatedTokenAddress(
    swimUsdMintPublicKey,
    propellerRedeemer,
    true,
  );
  const twoPoolConfig = solanaChainConfig.pools[0];
  const twoPoolProgramId = new PublicKey(twoPoolConfig.contract);
  const twoPoolAddress = new PublicKey(twoPoolConfig.address);
  const [tokenIdMap] = await getToTokenNumberMapPda(
    propeller,
    toTokenNumber,
    propellerProgramId,
  );
  const userTokenAccounts = getUserTokenAccounts(
    walletPublicKey,
    solanaChainConfig,
  );
  return {
    propeller,
    payer: walletPublicKey,
    claim,
    swimPayloadMessage: new PublicKey(swimPayloadMessage),
    swimPayloadMessagePayer: walletPublicKey,
    redeemer: propellerRedeemer,
    redeemerEscrow: propellerRedeemerEscrowAccount,
    pool: twoPoolAddress,
    poolTokenAccount0: poolTokenAccounts[0],
    poolTokenAccount1: poolTokenAccounts[1],
    lpMint: swimUsdMintPublicKey,
    governanceFee: governanceFeeKey,
    userTransferAuthority: walletPublicKey,
    userTokenAccount0: userTokenAccounts[TokenProjectId.Usdc],
    userTokenAccount1: userTokenAccounts[TokenProjectId.Usdt],
    userLpTokenAccount: userTokenAccounts[TokenProjectId.SwimUsd],
    tokenProgram: TOKEN_PROGRAM_ID,
    twoPoolProgram: twoPoolProgramId,
    systemProgram: SystemProgram.programId,
    tokenIdMap,
  };
};
