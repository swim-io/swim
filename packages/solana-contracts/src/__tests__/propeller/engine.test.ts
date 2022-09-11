import {
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  createNonce,
  getClaimAddressSolana,
  postVaaSolanaWithRetry,
  setDefaultWasm,
  tryHexToNativeAssetString,
  tryNativeToHexString,
  // uint8ArrayToHex,
} from "@certusone/wormhole-sdk";
import { parseUnits } from "@ethersproject/units";
import type { Program } from "@project-serum/anchor";
// eslint-disable-next-line import/order
import {
  AnchorProvider,
  BN,
  Spl,
  setProvider,
  web3,
  workspace,
} from "@project-serum/anchor";

import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
// eslint-disable-next-line import/order
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
// import type { SwitchboardTestContext } from "@switchboard-xyz/sbv2-utils";

import { SwitchboardTestContext } from "@switchboard-xyz/sbv2-utils";

import type { Propeller } from "../../artifacts/propeller";
import type { TwoPool } from "../../artifacts/two_pool";
import { getApproveAndRevokeIxs } from "../../index";
import {
  getPoolUserBalances,
  printPoolUserBalances,
  setupPoolPrereqs,
  setupUserAssociatedTokenAccts,
} from "../twoPool/poolTestUtils";

import {
  encodeSwimPayload,
  formatParsedTokenTransferWithSwimPayloadPostedMessage,
  formatParsedTokenTransferWithSwimPayloadVaa,
  getPropellerPda,
  // getFlagshipTokenAccountBalances,
  // getPropellerPda,
  getPropellerRedeemerPda,
  // getPropellerSenderPda,
  parseTokenTransferWithSwimPayloadPostedMessage,
  parseTokenTransferWithSwimPayloadSignedVaa,
  // printBeforeAndAfterPoolUserBalances,
} from "./propellerUtils";
import {
  deriveEndpointPda,
  deriveMessagePda,
  encodeTokenTransferWithPayload,
} from "./tokenBridgeUtils";
import {
  WORMHOLE_CORE_BRIDGE,
  WORMHOLE_TOKEN_BRIDGE,
  signAndEncodeVaa,
} from "./wormholeUtils";

setDefaultWasm("node");

const envProvider = AnchorProvider.env();

// const confirmedCommitment = { commitment: "confirmed" as web3.Finality };
const commitment = "confirmed" as web3.Commitment;
const rpcCommitmentConfig = {
  commitment,
  preflightCommitment: commitment,
  skipPreflight: true,
};
const provider = new AnchorProvider(
  envProvider.connection,
  envProvider.wallet,
  rpcCommitmentConfig,
);
const connection = provider.connection;
// const userKeypair = web3.Keypair.generate();
// const user = userKeypair.publicKey;
const payer = (provider.wallet as NodeWallet).payer;
const dummyUser = payer;
const userKeypair = (provider.wallet as NodeWallet).payer;
const user = userKeypair.publicKey;
const splToken = Spl.token(provider);
const splAssociatedToken = Spl.associatedToken(provider);
// Configure the client to use the local cluster.
setProvider(provider);

const propellerProgram = workspace.Propeller as Program<Propeller>;
const twoPoolProgram = workspace.TwoPool as Program<TwoPool>;

const wormhole = WORMHOLE_CORE_BRIDGE;
const tokenBridge = WORMHOLE_TOKEN_BRIDGE;

let ethTokenBridgeSequence = 0;
// let ethTokenBridgeSequence = BigInt(0);

const ethTokenBridgeStr = "0x0290FB167208Af455bB137780163b7B7a9a10C16";
//0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
const ethTokenBridgeEthHexStr = tryNativeToHexString(
  ethTokenBridgeStr,
  CHAIN_ID_ETH,
);
//ethTokenBridge.toString() = gibberish
// ethTokenBridge.toString("hex") = 0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
const ethTokenBridge = Buffer.from(ethTokenBridgeEthHexStr, "hex");

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
const ethRoutingContractEthHexStr = tryNativeToHexString(
  ethRoutingContractStr,
  CHAIN_ID_ETH,
);
const ethRoutingContract = Buffer.from(ethRoutingContractEthHexStr, "hex");

const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
  // units: 420690,
  units: 900000,
  additionalFee: 0,
});

let metapool: web3.PublicKey;
// let metapoolData: SwimPoolState;
// let metapoolAuth: web3.PublicKey;
let userMetapoolTokenAccount0: web3.PublicKey;
let userMetapoolTokenAccount1: web3.PublicKey;
let userMetapoolLpTokenAccount: web3.PublicKey;

let propeller: web3.PublicKey;
let propellerSender: web3.PublicKey;
let propellerRedeemer: web3.PublicKey;
let propellerRedeemerEscrowAccount: web3.PublicKey;
const propellerAdmin: web3.Keypair = web3.Keypair.generate();
let propellerFeeVault: web3.PublicKey;

const initialMintAmount = 100_000_000_000_000;
// const usdcMintInfo: MintInfo = {
//     mint: web3.Keypair.generate(),
//     decimals: 6,
//     mintAuth: dummyUser.publicKey,
// };
// const usdtMintInfo: MintInfo = {
//     mint: web3.Keypair.generate(),
//     decimals: 6,
//     mintAuth: dummyUser.publicKey
// };

const mintDecimal = 6;

const usdcKeypair = web3.Keypair.generate();
const usdtKeypair = web3.Keypair.generate();
const poolMintKeypairs = [usdcKeypair, usdtKeypair];
const poolMintDecimals = [mintDecimal, mintDecimal];
const poolMintAuthorities = [userKeypair, userKeypair];
const swimUsdKeypair = web3.Keypair.generate();
const governanceKeypair = web3.Keypair.generate();
const pauseKeypair = web3.Keypair.generate();

let poolUsdcAtaAddr: web3.PublicKey;
let poolUsdtAtaAddr: web3.PublicKey;
let flagshipPoolGovernanceFeeAcct: web3.PublicKey;

