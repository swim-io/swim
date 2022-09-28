import type { ChainId, ChainName } from "@certusone/wormhole-sdk";
import {
  CHAIN_ID_BSC,
  CHAIN_ID_ETH,
  getClaimAddressSolana,
  tryUint8ArrayToNative,
} from "@certusone/wormhole-sdk";
import type { Program, SplToken } from "@project-serum/anchor";
import { BN, web3 } from "@project-serum/anchor";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { BigNumber } from "ethers";

import type { Propeller } from "../../artifacts/propeller";
import type { TwoPool } from "../../artifacts/two_pool";

import type {
  ParsedTokenTransferPostedMessage,
  ParsedTokenTransferSignedVaa,
} from "./tokenBridgeUtils";
import {
  deriveEndpointPda,
  deriveMessagePda,
  formatParsedTokenTransferPostedMessage,
  formatParsedTokenTransferSignedVaa,
  parseTokenTransferPostedMessage,
  parseTokenTransferSignedVaa,
} from "./tokenBridgeUtils";
import { WORMHOLE_CORE_BRIDGE, WORMHOLE_TOKEN_BRIDGE } from "./wormholeUtils";

export async function getPropellerPda(
  mint: web3.PublicKey,
  programId: web3.PublicKey,
): Promise<web3.PublicKey> {
  return (
    await web3.PublicKey.findProgramAddress(
      [Buffer.from("propeller"), mint.toBytes()],
      programId,
    )
  )[0];
}

export async function getPropellerRedeemerPda(
  programId: web3.PublicKey,
): Promise<web3.PublicKey> {
  return (
    await web3.PublicKey.findProgramAddress(
      [Buffer.from("redeemer")],
      programId,
    )
  )[0];
}

export async function getPropellerSenderPda(
  programId: web3.PublicKey,
): Promise<web3.PublicKey> {
  return (
    await web3.PublicKey.findProgramAddress([Buffer.from("sender")], programId)
  )[0];
}

export async function getSwimClaimPda(
  wormholeClaim: web3.PublicKey,
  propellerProgramId: web3.PublicKey,
): Promise<readonly [web3.PublicKey, number]> {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from("propeller"), Buffer.from("claim"), wormholeClaim.toBuffer()],
    propellerProgramId,
  );
}

export const getSwimPayloadMessagePda = async (
  wormholeClaim: web3.PublicKey,
  propellerProgramId: web3.PublicKey,
): Promise<readonly [web3.PublicKey, number]> => {
  return await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("propeller"),
      Buffer.from("swim_payload"),
      wormholeClaim.toBuffer(),
    ],
    propellerProgramId,
  );
};
//
// async function addToPool(
// 	provider: anchor.AnchorProvider,
// 	pool: web3.PublicKey,
// 	poolState: SwimPoolState,
// 	userTokenAccounts: web3.PublicKey[],
// 	userLpTokenAccount: web3.PublicKey,
// 	inputAmounts: anchor.BN[],
// 	minimumMintAmount: anchor.BN,
// 	tokenAccountOwner: web3.Keypair,
// 	delegate: web3.PublicKey,
// ): Promise<string> {
// 	// let userMetapoolTokenAccountAmounts = await Promise.all(
// 	//     userMetapoolTokenAccounts.map(async (account) => {
// 	//     return (await splToken.account.token.fetch(account)).amount;
// 	// }));
// 	// console.log(`userMetapoolTokenAccountAmounts: ${userMetapoolTokenAccountAmounts}`)
// 	// let userMetapoolTokenAccounts0Amount = await splToken.account.token.fetch(userMetapoolTokenAccounts[0]);
// 	// let inputAmounts = [new anchor.BN(100), new anchor.BN(100)];
//
// 	const addMetapoolIx = addToPoolIx(
// 		{
// 			provider,
// 			pool,
// 			poolState,
// 			userTokenAccounts,
// 			userLpTokenAccount,
// 			inputAmounts,
// 			minimumMintAmount,
// 		});
// 	const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
// 		anchor.BN.max(inputAmounts[0]!, inputAmounts[1]!),
// 		tokenAccountOwner.publicKey,
// 		delegate,
// 		userTokenAccounts
// 	);
// 	const seedMetapoolTxn = new web3.Transaction()
// 		.add(...approveIxs!)
// 		.add(addMetapoolIx)
// 		.add(...revokeIxs!);
// 	seedMetapoolTxn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
// 	return await provider.sendAndConfirm(
// 		seedMetapoolTxn,
// 		[dummyUser],
// 		{
// 			skipPreflight: true,
// 		}
// 	);
// }
//
// async function createAtaAndMint(mint: web3.PublicKey) {
// 	const tokenAccount = await getOrCreateAssociatedTokenAccount(
// 		connection,
// 		payer,
// 		mint,
// 		dummyUser.publicKey,
// 		false
// 	);
// 	const mintTxn = await mintTo(
// 		connection,
// 		payer,
// 		mint,
// 		tokenAccount.address,
// 		payer,
// 		initialMintAmount,
// 	);
//
// 	await connection.confirmTransaction({
// 		signature: mintTxn,
// 		...(await connection.getLatestBlockhash())
// 	})
// 	console.log(`minted to user_token_account: ${tokenAccount.address.toBase58()}`);
// 	return tokenAccount
// }

