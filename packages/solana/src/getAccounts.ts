import {
  getClaimAddressSolana,
  getEmitterAddressEth,
} from "@certusone/wormhole-sdk";
import type { Accounts } from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import {
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import type { ChainConfig } from "@swim-io/core/types";
import * as byteify from "byteify";
import keccak256 from "keccak256";

import type { SolanaChainConfig } from "./protocol";

export const getAddAccounts = (
  solanaChainConfig: SolanaChainConfig,
  userSwimUsdAtaPublicKey: PublicKey,
  userTokenAccounts: readonly PublicKey[],
  auxiliarySigner: PublicKey,
  lpMint: PublicKey,
  poolTokenAccounts: readonly PublicKey[],
  poolGovernanceFeeAccount: PublicKey,
): Accounts => {
  return {
    propeller: new PublicKey(solanaChainConfig.routingContractStateAddress),
    tokenProgram: TOKEN_PROGRAM_ID,
    poolTokenAccount0: poolTokenAccounts[0],
    poolTokenAccount1: poolTokenAccounts[1],
    lpMint,
    governanceFee: poolGovernanceFeeAccount,
    userTransferAuthority: auxiliarySigner,
    userTokenAccount0: userTokenAccounts[0],
    userTokenAccount1: userTokenAccounts[1],
    userLpTokenAccount: userSwimUsdAtaPublicKey,
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

export const createCompleteNativeWithPayloadAccounts = async (
  solanaChainConfig: SolanaChainConfig,
  walletPublicKey: PublicKey,
  signedVaa: Buffer,
  swimUsdAtaPublicKey: PublicKey,
  sourceWormholeChainId: number,
  sourceChainConfig: ChainConfig,
): Promise<Accounts> => {
  const bridgePublicKey = new PublicKey(solanaChainConfig.wormhole.bridge);
  const portalPublicKey = new PublicKey(solanaChainConfig.wormhole.portal);
  const swimUsdMintPublicKey = new PublicKey(
    solanaChainConfig.swimUsdDetails.address,
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

  const propellerRedeemer = (
    await PublicKey.findProgramAddress(
      [Buffer.from("redeemer")],
      new PublicKey(solanaChainConfig.routingContractAddress),
    )
  )[0];
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

const getToTokenNumberMapAddr = async (
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

export const createProcessSwimPayloadAccounts = async (
  solanaChainConfig: SolanaChainConfig,
  walletPublicKey: PublicKey,
  signedVaa: Buffer,
  swimUsdAtaPublicKey: PublicKey,
  userTokenAccounts: readonly PublicKey[],
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
  const propellerRedeemer = (
    await PublicKey.findProgramAddress(
      [Buffer.from("redeemer")],
      propellerProgramId,
    )
  )[0];
  const propellerRedeemerEscrowAccount = await getAssociatedTokenAddress(
    swimUsdMintPublicKey,
    propellerRedeemer,
    true,
  );
  const twoPoolConfig = solanaChainConfig.pools[0];
  const twoPoolProgramId = new PublicKey(twoPoolConfig.contract);
  const twoPoolAddress = new PublicKey(twoPoolConfig.address);
  const [tokenIdMap] = await getToTokenNumberMapAddr(
    propeller,
    toTokenNumber,
    propellerProgramId,
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
    userTokenAccount0: userTokenAccounts[0],
    userTokenAccount1: userTokenAccounts[1],
    userLpTokenAccount: swimUsdAtaPublicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    twoPoolProgram: twoPoolProgramId,
    systemProgram: SystemProgram.programId,
    tokenIdMap,
  };
};