let userUsdcAtaAddr: web3.PublicKey;
let userUsdtAtaAddr: web3.PublicKey;
let userSwimUsdAtaAddr: web3.PublicKey;
const ampFactor = { value: new BN(300), decimals: 0 };
const lpFee = { value: new BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
const governanceFee = { value: new BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps

let flagshipPool: web3.PublicKey;
// let flagshipPoolData: SwimPoolState;
// let poolAuth: web3.PublicKey;
const tokenBridgeMint: web3.PublicKey = swimUsdKeypair.publicKey;

const metapoolMint0Keypair = swimUsdKeypair;
const metapoolMint1Keypair = web3.Keypair.generate();
const metapoolMint1Authority = userKeypair;
const metapoolMint1Decimal = 8;
const metapoolMintKeypairs = [metapoolMint0Keypair, metapoolMint1Keypair];
const metapoolMintDecimals = [mintDecimal, metapoolMint1Decimal];
// const metapoolMintAuthorities = [flagshipPool, metapoolMint1Authority];

const metapoolLpMintKeypair = web3.Keypair.generate();
const metapoolLpMint = metapoolLpMintKeypair.publicKey;
let metapoolPoolToken0Ata: web3.PublicKey;
let metapoolPoolToken1Ata: web3.PublicKey;
let metapoolGovernanceFeeAta: web3.PublicKey;

const gasKickstartAmount: BN = new BN(0.75 * LAMPORTS_PER_SOL);
const propellerFee: BN = new BN(0.25 * LAMPORTS_PER_SOL);
const secpVerifyInitFee: BN = new BN(0.000045 * LAMPORTS_PER_SOL);
const secpVerifyFee: BN = new BN(0.00004 * LAMPORTS_PER_SOL);
const postVaaFee: BN = new BN(0.00005 * LAMPORTS_PER_SOL);
const completeWithPayloadFee: BN = new BN(0.0000055 * LAMPORTS_PER_SOL);
const processSwimPayloadFee: BN = new BN(0.00001 * LAMPORTS_PER_SOL);
const propellerMinTransferAmount = new BN(5_000_000);
const propellerEthMinTransferAmount = new BN(10_000_000);
let marginalPricePool: web3.PublicKey;
let marginalPricePoolToken0Account: web3.PublicKey;
let marginalPricePoolToken1Account: web3.PublicKey;
// USDC token index in flagship pool
const marginalPricePoolTokenIndex = 0;
const marginalPricePoolTokenMint = usdcKeypair.publicKey;

const swimPayloadVersion = 0;

const swimUsdOutputTokenIndex = 0;
const usdcOutputTokenIndex = 1;
const usdcPoolTokenIndex = 0;
const usdtOutputTokenIndex = 2;
const usdtPoolTokenIndex = 1;
const metapoolMint1OutputTokenIndex = 3;
const metapoolMint1PoolTokenIndex = 1;
let outputTokenIdMappingAddrs: ReadonlyMap<number, PublicKey>;
let memoId = 0;

let custody: web3.PublicKey;
let wormholeConfig: web3.PublicKey;
let wormholeFeeCollector: web3.PublicKey;
let wormholeEmitter: web3.PublicKey;
let wormholeSequence: web3.PublicKey;
let authoritySigner: web3.PublicKey;
let tokenBridgeConfig: web3.PublicKey;
let custodySigner: web3.PublicKey;

const evmTargetTokenId = 2;
// const evmTargetTokenAddrEthHexStr = tryNativeToHexString(
//   "0x0000000000000000000000000000000000000003",
//   CHAIN_ID_ETH,
// );
// const evmTargetTokenAddr = Buffer.from(evmTargetTokenAddrEthHexStr, "hex");

const evmOwnerEthHexStr = tryNativeToHexString(
  "0x0000000000000000000000000000000000000004",
  CHAIN_ID_ETH,
);
const evmOwner = Buffer.from(evmOwnerEthHexStr, "hex");

const propellerEngineKeypair = web3.Keypair.generate();
console.info(`propellerEngine: ${propellerEngineKeypair.publicKey.toBase58()}`);
let propellerEngineSwimUsdAta: web3.PublicKey;

let propellerEngineFeeTracker: web3.PublicKey;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let propellerEngineFeeAccount: web3.PublicKey;

let switchboard: SwitchboardTestContext;
let aggregator: PublicKey;

describe("propeller", () => {
  beforeAll(async () => {
    await connection.requestAirdrop(user, 100 * LAMPORTS_PER_SOL);
    await connection.requestAirdrop(
      propellerEngineKeypair.publicKey,
      10 * LAMPORTS_PER_SOL,
    );
    // console.info(`Setting up flagship pool`);
    // await setupFlagshipPool();
    // console.info(
    //   `Finished setting up flagship pool and relevant user token accounts`,
    // );
    // await seedFlagshipPool();
    // console.info(`Finished seeding flagship pool`);
    //
    // console.info(`metapool initializeV2 `);
    // await setupMetaPool();
    // console.info(`Done setting up metapool & relevant user token accounts`);
    // await seedMetaPool();
    // console.info(`Done seeding metapool`);

    console.info(`initializing two pool v2`);
    ({
      poolPubkey: flagshipPool,
      poolTokenAccounts: [poolUsdcAtaAddr, poolUsdtAtaAddr],
      governanceFeeAccount: flagshipPoolGovernanceFeeAcct,
    } = await setupPoolPrereqs(
      twoPoolProgram,
      splToken,
      poolMintKeypairs,
      poolMintDecimals,
      poolMintAuthorities.map((k) => k.publicKey),
      swimUsdKeypair.publicKey,
      governanceKeypair.publicKey,
    ));
    const initFlagshipPoolTxn = twoPoolProgram.methods
      // .initialize(params)
      .initialize(ampFactor, lpFee, governanceFee)
      .accounts({
        payer: provider.publicKey,
        poolMint0: usdcKeypair.publicKey,
        poolMint1: usdtKeypair.publicKey,
        lpMint: swimUsdKeypair.publicKey,
        poolTokenAccount0: poolUsdcAtaAddr,
        poolTokenAccount1: poolUsdtAtaAddr,
        pauseKey: pauseKeypair.publicKey,
        governanceAccount: governanceKeypair.publicKey,
        governanceFeeAccount: flagshipPoolGovernanceFeeAcct,
        tokenProgram: splToken.programId,
        associatedTokenProgram: splAssociatedToken.programId,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([swimUsdKeypair]);

    const pubkeys = await initFlagshipPoolTxn.pubkeys();
    console.info(`pubkeys: ${JSON.stringify(pubkeys)}`);
    if (!pubkeys.pool) {
      throw new Error("Missing Pool Pubkey");
    }
    const pool = pubkeys.pool;
    console.info(
      `poolKey: ${pool.toBase58()}, expected: ${flagshipPool.toBase58()}`,
    );

    // expect(pool.toBase58()).toEqual(flagshipPool.toBase58());
    const initFlagshipPoolTxnSig: string = await initFlagshipPoolTxn.rpc(
      rpcCommitmentConfig,
    );

    console.info(`initFlagshipPoolTxnSig: ${initFlagshipPoolTxnSig}`);

    const flagshipPoolData = await twoPoolProgram.account.twoPool.fetch(pool);
    console.info(
      `flagshipPoolData: ${JSON.stringify(flagshipPoolData, null, 2)}`,
    );

    marginalPricePool = flagshipPool;

    // const calculatedSwimPoolPda = await web3.PublicKey.createProgramAddress(
    //   [
    //     Buffer.from("two_pool"),
    //     ...poolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
    //     swimUsdKeypair.publicKey.toBytes(),
    //     Buffer.from([flagshipPoolData.bump]),
    //   ],
    //   twoPoolProgram.programId,
    // );
    // expect(flagshipPool.toBase58()).toEqual(calculatedSwimPoolPda.toBase58());

    console.info(`setting up user token accounts for flagship pool`);
    ({
      userPoolTokenAtas: [userUsdcAtaAddr, userUsdtAtaAddr],
      userLpTokenAta: userSwimUsdAtaAddr,
    } = await setupUserAssociatedTokenAccts(
      provider.connection,
      dummyUser.publicKey,
      poolMintKeypairs.map((kp) => kp.publicKey),
      poolMintAuthorities,
      swimUsdKeypair.publicKey,
      initialMintAmount,
      payer,
      commitment,
      rpcCommitmentConfig,
    ));

    console.info(
      `done setting up flagship pool and relevant user token accounts`,
    );
    console.info(`
      flagshipPool: ${JSON.stringify(flagshipPoolData, null, 2)}
      user: {
        userUsdcAtaAddr: ${userUsdcAtaAddr.toBase58()}
        userUsdtAtaAddr: ${userUsdtAtaAddr.toBase58()}
        userSwimUsdAtaAddr: ${userSwimUsdAtaAddr.toBase58()}
      }
    `);

    const seedFlagshipPoolAmounts = [
      new BN(50_000_000_000_000),
      new BN(50_000_000_000_000),
    ];
    const minimumMintAmount = new BN(0);
    const propellerEnabled = false;
    const userTransferAuthority = web3.Keypair.generate();
    // const addParams = {
    //   inputAmounts,
    //   minimumMintAmount,
    // };
    const [flagshipPoolAddApproveIxs, flagshipPoolAddRevokeIxs] = await getApproveAndRevokeIxs(
      splToken,
      [userUsdcAtaAddr, userUsdtAtaAddr],
      seedFlagshipPoolAmounts,
      userTransferAuthority.publicKey,
      payer,
    );
    const memoStr = incMemoIdAndGet();
    const memo = Buffer.from(memoStr);

    const addTxn = twoPoolProgram.methods
      .add(
        seedFlagshipPoolAmounts,
        minimumMintAmount,
      )
      .accounts({
        poolTokenAccount0: poolUsdcAtaAddr,
        poolTokenAccount1: poolUsdtAtaAddr,
        lpMint: swimUsdKeypair.publicKey,
        governanceFee: flagshipPoolGovernanceFeeAcct,
        userTransferAuthority: userTransferAuthority.publicKey,
        userTokenAccount0: userUsdcAtaAddr,
        userTokenAccount1: userUsdtAtaAddr,
        userLpTokenAccount: userSwimUsdAtaAddr,
        tokenProgram: splToken.programId,
      })
      .preInstructions([...flagshipPoolAddApproveIxs])
      .postInstructions([...flagshipPoolAddRevokeIxs])
      .signers([userTransferAuthority]);
    // .rpc(rpcCommitmentConfig);

    const addTxnPubkeys = await addTxn.pubkeys();
    console.info(`addTxPubkeys: ${JSON.stringify(addTxnPubkeys, null, 2)}`);

    const addTxnSig = await addTxn.rpc(rpcCommitmentConfig);

    console.info(`addTxSig: ${addTxnSig}`);

    console.info(`metapool initializeV2 `);

    // const [metapoolPda, metapoolBump] = await web3.PublicKey.findProgramAddress(
    //   [
    //     Buffer.from("two_pool"),
    //     ...metapoolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
    //     metapoolLpMintKeypair.publicKey.toBytes(),
    //   ],
    //   twoPoolProgram.programId,
    // );

    ({
      poolPubkey: metapool,
      poolTokenAccounts: [metapoolPoolToken0Ata, metapoolPoolToken1Ata],
      governanceFeeAccount: metapoolGovernanceFeeAta,
    } = await setupPoolPrereqs(
      twoPoolProgram,
      splToken,
      metapoolMintKeypairs,
      metapoolMintDecimals,
      [flagshipPool, metapoolMint1Authority.publicKey],
      // [metapoolMint1Keypair],
      // [metapoolMint1Decimal],
      // [metapoolMint1Authority.publicKey],
      metapoolLpMintKeypair.publicKey,
      governanceKeypair.publicKey,
    ));

    const initMetapoolTxn = twoPoolProgram.methods
      // .initialize(params)
      .initialize(ampFactor, lpFee, governanceFee)
      .accounts({
        payer: provider.publicKey,
        poolMint0: metapoolMintKeypairs[0].publicKey,
        poolMint1: metapoolMintKeypairs[1].publicKey,
        lpMint: metapoolLpMintKeypair.publicKey,
        poolTokenAccount0: metapoolPoolToken0Ata,
        poolTokenAccount1: metapoolPoolToken1Ata,
        pauseKey: pauseKeypair.publicKey,
        governanceAccount: governanceKeypair.publicKey,
        governanceFeeAccount: metapoolGovernanceFeeAta,
        tokenProgram: splToken.programId,
        associatedTokenProgram: splAssociatedToken.programId,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([metapoolLpMintKeypair]);
    // .rpc({skipPreflight: true});
    // console.info(`initMetapoolTxn: ${JSON.stringify(initMetapoolTxn, null, 2)}`);

    const initMetapoolTxnPubkeys = await initMetapoolTxn.pubkeys();
    console.info(
      `initMetapoolTxnPubkeys: ${JSON.stringify(initMetapoolTxnPubkeys)}`,
    );

    if (!initMetapoolTxnPubkeys.pool) {
      throw new Error(
        "Pool pubkey from initMetapoolTxnPubkeys not auto-derived",
      );
    }
    const derivedMetapool = initMetapoolTxnPubkeys.pool;
    console.info(
      `derivedMetapool: ${derivedMetapool.toBase58()}, expected: ${metapool.toBase58()}`,
    );
    // expect(metapoolPda.toBase58()).toEqual(derivedMetapool.toBase58());
    // expect(derivedMetapool.toBase58()).toEqual(metapool.toBase58());

    const initMetapoolTxnSig = await initMetapoolTxn.rpc(rpcCommitmentConfig);

    console.info(`initMetapoolTxnSig: ${initMetapoolTxnSig}`);

    const metapoolData = await twoPoolProgram.account.twoPool.fetch(metapool);
    console.info(`metapoolData: ${JSON.stringify(metapoolData, null, 2)}`);
    // expect(metapoolBump).toEqual(metapoolData.bump);

    // const calculatedMetapoolPda: web3.PublicKey =
    //   await web3.PublicKey.createProgramAddress(
    //     [
    //       Buffer.from("two_pool"),
    //       ...metapoolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
    //       metapoolLpMintKeypair.publicKey.toBytes(),
    //       Buffer.from([metapoolData.bump]),
    //     ],
    //     twoPoolProgram.programId,
    //   );
    // expect(metapool.toBase58()).toEqual(calculatedMetapoolPda.toBase58());

    userMetapoolTokenAccount0 = userSwimUsdAtaAddr;

    // userMetapoolTokenAccount0 = (
    //   await getOrCreateAssociatedTokenAccount(
    //     provider.connection,
    //     payer,
    //     metapoolLpMintKeypair.publicKey,
    //     dummyUser.publicKey,
    //     false,
    //     commitment,
    //     rpcCommitmentConfig,
    //   )
    // ).address;

    ({
      userPoolTokenAtas: [userMetapoolTokenAccount1],
      userLpTokenAta: userMetapoolLpTokenAccount,
    } = await setupUserAssociatedTokenAccts(
      provider.connection,
      dummyUser.publicKey,
      [metapoolMint1Keypair.publicKey],
      [metapoolMint1Authority],
      metapoolLpMintKeypair.publicKey,
      initialMintAmount,
      payer,
      commitment,
      rpcCommitmentConfig,
    ));

    console.info(`Done setting up metapool & relevant user token accounts`);
    console.info(`
      metapool: ${JSON.stringify(metapoolData, null, 2)}
      user: {
        userMetapoolTokenAccount0: ${userMetapoolTokenAccount0.toBase58()}
        userMetapoolTokenAccount1: ${userMetapoolTokenAccount1.toBase58()}
        userMetapoolLpTokenAccount: ${userMetapoolLpTokenAccount.toBase58()}
      }
    `);

    console.info("seeding metapool");
    const poolUserBalancesBefore = await getPoolUserBalances(
      splToken,
      twoPoolProgram,
      metapoolPoolToken0Ata,
      metapoolPoolToken1Ata,
      metapoolGovernanceFeeAta,
      userMetapoolTokenAccount0,
      userMetapoolTokenAccount1,
      userMetapoolLpTokenAccount,
      metapool,
      metapoolLpMintKeypair.publicKey,
    );
    printPoolUserBalances(
      "seeding metapool balances before",
      poolUserBalancesBefore,
    );
    const uiInputAmounts: readonly BN[] = [new BN(2_000), new BN(1_500)];
    const inputAmounts: readonly BN[] = uiInputAmounts.map(
      (bn: BN, i: number) => {
        const powerOfTen = new BN(10).pow(new BN(metapoolMintDecimals[i]));
        return bn.mul(powerOfTen);
      },
    );
    console.info(
      `inputAmounts: ${JSON.stringify(inputAmounts.map((x) => x.toString()))}`,
    );

    const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
      splToken,
      [userMetapoolTokenAccount0, userMetapoolTokenAccount1],
      inputAmounts,
      userTransferAuthority.publicKey,
      payer,
    );
    const seedMetapoolTxn = await twoPoolProgram.methods
      .add(inputAmounts, minimumMintAmount)
      .accounts({
        // propeller: propeller,
        poolTokenAccount0: metapoolPoolToken0Ata,
        poolTokenAccount1: metapoolPoolToken1Ata,
        lpMint: metapoolLpMintKeypair.publicKey,
        governanceFee: metapoolGovernanceFeeAta,
        userTransferAuthority: userTransferAuthority.publicKey,
        userTokenAccount0: userMetapoolTokenAccount0,
        userTokenAccount1: userMetapoolTokenAccount1,
        userLpTokenAccount: userMetapoolLpTokenAccount,
        tokenProgram: splToken.programId,
      })
      .preInstructions([...approveIxs])
      .postInstructions([...revokeIxs])
      .signers([userTransferAuthority])
      .rpc();

    console.info(`seedMetapoolTxn: ${seedMetapoolTxn}`);

    console.info(`initializing propeller`);
    await initializePropeller();
    console.info(`initialized propeller`);

    console.info(`creating token id maps`);
    await createTokenIdMaps();
    console.info(`created token id maps`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    propellerEngineSwimUsdAta = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        userKeypair,
        swimUsdKeypair.publicKey,
        propellerEngineKeypair.publicKey,
      )
    ).address;
    console.info(
      `propellerEngineSwimUsdAta: ${propellerEngineSwimUsdAta.toBase58()}`,
    );

    // [custodyOrWrappedMeta] = await (async () => {
    //     const mintInfo = await getMint(program.provider.connection, tokenBridgeMint);
    //     if (mintInfo.mintAuthority! === tokenMintSigner) {
    //         //First derive the Wrapped Mint Key
    //         //[Ricky] - this call is propellerLpAta wormhole-sdk
    //         const nativeInfo = await getOriginalAssetSol(
    //             program.provider.connection,
    //             tokenBridge.toString(),
    //             tokenBridgeMint.toString()
    //         );
    //         const [wrappedMintKey] = await web3.PublicKey.findProgramAddress(
    //             [
    //                 Buffer.from("wrapped"),
    //                 // serializeuint16 as uint8array
    //                 // ` data.token_chain.to_be_bytes().to_vec(),`
    //                 serializeUint16(nativeInfo.chainId as number),
    //                 tokenBridgeMint.toBytes()
    //             ],
    //             tokenBridge
    //         );
    //         //Then derive the Wrapped Meta Key
    //         return await web3.PublicKey.findProgramAddress([Buffer.from("meta"), wrappedMintKey.toBytes()], tokenBridge);
    //     } else {
    //         // transfer native sol asset
    //         return await web3.PublicKey.findProgramAddress([tokenBridgeMint.toBytes()], tokenBridge);
    //     }
    // })();

    // note - there's also wasm generated helper methods to derive these addresses as well.
    // assuming always sending solana native token so this will be custody.
    [custody] = await (async () => {
      return await web3.PublicKey.findProgramAddress(
        [tokenBridgeMint.toBytes()],
        tokenBridge,
      );
    })();

    [wormholeConfig] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("Bridge")],
      wormhole,
    );
    [wormholeFeeCollector] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("fee_collector")],
      wormhole,
    );
    // wh functions return in a hex string format
    // wormholeEmitter = new web3.PublicKey(
    //   tryHexToNativeString(await getEmitterAddressSolana(tokenBridge.toBase58()), CHAIN_ID_SOLANA)
    //   );
    [wormholeEmitter] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("emitter")],
      tokenBridge,
    );
    [wormholeSequence] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("Sequence"), wormholeEmitter.toBytes()],
      wormhole,
    );

    [authoritySigner] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("authority_signer")],
      tokenBridge,
    );
    [tokenBridgeConfig] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("config")],
      tokenBridge,
    );
    [custodySigner] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("custody_signer")],
      tokenBridge,
    );

    console.info(`
            custodyOrWrappedMeta: ${custody.toString()}
            wormholeConfig: ${wormholeConfig.toString()}
            wormholeFeeCollector: ${wormholeFeeCollector.toString()}
            wormholeEmitter: ${wormholeEmitter.toString()}
            wormholeSequence: ${wormholeSequence.toString()}
            authoritySigner: ${authoritySigner.toString()}
            tokenBridgeConfig: ${tokenBridgeConfig.toString()}
            custodySigner: ${custodySigner.toString()}
        `);

    console.info(`seeding wormhole custody`);
    await seedWormholeCustody();
    console.info(`finished seeing wormhole custody`);

    console.info(`setting up switchboard`);

    // If fails, fallback to looking for a local env file
    try {
      switchboard = await SwitchboardTestContext.loadFromEnv(provider);
      console.info(`set up switchboard`);
      const aggregatorAccount = await switchboard.createStaticFeed(100);
      aggregator = aggregatorAccount.publicKey;
      // switchboard = await SwitchboardTestContext.loadDevnetQueue(
      //   provider,
      //   "F8ce7MsckeZAbAGmxjJNetxYXQa9mKr9nnrC3qKubyYy"
      // );
      // aggregatorKey = DEFAULT_SOL_USD_FEED;
      console.info("local env detected");
      return;
    } catch (error: any) {
      console.info(`Error: SBV2 Localnet - ${JSON.stringify(error.message)}`);
      throw new Error(
        `Failed to load localenv SwitchboardTestContext: ${JSON.stringify(
          error.message,
        )}`,
      );
    }
  }, 50000);

  describe("propellerEngine CompleteWithPayload and ProcessSwimPayload", () => {
    it("Initialize fee tracker", async () => {
      const initalizeFeeTrackers = propellerProgram.methods
        .initializeFeeTracker()
        .accounts({
          propeller,
          payer: propellerEngineKeypair.publicKey,
          tokenBridgeMint,
          systemProgram: web3.SystemProgram.programId,
        });

      const initializeFeeTrackersPubkeys = await initalizeFeeTrackers.pubkeys();
      console.info(
        `initializeFeeTrackersPubkeys: ${JSON.stringify(
          initializeFeeTrackersPubkeys,
          null,
          2,
        )}`,
      );
      const initializeFeeTrackersTxn = await initalizeFeeTrackers.transaction();
      await provider.sendAndConfirm(initializeFeeTrackersTxn, [
        propellerEngineKeypair,
      ]);

      const [expectedFeeTracker, bump] =
        await web3.PublicKey.findProgramAddress(
          [
            Buffer.from("propeller"),
            Buffer.from("fee"),
            tokenBridgeMint.toBuffer(),
            propellerEngineKeypair.publicKey.toBuffer(),
          ],
          propellerProgram.programId,
        );

      if (!initializeFeeTrackersPubkeys.feeTracker) {
        throw new Error("feeTracker is undefined");
      }
      expect(expectedFeeTracker.toBase58()).toEqual(
        initializeFeeTrackersPubkeys.feeTracker.toBase58(),
      );
      propellerEngineFeeTracker = initializeFeeTrackersPubkeys.feeTracker;

      const feeTrackerAccount = await propellerProgram.account.feeTracker.fetch(
        initializeFeeTrackersPubkeys.feeTracker,
      );
      expect(feeTrackerAccount.bump).toEqual(bump);
      expect(feeTrackerAccount.payer.toBase58()).toEqual(
        propellerEngineKeypair.publicKey.toBase58(),
      );
      expect(feeTrackerAccount.feesMint.toBase58()).toEqual(
        tokenBridgeMint.toBase58(),
      );
      expect(feeTrackerAccount.feesOwed.eq(new BN(0))).toBeTruthy();
    });

    const propellerEnabled = true;
    describe("without gas kickstart", () => {
      const gasKickstart = false;
      // still have to handle possibly creating token accounts
      describe("for token from flagship pool as output token", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let propellerMessage: web3.PublicKey;

        const targetTokenId = usdcOutputTokenIndex;
        const memoStr = incMemoIdAndGet();

        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          const memoBuffer = Buffer.alloc(16);
          memoBuffer.write(memoStr);

          const swimPayload = {
            version: swimPayloadVersion,
            targetTokenId,
            owner: provider.publicKey.toBuffer(),
            memo: memoBuffer,
            propellerEnabled,
            gasKickstart,
          };
          const amount = parseUnits("1", mintDecimal);
          console.info(`amount: ${amount.toString()}`);
          /**
           * this is encoding a token transfer from eth routing contract
           * with a swimUSD token address that originated on solana
           * the same as initializing a `TransferWrappedWithPayload` from eth
           */

          const nonce = createNonce().readUInt32LE(0);
          const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
            0,
            nonce,
            CHAIN_ID_ETH as number,
            ethTokenBridge,
            BigInt(++ethTokenBridgeSequence),
            encodeTokenTransferWithPayload(
              amount.toString(),
              swimUsdKeypair.publicKey.toBuffer(),
              CHAIN_ID_SOLANA,
              propellerProgram.programId,
              ethRoutingContract,
              encodeSwimPayload(swimPayload),
            ),
          );
          const propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;

          await postVaaSolanaWithRetry(
            connection,
            // eslint-disable-next-line @typescript-eslint/require-await
            async (tx) => {
              tx.partialSign(userKeypair);
              return tx;
            },
            WORMHOLE_CORE_BRIDGE.toBase58(),
            userKeypair.publicKey.toBase58(),
            tokenTransferWithPayloadSignedVaa,
            10,
          );

          [wormholeMessage] = await deriveMessagePda(
            tokenTransferWithPayloadSignedVaa,
            WORMHOLE_CORE_BRIDGE,
          );

          const [endpointAccount] = await deriveEndpointPda(
            CHAIN_ID_ETH,
            ethTokenBridge,
            // parsedVaa.emitterChain,
            // parsedVaa.emitterAddress,
            WORMHOLE_TOKEN_BRIDGE,
          );
          console.info(`endpointAccount: ${endpointAccount.toBase58()}`);
          wormholeClaim = await getClaimAddressSolana(
            WORMHOLE_TOKEN_BRIDGE.toBase58(),
            tokenTransferWithPayloadSignedVaa,
          );

          const completeNativeWithPayloadIxs = propellerProgram.methods
            .propellerCompleteNativeWithPayload()
            .accounts({
              completeNativeWithPayload: {
                propeller,
                payer: propellerEngineKeypair.publicKey,
                tokenBridgeConfig,
                // userTokenBridgeAccount: userLpTokenAccount.address,
                message: wormholeMessage,
                claim: wormholeClaim,
                endpoint: endpointAccount,
                to: propellerRedeemerEscrowAccount,
                redeemer: propellerRedeemer,
                feeRecipient: propellerFeeVault,
                // feeRecipient: propellerRedeemerEscrowAccount,
                // tokenBridgeMint,
                custody: custody,
                mint: tokenBridgeMint,
                custodySigner,
                rent: web3.SYSVAR_RENT_PUBKEY,
                systemProgram: web3.SystemProgram.programId,
                memo: MEMO_PROGRAM_ID,
                wormhole,
                tokenProgram: splToken.programId,
                tokenBridge,
              },
              feeTracker: propellerEngineFeeTracker,
              aggregator,
              marginalPricePool: marginalPricePool,
              marginalPricePoolToken0Account,
              marginalPricePoolToken1Account,
              twoPoolProgram: twoPoolProgram.programId,
            })
            .preInstructions([requestUnitsIx])
            .signers([propellerEngineKeypair]);

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const completeNativeWithPayloadPubkeys =
            await completeNativeWithPayloadIxs.pubkeys();

          console.info(
            `completeNativeWithPayloadPubkeys: ${JSON.stringify(
              completeNativeWithPayloadPubkeys,
              null,
              2,
            )}`,
          );

          // if (!completeNativeWithPayloadPubkeys.completeNativeWithPayload.propellerMessage) {
          //   throw new Error("propellerMessage key not derived");
          // }
          // console.info(
          //   `completeNativeWithPayloadPubkeys: ${JSON.stringify(
          //     completeNativeWithPayloadPubkeys,
          //     null,
          //     2,
          //   )}`,
          // );
          //
          // const [expectedPropellerMessage, expectedPropellerMessageBump] =
          //   await web3.PublicKey.findProgramAddress(
          //     [
          //       Buffer.from("propeller"),
          //       wormholeClaim.toBuffer(),
          //       wormholeMessage.toBuffer(),
          //     ],
          //     propellerProgram.programId,
          //   );
          // expect(expectedPropellerMessage.toBase58()).toEqual(
          //   completeNativeWithPayloadPubkeys.propellerMessage.toBase58(),
          // );
          //
          // propellerMessage = completeNativeWithPayloadPubkeys.propellerMessage;
          //
          // const completeNativeWithPayloadTxn =
          //   await completeNativeWithPayloadIxs.transaction();
          // const completeNativeWithPayloadTxnSig = await provider.sendAndConfirm(
          //   completeNativeWithPayloadTxn,
          //   [userKeypair],
          //   {
          //     skipPreflight: true,
          //   },
          // );
          //
          // const propellerMessageAccount =
          //   await propellerProgram.account.propellerMessage.fetch(
          //     completeNativeWithPayloadPubkeys.propellerMessage,
          //   );
          // console.info(
          //   `propellerMessageAccount: ${JSON.stringify(
          //     propellerMessageAccount,
          //     null,
          //     2,
          //   )}`,
          // );
          // expect(propellerMessageAccount.bump).toEqual(
          //   expectedPropellerMessageBump,
          // );
          // expect(propellerMessageAccount.whMessage).toEqual(wormholeMessage);
          // expect(propellerMessageAccount.claim).toEqual(wormholeClaim);
          // expect(Buffer.from(propellerMessageAccount.vaaEmitterAddress)).toEqual(
          //   ethTokenBridge,
          // );
          // expect(propellerMessageAccount.vaaEmitterChain).toEqual(CHAIN_ID_ETH);
          // expect(
          //   propellerMessageAccount.vaaSequence.eq(
          //     new BN(ethTokenBridgeSequence),
          //   ),
          // ).toBeTruthy();
          // expect(
          //   propellerMessageAccount.transferAmount.eq(new BN(amount.toString())),
          // ).toBeTruthy();
          // // const {
          // //   swimPayloadVersion,
          // //   targetTokenId,
          // //   owner,
          // //   memo,
          // //   propellerEnabled,
          // //   gasKickstart
          // // } = propellerMessageAccount.swimPayload;
          // expect(propellerMessageAccount.swimPayloadVersion).toEqual(
          //   swimPayloadVersion,
          // );
          // expect(propellerMessageAccount.targetTokenId).toEqual(targetTokenId);
          // const propellerMessageOwnerPubKey = new PublicKey(
          //   propellerMessageAccount.owner,
          // );
          // expect(propellerMessageOwnerPubKey).toEqual(provider.wallet.publicKey);
          // expect(propellerMessageAccount.propellerEnabled).toEqual(
          //   propellerEnabled,
          // );
          // expect(propellerMessageAccount.gasKickstart).toEqual(gasKickstart);
          //
          // const completeNativeWithPayloadTxnSize =
          //   completeNativeWithPayloadTxn.serialize().length;
          // console.info(
          //   `completeNativeWithPayloadTxnSize: ${completeNativeWithPayloadTxnSize}`,
          // );
          // await connection.confirmTransaction({
          //   signature: completeNativeWithPayloadTxnSig,
          //   ...(await connection.getLatestBlockhash()),
          // });
          //
          // const propellerRedeemerEscrowAccountAfter = (
          //   await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          // ).amount;
          // console.info(`
          //     propellerRedeemerEscrowAccount
          //       Before: ${propellerRedeemerEscrowAccountBefore.toString()}
          //       After: ${propellerRedeemerEscrowAccountAfter.toString()}
          //   `);
          // expect(
          //   propellerRedeemerEscrowAccountAfter.gt(
          //     propellerRedeemerEscrowAccountBefore,
          //   ),
          // ).toEqual(true);
          // await checkTxnLogsForMemo(completeNativeWithPayloadTxnSig, memoStr);
        });

        it.skip("processes swim payload", async () => {
          const pool = flagshipPool;
          const poolTokenAccount0 = poolUsdcAtaAddr;
          const poolTokenAccount1 = poolUsdtAtaAddr;
          const lpMint = tokenBridgeMint;
          const governanceFeeAcct = flagshipPoolGovernanceFeeAcct;
          const userTokenAccount0 = userUsdcAtaAddr;
          const userTokenAccount1 = userUsdtAtaAddr;
          const userLpTokenAccount = userSwimUsdAtaAddr;

          const userTransferAuthority = web3.Keypair.generate();
          const propellerMessageAccount =
            await propellerProgram.account.propellerMessage.fetch(
              propellerMessage,
            );
          const propellerMessageAccountTargetTokenId =
            propellerMessageAccount.targetTokenId;
          const propellerRedeemerEscrowBalanceBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;
          const min_output_amount = new BN(0);
          const processSwimPayloadIxs = propellerProgram.methods
            .processSwimPayload(min_output_amount)
            .accounts({
              propeller,
              payer: userKeypair.publicKey,
              message: wormholeMessage,
              claim: wormholeClaim,
              propellerMessage,
              redeemer: propellerRedeemer,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              // tokenIdMap: ?
              // feeRecipient: propellerRedeemerEscrowAccount,
              pool,
              poolTokenAccount0,
              poolTokenAccount1,
              lpMint,
              governanceFee: governanceFeeAcct,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0,
              userTokenAccount1,
              userLpTokenAccount,
              tokenProgram: splToken.programId,
              memo: MEMO_PROGRAM_ID,
              twoPoolProgram: twoPoolProgram.programId,
              systemProgram: web3.SystemProgram.programId,
            })
            .preInstructions([requestUnitsIx])
            .signers([userTransferAuthority]);

          const processSwimPayloadPubkeys =
            await processSwimPayloadIxs.pubkeys();
          console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
          if (!processSwimPayloadPubkeys.tokenIdMap) {
            throw new Error("tokenIdMap not derived");
          }
          const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                Buffer.from("token_id"),
                propeller.toBuffer(),
                new BN(propellerMessageAccountTargetTokenId).toArrayLike(
                  Buffer,
                  "le",
                  2,
                ),
              ],
              propellerProgram.programId,
            );

          const expectedTokenIdMap =
            outputTokenIdMappingAddrs.get(targetTokenId);
          if (!expectedTokenIdMap) {
            throw new Error("expectedTokenIdMap not found");
          }
          const expectedTokenIdMapAcct =
            await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
          console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
          const derivedTokenIdMap = processSwimPayloadPubkeys.tokenIdMap;
          expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
          if (!processSwimPayloadPubkeys.propellerClaim) {
            throw new Error("propellerClaim key not derived");
          }
          const [expectedPropellerClaim, expectedPropellerClaimBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                Buffer.from("claim"),
                wormholeClaim.toBuffer(),
              ],
              propellerProgram.programId,
            );
          expect(processSwimPayloadPubkeys.propellerClaim).toEqual(
            expectedPropellerClaim,
          );

          const processSwimPayloadTxnSig: string =
            await processSwimPayloadIxs.rpc();
          console.info(`processSwimPayloadTxnSig: ${processSwimPayloadTxnSig}`);
          const propellerClaimAccount =
            await propellerProgram.account.propellerClaim.fetch(
              processSwimPayloadPubkeys.propellerClaim,
            );
          expect(propellerClaimAccount.bump).toEqual(
            expectedPropellerClaimBump,
          );
          expect(propellerClaimAccount.claimed).toBeTruthy();

          const propellerRedeemerEscrowBalanceAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceAfter = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceAfter = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;

          console.info(`
            propellerRedeemerEscrowBalance
              Before: ${propellerRedeemerEscrowBalanceBefore.toString()}
              After: ${propellerRedeemerEscrowBalanceAfter.toString()}
            userTokenAccount0Balance
              Before: ${userTokenAccount0BalanceBefore.toString()}
              After: ${userTokenAccount0BalanceAfter.toString()}
            userTokenAccount1Balance
              Before: ${userTokenAccount1BalanceBefore.toString()}
              After: ${userTokenAccount1BalanceAfter.toString()}
          `);
          expect(
            propellerRedeemerEscrowBalanceAfter.eq(
              propellerRedeemerEscrowBalanceBefore.sub(
                propellerMessageAccount.transferAmount,
              ),
            ),
          ).toBeTruthy();

          expect(
            userTokenAccount0BalanceAfter.gt(userTokenAccount0BalanceBefore),
          ).toBeTruthy();
          expect(
            userTokenAccount1BalanceAfter.eq(userTokenAccount1BalanceBefore),
          ).toBeTruthy();
          await checkTxnLogsForMemo(processSwimPayloadTxnSig, memoStr);
        });

        //TODO: add min_output_amount test cases
      });

      describe.skip("for swimUSD as output token", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let propellerMessage: web3.PublicKey;

        const targetTokenId = swimUsdOutputTokenIndex;

        const memoStr = incMemoIdAndGet();
        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          const memoBuffer = Buffer.alloc(16);
          memoBuffer.write(memoStr);

          const swimPayload = {
            version: swimPayloadVersion,
            targetTokenId,
            // owner: tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA),
            // owner: Buffer.from(tryNativeToHexString(provider.publicKey.toBase58(), CHAIN_ID_SOLANA), 'hex'),
            owner: provider.publicKey.toBuffer(),
            // minOutputAmount: 0n,
            memo: memoBuffer,
            propellerEnabled,
            // minThreshold: BigInt(0),
            gasKickstart,
          };
          const amount = parseUnits("1", mintDecimal);
          console.info(`amount: ${amount.toString()}`);
          /**
           * this is encoding a token transfer from eth routing contract
           * with a swimUSD token address that originated on solana
           * the same as initializing a `TransferWrappedWithPayload` from eth
           */

          const nonce = createNonce().readUInt32LE(0);
          const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
            0,
            nonce,
            CHAIN_ID_ETH as number,
            ethTokenBridge,
            BigInt(++ethTokenBridgeSequence),
            encodeTokenTransferWithPayload(
              amount.toString(),
              swimUsdKeypair.publicKey.toBuffer(),
              CHAIN_ID_SOLANA,
              propellerProgram.programId,
              ethRoutingContract,
              encodeSwimPayload(swimPayload),
            ),
          );
          const propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;

          await postVaaSolanaWithRetry(
            connection,
            // eslint-disable-next-line @typescript-eslint/require-await
            async (tx) => {
              tx.partialSign(userKeypair);
              return tx;
            },
            WORMHOLE_CORE_BRIDGE.toBase58(),
            userKeypair.publicKey.toBase58(),
            tokenTransferWithPayloadSignedVaa,
            10,
          );

          [wormholeMessage] = await deriveMessagePda(
            tokenTransferWithPayloadSignedVaa,
            WORMHOLE_CORE_BRIDGE,
          );

          const [endpointAccount] = await deriveEndpointPda(
            CHAIN_ID_ETH,
            ethTokenBridge,
            // parsedVaa.emitterChain,
            // parsedVaa.emitterAddress,
            WORMHOLE_TOKEN_BRIDGE,
          );
          console.info(`endpointAccount: ${endpointAccount.toBase58()}`);
          wormholeClaim = await getClaimAddressSolana(
            WORMHOLE_TOKEN_BRIDGE.toBase58(),
            tokenTransferWithPayloadSignedVaa,
          );

          const completeNativeWithPayloadSwimUsdIxs = propellerProgram.methods
            .completeNativeWithPayload()
            .accounts({
              propeller,
              payer: userKeypair.publicKey,
              tokenBridgeConfig,
              // userTokenBridgeAccount: userLpTokenAccount.address,
              message: wormholeMessage,
              claim: wormholeClaim,
              endpoint: endpointAccount,
              to: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              feeRecipient: userSwimUsdAtaAddr,
              // feeRecipient: propellerRedeemerEscrowAccount,
              // tokenBridgeMint,
              custody: custody,
              mint: tokenBridgeMint,
              custodySigner,
              rent: web3.SYSVAR_RENT_PUBKEY,
              systemProgram: web3.SystemProgram.programId,
              memo: MEMO_PROGRAM_ID,
              wormhole,
              tokenProgram: splToken.programId,
              tokenBridge,
            })
            .preInstructions([requestUnitsIx]);

          const completeNativeWithPayloadSwimUsdPubkeys =
            await completeNativeWithPayloadSwimUsdIxs.pubkeys();

          if (!completeNativeWithPayloadSwimUsdPubkeys.propellerMessage) {
            throw new Error("propellerMessage key not derived");
          }
          console.info(
            `completeNativeWithPayloadSwimUsdPubkeys: ${JSON.stringify(
              completeNativeWithPayloadSwimUsdPubkeys,
              null,
              2,
            )}`,
          );

          const [expectedPropellerMessage, expectedPropellerMessageBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                wormholeClaim.toBuffer(),
                wormholeMessage.toBuffer(),
              ],
              propellerProgram.programId,
            );
          expect(expectedPropellerMessage.toBase58()).toEqual(
            completeNativeWithPayloadSwimUsdPubkeys.propellerMessage.toBase58(),
          );

          propellerMessage =
            completeNativeWithPayloadSwimUsdPubkeys.propellerMessage;

          const completeNativeWithPayloadSwimUsdTxn =
            await completeNativeWithPayloadSwimUsdIxs.transaction();
          const completeNativeWithPayloadSwimUsdTxnSig =
            await provider.sendAndConfirm(
              completeNativeWithPayloadSwimUsdTxn,
              [userKeypair],
              {
                skipPreflight: true,
              },
            );

          const propellerMessageAccount =
            await propellerProgram.account.propellerMessage.fetch(
              completeNativeWithPayloadSwimUsdPubkeys.propellerMessage,
            );
          console.info(
            `propellerMessageAccount: ${JSON.stringify(
              propellerMessageAccount,
              null,
              2,
            )}`,
          );
          expect(propellerMessageAccount.bump).toEqual(
            expectedPropellerMessageBump,
          );
          expect(propellerMessageAccount.whMessage).toEqual(wormholeMessage);
          expect(propellerMessageAccount.claim).toEqual(wormholeClaim);
          expect(
            Buffer.from(propellerMessageAccount.vaaEmitterAddress),
          ).toEqual(ethTokenBridge);
          expect(propellerMessageAccount.vaaEmitterChain).toEqual(CHAIN_ID_ETH);
          expect(
            propellerMessageAccount.vaaSequence.eq(
              new BN(ethTokenBridgeSequence),
            ),
          ).toBeTruthy();
          expect(
            propellerMessageAccount.transferAmount.eq(
              new BN(amount.toString()),
            ),
          ).toBeTruthy();
          // const {
          //   swimPayloadVersion,
          //   targetTokenId,
          //   owner,
          //   memo,
          //   propellerEnabled,
          //   gasKickstart
          // } = propellerMessageAccount.swimPayload;
          expect(propellerMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          expect(propellerMessageAccount.targetTokenId).toEqual(targetTokenId);
          const propellerMessageOwnerPubKey = new PublicKey(
            propellerMessageAccount.owner,
          );
          expect(propellerMessageOwnerPubKey).toEqual(
            provider.wallet.publicKey,
          );
          expect(propellerMessageAccount.propellerEnabled).toEqual(
            propellerEnabled,
          );
          expect(propellerMessageAccount.gasKickstart).toEqual(gasKickstart);

          const completeNativeWithPayloadSwimUsdTxnSize =
            completeNativeWithPayloadSwimUsdTxn.serialize().length;
          console.info(
            `completeNativeWithPayloadSwimUsdTxnSize: ${completeNativeWithPayloadSwimUsdTxnSize}`,
          );
          await connection.confirmTransaction({
            signature: completeNativeWithPayloadSwimUsdTxnSig,
            ...(await connection.getLatestBlockhash()),
          });

          const propellerRedeemerEscrowAccountAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          console.info(`
            propellerRedeemerEscrowAccount
              Before: ${propellerRedeemerEscrowAccountBefore.toString()}
              After: ${propellerRedeemerEscrowAccountAfter.toString()}
          `);
          expect(
            propellerRedeemerEscrowAccountAfter.gt(
              propellerRedeemerEscrowAccountBefore,
            ),
          ).toEqual(true);
          await checkTxnLogsForMemo(
            completeNativeWithPayloadSwimUsdTxnSig,
            memoStr,
          );
        });

        it("processes swim payload", async () => {
          const pool = flagshipPool;
          const poolTokenAccount0 = poolUsdcAtaAddr;
          const poolTokenAccount1 = poolUsdtAtaAddr;
          const lpMint = tokenBridgeMint;
          const governanceFeeAcct = flagshipPoolGovernanceFeeAcct;
          const userTokenAccount0 = userUsdcAtaAddr;
          const userTokenAccount1 = userUsdtAtaAddr;
          const userLpTokenAccount = userSwimUsdAtaAddr;

          const userTransferAuthority = web3.Keypair.generate();
          const propellerMessageAccount =
            await propellerProgram.account.propellerMessage.fetch(
              propellerMessage,
            );
          const propellerMessageAccountTargetTokenId =
            propellerMessageAccount.targetTokenId;
          const propellerRedeemerEscrowBalanceBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;
          const userLpTokenAccountBalanceBefore = (
            await splToken.account.token.fetch(userLpTokenAccount)
          ).amount;
          const min_output_amount = new BN(0);
          const processSwimPayload = propellerProgram.methods
            .processSwimPayload(min_output_amount)
            .accounts({
              propeller,
              payer: userKeypair.publicKey,
              message: wormholeMessage,
              claim: wormholeClaim,
              propellerMessage,
              redeemer: propellerRedeemer,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              // tokenIdMap: ?
              // feeRecipient: propellerRedeemerEscrowAccount,
              pool,
              poolTokenAccount0,
              poolTokenAccount1,
              lpMint,
              governanceFee: governanceFeeAcct,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0,
              userTokenAccount1,
              userLpTokenAccount,
              tokenProgram: splToken.programId,
              memo: MEMO_PROGRAM_ID,
              twoPoolProgram: twoPoolProgram.programId,
              systemProgram: web3.SystemProgram.programId,
            })
            .preInstructions([requestUnitsIx])
            .signers([userTransferAuthority]);

          const processSwimPayloadPubkeys = await processSwimPayload.pubkeys();
          console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
          if (!processSwimPayloadPubkeys.tokenIdMap) {
            throw new Error("tokenIdMap not derived");
          }

          const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                Buffer.from("token_id"),
                propeller.toBuffer(),
                new BN(propellerMessageAccountTargetTokenId).toArrayLike(
                  Buffer,
                  "le",
                  2,
                ),
              ],
              propellerProgram.programId,
            );

          const expectedTokenIdMap =
            outputTokenIdMappingAddrs.get(targetTokenId);
          if (!expectedTokenIdMap) {
            throw new Error("expectedTokenIdMap not found");
          }
          const expectedTokenIdMapAcct =
            await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
          console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
          const derivedTokenIdMap = processSwimPayloadPubkeys.tokenIdMap;
          expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
          if (!processSwimPayloadPubkeys.propellerClaim) {
            throw new Error("propellerClaim key not derived");
          }
          const [expectedPropellerClaim, expectedPropellerClaimBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                Buffer.from("claim"),
                wormholeClaim.toBuffer(),
              ],
              propellerProgram.programId,
            );
          expect(processSwimPayloadPubkeys.propellerClaim).toEqual(
            expectedPropellerClaim,
          );

          const processSwimPayloadTxn: string = await processSwimPayload.rpc();
          console.info(`processSwimPayloadTxn: ${processSwimPayloadTxn}`);
          const propellerClaimAccount =
            await propellerProgram.account.propellerClaim.fetch(
              processSwimPayloadPubkeys.propellerClaim,
            );
          expect(propellerClaimAccount.bump).toEqual(
            expectedPropellerClaimBump,
          );
          expect(propellerClaimAccount.claimed).toBeTruthy();

          const propellerRedeemerEscrowBalanceAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceAfter = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceAfter = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;
          const userLpTokenAccountBalanceAfter = (
            await splToken.account.token.fetch(userLpTokenAccount)
          ).amount;

          console.info(`
            propellerRedeemerEscrowBalance
              Before: ${propellerRedeemerEscrowBalanceBefore.toString()}
              After: ${propellerRedeemerEscrowBalanceAfter.toString()}
            userTokenAccount0Balance
              Before: ${userTokenAccount0BalanceBefore.toString()}
              After: ${userTokenAccount0BalanceAfter.toString()}
            userTokenAccount1Balance
              Before: ${userTokenAccount1BalanceBefore.toString()}
              After: ${userTokenAccount1BalanceAfter.toString()}
          `);
          expect(
            propellerRedeemerEscrowBalanceAfter.eq(
              propellerRedeemerEscrowBalanceBefore.sub(
                propellerMessageAccount.transferAmount,
              ),
            ),
          ).toBeTruthy();

          expect(
            userTokenAccount0BalanceAfter.eq(userTokenAccount0BalanceBefore),
          ).toBeTruthy();
          expect(
            userTokenAccount1BalanceAfter.eq(userTokenAccount1BalanceBefore),
          ).toBeTruthy();
          expect(
            userLpTokenAccountBalanceAfter.eq(
              userLpTokenAccountBalanceBefore.add(
                propellerMessageAccount.transferAmount,
              ),
            ),
          ).toBeTruthy();
          await checkTxnLogsForMemo(processSwimPayloadTxn, memoStr);
        });
      });

      describe.skip("for token from metapool as output token", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let propellerMessage: web3.PublicKey;
        const targetTokenId = metapoolMint1OutputTokenIndex;
        const memoStr = incMemoIdAndGet();
        // const memo = "e45794d6c5a2750b";

        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          const memoBuffer = Buffer.alloc(16);
          memoBuffer.write(memoStr);

          const swimPayload = {
            version: swimPayloadVersion,
            targetTokenId,
            // owner: tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA),
            // owner: Buffer.from(tryNativeToHexString(provider.publicKey.toBase58(), CHAIN_ID_SOLANA), 'hex'),
            owner: provider.publicKey.toBuffer(),
            // minOutputAmount: 0n,
            memo: memoBuffer,
            propellerEnabled,
            // minThreshold: BigInt(0),
            gasKickstart,
          };
          const amount = parseUnits("1", mintDecimal);
          console.info(`amount: ${amount.toString()}`);
          /**
           * this is encoding a token transfer from eth routing contract
           * with a swimUSD token address that originated on solana
           * the same as initializing a `TransferWrappedWithPayload` from eth
           */

          const nonce = createNonce().readUInt32LE(0);
          const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
            0,
            nonce,
            CHAIN_ID_ETH as number,
            ethTokenBridge,
            BigInt(++ethTokenBridgeSequence),
            encodeTokenTransferWithPayload(
              amount.toString(),
              swimUsdKeypair.publicKey.toBuffer(),
              CHAIN_ID_SOLANA,
              propellerProgram.programId,
              ethRoutingContract,
              encodeSwimPayload(swimPayload),
            ),
          );
          const propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;

          await postVaaSolanaWithRetry(
            connection,
            // eslint-disable-next-line @typescript-eslint/require-await
            async (tx) => {
              tx.partialSign(userKeypair);
              return tx;
            },
            WORMHOLE_CORE_BRIDGE.toBase58(),
            userKeypair.publicKey.toBase58(),
            tokenTransferWithPayloadSignedVaa,
            10,
          );

          [wormholeMessage] = await deriveMessagePda(
            tokenTransferWithPayloadSignedVaa,
            WORMHOLE_CORE_BRIDGE,
          );

          const [endpointAccount] = await deriveEndpointPda(
            CHAIN_ID_ETH,
            ethTokenBridge,
            // parsedVaa.emitterChain,
            // parsedVaa.emitterAddress,
            WORMHOLE_TOKEN_BRIDGE,
          );
          console.info(`endpointAccount: ${endpointAccount.toBase58()}`);
          wormholeClaim = await getClaimAddressSolana(
            WORMHOLE_TOKEN_BRIDGE.toBase58(),
            tokenTransferWithPayloadSignedVaa,
          );

          const completeNativeWithPayloadMetapoolIxs = propellerProgram.methods
            .completeNativeWithPayload()
            .accounts({
              propeller,
              payer: userKeypair.publicKey,
              tokenBridgeConfig,
              // userTokenBridgeAccount: userLpTokenAccount.address,
              message: wormholeMessage,
              claim: wormholeClaim,
              endpoint: endpointAccount,
              to: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              feeRecipient: userSwimUsdAtaAddr,
              // feeRecipient: propellerRedeemerEscrowAccount,
              // tokenBridgeMint,
              custody: custody,
              mint: tokenBridgeMint,
              custodySigner,
              rent: web3.SYSVAR_RENT_PUBKEY,
              systemProgram: web3.SystemProgram.programId,
              memo: MEMO_PROGRAM_ID,
              wormhole,
              tokenProgram: splToken.programId,
              tokenBridge,
            })
            .preInstructions([requestUnitsIx]);

          const completeNativeWithPayloadMetapoolPubkeys =
            await completeNativeWithPayloadMetapoolIxs.pubkeys();

          if (!completeNativeWithPayloadMetapoolPubkeys.propellerMessage) {
            throw new Error("propellerMessage key not derived");
          }
          console.info(
            `completeNativeWithPayloadMetapoolPubkeys: ${JSON.stringify(
              completeNativeWithPayloadMetapoolPubkeys,
              null,
              2,
            )}`,
          );

          const [expectedPropellerMessage, expectedPropellerMessageBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                wormholeClaim.toBuffer(),
                wormholeMessage.toBuffer(),
              ],
              propellerProgram.programId,
            );
          expect(expectedPropellerMessage.toBase58()).toEqual(
            completeNativeWithPayloadMetapoolPubkeys.propellerMessage.toBase58(),
          );

          propellerMessage =
            completeNativeWithPayloadMetapoolPubkeys.propellerMessage;

          const completeNativeWithPayloadMetapoolTxn =
            await completeNativeWithPayloadMetapoolIxs.transaction();
          const transferNativeTxnSig = await provider.sendAndConfirm(
            completeNativeWithPayloadMetapoolTxn,
            [userKeypair],
            {
              skipPreflight: true,
            },
          );

          const propellerMessageAccount =
            await propellerProgram.account.propellerMessage.fetch(
              completeNativeWithPayloadMetapoolPubkeys.propellerMessage,
            );
          console.info(
            `propellerMessageAccount: ${JSON.stringify(
              propellerMessageAccount,
              null,
              2,
            )}`,
          );
          expect(propellerMessageAccount.bump).toEqual(
            expectedPropellerMessageBump,
          );
          expect(propellerMessageAccount.whMessage).toEqual(wormholeMessage);
          expect(propellerMessageAccount.claim).toEqual(wormholeClaim);
          expect(
            Buffer.from(propellerMessageAccount.vaaEmitterAddress),
          ).toEqual(ethTokenBridge);
          expect(propellerMessageAccount.vaaEmitterChain).toEqual(CHAIN_ID_ETH);
          expect(
            propellerMessageAccount.vaaSequence.eq(
              new BN(ethTokenBridgeSequence),
            ),
          ).toBeTruthy();
          expect(
            propellerMessageAccount.transferAmount.eq(
              new BN(amount.toString()),
            ),
          ).toBeTruthy();
          // const {
          //   swimPayloadVersion,
          //   targetTokenId,
          //   owner,
          //   memo,
          //   propellerEnabled,
          //   gasKickstart
          // } = propellerMessageAccount.swimPayload;
          expect(propellerMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          expect(propellerMessageAccount.targetTokenId).toEqual(targetTokenId);
          const propellerMessageOwnerPubKey = new PublicKey(
            propellerMessageAccount.owner,
          );
          expect(propellerMessageOwnerPubKey).toEqual(
            provider.wallet.publicKey,
          );
          expect(propellerMessageAccount.propellerEnabled).toEqual(
            propellerEnabled,
          );
          expect(propellerMessageAccount.gasKickstart).toEqual(gasKickstart);

          const completeNativeWithPayloadMetapoolTxnSize =
            completeNativeWithPayloadMetapoolTxn.serialize().length;
          console.info(
            `completeNativeWithPayloadMetapoolTxnSize: ${completeNativeWithPayloadMetapoolTxnSize}`,
          );
          await connection.confirmTransaction({
            signature: transferNativeTxnSig,
            ...(await connection.getLatestBlockhash()),
          });

          const propellerRedeemerEscrowAccountAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          console.info(`
            propellerRedeemerEscrowAccount
              Before: ${propellerRedeemerEscrowAccountBefore.toString()}
              After: ${propellerRedeemerEscrowAccountAfter.toString()}
          `);
          expect(
            propellerRedeemerEscrowAccountAfter.gt(
              propellerRedeemerEscrowAccountBefore,
            ),
          ).toEqual(true);
          await checkTxnLogsForMemo(transferNativeTxnSig, memoStr);
        });

        it("processes swim payload", async () => {
          const pool = metapool;
          const poolTokenAccount0 = metapoolPoolToken0Ata;
          const poolTokenAccount1 = metapoolPoolToken1Ata;
          const lpMint = metapoolLpMint;
          const governanceFeeAcct = metapoolGovernanceFeeAta;
          // user's swimUSdTokenAccount. should be unchanged.
          const userTokenAccount0 = userMetapoolTokenAccount0;
          // user's output_token_index token account. should be increased.
          const userTokenAccount1 = userMetapoolTokenAccount1;
          // user's lp token account. should be unchanged.
          const userLpTokenAccount = userMetapoolLpTokenAccount;

          const userTransferAuthority = web3.Keypair.generate();
          const propellerMessageAccount =
            await propellerProgram.account.propellerMessage.fetch(
              propellerMessage,
            );
          const propellerMessageAccountTargetTokenId =
            propellerMessageAccount.targetTokenId;
          const propellerRedeemerEscrowBalanceBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;
          const userLpTokenAccountBalanceBefore = (
            await splToken.account.token.fetch(userLpTokenAccount)
          ).amount;
          const min_output_amount = new BN(0);
          const processSwimPayload = propellerProgram.methods
            .processSwimPayload(min_output_amount)
            .accounts({
              propeller,
              payer: userKeypair.publicKey,
              message: wormholeMessage,
              claim: wormholeClaim,
              propellerMessage,
              redeemer: propellerRedeemer,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              // tokenIdMap: ?
              // feeRecipient: propellerRedeemerEscrowAccount,
              pool,
              poolTokenAccount0,
              poolTokenAccount1,
              lpMint,
              governanceFee: governanceFeeAcct,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0,
              userTokenAccount1,
              userLpTokenAccount,
              tokenProgram: splToken.programId,
              memo: MEMO_PROGRAM_ID,
              twoPoolProgram: twoPoolProgram.programId,
              systemProgram: web3.SystemProgram.programId,
            })
            .preInstructions([requestUnitsIx])
            .signers([userTransferAuthority]);

          const processSwimPayloadPubkeys = await processSwimPayload.pubkeys();
          console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
          if (!processSwimPayloadPubkeys.tokenIdMap) {
            throw new Error("tokenIdMap not derived");
          }
          const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                Buffer.from("token_id"),
                propeller.toBuffer(),
                new BN(propellerMessageAccountTargetTokenId).toArrayLike(
                  Buffer,
                  "le",
                  2,
                ),
              ],
              propellerProgram.programId,
            );

          const expectedTokenIdMap =
            outputTokenIdMappingAddrs.get(targetTokenId);
          if (!expectedTokenIdMap) {
            throw new Error("expectedTokenIdMap not found");
          }
          const expectedTokenIdMapAcct =
            await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
          console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
          const derivedTokenIdMap = processSwimPayloadPubkeys.tokenIdMap;
          expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
          if (!processSwimPayloadPubkeys.propellerClaim) {
            throw new Error("propellerClaim key not derived");
          }
          const [expectedPropellerClaim, expectedPropellerClaimBump] =
            await web3.PublicKey.findProgramAddress(
              [
                Buffer.from("propeller"),
                Buffer.from("claim"),
                wormholeClaim.toBuffer(),
              ],
              propellerProgram.programId,
            );
          expect(processSwimPayloadPubkeys.propellerClaim).toEqual(
            expectedPropellerClaim,
          );

          const processSwimPayloadTxn: string = await processSwimPayload.rpc();
          console.info(`processSwimPayloadTxn: ${processSwimPayloadTxn}`);
          const propellerClaimAccount =
            await propellerProgram.account.propellerClaim.fetch(
              processSwimPayloadPubkeys.propellerClaim,
            );
          expect(propellerClaimAccount.bump).toEqual(
            expectedPropellerClaimBump,
          );
          expect(propellerClaimAccount.claimed).toBeTruthy();

          const propellerRedeemerEscrowBalanceAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceAfter = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceAfter = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;
          const userLpTokenAccountBalanceAfter = (
            await splToken.account.token.fetch(userLpTokenAccount)
          ).amount;

          console.info(`
            propellerRedeemerEscrowBalance
              Before: ${propellerRedeemerEscrowBalanceBefore.toString()}
              After: ${propellerRedeemerEscrowBalanceAfter.toString()}
            userTokenAccount0Balance
              Before: ${userTokenAccount0BalanceBefore.toString()}
              After: ${userTokenAccount0BalanceAfter.toString()}
            userTokenAccount1Balance
              Before: ${userTokenAccount1BalanceBefore.toString()}
              After: ${userTokenAccount1BalanceAfter.toString()}
          `);
          expect(
            propellerRedeemerEscrowBalanceAfter.eq(
              propellerRedeemerEscrowBalanceBefore.sub(
                propellerMessageAccount.transferAmount,
              ),
            ),
          ).toBeTruthy();

          const outputAmount = userTokenAccount1BalanceAfter.sub(
            userTokenAccount1BalanceBefore,
          );
          expect(
            userTokenAccount0BalanceAfter.eq(userTokenAccount0BalanceBefore),
          ).toBeTruthy();
          expect(
            userTokenAccount1BalanceAfter.gt(userTokenAccount1BalanceBefore),
          ).toBeTruthy();
          expect(
            userLpTokenAccountBalanceAfter.eq(userLpTokenAccountBalanceBefore),
          ).toBeTruthy();
          console.info(`outputAmount: ${outputAmount.toString()}`);
          await checkTxnLogsForMemo(processSwimPayloadTxn, memoStr);
        });
      });
    });

    describe.skip("with gas kickstart", () => {
      const gasKickstart = true;
      describe("for new user", () => {});

      describe("for existing user", () => {});
    });
  });

  async function checkTxnLogsForMemo(txSig: string, memoStr: string) {
    console.info(`txSig: ${txSig}`);
    const txnInfo = await connection.getTransaction(txSig, {
      commitment: "confirmed",
    });

    if (!txnInfo) {
      throw new Error("txnInfo is null");
    }
    if (!txnInfo.meta) {
      throw new Error("txnInfo.meta is null");
    }
    if (!txnInfo.meta.logMessages) {
      throw new Error("txnInfo undefined");
    }
    const txnLogs = txnInfo.meta.logMessages;
    const memoLogFound = txnLogs.some(
      (log) => log.startsWith("Program log: Memo") && log.includes(memoStr),
    );
    expect(memoLogFound).toEqual(true);
  }
});