// const parseTokenTransferWithSwimPayloadPostedMessage = async (arr: Buffer) => {
// 	const {parse_posted_message} = await importCoreWasm();
// 	const postedMessage = parse_posted_message(arr);
// 	const tokenTransfer = parseTransferWithPayload(Buffer.from(postedMessage.payload));
//   // console.log(`swimPayloadRawBufferStr: ${tokenTransfer.payload.toString()}`);
//   const swimPayload = parseSwimPayload(tokenTransfer.payload);
// 	return {
// 		...postedMessage,
// 		vaa_signature_account: new web3.PublicKey(postedMessage.vaa_signature_account).toBase58(),
// 		// emitter_address: tryHexToNativeAssetString(postedMessage.emitter_address, postedMessage.emitter_chain),
// 		// emitter_address: new web3.PublicKey(postedMessage.emitter_address).toBase58(),
// 		emitter_address: tryUint8ArrayToNative(postedMessage.emitter_address, postedMessage.emitter_chain),
//
// 		payload: {
// 			...tokenTransfer,
// 			amount: tokenTransfer.amount.toString(),
// 			originAddress: tryHexToNativeAssetString(tokenTransfer.originAddress, tokenTransfer.originChain),
// 			originChain: toChainName(tokenTransfer.originChain),
// 			targetAddress: tryHexToNativeAssetString(tokenTransfer.targetAddress, tokenTransfer.targetChain),
// 			targetChain: toChainName(tokenTransfer.targetChain),
// 			fromAddress: tryHexToNativeAssetString(tokenTransfer.fromAddress, postedMessage.emitter_chain),
//       payload: {
//         ...swimPayload,
//         minOutputAmount: swimPayload.minOutputAmount.toString(),
//         memo: swimPayload.memo.toString(),
//         propellerMinThreshold: swimPayload.propellerMinThreshold.toString(),
//         // propellerFee: swimPayload.propellerFee.toString(),
//         // targetTokenStr: swimPayload.targetToken.toString(),
//         // targetTokenHexStr: swimPayload.targetToken.toString("hex"),
//         // ownerStr: swimPayload.owner.toString(),
//         ownerNativeStr: tryHexToNativeAssetString(swimPayload.owner.toString("hex"), tokenTransfer.targetChain),
//         // ownerHexStr: swimPayload.owner.toString("hex"),
//       }
// 		}
// 	}
// }

//   1 byte - swim internal payload version number
// 32 bytes - logical owner/recipient (will use ATA of owner and token on Solana)
//  2 bytes - swimTokenNumber (support up to 65k different tokens, just to be safe)
// 32 bytes - minimum output amount (using 32 bytes like Wormhole)
// 16 bytes - memo/interactionId (??) (current memo is 16 bytes - can't use Wormhole sequence due to Solana originating transactions (only receive sequence number in last transaction on Solana, hence no id for earlier transactions))
// ?? bytes - propeller parameters (propellerEnabled: bool / gasTokenPrefundingAmount: uint256 / propellerFee (?? - similar to wormhole arbiter fee))
export interface ParsedSwimPayload {
  readonly version: number;
  readonly owner: Buffer;
  readonly propellerEnabled: boolean;
  readonly targetTokenId: number;
  readonly gasKickstart: boolean;
  readonly maxFee: BN;
  readonly memo: Buffer;
}

export function encodeSwimPayload(swimPayload: ParsedSwimPayload): Buffer {
  const encoded = Buffer.alloc(
    1 + //version
      32 + //owner
      1 + //propellerEnabled
      1 + //gasKickstart
      8 + //maxFee
      2 + //targetTokenId (u16)
      16, //memo
  );
  let offset = 0;
  encoded.writeUint8(swimPayload.version, offset);
  offset++;
  encoded.write(swimPayload.owner.toString("hex"), offset, "hex");
  offset += 32;
  encoded.writeUint8(Number(swimPayload.propellerEnabled), offset);
  offset++;
  encoded.writeUint8(Number(swimPayload.gasKickstart), offset);
  offset++;
  encoded.writeBigUint64BE(BigInt(swimPayload.maxFee.toNumber()), offset);
  offset += 8;

  encoded.writeUint16BE(swimPayload.targetTokenId, offset);
  offset += 2;
  encoded.write(swimPayload.memo.toString("hex"), offset, "hex");
  // offset += 16;
  return encoded;
}

