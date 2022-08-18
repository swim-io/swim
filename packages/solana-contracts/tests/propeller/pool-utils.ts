import { AnchorProvider, BN, Spl, web3 } from "@project-serum/anchor";
import {
  AccountMeta,
  Commitment,
  ConfirmOptions,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import type { Layout } from "@project-serum/borsh";
import {
  array,
  bool,
  i64,
  publicKey,
  struct,
  u128,
  u32,
  u64,
  u8,
} from "@project-serum/borsh";

//TODO: update
export const TWO_POOL_PROGRAM_ID = new PublicKey(
  "SWimmSE5hgWsEruwPBLBVAFi3KyVfe8URU2pb4w7GZs",
);

export interface DecimalBN {
  readonly value: BN;
  readonly decimals: number;
}

export interface AmpFactor {
  readonly initialValue: DecimalBN;
  readonly initialTs: BN;
  readonly targetValue: DecimalBN;
  readonly targetTs: BN;
}
export const ampFactor = (property = "ampFactor"): Layout<AmpFactor> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
  struct(
    [
      decimal("initialValue"),
      i64("initialTs"),
      decimal("targetValue"),
      i64("targetTs"),
    ],
    property,
  );

export const decimal = (property = "decimal"): Layout<DecimalBN> =>
  struct([u64("value"), u8("decimals")], property);

export enum SwimInstruction {
  Init,
  DeFi,
  Governance,
  InitV2,
}
export enum SwimDefiInstruction {
  Add,
  Swap,
  SwapExactOutput,
  RemoveUniform,
  RemoveExactBurn,
  RemoveExactOutput,
}

export interface InitInstruction {
  readonly instruction: SwimInstruction.Init | SwimInstruction.InitV2;
  readonly nonce: number;
  readonly ampFactor: DecimalBN;
  readonly lpFee: DecimalBN;
  readonly governanceFee: DecimalBN;
}

export const initInstruction = (
  property = "initInstruction",
): Layout<InitInstruction> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
  struct(
    [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      u8("instruction"),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      u8("nonce"),
      decimal("ampFactor"),
      decimal("lpFee"),
      decimal("governanceFee"),
    ],
    property,
  );

export interface AddDefiInstruction {
  readonly instruction: SwimInstruction.DeFi;
  readonly defiInstruction: SwimDefiInstruction.Add;
  readonly inputAmounts: readonly BN[];
  readonly minimumMintAmount: BN;
}

export const defiAddInstruction = (
  numberOfTokens: number,
  property = "defiAddInstruction",
): Layout<AddDefiInstruction> =>
  struct(
    [
      u8("instruction"),
      u8("defiInstruction"),
      array(u64(), numberOfTokens, "inputAmounts"),
      u64("minimumMintAmount"),
    ],
    property,
  );

export interface SwimPoolState {
  readonly nonce: number;
  readonly isPaused: boolean;
  readonly ampFactor: AmpFactor;
  readonly lpFee: number;
  readonly governanceFee: number;
  readonly lpMintKey: PublicKey;
  readonly lpDecimalEqualizer: number;
  readonly tokenMintKeys: readonly PublicKey[];
  readonly tokenDecimalEqualizers: readonly number[];
  readonly tokenKeys: readonly PublicKey[];
  readonly governanceKey: PublicKey;
  readonly governanceFeeKey: PublicKey;
  readonly preparedGovernanceKey: PublicKey;
  readonly governanceTransitionTs: BN;
  readonly preparedLpFee: number;
  readonly preparedGovernanceFee: number;
  readonly feeTransitionTs: BN;
  readonly previousDepth: BN;
}

export const getPoolStateStr = async (
  poolStateAddr: PublicKey,
  numberOfTokens: number,
  poolProgramId: PublicKey,
  connection: Connection,
): Promise<string> => {
  // const connection = new Connection(clusterUrl, "confirmed" as Commitment);
  const accountInfo = await connection.getAccountInfo(poolStateAddr);

  const swimPoolData = accountInfo
    ? deserializeSwimPool(numberOfTokens, accountInfo.data)
    : null;
  return await swimPoolStateToString(
    swimPoolData!,
    poolStateAddr,
    poolProgramId,
  );
};

export function rawAmpFactorToJson(amp: AmpFactor) {
  return {
    initialValue: decimalBnToString(amp.initialValue),
    initialTs: amp.initialTs.toString(10),
    targetValue: decimalBnToString(amp.targetValue),
    targetTs: amp.targetTs.toString(10),
  };
}
export function decimalBnToString(decimalBN: DecimalBN): string {
  // new BN(2000).toString(10, 0) => 2000
  const str: string = decimalBN.value.toString(10, decimalBN.decimals);
  if (decimalBN.value.toString(10).length <= decimalBN.decimals) {
    return parseFloat("." + str).toString();
  } else if (decimalBN.decimals !== 0) {
    // return parseFloat(
    //   str.split("").splice(decimalBN.decimals, 0, ".").join("")
    // ).toString();
    //1524, 2 => 15.24
    const strArr = str.split("");
    strArr.splice(decimalBN.decimals, 0, ".");
    return strArr.join("");
  }
  return parseFloat(str).toString();
}

function swimPoolStateToJSON(
  poolKey: PublicKey,
  authority: PublicKey,
  state: SwimPoolState,
) {
  return {
    poolKey: poolKey.toBase58(),
    authority_calculated: authority.toBase58(),
    nonce: state.nonce,
    isPaused: state.isPaused,
    ampFactor: rawAmpFactorToJson(state.ampFactor),
    lpFee: state.lpFee,
    governanceFee: state.governanceFee,
    lpMintKey: state.lpMintKey.toBase58(),
    lpDecimalEqualizer: state.lpDecimalEqualizer,
    tokenMintKeys: state.tokenMintKeys.map((key) => key.toBase58()),
    tokenDecimalEqualizers: JSON.stringify(state.tokenDecimalEqualizers),
    tokenAccountKeys: state.tokenKeys.map((key) => key.toBase58()),
    governanceKey: state.governanceKey.toBase58(),
    governanceFeeKey: state.governanceFeeKey.toBase58(),
    preparedGovernanceKey: state.preparedGovernanceKey.toBase58(),
    governanceTransitionTs: state.governanceTransitionTs.toString(10),
    preparedLpFee: state.preparedLpFee,
    preparedGovernanceFee: state.preparedGovernanceFee,
    feeTransitionTs: state.feeTransitionTs.toString(10),
    previousDepth: state.previousDepth.toString(10),
  };
}

export async function swimPoolStateToString(
  state: SwimPoolState,
  poolKey: PublicKey,
  programId: PublicKey,
): Promise<string> {
  const authority = await PublicKey.createProgramAddress(
    [poolKey.toBuffer(), Buffer.from([state.nonce])],
    programId,
  );

  return JSON.stringify(
    swimPoolStateToJSON(poolKey, authority, state),
    null,
    2,
  );
}

export const swimPool = (
  numberOfTokens: number,
  property = "swimPool",
): Layout<SwimPoolState> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
  struct(
    [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      u8("nonce"),
      bool("isPaused"),
      ampFactor(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      u32("lpFee"),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      u32("governanceFee"),
      publicKey("lpMintKey"),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      u8("lpDecimalEqualizer"),
      array(publicKey(), numberOfTokens, "tokenMintKeys"),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call
      array(u8(), numberOfTokens, "tokenDecimalEqualizers"),
      array(publicKey(), numberOfTokens, "tokenKeys"),
      publicKey("governanceKey"),
      publicKey("governanceFeeKey"),
      publicKey("preparedGovernanceKey"),
      i64("governanceTransitionTs"),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      u32("preparedLpFee"),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      u32("preparedGovernanceFee"),
      i64("feeTransitionTs"),
      u128("previousDepth"),
    ],
    property,
  );

export const deserializeSwimPool = (
  numberOfTokens: number,
  poolData: Buffer,
): SwimPoolState => {
  const layout = swimPool(numberOfTokens);
  if (poolData.length !== layout.span) {
    throw new Error("Incorrect pool data length");
  }
  return layout.decode(poolData);
};

export async function initalizeTwoPool({
  provider,
  poolMint_0,
  poolMint_1,
  lpMint,
}: {
  provider: AnchorProvider;
  poolMint_0: web3.Keypair;
  poolMint_1: web3.Keypair;
  lpMint: web3.Keypair;
}): Promise<web3.PublicKey> {
  const splToken = Spl.token(provider);

  const payer = (provider.wallet as NodeWallet).payer;
  // const ataProgram = Spl.associatedToken();
  const mintDecimals = 8;

  const poolState = web3.Keypair.generate();

  const poolStateLen = getPoolStateLen(2);
  const lamports = await provider.connection.getMinimumBalanceForRentExemption(
    poolStateLen,
  );
  const createAcctIx = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: poolState.publicKey,
    lamports,
    space: poolStateLen,
    programId: TWO_POOL_PROGRAM_ID,
    // programId: SIX_POOL_PROGRAM_ID,
  });
  const createAcctTxn = new Transaction();
  createAcctTxn.add(createAcctIx);
  const options: ConfirmOptions = { commitment: "confirmed" as Commitment };
  await provider.sendAndConfirm(createAcctTxn, [payer, poolState], options);

  console.log(`created system account for pool`);

  const poolTokenMintAuth = provider.wallet.publicKey;

  const [poolAuth, nonce] = await PublicKey.findProgramAddress(
    [poolState.publicKey.toBuffer()],
    TWO_POOL_PROGRAM_ID,
    // SIX_POOL_PROGRAM_ID
  );
  // const poolMint_0 = web3.Keypair.generate();
  // const poolMint_1 = web3.Keypair.generate();
  // const lpMint = web3.Keypair.generate();
  const poolLpMintAuth = poolAuth;
  const poolMint0Info = await provider.connection.getAccountInfo(
    poolMint_0.publicKey,
  );

  if (!poolMint0Info) {
    const initPoolMintTxn = await splToken.methods
      .initializeMint(mintDecimals, poolTokenMintAuth, null)
      .accounts({
        mint: poolMint_0.publicKey,
      })
      .preInstructions([
        await splToken.account.mint.createInstruction(poolMint_0),
      ])
      .signers([poolMint_0])
      .rpc();
    let blockConfirmStrategy = {
      signature: initPoolMintTxn,
      ...(await provider.connection.getLatestBlockhash()),
    };
    await provider.connection.confirmTransaction(blockConfirmStrategy);
  }

  const poolMint1Info = await provider.connection.getAccountInfo(
    poolMint_1.publicKey,
  );
  if (!poolMint1Info) {
    const initPoolMintTxn1 = await splToken.methods
      .initializeMint(mintDecimals, poolTokenMintAuth, null)
      .accounts({
        mint: poolMint_1.publicKey,
      })
      .preInstructions([
        await splToken.account.mint.createInstruction(poolMint_1),
      ])
      .signers([poolMint_1])
      .rpc();
    let blockConfirmStrategy = {
      signature: initPoolMintTxn1,
      ...(await provider.connection.getLatestBlockhash()),
    };
    await provider.connection.confirmTransaction(blockConfirmStrategy);
  }

  const initLpMintTxn = await splToken.methods
    .initializeMint(mintDecimals, poolLpMintAuth, null)
    .accounts({
      mint: lpMint.publicKey,
    })
    .preInstructions([await splToken.account.mint.createInstruction(lpMint)])
    .signers([lpMint])
    .rpc();
  let blockConfirmStrategy = {
    signature: initLpMintTxn,
    ...(await provider.connection.getLatestBlockhash()),
  };
  await provider.connection.confirmTransaction(blockConfirmStrategy);

  const pool_token_account_0 = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    poolMint_0.publicKey,
    poolAuth,
    true,
  );

  const pool_token_account_1 = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    poolMint_1.publicKey,
    poolAuth,
    true,
  );

  const governance = web3.Keypair.generate();
  const governanceFee = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    lpMint.publicKey,
    governance.publicKey,
  );

  const keysArr: readonly AccountMeta[] = [
    { pubkey: poolState.publicKey, isSigner: false, isWritable: true },
    {
      pubkey: lpMint.publicKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: poolMint_0.publicKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: poolMint_1.publicKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: pool_token_account_0.address,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: pool_token_account_1.address,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: governance.publicKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: governanceFee.address,
      isSigner: false,
      isWritable: false,
    },
  ];

  const ampFactor = { value: new BN(300), decimals: 0 };
  const lpFee = { value: new BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
  const governanceFeeValue = { value: new BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps
  const layout = initInstruction();
  const data = Buffer.alloc(layout.span);
  layout.encode(
    {
      instruction: SwimInstruction.Init,
      nonce,
      ampFactor,
      lpFee,
      governanceFee: governanceFeeValue,
    },
    data,
  );

  const initIx = new TransactionInstruction({
    keys: [...keysArr],
    programId: TWO_POOL_PROGRAM_ID,
    data,
  });
  const initTxn = new Transaction().add(initIx);
  await provider.sendAndConfirm(initTxn);

  return poolState.publicKey;
}

export type MintInfo = {
  mint: web3.Keypair;
  decimals: number;
  mintAuth: web3.PublicKey;
};

export async function initalizeTwoPoolV2({
  provider,
  poolMintInfo_0,
  poolMintInfo_1,
  lpMint,
}: {
  provider: AnchorProvider;
  poolMintInfo_0: MintInfo;
  poolMintInfo_1: MintInfo;
  lpMint: web3.Keypair;
}): Promise<web3.PublicKey> {
  const splToken = Spl.token(provider);

  const payer = (provider.wallet as NodeWallet).payer;
  // const ataProgram = Spl.associatedToken();
  const mintDecimals = 8;

  const [poolPda, bump] = await PublicKey.findProgramAddress(
    [lpMint.publicKey.toBuffer()],
    TWO_POOL_PROGRAM_ID,
  );
  console.log(`poolPda: ${poolPda.toBase58()}, bump: ${bump}`);

  // const poolTokenMintAuth = provider.wallet.publicKey;

  const poolAuth = poolPda;
  const poolLpMintAuth = poolAuth;
  const poolMint0Info = await provider.connection.getAccountInfo(
    poolMintInfo_0.mint.publicKey,
  );

  if (!poolMint0Info) {
    const initPoolMintTxn = await splToken.methods
      .initializeMint(mintDecimals, poolMintInfo_0.mintAuth, null)
      .accounts({
        mint: poolMintInfo_0.mint.publicKey,
      })
      .preInstructions([
        await splToken.account.mint.createInstruction(poolMintInfo_0.mint),
      ])
      .signers([poolMintInfo_0.mint])
      .rpc();
    let blockConfirmStrategy = {
      signature: initPoolMintTxn,
      ...(await provider.connection.getLatestBlockhash()),
    };
    await provider.connection.confirmTransaction(blockConfirmStrategy);
  }

  const poolMint1Info = await provider.connection.getAccountInfo(
    poolMintInfo_1.mint.publicKey,
  );
  if (!poolMint1Info) {
    const initPoolMintTxn1 = await splToken.methods
      .initializeMint(mintDecimals, poolMintInfo_1.mintAuth, null)
      .accounts({
        mint: poolMintInfo_1.mint.publicKey,
      })
      .preInstructions([
        await splToken.account.mint.createInstruction(poolMintInfo_1.mint),
      ])
      .signers([poolMintInfo_1.mint])
      .rpc();
    let blockConfirmStrategy = {
      signature: initPoolMintTxn1,
      ...(await provider.connection.getLatestBlockhash()),
    };
    await provider.connection.confirmTransaction(blockConfirmStrategy);
  }

  const initLpMintTxn = await splToken.methods
    .initializeMint(mintDecimals, poolLpMintAuth, null)
    .accounts({
      mint: lpMint.publicKey,
    })
    .preInstructions([await splToken.account.mint.createInstruction(lpMint)])
    .signers([lpMint])
    .rpc();
  let blockConfirmStrategy = {
    signature: initLpMintTxn,
    ...(await provider.connection.getLatestBlockhash()),
  };
  await provider.connection.confirmTransaction(blockConfirmStrategy);

  const pool_token_account_0 = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    poolMintInfo_0.mint.publicKey,
    poolAuth,
    true,
  );

  const pool_token_account_1 = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    poolMintInfo_1.mint.publicKey,
    poolAuth,
    true,
  );

  const governance = web3.Keypair.generate();
  const governanceFee = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,
    lpMint.publicKey,
    governance.publicKey,
  );

  const keysArr: readonly AccountMeta[] = [
    { pubkey: poolPda, isSigner: false, isWritable: true },
    {
      pubkey: lpMint.publicKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: poolMintInfo_0.mint.publicKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: poolMintInfo_1.mint.publicKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: pool_token_account_0.address,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: pool_token_account_1.address,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: governance.publicKey,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: governanceFee.address,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: payer.publicKey,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: web3.SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
  ];

  const ampFactor = { value: new BN(300), decimals: 0 };
  const lpFee = { value: new BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
  const governanceFeeValue = { value: new BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps
  const layout = initInstruction();
  const data = Buffer.alloc(layout.span);
  layout.encode(
    {
      instruction: SwimInstruction.InitV2,
      nonce: bump,
      ampFactor,
      lpFee,
      governanceFee: governanceFeeValue,
    },
    data,
  );

  const initIx = new TransactionInstruction({
    keys: [...keysArr],
    programId: TWO_POOL_PROGRAM_ID,
    data,
  });
  const initTxn = new Transaction().add(initIx);
  await provider.sendAndConfirm(initTxn);

  return poolPda;
  // return poolState.publicKey;
}

export function addToPoolIx({
  provider,
  pool,
  poolState,
  userTokenAccounts,
  userLpTokenAccount,
  inputAmounts,
  minimumMintAmount,
}: {
  provider: AnchorProvider;
  pool: web3.PublicKey;
  poolState: SwimPoolState;
  userTokenAccounts: web3.PublicKey[];
  userLpTokenAccount: web3.PublicKey;
  inputAmounts: BN[];
  minimumMintAmount: BN;
}) {
  const layout = defiAddInstruction(2);
  const data = Buffer.alloc(layout.span);
  layout.encode(
    {
      instruction: SwimInstruction.DeFi,
      defiInstruction: SwimDefiInstruction.Add,
      inputAmounts,
      minimumMintAmount,
    },
    data,
  );
  const keysArr: readonly AccountMeta[] = [
    { pubkey: pool, isSigner: false, isWritable: true },
    {
      pubkey: pool,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: poolState.tokenKeys[0]!,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: poolState.tokenKeys[1]!,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: poolState.lpMintKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: poolState.governanceFeeKey,
      isSigner: false,
      isWritable: true,
    },
    // "user_transfer_authority"
    {
      pubkey: pool,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: userTokenAccounts[0]!,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: userTokenAccounts[1]!,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: Spl.token(provider).programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: userLpTokenAccount,
      isSigner: false,
      isWritable: true,
    },
  ];
  const addIx = new TransactionInstruction({
    keys: [...keysArr],
    programId: TWO_POOL_PROGRAM_ID,
    data,
  });
  return addIx;
}

function getPoolStateLen(tokenCount: number) {
  // 2 * (DecimalU64.value: u64 + DecimalU64.decimals: u8)
  // + TimestampT = UnixTimestamp: i64
  const ampFactorLen = 2 * (8 + 1) + 2 * 8;
  const poolFeeLen = 4;
  const poolStateLen =
    1 +
    // is_paused
    1 +
    // amp_factor
    ampFactorLen +
    // lp_fee & governance_fee
    2 * poolFeeLen +
    // lp_mint_key
    32 +
    // lp_decimal_equalizer
    1 +
    // token_mint_keys
    tokenCount * 32 +
    // token_decimal_equalizers
    tokenCount * 1 +
    // token_keys
    tokenCount * 32 +
    // governance_key
    32 +
    // governance_fee_key
    32 +
    // prepared_governance_key
    32 +
    // governance_transition_ts
    8 +
    // prepared_lp_fee & prepared_governance_fee
    2 * poolFeeLen +
    // fee_transition_ts
    8 +
    // previous_depth
    16;
  return poolStateLen;
}

export async function getPoolV1Auth(poolKey: web3.PublicKey, nonce: number) {
  return await PublicKey.createProgramAddress(
    [poolKey.toBuffer(), Buffer.from([nonce])],
    TWO_POOL_PROGRAM_ID,
  );
}