const getUserTokenAccounts = async (
  propellerMessage: web3.PublicKey,
  // propeller: web3.PublicKey,
  propellerProgramId: web3.PublicKey,
) => {
  const propellerMessageData =
    await propellerProgram.account.propellerMessage.fetch(propellerMessage);

  const targetTokenId = propellerMessageData.targetTokenId;

  if (targetTokenId === 0) {
    // getting out swimUSD. is this an accepted route?
  }

  const owner = new web3.PublicKey(propellerMessageData.owner);
  const [tokenIdMap] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("propeller"),
      Buffer.from("token_id"),
      propeller.toBuffer(),
      new BN(targetTokenId).toArrayLike(Buffer, "le", 2),
    ],
    propellerProgramId,
  );
  const tokenIdMapData = await propellerProgram.account.tokenIdMap.fetch(
    tokenIdMap,
  );
  const poolKey = tokenIdMapData.pool;
  const poolData = await twoPoolProgram.account.twoPool.fetch(poolKey);
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    userTokenAccount0: await getAssociatedTokenAddress(
      poolData.tokenMintKeys[0],
      owner,
    ),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    userTokenAccount1: await getAssociatedTokenAddress(
      poolData.tokenMintKeys[1],
      owner,
    ),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    userLpTokenAccount: await getAssociatedTokenAddress(
      poolData.lpMintKey,
      owner,
    ),
  };
  // let userTokenAccount0: web3.PublicKey;
  // let userTokenAccount1: web3.PublicKey;
  // let userLpTokenAccount: web3.PublicKey;
  // for (let i = 0; i < poolData.tokenMintKeys.length; i++){
  //   const userTokenAccount = await getAssociatedTokenAddress(poolData.tokenMintKeys[i], owner);
  //   result[`userTokenAccount${i}`] = userTokenAccount;
  // }
  // for (const mint of poolData.tokenMintKeys) {
  //
  // }
  // // TODO: optimize this by only requiring the userToken matching the poolTokenIndex to actually be the owner's ATA
  // // const poolTokenIndex = tokenIdMapData.poolTokenIndex;
  // // const poolTokenMint = tokenIdMapData.poolTokenMint;
  //
  //
  // userTokenAccount0 = await getAssociatedTokenAddress(poolTokenMint, owner);
  // const t = {
  //   userTokenAccount0: await getAssociatedTokenAddress(pool.)
  // }
  // userTokenAccount1 =
  // const poolData = await twoPoolProgram.account.twoPool.fetch(poolKey);
  // need propellerMessage.swimPayload.targetTokenId
  // if(targetTokenId === 0)
  // getTargetTokenMapping(target_token_id)
};