export function parseSwimPayload(arr: Buffer): ParsedSwimPayload {
  //BigNumber.from(arr.subarray(1, 1 + 32)).toBigInt()
  let offset = 0;
  const version = arr.readUint8(offset);
  offset++;
  const owner = arr.subarray(offset, offset + 32);
  offset += 32;
  const propellerEnabled = arr.readUint8(offset) === 1;
  offset++;
  const gasKickstart = arr.readUint8(offset) === 1;
  offset++;
  const maxFee = new BN(Number(arr.readBigUint64BE(offset)));
  offset += 8;
  const targetTokenId = arr.readUint16BE(offset);
  offset += 2;
  const memo = arr.subarray(offset, offset + 16);
  // offset += 16;

  return {
    version,
    owner,
    propellerEnabled,
    gasKickstart,
    maxFee,
    targetTokenId,
    memo,
  };
  // return {
  //   version: arr.readUint8(0),
  //   targetTokenId: arr.readUint16BE(1),
  //   targetToken: arr.subarray(3, 3 + 32),
  //   owner: arr.subarray(35, 35 + 32),
  //   minOutputAmount: BigNumber.from(arr.subarray(67, 67 + 32)).toBigInt(),
  //   // minOutputAmount: arr.readBigUInt64BE(67),
  //   propellerEnabled: arr.readUint8(99) === 1,
  //   // propellerFee: arr.readBigUInt64BE(100),
  //   propellerFee: BigNumber.from(arr.subarray(100, 100 + 32)).toBigInt(),
  //   gasKickstart: arr.readUint8(132) === 1,
  // }
}
export type PostVAAData = {
  readonly version: number;
  readonly guardianSetIndex: number;
  readonly timestamp: number;
  readonly nonce: number;
  readonly emitterChain: number;
  readonly emitterAddress: Buffer;
  readonly sequence: BN;
  readonly consistencyLevel: number;
  readonly payload: Buffer;
};

// export function toPostVAAData(signedVaa: Buffer): PostVAAData {
//   // const {
//   //   consistencyLevel,
//   //   data,
//   //   emitterAddress,
//   //   emitterChain,
//   //   guardianSignatures,
//   //   hash,
//   //   nonce,
//   //   sequence,
//   //   timestamp,
//   //   version
//   // } = parseVaa(signedVaa);
//   // return {
//   //   version,
//   //
//   // }
//   // const version = signedVaa.readUint8(0);
//   // const guardianSetIndex = signedVaa.readUint8(1);
//   // const timestamp = signedVaa.readUint32BE(2);
//   // const nonce = signedVaa.readUint32BE(6);
//   // const emitterChain = signedVaa.readUint8(10);
//   // const emitterAddress = signedVaa.subarray(11, 11 + 32);
//   // const sequence = anchor.BN.fromBuffer(signedVaa.subarray(43, 43 + 32));
//   // const consistencyLevel = signedVaa.readUint8(75);
//   // const payload = signedVaa.subarray(76);
//   // return {
//   //   version,
//   //   guardianSetIndex,
//   //   timestamp,
//   //   nonce,
//   //   emitterChain,
//   //   emitterAddress,
//   //   sequence,
//   //   consistencyLevel,
//   //   payload,
//   // }
// }

export function parseU256(arr: Buffer): bigint {
  return BigNumber.from(arr.subarray(0, 32)).toBigInt();
}

export interface ParsedTokenTransferWithSwimPayloadVaa {
  // core: ParsedVaa,
  // tokenTransfer: ParsedTokenTransfer;
  readonly tokenTransferVaa: ParsedTokenTransferSignedVaa;
  readonly swimPayload: ParsedSwimPayload;
}

/**
 * It parses a "raw signed VAA" (the one directly from guardian network)
 * into a token transfer VAA and a SWIM payload
 * @param {Buffer} signedVaa - The signed VAA that you want to parse.
 * @returns A function that takes a signed VAA and returns a parsed token transfer with swim payload VAA.
 */
export const parseTokenTransferWithSwimPayloadSignedVaa = (
  signedVaa: Buffer,
): ParsedTokenTransferWithSwimPayloadVaa => {
  const parsedTokenTransfer = parseTokenTransferSignedVaa(signedVaa);
  const payload = parsedTokenTransfer.tokenTransfer.payload;
  const swimPayload = parseSwimPayload(payload);
  return {
    tokenTransferVaa: parsedTokenTransfer,
    swimPayload,
  };
};

export const formatParsedTokenTransferWithSwimPayloadVaa = (
  parsed: ParsedTokenTransferWithSwimPayloadVaa,
) => {
  const formattedTokenTransfer = formatParsedTokenTransferSignedVaa(
    parsed.tokenTransferVaa,
  );
  const swimPayload = parsed.swimPayload;
  const formattedSwimPayload = formatSwimPayload(
    swimPayload,
    parsed.tokenTransferVaa.tokenTransfer.toChain,
  );
  return {
    ...formattedTokenTransfer,
    ...formattedSwimPayload,
  };
};