const setupFlagshipPool = async () => {
  ({
    poolPubkey: flagshipPool,
    poolTokenAccounts: [poolUsdcAtaAddr, poolUsdtAtaAddr],
    governanceFeeAccount: flagshipPoolGovernanceFeeAcct,
  } = await setupPoolPrereqs(
    twoPoolProgram,
    splToken,
    poolMintKeypairs,
    poolMintDecimals,
    poolMintAuthorities.map((k) => k.publicKey),
    swimUsdKeypair.publicKey,
    governanceKeypair.publicKey,
  ));
  const initFlagshipPoolTxn = twoPoolProgram.methods
    // .initialize(params)
    .initialize(ampFactor, lpFee, governanceFee)
    .accounts({
      payer: provider.publicKey,
      poolMint0: usdcKeypair.publicKey,
      poolMint1: usdtKeypair.publicKey,
      lpMint: swimUsdKeypair.publicKey,
      poolTokenAccount0: poolUsdcAtaAddr,
      poolTokenAccount1: poolUsdtAtaAddr,
      pauseKey: pauseKeypair.publicKey,
      governanceAccount: governanceKeypair.publicKey,
      governanceFeeAccount: flagshipPoolGovernanceFeeAcct,
      tokenProgram: splToken.programId,
      associatedTokenProgram: splAssociatedToken.programId,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([swimUsdKeypair]);

  const pubkeys = await initFlagshipPoolTxn.pubkeys();

  console.info(`pubkeys: ${JSON.stringify(pubkeys)}`);
  if (!pubkeys.pool) {
    throw new Error("Pool Pubkey not auto derived");
  }
  const pool = pubkeys.pool;
  console.info(
    `poolKey: ${pool.toBase58()}, expected: ${flagshipPool.toBase58()}`,
  );

  expect(pool.toBase58()).toBe(flagshipPool.toBase58());
  const initFlagshipPoolTxnSig = await initFlagshipPoolTxn.rpc(
    rpcCommitmentConfig,
  );

  console.info(`initFlagshipPoolTxnSig: ${initFlagshipPoolTxnSig}`);

  const flagshipPoolData = await twoPoolProgram.account.twoPool.fetch(pool);
  console.info(
    `flagshipPoolData: ${JSON.stringify(flagshipPoolData, null, 2)}`,
  );

  marginalPricePool = flagshipPool;
  marginalPricePoolToken0Account = poolUsdcAtaAddr;
  marginalPricePoolToken1Account = poolUsdtAtaAddr;

  const calculatedSwimPoolPda = await web3.PublicKey.createProgramAddress(
    [
      Buffer.from("two_pool"),
      ...poolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
      swimUsdKeypair.publicKey.toBytes(),
      Buffer.from([flagshipPoolData.bump]),
    ],
    twoPoolProgram.programId,
  );
  expect(flagshipPool.toBase58()).toBe(calculatedSwimPoolPda.toBase58());

  console.info(`setting up user token accounts for flagship pool`);
  ({
    userPoolTokenAtas: [userUsdcAtaAddr, userUsdtAtaAddr],
    userLpTokenAta: userSwimUsdAtaAddr,
  } = await setupUserAssociatedTokenAccts(
    provider.connection,
    user,
    poolMintKeypairs.map((kp) => kp.publicKey),
    poolMintAuthorities,
    swimUsdKeypair.publicKey,
    initialMintAmount,
    userKeypair,
    commitment,
    rpcCommitmentConfig,
  ));

  console.info(
    `done setting up flagship pool and relevant user token accounts`,
  );
  console.info(`
      flagshipPool: ${JSON.stringify(flagshipPoolData, null, 2)}
      user: {
        userUsdcAtaAddr: ${userUsdcAtaAddr.toBase58()}
        userUsdtAtaAddr: ${userUsdtAtaAddr.toBase58()}
        userSwimUsdAtaAddr: ${userSwimUsdAtaAddr.toBase58()}
      }
    `);
};

const seedFlagshipPool = async () => {
  const inputAmounts = [new BN(10_000_000_000_000), new BN(5_000_000_000_000)];
  const minimumMintAmount = new BN(0);
  // const addParams = {
  //   inputAmounts,
  //   minimumMintAmount,
  // };
  const userTransferAuthority = web3.Keypair.generate();
  const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
    splToken,
    [userUsdcAtaAddr, userUsdtAtaAddr],
    inputAmounts,
    userTransferAuthority.publicKey,
    userKeypair,
  );

  const addTxn = twoPoolProgram.methods
    .add(inputAmounts, minimumMintAmount)
    .accounts({
      // propeller: propeller,
      poolTokenAccount0: poolUsdcAtaAddr,
      poolTokenAccount1: poolUsdtAtaAddr,
      lpMint: swimUsdKeypair.publicKey,
      governanceFee: flagshipPoolGovernanceFeeAcct,
      userTransferAuthority: userTransferAuthority.publicKey,
      userTokenAccount0: userUsdcAtaAddr,
      userTokenAccount1: userUsdtAtaAddr,
      userLpTokenAccount: userSwimUsdAtaAddr,
      tokenProgram: splToken.programId,
    })
    .preInstructions([...approveIxs])
    .postInstructions([...revokeIxs])
    .signers([userTransferAuthority]);
  // .rpc(rpcCommitmentConfig);

  const addTxnPubkeys = await addTxn.pubkeys();
  console.info(`addTxPubkeys: ${JSON.stringify(addTxnPubkeys, null, 2)}`);

  const addTxnSig = await addTxn.rpc(rpcCommitmentConfig);

  console.info(`addTxSig: ${addTxnSig}`);
};

const setupMetaPool = async () => {
  const [metapoolPda, metapoolBump] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("two_pool"),
      ...metapoolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
      metapoolLpMintKeypair.publicKey.toBytes(),
    ],
    twoPoolProgram.programId,
  );

  ({
    poolPubkey: metapool,
    poolTokenAccounts: [metapoolPoolToken0Ata, metapoolPoolToken1Ata],
    governanceFeeAccount: metapoolGovernanceFeeAta,
  } = await setupPoolPrereqs(
    twoPoolProgram,
    splToken,
    metapoolMintKeypairs,
    metapoolMintDecimals,
    [flagshipPool, metapoolMint1Authority.publicKey],
    // [metapoolMintKeypair1],
    // [metapoolMint1Decimal],
    // [metapoolMint1Authority.publicKey],
    metapoolLpMintKeypair.publicKey,
    governanceKeypair.publicKey,
  ));

  const initMetapoolTxn = twoPoolProgram.methods
    // .initialize(params)
    .initialize(ampFactor, lpFee, governanceFee)
    .accounts({
      payer: provider.publicKey,
      poolMint0: metapoolMintKeypairs[0].publicKey,
      poolMint1: metapoolMintKeypairs[1].publicKey,
      lpMint: metapoolLpMintKeypair.publicKey,
      poolTokenAccount0: metapoolPoolToken0Ata,
      poolTokenAccount1: metapoolPoolToken1Ata,
      pauseKey: pauseKeypair.publicKey,
      governanceAccount: governanceKeypair.publicKey,
      governanceFeeAccount: metapoolGovernanceFeeAta,
      tokenProgram: splToken.programId,
      associatedTokenProgram: splAssociatedToken.programId,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([metapoolLpMintKeypair]);
  // .rpc({skipPreflight: true});
  // console.info(`initMetapoolTxn: ${JSON.stringify(initMetapoolTxn, null, 2)}`);

  const initMetapoolTxnPubkeys = await initMetapoolTxn.pubkeys();
  console.info(
    `initMetapoolTxnPubkeys: ${JSON.stringify(initMetapoolTxnPubkeys)}`,
  );

  if (!initMetapoolTxnPubkeys.pool) {
    throw new Error("Metapool address not auto-derived");
  }
  const derivedMetapool = initMetapoolTxnPubkeys.pool;
  console.info(
    `derivedMetapool: ${derivedMetapool.toBase58()}, expected: ${metapool.toBase58()}`,
  );
  expect(metapoolPda.toBase58()).toBe(derivedMetapool.toBase58());
  expect(derivedMetapool.toBase58()).toBe(metapool.toBase58());

  const initMetapoolTxnSig = await initMetapoolTxn.rpc(rpcCommitmentConfig);

  console.info(`initMetapoolTxnSig: ${initMetapoolTxnSig}`);

  const metapoolData = await twoPoolProgram.account.twoPool.fetch(metapool);
  console.info(`metapoolData: ${JSON.stringify(metapoolData, null, 2)}`);
  expect(metapoolBump).toBe(metapoolData.bump);

  const calculatedMetapoolPda = await web3.PublicKey.createProgramAddress(
    [
      Buffer.from("two_pool"),
      ...metapoolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
      metapoolLpMintKeypair.publicKey.toBytes(),
      Buffer.from([metapoolData.bump]),
    ],
    twoPoolProgram.programId,
  );
  expect(metapool.toBase58()).toBe(calculatedMetapoolPda.toBase58());

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  userMetapoolTokenAccount0 = (
    await getOrCreateAssociatedTokenAccount(
      provider.connection,
      userKeypair,
      swimUsdKeypair.publicKey,
      user,
      false,
      commitment,
      rpcCommitmentConfig,
    )
  ).address;

  ({
    userPoolTokenAtas: [userMetapoolTokenAccount1],
    userLpTokenAta: userMetapoolLpTokenAccount,
  } = await setupUserAssociatedTokenAccts(
    provider.connection,
    user,
    [metapoolMint1Keypair.publicKey],
    [metapoolMint1Authority],
    metapoolLpMintKeypair.publicKey,
    initialMintAmount,
    userKeypair,
    commitment,
    rpcCommitmentConfig,
  ));
};

const seedMetaPool = async () => {
  const inputAmounts = [new BN(2_000_000_000_000), new BN(1_000_000_000_000)];
  const minimumMintAmount = new BN(0);
  // const addParams = {
  //   inputAmounts,
  //   minimumMintAmount,
  // };
  const userTransferAuthority = web3.Keypair.generate();
  const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
    splToken,
    [userMetapoolTokenAccount0, userMetapoolTokenAccount1],
    inputAmounts,
    userTransferAuthority.publicKey,
    userKeypair,
  );

  const addTxn = twoPoolProgram.methods
    .add(inputAmounts, minimumMintAmount)
    .accounts({
      // propeller: propeller,
      poolTokenAccount0: metapoolPoolToken0Ata,
      poolTokenAccount1: metapoolPoolToken1Ata,
      lpMint: metapoolLpMintKeypair.publicKey,
      governanceFee: metapoolGovernanceFeeAta,
      userTransferAuthority: userTransferAuthority.publicKey,
      userTokenAccount0: userMetapoolTokenAccount0,
      userTokenAccount1: userMetapoolTokenAccount1,
      userLpTokenAccount: userMetapoolLpTokenAccount,
      tokenProgram: splToken.programId,
    })
    .preInstructions([...approveIxs])
    .postInstructions([...revokeIxs])
    .signers([userTransferAuthority]);
  // .rpc(rpcCommitmentConfig);

  const addTxnPubkeys = await addTxn.pubkeys();
  console.info(
    `seedMetaPool addTxPubkeys: ${JSON.stringify(addTxnPubkeys, null, 2)}`,
  );

  const addTxnSig = await addTxn.rpc(rpcCommitmentConfig);

  console.info(`addTxSig: ${addTxnSig}`);

  console.info(`
      user: {
        userMetapoolTokenAccount0: ${userMetapoolTokenAccount0.toBase58()}
        userMetapoolTokenAccount1: ${userMetapoolTokenAccount1.toBase58()}
        userMetapoolLpTokenAccount: ${userMetapoolLpTokenAccount.toBase58()}
      }
    `);
};