export const formatSwimPayload = (
  swimPayload: ParsedSwimPayload,
  chain: ChainId | ChainName,
) => {
  return {
    ...swimPayload,
    // minOutputAmount: swimPayload.minOutputAmount.toString(),
    memo: swimPayload.memo.toString(),
    // minThreshold: swimPayload.minThreshold.toString(),
    owner: tryUint8ArrayToNative(swimPayload.owner, chain),
    maxFee: swimPayload.maxFee.toString(),
  };
};

export interface ParsedTokenTransferWithSwimPayloadPostedMessage {
  readonly tokenTransferMessage: ParsedTokenTransferPostedMessage;
  readonly swimPayload: ParsedSwimPayload;
}

export const parseTokenTransferWithSwimPayloadPostedMessage = async (
  message: Buffer,
): Promise<ParsedTokenTransferWithSwimPayloadPostedMessage> => {
  const parsedTokenTransferMsg = await parseTokenTransferPostedMessage(message);
  const payload = parsedTokenTransferMsg.tokenTransfer.payload;
  const swimPayload = parseSwimPayload(payload);
  return {
    tokenTransferMessage: parsedTokenTransferMsg,
    swimPayload,
  };
};

export const formatParsedTokenTransferWithSwimPayloadPostedMessage = (
  parsed: ParsedTokenTransferWithSwimPayloadPostedMessage,
) => {
  const formattedTokenTransfer = formatParsedTokenTransferPostedMessage(
    parsed.tokenTransferMessage,
  );
  const swimPayload = parsed.swimPayload;
  const formattedSwimPayload = formatSwimPayload(
    swimPayload,
    parsed.tokenTransferMessage.tokenTransfer.toChain,
  );
  return {
    ...formattedTokenTransfer,
    ...formattedSwimPayload,
  };
};

export const getTargetTokenIdMapAddr = async (
  propeller: web3.PublicKey,
  targetTokenId: number,
  propellerProgramId: web3.PublicKey,
) => {
  return await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("propeller"),
      Buffer.from("token_id"),
      propeller.toBuffer(),
      new BN(targetTokenId).toArrayLike(Buffer, "le", 2),
    ],
    propellerProgramId,
  );
};

export const getTargetChainIdMapAddr = async (
  propeller: web3.PublicKey,
  targetChain: number,
  propellerProgramId: web3.PublicKey,
) => {
  return await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("propeller"),
      propeller.toBuffer(),
      new BN(targetChain).toArrayLike(Buffer, "le", 2),
    ],
    propellerProgramId,
  );
};

export const getPropellerFeeTrackerAddr = async (
  swimUsdMint: web3.PublicKey,
  feeTrackerOwner: web3.PublicKey,
  propellerProgramId: web3.PublicKey,
) => {
  return await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("propeller"),
      Buffer.from("fee"),
      swimUsdMint.toBuffer(),
      feeTrackerOwner.toBuffer(),
    ],
    propellerProgramId,
  );
};

export type WormholeAddresses = {
  readonly wormhole: web3.PublicKey;
  readonly tokenBridge: web3.PublicKey;
  readonly ethEndpointAccount: web3.PublicKey;
  readonly bscEndpointAccount: web3.PublicKey;
  readonly custody: web3.PublicKey;
  readonly wormholeConfig: web3.PublicKey;
  readonly wormholeFeeCollector: web3.PublicKey;
  readonly wormholeEmitter: web3.PublicKey;
  readonly wormholeSequence: web3.PublicKey;
  readonly authoritySigner: web3.PublicKey;
  readonly tokenBridgeConfig: web3.PublicKey;
  readonly custodySigner: web3.PublicKey;
};

export type MarginalPricePoolInfo = {
  readonly pool: web3.PublicKey;
  readonly token0Account: web3.PublicKey;
  readonly token1Account: web3.PublicKey;
  readonly lpMint: web3.PublicKey;
};