const initializePropeller = async () => {
  const expectedPropellerAddr = await getPropellerPda(
    tokenBridgeMint,
    propellerProgram.programId,
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  propellerFeeVault = await getAssociatedTokenAddress(
    tokenBridgeMint,
    expectedPropellerAddr,
    true,
  );

  const expectedPropellerRedeemerAddr = await getPropellerRedeemerPda(
    propellerProgram.programId,
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const propellerRedeemerEscrowAddr: web3.PublicKey =
    await getAssociatedTokenAddress(
      tokenBridgeMint,
      expectedPropellerRedeemerAddr,
      true,
    );
  const initializeParams = {
    gasKickstartAmount,
    propellerFee,
    secpVerifyInitFee,
    secpVerifyFee,
    postVaaFee,
    completeWithPayloadFee,
    processSwimPayloadFee,
    propellerMinTransferAmount,
    propellerEthMinTransferAmount,
    marginalPricePool,
    marginalPricePoolTokenIndex,
    marginalPricePoolTokenMint,
    evmRoutingContractAddress: ethRoutingContract,
    // evmRoutingContractAddress: ethRoutingContractEthUint8Arr
  };
  const tx = propellerProgram.methods
    .initialize(initializeParams)
    .accounts({
      propellerRedeemerEscrow: propellerRedeemerEscrowAddr,
      propellerFeeVault,
      admin: propellerAdmin.publicKey,
      tokenBridgeMint,
      payer: userKeypair.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
      pool: flagshipPool,
      poolTokenMint0: usdcKeypair.publicKey,
      poolTokenMint1: usdtKeypair.publicKey,
      lpMint: swimUsdKeypair.publicKey,
      twoPoolProgram: twoPoolProgram.programId,
    })
    .signers([propellerAdmin]);

  const pubkeys = await tx.pubkeys();
  console.info(`pubkeys: ${JSON.stringify(pubkeys, null, 2)}`);
  if (!pubkeys.propeller) {
    throw new Error("Propeller PDA Address was not auto-derived");
  }
  propeller = pubkeys.propeller;
  console.info(`propeller: ${propeller.toBase58()}`);
  if (!pubkeys.propellerSender) {
    throw new Error("Propeller Sender PDA Address was not auto-derived");
  }
  propellerSender = pubkeys.propellerSender;

  if (!pubkeys.propellerRedeemer) {
    throw new Error("Propeller Redeemer PDA Address was not auto-derived");
  }
  propellerRedeemer = pubkeys.propellerRedeemer;
  expect(propellerRedeemer).toEqual(expectedPropellerRedeemerAddr);

  const txSig = await tx.rpc({ skipPreflight: true });
  await connection.confirmTransaction({
    signature: txSig,
    ...(await connection.getLatestBlockhash()),
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  propellerRedeemerEscrowAccount = (
    await getAccount(connection, propellerRedeemerEscrowAddr)
  ).address;

  const propellerAcct = await connection.getAccountInfo(propeller);
  if (!propellerAcct) {
    throw new Error("Propeller AccountInfo not found");
  }
  console.info(`propellerAcct.owner: ${propellerAcct.owner.toBase58()}`);

  const propellerData = await propellerProgram.account.propeller.fetch(
    propeller,
  );
  console.info(`propellerData: ${JSON.stringify(propellerData)}`);

  console.info(`propellerFee: ${propellerData.propellerFee.toString()}`);
  console.info(
    `gasKickstartAmount: ${propellerData.gasKickstartAmount.toString()}`,
  );
  console.info(
    `propellerMinTransferAmount: ${propellerData.propellerMinTransferAmount.toString()}`,
  );

  console.info(`
			propeller: ${propeller.toBase58()}
			propellerSender: ${propellerSender.toBase58()}
			propellerRedeemer: ${propellerRedeemer.toBase58()}
			propellerRedeemerEscrowAccount: ${propellerRedeemerEscrowAccount.toBase58()}
		`);
};

const createTokenIdMaps = async () => {
  const swimUsdTokenIdMap = {
    pool: flagshipPool,
    poolTokenIndex: 0,
    poolTokenMint: swimUsdKeypair.publicKey,
    poolIx: { transfer: {} },
  };
  const usdcTokenIdMap = {
    pool: flagshipPool,
    poolTokenIndex: usdcPoolTokenIndex,
    poolTokenMint: usdcKeypair.publicKey,
    poolIx: { removeExactBurn: {} },
  };
  const usdtTokenIdMap = {
    pool: flagshipPool,
    poolTokenIndex: usdtPoolTokenIndex,
    poolTokenMint: usdtKeypair.publicKey,
    poolIx: { removeExactBurn: {} },
  };
  const metapoolMint1TokenIdMap = {
    pool: metapool,
    poolTokenIndex: metapoolMint1PoolTokenIndex,
    poolTokenMint: metapoolMint1Keypair.publicKey,
    poolIx: { swapExactInput: {} },
  };

  const outputTokenIdMapAddrEntries = await Promise.all(
    [
      {
        outputTokenIndex: swimUsdOutputTokenIndex,
        tokenIdMap: swimUsdTokenIdMap,
      },
      { outputTokenIndex: usdcOutputTokenIndex, tokenIdMap: usdcTokenIdMap },
      { outputTokenIndex: usdtOutputTokenIndex, tokenIdMap: usdtTokenIdMap },
      {
        outputTokenIndex: metapoolMint1OutputTokenIndex,
        tokenIdMap: metapoolMint1TokenIdMap,
      },
    ].map(async ({ outputTokenIndex, tokenIdMap }) => {
      const createTokenIdMappingTxn = propellerProgram.methods
        .createTokenIdMap(
          outputTokenIndex,
          tokenIdMap.pool,
          tokenIdMap.poolTokenIndex,
          tokenIdMap.poolTokenMint,
          tokenIdMap.poolIx,
        )
        .accounts({
          propeller,
          admin: propellerAdmin.publicKey,
          payer: userKeypair.publicKey,
          systemProgram: web3.SystemProgram.programId,
          // rent: web3.SYSVAR_RENT_PUBKEY,
          pool: tokenIdMap.pool,
          twoPoolProgram: twoPoolProgram.programId,
        })
        .signers([propellerAdmin]);

      const pubkeys = await createTokenIdMappingTxn.pubkeys();
      if (!pubkeys.tokenIdMap) {
        throw new Error("Token Id Map PDA Address was not auto-derived");
      }
      const tokenIdMapAddr = pubkeys.tokenIdMap;
      expect(tokenIdMapAddr).toBeTruthy();

      const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
        await web3.PublicKey.findProgramAddress(
          [
            Buffer.from("propeller"),
            Buffer.from("token_id"),
            propeller.toBuffer(),
            new BN(outputTokenIndex).toArrayLike(Buffer, "le", 2),
            // byteify.serializeUint16(usdcOutputTokenIndex),
          ],
          propellerProgram.programId,
        );
      expect(tokenIdMapAddr).toEqual(calculatedTokenIdMap);
      await createTokenIdMappingTxn.rpc();

      const fetchedTokenIdMap = await propellerProgram.account.tokenIdMap.fetch(
        tokenIdMapAddr,
      );
      expect(fetchedTokenIdMap.outputTokenIndex).toEqual(outputTokenIndex);
      expect(fetchedTokenIdMap.pool).toEqual(tokenIdMap.pool);
      expect(fetchedTokenIdMap.poolTokenIndex).toEqual(
        tokenIdMap.poolTokenIndex,
      );
      expect(fetchedTokenIdMap.poolTokenMint).toEqual(tokenIdMap.poolTokenMint);
      expect(fetchedTokenIdMap.poolIx).toEqual(tokenIdMap.poolIx);
      expect(fetchedTokenIdMap.bump).toEqual(calculatedTokenIdMapBump);
      return { outputTokenIndex, tokenIdMapAddr };
    }),
  );

  outputTokenIdMappingAddrs = new Map(
    outputTokenIdMapAddrEntries.map(({ outputTokenIndex, tokenIdMapAddr }) => {
      return [outputTokenIndex, tokenIdMapAddr];
    }),
  );
};

const seedWormholeCustody = async () => {
  // const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
  //   units: 900000,
  //   additionalFee: 0,
  // });

  const userLpTokenBalanceBefore = (
    await splToken.account.token.fetch(userSwimUsdAtaAddr)
  ).amount;

  const transferAmount = userLpTokenBalanceBefore.div(new BN(2));
  const nonce = createNonce().readUInt32LE(0);
  const memo = "e45794d6c5a2750a";
  const memoBuffer = Buffer.alloc(16);
  memoBuffer.write(memo);
  const wormholeMessage = web3.Keypair.generate();
  const gasKickstart = false;
  const propellerEnabled = true;
  const transferNativeTxn = await propellerProgram.methods
    .transferNativeWithPayload(
      nonce,
      CHAIN_ID_ETH,
      transferAmount,
      evmTargetTokenId,
      // evmTargetTokenAddr,
      evmOwner,
      gasKickstart,
      propellerEnabled,
      memoBuffer,
    )
    .accounts({
      propeller,
      payer: userKeypair.publicKey,
      tokenBridgeConfig,
      userTokenBridgeAccount: userSwimUsdAtaAddr,
      tokenBridgeMint,
      custody,
      tokenBridge,
      custodySigner,
      authoritySigner,
      wormholeConfig,
      wormholeMessage: wormholeMessage.publicKey,
      wormholeEmitter,
      wormholeSequence,
      wormholeFeeCollector,
      clock: web3.SYSVAR_CLOCK_PUBKEY,
      // autoderived
      // sender
      rent: web3.SYSVAR_RENT_PUBKEY,
      // autoderived
      // systemProgram,
      wormhole,
      tokenProgram: splToken.programId,
      memo: MEMO_PROGRAM_ID,
    })
    .preInstructions([requestUnitsIx])
    .signers([wormholeMessage])
    .rpc();

  console.info(`transferNativeTxn(seedWormholeCustody): ${transferNativeTxn}`);
};

function incMemoIdAndGet() {
  return (++memoId).toString().padStart(16, "0");
}