// TODO: this should probably be split up.
//  1. the `propellerCompleteWithPayload` will be the same
//  2. only need to determine if using valid token id map & creating all token accounts
//     or using fallback method and creating/transfering to only swimUsd token account
export const generatePropellerEngineTxns = async (
  propellerProgram: Program<Propeller>,
  tokenTransferWithPayloadSignedVaa: Buffer,
  propeller: web3.PublicKey,
  swimUsdMint: web3.PublicKey,
  wormholeAddresses: WormholeAddresses,
  payer: web3.Keypair,
  twoPoolProgram: Program<TwoPool>,
  splToken: Program<SplToken>,
  aggregator: web3.PublicKey,
  userTransferAuthority: web3.Keypair,
): Promise<readonly web3.Transaction[]> => {
  let txns: readonly web3.Transaction[] = [];
  const {
    custody,
    custodySigner,
    ethEndpointAccount,
    tokenBridge,
    tokenBridgeConfig,
    wormhole,
  } = wormholeAddresses;
  const [wormholeMessage] = await deriveMessagePda(
    tokenTransferWithPayloadSignedVaa,
    wormhole,
  );
  const wormholeClaim = await getClaimAddressSolana(
    tokenBridge.toBase58(),
    tokenTransferWithPayloadSignedVaa,
  );
  const [swimPayloadMessage] = await getSwimPayloadMessagePda(
    wormholeClaim,
    propellerProgram.programId,
  );

  // const [swimPayloadMessage] = await web3.PublicKey.findProgramAddress(
  //   [
  //     Buffer.from("propeller"),
  //     wormholeClaim.toBuffer(),
  //     wormholeMessage.toBuffer(),
  //   ],
  //   propellerProgram.programId,
  // );
  console.info(`
    generatePropellerEngineTnxs
      wormholeMESSAGE: ${wormholeMessage.toBase58()}
      wormholeClaim: ${wormholeClaim.toBase58()}
      swimPayloadMessage: ${swimPayloadMessage.toBase58()})
  `);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propellerFeeVault: web3.PublicKey = await getAssociatedTokenAddress(
    swimUsdMint,
    propeller,
    true,
  );
  const propellerRedeemer = await getPropellerRedeemerPda(
    propellerProgram.programId,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propellerRedeemerEscrowAccount: web3.PublicKey =
    await getAssociatedTokenAddress(swimUsdMint, propellerRedeemer, true);

  const marginalPricePoolInfo = await getMarginalPricePoolInfo(
    propeller,
    propellerProgram,
    twoPoolProgram,
  );
  console.info(`
    marginalPricePoolInfo: ${JSON.stringify(marginalPricePoolInfo, null, 2)}
  `);
  const [propellerEngineFeeTracker] = await getPropellerFeeTrackerAddr(
    swimUsdMint,
    payer.publicKey,
    propellerProgram.programId,
  );

  console.info(`
  getPropellerEngineTxns:
    propellerEngineFeeTracker: ${propellerEngineFeeTracker.toBase58()}
  `);

  const propellerEngineFeeTrackerData =
    await propellerProgram.account.feeTracker.fetch(propellerEngineFeeTracker);
  console.info(`
    propellerEngineFeeTrackerData: ${JSON.stringify(
      propellerEngineFeeTrackerData,
      null,
      2,
    )}
  `);

  const { swimPayload } = parseTokenTransferWithSwimPayloadSignedVaa(
    tokenTransferWithPayloadSignedVaa,
  );

  //TODO: https://solanacookbook.com/references/basic-transactions.html#how-to-change-compute-budget-fee-priority-for-a-transaction
  // const modifyComputeUnits = web3.ComputeBudgetProgram.setComputeUnitLimit({
  //   units: 900000
  // });
  //
  // const addPriorityFee = web3.ComputeBudgetProgram.setComputeUnitPrice({
  //   microLamports: 1
  // });

  const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
    // units: 420690,
    units: 900000,
    additionalFee: 0,
  });
  const propellerData = await propellerProgram.account.propeller.fetch(
    propeller,
  );
  console.info(`
    propellerData: ${JSON.stringify(propellerData, null, 2)}
  `);

  const completePubkeys = await propellerProgram.methods
    .completeNativeWithPayload()
    .accounts({
      propeller,
      payer: payer.publicKey,
      tokenBridgeConfig,
      message: wormholeMessage,
      claim: wormholeClaim,
      swimPayloadMessage: swimPayloadMessage,
      endpoint: ethEndpointAccount,
      to: propellerRedeemerEscrowAccount,
      redeemer: propellerRedeemer,
      feeRecipient: propellerFeeVault,
      custody: custody,
      swimUsdMint: swimUsdMint,
      custodySigner,
      rent: web3.SYSVAR_RENT_PUBKEY,
      systemProgram: web3.SystemProgram.programId,
      memo: MEMO_PROGRAM_ID,
      wormhole: wormholeAddresses.wormhole,
      tokenProgram: splToken.programId,
      tokenBridge: wormholeAddresses.tokenBridge,
    })
    .pubkeys();
  console.info(`
    completePubkeys: ${JSON.stringify(completePubkeys, null, 2)}
  `);

  const completeNativeWithPayloadIxs = propellerProgram.methods
    .propellerCompleteNativeWithPayload()
    .accounts({
      // @ts-ignore
      completeNativeWithPayload: completePubkeys,
      feeTracker: propellerEngineFeeTracker,
      aggregator,
      // marginalPricePool: {
      //   pool: marginalPricePoolInfo.pool,
      //   poolToken0Account: marginalPricePoolInfo.token0Account,
      //   poolToken1Account: marginalPricePoolInfo.token1Account,
      //   lpMint: marginalPricePoolInfo.lpMint,
      // },
      marginalPricePool: marginalPricePoolInfo.pool,
      marginalPricePoolToken0Account: marginalPricePoolInfo.token0Account,
      marginalPricePoolToken1Account: marginalPricePoolInfo.token1Account,
      marginalPricePoolLpMint: marginalPricePoolInfo.lpMint,
      twoPoolProgram: twoPoolProgram.programId,
    })
    .preInstructions([requestUnitsIx])
    .signers([payer]);

  const completeNativeWithPayloadPubkeys =
    await completeNativeWithPayloadIxs.pubkeys();

  console.info(
    `completeNativeWithPayloadPubkeys: ${JSON.stringify(
      completeNativeWithPayloadPubkeys,
      null,
      2,
    )}`,
  );
  const completeNativeWithPayloadTxn =
    await completeNativeWithPayloadIxs.transaction();
  txns = [completeNativeWithPayloadTxn];
  const targetTokenId = swimPayload.targetTokenId;
  const [tokenIdMapAddr] = await getTargetTokenIdMapAddr(
    propeller,
    targetTokenId,
    propellerProgram.programId,
  );
  const tokenIdMapData =
    await propellerProgram.account.tokenIdMap.fetchNullable(tokenIdMapAddr);
  const owner = new web3.PublicKey(swimPayload.owner);
  // const userTransferAuthority = web3.Keypair.generate();
  const [swimClaim] = await getSwimClaimPda(
    wormholeClaim,
    propellerProgram.programId,
  );

  if (!tokenIdMapData) {
    console.info(
      `invalid tokenIdMap. targetTokenId: ${targetTokenId}. Generating fallback transactions`,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userSwimUsdAta: web3.PublicKey = await getAssociatedTokenAddress(
      swimUsdMint,
      owner,
    );
    const ownerSwimUsdAtaData = await splToken.account.token.fetchNullable(
      userSwimUsdAta,
    );
    if (!ownerSwimUsdAtaData) {
      const createOwnerSwimUsdAtaTxn = await propellerProgram.methods
        .propellerCreateOwnerSwimUsdAta()
        .accounts({
          propeller,
          payer: payer.publicKey,
          redeemer: propellerRedeemer,
          redeemerEscrow: propellerRedeemerEscrowAccount,
          feeVault: propellerFeeVault,
          feeTracker: propellerEngineFeeTracker,
          claim: wormholeClaim,
          swimPayloadMessage,
          tokenIdMap: tokenIdMapAddr,
          swimUsdMint: swimUsdMint,
          owner,
          ownerSwimUsdAta: userSwimUsdAta,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: splToken.programId,
          memo: MEMO_PROGRAM_ID,
          aggregator,
          marginalPricePool: marginalPricePoolInfo.pool,
          marginalPricePoolToken0Account: marginalPricePoolInfo.token0Account,
          marginalPricePoolToken1Account: marginalPricePoolInfo.token1Account,
          marginalPricePoolLpMint: marginalPricePoolInfo.lpMint,
          twoPoolProgram: twoPoolProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .transaction();
      txns = [...txns, createOwnerSwimUsdAtaTxn];
    }

    const propellerProcessSwimPayloadFallbackTxn =
      await propellerProgram.methods
        .propellerProcessSwimPayloadFallback()
        .accounts({
          propeller,
          payer: payer.publicKey,
          claim: wormholeClaim,
          swimClaim,
          swimPayloadMessage,
          swimPayloadMessagePayer: payer.publicKey,
          redeemer: propellerRedeemer,
          redeemerEscrow: propellerRedeemerEscrowAccount,
          tokenIdMap: tokenIdMapAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userSwimUsdAta: userSwimUsdAta,
          tokenProgram: splToken.programId,
          memo: MEMO_PROGRAM_ID,
          twoPoolProgram: twoPoolProgram.programId,
          systemProgram: web3.SystemProgram.programId,
          feeVault: propellerFeeVault,
          feeTracker: propellerEngineFeeTracker,
          aggregator,
          marginalPricePool: marginalPricePoolInfo.pool,
          marginalPricePoolToken0Account: marginalPricePoolInfo.token0Account,
          marginalPricePoolToken1Account: marginalPricePoolInfo.token1Account,
          marginalPricePoolLpMint: marginalPricePoolInfo.lpMint,
          owner,
        })
        .preInstructions([requestUnitsIx])
        .signers([userTransferAuthority, payer])
        .transaction();
    txns = [...txns, propellerProcessSwimPayloadFallbackTxn];
  } else {
    const tokenIdMapPoolAddr = tokenIdMapData.pool;
    const tokenIdMapPoolData = await twoPoolProgram.account.twoPool.fetch(
      tokenIdMapPoolAddr,
    );
    const tokenIdMapPoolInfo = {
      pool: tokenIdMapPoolAddr,
      tokenMints: tokenIdMapPoolData.tokenMintKeys,
      tokenAccounts: tokenIdMapPoolData.tokenKeys,
      lpMint: tokenIdMapPoolData.lpMintKey,
      governanceFeeAcct: tokenIdMapPoolData.governanceFeeKey,
    };
    // const mints = [...tokenIdMapPoolInfo.tokenMints, tokenIdMapPoolInfo.lpMint];
    // const ownerAtaAddrs = await Promise.all(
    //   mints.map(async (mint) => {
    //     return await getAssociatedTokenAddress(mint, owner);
    //   }),
    // );
    const ownerAtaAddrs = await getOwnerTokenAccountsForPool(
      tokenIdMapPoolAddr,
      owner,
      twoPoolProgram,
    );

    const ownerAtas = await Promise.all(
      ownerAtaAddrs.map(async (ataAddr: web3.PublicKey) => {
        return await splToken.account.token.fetchNullable(ataAddr);
      }),
    );
    // Note: this is normally how we should get the swimPayloadMessagePayer address
    // but since we're generating txns, this account won't exist at the timem we call this.
    // const swimPayloadMessageAccount = await propellerProgram.account.swimPayloadMessage.fetch(
    //   swimPayloadMessage,
    // );
    if (ownerAtas.some((ata) => ata === null)) {
      console.info(
        "at least one owner ATA was not found. generating txn to create them",
      );
      const createOwnerAtasTxn = await propellerProgram.methods
        .propellerCreateOwnerTokenAccounts()
        .accounts({
          propeller,
          payer: payer.publicKey,
          redeemer: propellerRedeemer,
          redeemerEscrow: propellerRedeemerEscrowAccount,
          feeVault: propellerFeeVault,
          feeTracker: propellerEngineFeeTracker,
          claim: wormholeClaim,
          swimPayloadMessage,
          tokenIdMap: tokenIdMapAddr,
          pool: tokenIdMapPoolInfo.pool,
          poolToken0Mint: tokenIdMapPoolInfo.tokenMints[0],
          poolToken1Mint: tokenIdMapPoolInfo.tokenMints[1],
          poolLpMint: tokenIdMapPoolInfo.lpMint,
          user: owner,
          userPoolToken0Account: ownerAtaAddrs[0],
          userPoolToken1Account: ownerAtaAddrs[1],
          userLpTokenAccount: ownerAtaAddrs[2],
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: splToken.programId,
          memo: MEMO_PROGRAM_ID,
          aggregator,
          marginalPricePool: marginalPricePoolInfo.pool,
          marginalPricePoolToken0Account: marginalPricePoolInfo.token0Account,
          marginalPricePoolToken1Account: marginalPricePoolInfo.token1Account,
          marginalPricePoolLpMint: marginalPricePoolInfo.lpMint,
          twoPoolProgram: twoPoolProgram.programId,
        })
        .preInstructions([requestUnitsIx])
        .transaction();
      txns = [...txns, createOwnerAtasTxn];
    }
    const processSwimPayloadPubkeys = await propellerProgram.methods
      .processSwimPayload(targetTokenId, new BN(0))
      .accounts({
        propeller,
        payer: payer.publicKey,
        claim: wormholeClaim,
        swimPayloadMessage,
        swimPayloadMessagePayer: payer.publicKey,
        swimClaim,
        redeemer: propellerRedeemer,
        redeemerEscrow: propellerRedeemerEscrowAccount,
        // tokenIdMap: ?
        pool: tokenIdMapPoolInfo.pool,
        poolTokenAccount0: tokenIdMapPoolInfo.tokenAccounts[0],
        poolTokenAccount1: tokenIdMapPoolInfo.tokenAccounts[1],
        lpMint: tokenIdMapPoolInfo.lpMint,
        governanceFee: tokenIdMapPoolInfo.governanceFeeAcct,
        userTransferAuthority: userTransferAuthority.publicKey,
        userTokenAccount0: ownerAtaAddrs[0],
        userTokenAccount1: ownerAtaAddrs[1],
        userLpTokenAccount: ownerAtaAddrs[2],
        tokenProgram: splToken.programId,
        memo: MEMO_PROGRAM_ID,
        twoPoolProgram: twoPoolProgram.programId,
        systemProgram: web3.SystemProgram.programId,
      })
      .pubkeys();
    const propellerProcessSwimPayloadTxn = await propellerProgram.methods
      .propellerProcessSwimPayload(targetTokenId)
      .accounts({
        // processSwimPayload: {
        //   propeller,
        //   payer: payer.publicKey,
        //   message: wormholeMessage,
        //   claim: wormholeClaim,
        //   swimPayloadMessage,
        //   swimClaim,
        //   redeemer: propellerRedeemer,
        //   redeemerEscrow: propellerRedeemerEscrowAccount,
        //   // tokenIdMap: ?
        //   pool: tokenIdMapPoolInfo.pool,
        //   poolTokenAccount0: tokenIdMapPoolInfo.tokenAccounts[0],
        //   poolTokenAccount1: tokenIdMapPoolInfo.tokenAccounts[1],
        //   lpMint: tokenIdMapPoolInfo.lpMint,
        //   governanceFee: tokenIdMapPoolInfo.governanceFeeAcct,
        //   userTransferAuthority: userTransferAuthority.publicKey,
        //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        //   userTokenAccount0: ownerAtaAddrs[0],
        //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        //   userTokenAccount1: ownerAtaAddrs[1],
        //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        //   userLpTokenAccount: ownerAtaAddrs[2],
        //   tokenProgram: splToken.programId,
        //   memo: MEMO_PROGRAM_ID,
        //   twoPoolProgram: twoPoolProgram.programId,
        //   systemProgram: web3.SystemProgram.programId,
        // },
        // @ts-ignore
        processSwimPayload: processSwimPayloadPubkeys,
        feeVault: propellerFeeVault,
        feeTracker: propellerEngineFeeTracker,
        aggregator,
        marginalPricePool: marginalPricePoolInfo.pool,
        marginalPricePoolToken0Account: marginalPricePoolInfo.token0Account,
        marginalPricePoolToken1Account: marginalPricePoolInfo.token1Account,
        marginalPricePoolLpMint: marginalPricePoolInfo.lpMint,
        owner,
      })
      .preInstructions([requestUnitsIx])
      .signers([userTransferAuthority, payer])
      .transaction();
    txns = [...txns, propellerProcessSwimPayloadTxn];
  }

  return txns;
};

const getMarginalPricePoolInfo = async (
  propeller: web3.PublicKey,
  propellerProgram: Program<Propeller>,
  twoPoolProgram: Program<TwoPool>,
): Promise<MarginalPricePoolInfo> => {
  const propellerData = await propellerProgram.account.propeller.fetch(
    propeller,
  );
  const marginalPricePool = propellerData.marginalPricePool;
  const pool = await twoPoolProgram.account.twoPool.fetch(marginalPricePool);
  return {
    pool: marginalPricePool,
    token0Account: pool.tokenKeys[0],
    token1Account: pool.tokenKeys[1],
    lpMint: pool.lpMintKey,
  };
};

export const getWormholeAddressesForMint = async (
  wormhole: web3.PublicKey,
  tokenBridge: web3.PublicKey,
  mint: web3.PublicKey,
  ethTokenBridge: Buffer,
  bscTokenBridge: Buffer,
): Promise<WormholeAddresses> => {
  const [ethEndpointAccount] = await deriveEndpointPda(
    CHAIN_ID_ETH,
    ethTokenBridge,
    tokenBridge,
  );

  const [bscEndpointAccount] = await deriveEndpointPda(
    CHAIN_ID_BSC,
    bscTokenBridge,
    tokenBridge,
  );
  const [custody] = await (async () => {
    return await web3.PublicKey.findProgramAddress(
      [mint.toBytes()],
      tokenBridge,
    );
  })();

  const [wormholeConfig] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("Bridge")],
    wormhole,
  );
  const [wormholeFeeCollector] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("fee_collector")],
    wormhole,
  );
  // wh functions return in a hex string format
  // wormholeEmitter = new web3.PublicKey(
  //   tryHexToNativeString(await getEmitterAddressSolana(tokenBridge.toBase58()), CHAIN_ID_SOLANA)
  //   );
  const [wormholeEmitter] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("emitter")],
    tokenBridge,
  );
  const [wormholeSequence] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("Sequence"), wormholeEmitter.toBytes()],
    wormhole,
  );

  const [authoritySigner] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("authority_signer")],
    tokenBridge,
  );
  const [tokenBridgeConfig] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("config")],
    tokenBridge,
  );
  const [custodySigner] = await web3.PublicKey.findProgramAddress(
    [Buffer.from("custody_signer")],
    tokenBridge,
  );
  return {
    wormhole,
    tokenBridge,
    ethEndpointAccount,
    bscEndpointAccount,
    custody,
    wormholeConfig,
    wormholeFeeCollector,
    wormholeEmitter,
    wormholeSequence,
    authoritySigner,
    tokenBridgeConfig,
    custodySigner,
  };
};

export const getOwnerTokenAccountsForPool = async (
  pool: web3.PublicKey,
  owner: web3.PublicKey,
  twoPoolProgram: Program<TwoPool>,
): Promise<readonly web3.PublicKey[]> => {
  const tokenIdMapPoolData = await twoPoolProgram.account.twoPool.fetch(pool);
  const tokenIdMapPoolInfo = {
    pool,
    tokenMints: tokenIdMapPoolData.tokenMintKeys,
    tokenAccounts: tokenIdMapPoolData.tokenKeys,
    lpMint: tokenIdMapPoolData.lpMintKey,
    governanceFeeAcct: tokenIdMapPoolData.governanceFeeKey,
  };
  const mints = [...tokenIdMapPoolInfo.tokenMints, tokenIdMapPoolInfo.lpMint];
  return await Promise.all(
    mints.map(async (mint) => {
      return await getAssociatedTokenAddress(mint, owner);
    }),
  );
};
