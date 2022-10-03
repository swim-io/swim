import {
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  createNonce,
  getClaimAddressSolana,
  postVaaSolanaWithRetry,
  setDefaultWasm,
} from "@certusone/wormhole-sdk";
import { parseUnits } from "@ethersproject/units";
import type { Idl } from "@project-serum/anchor";
// eslint-disable-next-line import/order
import {
  AnchorProvider,
  BN,
  Program,
  Spl,
  setProvider,
  web3,
  workspace,
} from "@project-serum/anchor";

// eslint-disable-next-line import/extensions
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  AggregatorAccount,
  loadSwitchboardProgram,
} from "@switchboard-xyz/switchboard-v2";
import Big from "big.js";

import type { Propeller } from "../../artifacts/propeller";
import PropellerIDL from "../../artifacts/propeller.json";
import type { TwoPool } from "../../artifacts/two_pool";
import { getApproveAndRevokeIxs } from "../../index";
import {
  getPoolUserBalances,
  printPoolUserBalances,
  setupPoolPrereqs,
  setupUserAssociatedTokenAccts,
} from "../twoPool/poolTestUtils";

import {
  DEFAULT_SOL_USD_FEED,
  SWIM_USD_TO_TOKEN_NUMBER,
  USDC_TO_TOKEN_NUMBER,
  USDT_TO_TOKEN_NUMBER,
  ampFactor,
  bscTokenBridge,
  commitment,
  completeWithPayloadFee,
  ethRoutingContract,
  ethTokenBridge,
  evmOwner,
  gasKickstartAmount,
  governanceFee,
  initAtaFee,
  lpFee,
  marginalPricePoolTokenIndex,
  metapoolMint1OutputTokenIndex,
  metapoolMint1PoolTokenIndex,
  postVaaFee,
  processSwimPayloadFee,
  routingContracts,
  rpcCommitmentConfig,
  secpVerifyFee,
  secpVerifyInitFee,
  setComputeUnitLimitIx,
  swimPayloadVersion,
  usdcPoolTokenIndex,
  usdtPoolTokenIndex,
} from "./consts";
import type { WormholeAddresses } from "./propellerUtils";
import {
  encodeSwimPayload,
  generatePropellerEngineTxns,
  getOwnerTokenAccountsForPool,
  getPropellerPda,
  getPropellerRedeemerPda,
  getSwimClaimPda,
  getSwimPayloadMessagePda,
  getTargetTokenIdMapAddr,
  getWormholeAddressesForMint,
} from "./propellerUtils";
import {
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

let wormhole: web3.PublicKey;
let tokenBridge: web3.PublicKey;
// const wormhole = WORMHOLE_CORE_BRIDGE;
// const tokenBridge = WORMHOLE_TOKEN_BRIDGE;

let ethTokenBridgeSequence = 0;
// let ethTokenBridgeSequence = BigInt(0);

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

const initialMintAmount = new BN(100_000_000_000_000);
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

let flagshipPool: web3.PublicKey;
// let flagshipPoolData: SwimPoolState;
// let poolAuth: web3.PublicKey;
const swimUsdMint: web3.PublicKey = swimUsdKeypair.publicKey;

const metapoolMint0Keypair = swimUsdKeypair;
const metapoolMint1Keypair = web3.Keypair.generate();
const metapoolMint1Authority = userKeypair;
const metapoolMint1Decimal = 8;
const metapoolMintKeypairs = [metapoolMint0Keypair, metapoolMint1Keypair];
const metapoolMintDecimals = [mintDecimal, metapoolMint1Decimal];
// const metapoolMintAuthorities = [flagshipPool, metapoolMint1Authority];

const metapoolLpMintKeypair = web3.Keypair.generate();
// const metapoolLpMint = metapoolLpMintKeypair.publicKey;
let metapoolPoolToken0Ata: web3.PublicKey;
let metapoolPoolToken1Ata: web3.PublicKey;
let metapoolGovernanceFeeAta: web3.PublicKey;

// const propellerMinTransferAmount = new BN(5_000_000);
// const propellerEthMinTransferAmount = new BN(10_000_000);
let marginalPricePool: web3.PublicKey;
let marginalPricePoolToken0Account: web3.PublicKey;
let marginalPricePoolToken1Account: web3.PublicKey;
let marginalPricePoolLpMint: web3.PublicKey;
const marginalPricePoolTokenMint = usdcKeypair.publicKey;

let outputTokenIdMappingAddrs: ReadonlyMap<number, PublicKey>;
let memoId = 0;

let wormholeAddresses: WormholeAddresses;
let custody: web3.PublicKey;
let wormholeConfig: web3.PublicKey;
let wormholeFeeCollector: web3.PublicKey;
let wormholeEmitter: web3.PublicKey;
let wormholeSequence: web3.PublicKey;
let authoritySigner: web3.PublicKey;
let tokenBridgeConfig: web3.PublicKey;
let custodySigner: web3.PublicKey;
let ethEndpointAccount: web3.PublicKey;

// const evmTargetTokenAddrEthHexStr = tryNativeToHexString(
//   "0x0000000000000000000000000000000000000003",
//   CHAIN_ID_ETH,
// );
// const evmTargetTokenAddr = Buffer.from(evmTargetTokenAddrEthHexStr, "hex");

const propellerEngineKeypair = web3.Keypair.generate();
const propellerEngineWallet = new NodeWallet(propellerEngineKeypair);
const propellerEngineAnchorProvider = new AnchorProvider(
  envProvider.connection,
  propellerEngineWallet,
  rpcCommitmentConfig,
);
const propellerEnginePropellerProgram = new Program(
  PropellerIDL as Idl,
  propellerProgram.programId,
  propellerEngineAnchorProvider,
) as Program<Propeller>;
console.info(`propellerEngine: ${propellerEngineKeypair.publicKey.toBase58()}`);

let propellerEngineFeeTracker: web3.PublicKey;

let propellerEngineSwimUsdFeeAccount: web3.PublicKey;

let aggregatorAccount: AggregatorAccount;
let aggregator: PublicKey;

describe("propeller", () => {
  beforeAll(async () => {
    await connection.requestAirdrop(user, 100 * LAMPORTS_PER_SOL);
    await connection.requestAirdrop(
      propellerEngineKeypair.publicKey,
      100 * LAMPORTS_PER_SOL,
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
      splToken,
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
    const userTransferAuthority = web3.Keypair.generate();
    // const addParams = {
    //   inputAmounts,
    //   minimumMintAmount,
    // };
    const [flagshipPoolAddApproveIxs, flagshipPoolAddRevokeIxs] =
      await getApproveAndRevokeIxs(
        splToken,
        [userUsdcAtaAddr, userUsdtAtaAddr],
        seedFlagshipPoolAmounts,
        userTransferAuthority.publicKey,
        payer,
      );

    const addTxn = twoPoolProgram.methods
      .add(seedFlagshipPoolAmounts, minimumMintAmount)
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

    marginalPricePool = flagshipPool;
    marginalPricePoolToken0Account = poolUsdcAtaAddr;
    marginalPricePoolToken1Account = poolUsdtAtaAddr;
    marginalPricePoolLpMint = swimUsdKeypair.publicKey;

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
      splToken,
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

    const switchboardProgram = await loadSwitchboardProgram(
      "devnet",
      provider.connection,
      // new Connection(clusterApiUrl("devnet")),
      payer,
    );
    aggregator = DEFAULT_SOL_USD_FEED;
    aggregatorAccount = new AggregatorAccount({
      program: switchboardProgram,
      publicKey: DEFAULT_SOL_USD_FEED,
    });

    const result = await aggregatorAccount.getLatestValue();
    const latestTimestamp = await aggregatorAccount.getLatestFeedTimestamp();
    console.info(`
      current devnet SOL_USD feed:
        sol/usd feed value: ${result.toString()}
        latestFeedTimestamp: ${new Date(
          latestTimestamp.toNumber(),
        ).toUTCString()}
    `);

    console.info(`initializing propeller`);
    await initializePropeller();
    console.info(`initialized propeller`);

    console.info(`creating token id maps`);
    await createTokenIdMaps();
    console.info(`created token id maps`);

    console.info(`creating target chain maps`);
    await createTargetChainMaps();
    console.info(`created target chain maps`);

    propellerEngineSwimUsdFeeAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        userKeypair,
        swimUsdKeypair.publicKey,
        propellerEngineKeypair.publicKey,
      )
    ).address;
    console.info(
      `propellerEngineSwimUsdFeeAccount: ${propellerEngineSwimUsdFeeAccount.toBase58()}`,
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

    wormholeAddresses = await getWormholeAddressesForMint(
      WORMHOLE_CORE_BRIDGE,
      WORMHOLE_TOKEN_BRIDGE,
      swimUsdMint,
      ethTokenBridge,
      bscTokenBridge,
    );

    ({
      authoritySigner,
      custody,
      custodySigner,
      ethEndpointAccount,
      tokenBridge,
      tokenBridgeConfig,
      wormhole,
      wormholeConfig,
      wormholeEmitter,
      wormholeFeeCollector,
      wormholeSequence,
    } = wormholeAddresses);
    console.info(
      `wormholeAddresses: ${JSON.stringify(wormholeAddresses, null, 2)}`,
    );

    console.info(`
      wormholeAddresses: ${JSON.stringify(wormholeAddresses, null, 2)}
    `);

    console.info(`seeding wormhole custody`);
    // await seedWormholeCustody(wormholeAddresses);
    await seedWormholeCustody();

    console.info(`finished seeing wormhole custody`);

    console.info(`setting up switchboard`);

    // // If fails, fallback to looking for a local env file
    // try {
    //   switchboard = await SwitchboardTestContext.loadFromEnv(provider);
    //   console.info(`set up switchboard`);
    //   const aggregatorAccount = await switchboard.createStaticFeed(100);
    //   aggregator = aggregatorAccount.publicKey;
    //   // switchboard = await SwitchboardTestContext.loadDevnetQueue(
    //   //   provider,
    //   //   "F8ce7MsckeZAbAGmxjJNetxYXQa9mKr9nnrC3qKubyYy"
    //   // );
    //   // aggregatorKey = DEFAULT_SOL_USD_FEED;
    //   console.info("local env detected");
    //   return;
    // } catch (error: any) {
    //   console.info(`Error: SBV2 Localnet - ${JSON.stringify(error.message)}`);
    //   throw new Error(
    //     `Failed to load localenv SwitchboardTestContext: ${JSON.stringify(
    //       error.message,
    //     )}`,
    //   );
    // }
  }, 50000);

  describe("propellerEngine CompleteWithPayload and ProcessSwimPayload", () => {
    // const t = wormholeAddresses;

    it("Initialize fee tracker", async () => {
      const initFeeTrackers = propellerProgram.methods
        .initializeFeeTracker()
        .accounts({
          propeller,
          payer: propellerEngineKeypair.publicKey,
          swimUsdMint: swimUsdMint,
          systemProgram: web3.SystemProgram.programId,
        });

      const initializeFeeTrackersPubkeys = await initFeeTrackers.pubkeys();
      console.info(
        `initializeFeeTrackersPubkeys: ${JSON.stringify(
          initializeFeeTrackersPubkeys,
          null,
          2,
        )}`,
      );
      const initializeFeeTrackersTxn = await initFeeTrackers.transaction();
      await provider.sendAndConfirm(initializeFeeTrackersTxn, [
        propellerEngineKeypair,
      ]);

      const [expectedFeeTracker, bump] =
        await web3.PublicKey.findProgramAddress(
          [
            Buffer.from("propeller"),
            Buffer.from("fee"),
            swimUsdMint.toBuffer(),
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
        swimUsdMint.toBase58(),
      );
      expect(feeTrackerAccount.feesOwed.eq(new BN(0))).toBeTruthy();
    });

    const propellerEnabled = true;
    describe("without gas kickstart", () => {
      const gasKickstart = false;
      // still have to handle possibly creating token accounts
      describe("for existing user with all token accounts", () => {
        describe("for token from flagship pool as output token", () => {
          let wormholeClaim: web3.PublicKey;
          let wormholeMessage: web3.PublicKey;
          let swimPayloadMessage: web3.PublicKey;
          let owner: web3.PublicKey;

          const targetTokenId = USDC_TO_TOKEN_NUMBER;
          const memoStr = incMemoIdAndGet();

          it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedBefore = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;

            const memoBuffer = Buffer.alloc(16);
            memoBuffer.write(memoStr);

            const maxFee = new BN(1000000000);
            const swimPayload = {
              version: swimPayloadVersion,
              owner: provider.publicKey.toBuffer(),
              propellerEnabled,
              gasKickstart,
              maxFee,
              targetTokenId,
              memo: memoBuffer,
            };
            const amount = parseUnits("100000", mintDecimal);
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

            console.info(
              `propellerRedeemerEscrowAccountBefore: ${propellerRedeemerEscrowAccountBefore.toString()}`,
            );
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

            // const [ethEndpointAccount] = await deriveEndpointPda(
            //   CHAIN_ID_ETH,
            //   ethTokenBridge,
            //   // parsedVaa.emitterChain,
            //   // parsedVaa.emitterAddress,
            //   WORMHOLE_TOKEN_BRIDGE,
            // );
            console.info(`endpointAccount: ${ethEndpointAccount.toBase58()}`);
            wormholeClaim = await getClaimAddressSolana(
              WORMHOLE_TOKEN_BRIDGE.toBase58(),
              tokenTransferWithPayloadSignedVaa,
            );

            const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
              await getSwimPayloadMessagePda(
                wormholeClaim,
                propellerProgram.programId,
              );
            // const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
            //   await web3.PublicKey.findProgramAddress(
            //     [
            //       Buffer.from("propeller"),
            //       wormholeClaim.toBuffer(),
            //       wormholeMessage.toBuffer(),
            //     ],
            //     propellerProgram.programId,
            //   );
            // expect(expectedSwimPayloadMessage.toBase58()).toEqual(
            //   completeNativeWithPayloadPubkeys.swimPayloadMessage.toBase58(),
            // );
            console.info(`
            marginalPricePoolToken0Account: ${marginalPricePoolToken0Account.toBase58()}
            marginalPricePoolToken1Account: ${marginalPricePoolToken1Account.toBase58()}
          `);

            const providerBalanceBefore = await provider.connection.getBalance(
              provider.wallet.publicKey,
            );
            const propellerEngineWalletPubkey =
              propellerEngineAnchorProvider.wallet.publicKey;
            const propellerEngineProviderBalanceBefore =
              await provider.connection.getBalance(propellerEngineWalletPubkey);

            const completeNativeWithPayloadIxs =
              propellerEnginePropellerProgram.methods
                .propellerCompleteNativeWithPayload()
                .accounts({
                  completeNativeWithPayload: {
                    propeller,
                    payer: propellerEngineKeypair.publicKey,
                    tokenBridgeConfig: wormholeAddresses.tokenBridgeConfig,
                    // userTokenBridgeAccount: userLpTokenAccount.address,
                    message: wormholeMessage,
                    claim: wormholeClaim,
                    swimPayloadMessage: expectedSwimPayloadMessage,
                    endpoint: ethEndpointAccount,
                    to: propellerRedeemerEscrowAccount,
                    redeemer: propellerRedeemer,
                    feeRecipient: propellerFeeVault,
                    // feeRecipient: propellerRedeemerEscrowAccount,
                    // tokenBridgeMint,
                    custody: wormholeAddresses.custody,
                    swimUsdMint: swimUsdMint,
                    custodySigner: wormholeAddresses.custodySigner,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    wormhole,
                    tokenProgram: splToken.programId,
                    tokenBridge,
                  },
                  feeTracker: propellerEngineFeeTracker,
                  aggregator,
                  // marginalPricePool: {
                  //   pool: marginalPricePool,
                  //   poolToken0Account: marginalPricePoolToken0Account,
                  //   poolToken1Account: marginalPricePoolToken1Account,
                  //   lpMint: marginalPricePoolLpMint,
                  // },
                  // twoPoolProgram: twoPoolProgram.programId,
                  marginalPricePool: marginalPricePool,
                  marginalPricePoolToken0Account:
                    marginalPricePoolToken0Account,
                  marginalPricePoolToken1Account:
                    marginalPricePoolToken1Account,
                  marginalPricePoolLpMint: marginalPricePoolLpMint,
                  twoPoolProgram: twoPoolProgram.programId,
                  memo: MEMO_PROGRAM_ID,
                })
                .preInstructions([setComputeUnitLimitIx])
                .signers([propellerEngineKeypair]);

            const completeNativeWithPayloadPubkeys =
              await completeNativeWithPayloadIxs.pubkeys();

            console.info(
              `completeNativeWithPayloadPubkeys: ${JSON.stringify(
                completeNativeWithPayloadPubkeys,
                null,
                2,
              )}`,
            );

            // const completeNativeWithPayloadTxn =
            //   await completeNativeWithPayloadIxs.transaction();
            //
            // console.info(
            //   `completeNativeWithPayloadTxn: ${JSON.stringify(
            //     completeNativeWithPayloadTxn,
            //     null,
            //     2,
            //   )}`,
            // );
            const completeNativeWithPayloadTxnSig =
              await completeNativeWithPayloadIxs.rpc();
            const providerBalanceAfter = await provider.connection.getBalance(
              provider.wallet.publicKey,
            );
            const providerBalanceDiff =
              providerBalanceBefore - providerBalanceAfter;
            const propellerEngineProviderBalanceAfter =
              await provider.connection.getBalance(
                propellerEngineAnchorProvider.wallet.publicKey,
              );
            const propellerEngineProviderBalanceDiff =
              propellerEngineProviderBalanceBefore -
              propellerEngineProviderBalanceAfter;
            console.info(`
              provider: ${provider.wallet.publicKey.toBase58()}
                balanceDiff: ${providerBalanceDiff}
            `);
            console.info(`
              propellerEngineWalletPubkey: ${propellerEngineWalletPubkey.toBase58()}
                balanceDiff: ${propellerEngineProviderBalanceDiff}
            `);

            const swimPayloadMessageAccount =
              await propellerProgram.account.swimPayloadMessage.fetch(
                expectedSwimPayloadMessage,
              );
            console.info(
              `swimPayloadMessageAccount: ${JSON.stringify(
                swimPayloadMessageAccount,
                null,
                2,
              )}`,
            );
            expect(swimPayloadMessageAccount.bump).toEqual(
              expectedSwimPayloadMessageBump,
            );
            // expect(swimPayloadMessageAccount.whMessage).toEqual(
            //   wormholeMessage,
            // );
            expect(swimPayloadMessageAccount.claim).toEqual(wormholeClaim);
            expect(
              Buffer.from(swimPayloadMessageAccount.vaaEmitterAddress),
            ).toEqual(ethTokenBridge);
            expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
              CHAIN_ID_ETH,
            );
            expect(
              swimPayloadMessageAccount.vaaSequence.eq(
                new BN(ethTokenBridgeSequence),
              ),
            ).toBeTruthy();

            // const {
            //   swimPayloadVersion,
            //   targetTokenId,
            //   owner,
            //   memo,
            //   propellerEnabled,
            //   gasKickstart
            // } = swimPayloadMessageAccount.swimPayload;
            expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
              swimPayloadVersion,
            );
            expect(swimPayloadMessageAccount.targetTokenId).toEqual(
              targetTokenId,
            );
            const swimPayloadMessageOwnerPubkey = new PublicKey(
              swimPayloadMessageAccount.owner,
            );
            expect(swimPayloadMessageOwnerPubkey).toEqual(
              provider.wallet.publicKey,
            );
            owner = swimPayloadMessageOwnerPubkey;
            expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
              propellerEnabled,
            );
            expect(swimPayloadMessageAccount.gasKickstart).toEqual(
              gasKickstart,
            );

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

            const propellerEngineFeeTrackerAfter =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );
            console.info(
              `propellerEngineFeeTrackerAfter: ${JSON.stringify(
                propellerEngineFeeTrackerAfter,
                null,
                2,
              )}`,
            );
            const propellerEngineFeeTrackerFeesOwedAfter =
              propellerEngineFeeTrackerAfter.feesOwed;
            console.info(`
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
          `);
            expect(
              propellerEngineFeeTrackerFeesOwedAfter.gt(
                propellerEngineFeeTrackerFeesOwedBefore,
              ),
            ).toEqual(true);

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            expect(
              propellerFeeVaultBalanceAfter.eq(
                propellerFeeVaultBalanceBefore.add(
                  propellerEngineFeeTrackerFeesOwedAfter,
                ),
              ),
            ).toEqual(true);

            const wormholeMessageLength = (
              await connection.getAccountInfo(wormholeMessage)
            ).data.length;
            const wormholeClaimLength = (
              await connection.getAccountInfo(wormholeClaim)
            ).data.length;
            const wormholeMessageRentExemption =
              await connection.getMinimumBalanceForRentExemption(
                wormholeMessageLength,
              );
            const wormholeClaimRentExemption =
              await connection.getMinimumBalanceForRentExemption(
                wormholeClaimLength,
              );

            const totalRentExemptionInLamports =
              wormholeMessageRentExemption + wormholeClaimRentExemption;

            console.info(`
            wormholeMessageLength: ${wormholeMessageLength}
            wormholeMessageRentExemption: ${wormholeMessageRentExemption}
            wormholeClaimLength: ${wormholeClaimLength}
            wormholeClaimRentExemption: ${wormholeClaimRentExemption}
            totalRentExemption: ${totalRentExemptionInLamports}
          `);

            const expectedFeesInLamports = completeWithPayloadFee
              .add(secpVerifyInitFee)
              .add(secpVerifyFee)
              .add(postVaaFee)
              .add(new BN(totalRentExemptionInLamports));

            const feeSwimUsdBn = await convertLamportsToSwimUsdAtomic(
              expectedFeesInLamports,
            );

            expect(
              propellerEngineFeeTrackerFeesOwedAfter.eq(feeSwimUsdBn),
            ).toBeTruthy();

            const expectedSwimPayloadMessageTransferAmount = new BN(
              amount.toString(),
            ).sub(propellerEngineFeeTrackerFeesOwedAfter);
            expect(
              swimPayloadMessageAccount.transferAmount.eq(
                expectedSwimPayloadMessageTransferAmount,
              ),
            ).toBeTruthy();
            await checkTxnLogsForMemo(completeNativeWithPayloadTxnSig, memoStr);
            swimPayloadMessage = expectedSwimPayloadMessage;
          });

          it("creates owner token accounts(no-op)", async () => {
            const pool = flagshipPool;
            const poolToken0Mint = usdcKeypair.publicKey;
            const poolToken1Mint = usdtKeypair.publicKey;
            const lpMint = swimUsdMint;

            const userTokenAccount0 = userUsdcAtaAddr;
            const userTokenAccount1 = userUsdtAtaAddr;
            const userLpTokenAccount = userSwimUsdAtaAddr;
            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedBefore = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;

            await propellerEnginePropellerProgram.methods
              .propellerCreateOwnerTokenAccounts()
              .accounts({
                propeller,
                payer: propellerEngineKeypair.publicKey,
                redeemer: propellerRedeemer,
                redeemerEscrow: propellerRedeemerEscrowAccount,
                feeVault: propellerFeeVault,
                feeTracker: propellerEngineFeeTracker,
                claim: wormholeClaim,
                swimPayloadMessage,
                // tokenIdMap: ?
                pool,
                poolToken0Mint,
                poolToken1Mint,
                poolLpMint: lpMint,
                user: owner,
                userPoolToken0Account: userTokenAccount0,
                userPoolToken1Account: userTokenAccount1,
                userLpTokenAccount,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: splToken.programId,
                memo: MEMO_PROGRAM_ID,
                aggregator,
                marginalPricePool: marginalPricePool,
                marginalPricePoolToken0Account: marginalPricePoolToken0Account,
                marginalPricePoolToken1Account: marginalPricePoolToken1Account,
                marginalPricePoolLpMint: marginalPricePoolLpMint,
                twoPoolProgram: twoPoolProgram.programId,
              })
              .preInstructions([setComputeUnitLimitIx])
              .rpc();

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedAfter = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;
            expect(
              propellerFeeVaultBalanceAfter.eq(propellerFeeVaultBalanceBefore),
            ).toBeTruthy();
            expect(
              propellerEngineFeeTrackerFeesOwedAfter.eq(
                propellerEngineFeeTrackerFeesOwedBefore,
              ),
            ).toBeTruthy();
          });

          it("processes swim payload", async () => {
            const pool = flagshipPool;
            const poolTokenAccount0 = poolUsdcAtaAddr;
            const poolTokenAccount1 = poolUsdtAtaAddr;
            const lpMint = swimUsdMint;
            const governanceFeeAcct = flagshipPoolGovernanceFeeAcct;
            const userTokenAccount0 = userUsdcAtaAddr;
            const userTokenAccount1 = userUsdtAtaAddr;
            const userLpTokenAccount = userSwimUsdAtaAddr;

            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedBefore = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;

            const userTransferAuthority = web3.Keypair.generate();

            const swimPayloadMessageAccount =
              await propellerProgram.account.swimPayloadMessage.fetch(
                swimPayloadMessage,
              );
            const swimPayloadMessagePayer =
              swimPayloadMessageAccount.swimPayloadMessagePayer;
            const swimPayloadMessagePayerData = await connection.getAccountInfo(
              swimPayloadMessagePayer,
            );
            console.info(
              `swimPayloadMessagePayerData: ${JSON.stringify(
                swimPayloadMessagePayerData,
              )}`,
            );

            const swimPayloadMessageAccountTargetTokenId =
              swimPayloadMessageAccount.targetTokenId;
            const propellerRedeemerEscrowBalanceBefore = (
              await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
            ).amount;
            const userTokenAccount0BalanceBefore = (
              await splToken.account.token.fetch(userTokenAccount0)
            ).amount;
            const userTokenAccount1BalanceBefore = (
              await splToken.account.token.fetch(userTokenAccount1)
            ).amount;
            //dummy value doesn't really matter
            const minOutputAmount = new BN(0);
            const processSwimPayloadPubkeys =
              await propellerEnginePropellerProgram.methods
                .processSwimPayload(
                  swimPayloadMessageAccountTargetTokenId,
                  minOutputAmount,
                )
                .accounts({
                  propeller,
                  payer: propellerEngineKeypair.publicKey,
                  claim: wormholeClaim,
                  swimPayloadMessage,
                  swimPayloadMessagePayer:
                    swimPayloadMessageAccount.swimPayloadMessagePayer,
                  redeemer: propellerRedeemer,
                  redeemerEscrow: propellerRedeemerEscrowAccount,
                  // tokenIdMap: ?
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
                  twoPoolProgram: twoPoolProgram.programId,
                  systemProgram: web3.SystemProgram.programId,
                })
                .pubkeys();
            const propellerProcessSwimPayloadIxs =
              propellerEnginePropellerProgram.methods
                .propellerProcessSwimPayload(
                  swimPayloadMessageAccountTargetTokenId,
                )
                .accounts({
                  processSwimPayload: processSwimPayloadPubkeys,
                  feeVault: propellerFeeVault,
                  feeTracker: propellerEngineFeeTracker,
                  aggregator,
                  marginalPricePool: marginalPricePool,
                  marginalPricePoolToken0Account:
                    marginalPricePoolToken0Account,
                  marginalPricePoolToken1Account:
                    marginalPricePoolToken1Account,
                  marginalPricePoolLpMint: marginalPricePoolLpMint,
                  owner,
                  memo: MEMO_PROGRAM_ID,
                })
                .preInstructions([setComputeUnitLimitIx])
                .signers([userTransferAuthority, propellerEngineKeypair]);

            const propellerProcessSwimPayloadPubkeys =
              await propellerProcessSwimPayloadIxs.pubkeys();
            console.info(
              `${JSON.stringify(propellerProcessSwimPayloadPubkeys, null, 2)}`,
            );
            if (!processSwimPayloadPubkeys.tokenIdMap) {
              throw new Error("tokenIdMap not derived");
            }
            const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
              await web3.PublicKey.findProgramAddress(
                [
                  Buffer.from("propeller"),
                  Buffer.from("token_id"),
                  propeller.toBuffer(),
                  new BN(swimPayloadMessageAccountTargetTokenId).toArrayLike(
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
              await propellerProgram.account.tokenIdMap.fetch(
                expectedTokenIdMap,
              );
            console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
            const derivedTokenIdMap = processSwimPayloadPubkeys.tokenIdMap;
            expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
            if (!processSwimPayloadPubkeys.swimClaim) {
              throw new Error("swimClaim key not derived");
            }
            const [expectedSwimClaim, expectedSwimClaimBump] =
              await getSwimClaimPda(wormholeClaim, propellerProgram.programId);
            expect(processSwimPayloadPubkeys.swimClaim).toEqual(
              expectedSwimClaim,
            );

            const processSwimPayloadTxnSig: string =
              await propellerProcessSwimPayloadIxs.rpc();
            console.info(
              `processSwimPayloadTxnSig: ${processSwimPayloadTxnSig}`,
            );

            const propellerEngineFeeTrackerAfter =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );
            console.info(
              `propellerEngineFeeTrackerAfter: ${JSON.stringify(
                propellerEngineFeeTrackerAfter,
                null,
                2,
              )}`,
            );
            const propellerEngineFeeTrackerFeesOwedAfter =
              propellerEngineFeeTrackerAfter.feesOwed;
            console.info(`
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
          `);
            const feeTrackerFeesOwedDiff =
              propellerEngineFeeTrackerFeesOwedAfter.sub(
                propellerEngineFeeTrackerFeesOwedBefore,
              );

            expect(
              propellerEngineFeeTrackerFeesOwedAfter.gt(
                propellerEngineFeeTrackerFeesOwedBefore,
              ),
            ).toEqual(true);

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            expect(
              propellerFeeVaultBalanceAfter.eq(
                propellerFeeVaultBalanceBefore.add(feeTrackerFeesOwedDiff),
              ),
            ).toEqual(true);

            const swimClaimAccount =
              await propellerProgram.account.swimClaim.fetch(
                processSwimPayloadPubkeys.swimClaim,
              );
            expect(swimClaimAccount.bump).toEqual(expectedSwimClaimBump);
            expect(swimClaimAccount.claimed).toBeTruthy();

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
                  swimPayloadMessageAccount.transferAmount,
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
            const swimPayloadMessageAccountInfoAfterProcess =
              await connection.getAccountInfo(swimPayloadMessage);
            console.info(`
            swimPayloadMessageAccountInfoAfterProcess: ${JSON.stringify(
              swimPayloadMessageAccountInfoAfterProcess,
              null,
              2,
            )}
          `);
          });

          //TODO: add min_output_amount test cases
        });
      });
      describe("for new user with no token accounts", () => {
        describe("for token from flagship pool as output token", () => {
          let wormholeClaim: web3.PublicKey;
          let wormholeMessage: web3.PublicKey;
          let swimPayloadMessage: web3.PublicKey;
          const owner = web3.Keypair.generate().publicKey;
          console.info(`new user: ${owner.toBase58()}`);
          // let owner: web3.PublicKey;

          const targetTokenId = USDC_TO_TOKEN_NUMBER;
          const memoStr = incMemoIdAndGet();

          it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedBefore = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;

            const memoBuffer = Buffer.alloc(16);
            memoBuffer.write(memoStr);

            const maxFee = new BN(1000000000);
            const swimPayload = {
              version: swimPayloadVersion,
              owner: owner.toBuffer(),
              propellerEnabled,
              gasKickstart,
              maxFee,
              targetTokenId,
              memo: memoBuffer,
            };
            // const swimPayload = {
            //   version: swimPayloadVersion,
            //   targetTokenId,
            //   owner: owner.toBuffer(),
            //   memo: memoBuffer,
            //   propellerEnabled,
            //   gasKickstart,
            // };
            const amount = parseUnits("100000", mintDecimal);
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

            console.info(
              `propellerRedeemerEscrowAccountBefore: ${propellerRedeemerEscrowAccountBefore.toString()}`,
            );
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

            // const [ethEndpointAccount] = await deriveEndpointPda(
            //   CHAIN_ID_ETH,
            //   ethTokenBridge,
            //   // parsedVaa.emitterChain,
            //   // parsedVaa.emitterAddress,
            //   WORMHOLE_TOKEN_BRIDGE,
            // );
            console.info(`endpointAccount: ${ethEndpointAccount.toBase58()}`);
            wormholeClaim = await getClaimAddressSolana(
              WORMHOLE_TOKEN_BRIDGE.toBase58(),
              tokenTransferWithPayloadSignedVaa,
            );

            const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
              await getSwimPayloadMessagePda(
                wormholeClaim,
                propellerProgram.programId,
              );

            console.info(`
            marginalPricePoolToken0Account: ${marginalPricePoolToken0Account.toBase58()}
            marginalPricePoolToken1Account: ${marginalPricePoolToken1Account.toBase58()}
          `);

            const providerBalanceBefore = await provider.connection.getBalance(
              provider.wallet.publicKey,
            );
            const propellerEngineWalletPubkey =
              propellerEngineAnchorProvider.wallet.publicKey;
            const propellerEngineProviderBalanceBefore =
              await provider.connection.getBalance(propellerEngineWalletPubkey);

            const completeNativeWithPayloadIxs =
              propellerEnginePropellerProgram.methods
                .propellerCompleteNativeWithPayload()
                .accounts({
                  completeNativeWithPayload: {
                    propeller,
                    payer: propellerEngineKeypair.publicKey,
                    tokenBridgeConfig,
                    // userTokenBridgeAccount: userLpTokenAccount.address,
                    message: wormholeMessage,
                    claim: wormholeClaim,
                    swimPayloadMessage: expectedSwimPayloadMessage,
                    endpoint: ethEndpointAccount,
                    to: propellerRedeemerEscrowAccount,
                    redeemer: propellerRedeemer,
                    feeRecipient: propellerFeeVault,
                    // feeRecipient: propellerRedeemerEscrowAccount,
                    // tokenBridgeMint,
                    custody: custody,
                    swimUsdMint: swimUsdMint,
                    custodySigner,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,

                    wormhole,
                    tokenProgram: splToken.programId,
                    tokenBridge,
                  },
                  feeTracker: propellerEngineFeeTracker,
                  aggregator,
                  // marginalPricePool: {
                  //   pool: marginalPricePool,
                  //   poolToken0Account: marginalPricePoolToken0Account,
                  //   poolToken1Account: marginalPricePoolToken1Account,
                  //   lpMint: marginalPricePoolLpMint,
                  // },
                  // twoPoolProgram: twoPoolProgram.programId,
                  marginalPricePool: marginalPricePool,
                  marginalPricePoolToken0Account:
                    marginalPricePoolToken0Account,
                  marginalPricePoolToken1Account:
                    marginalPricePoolToken1Account,
                  marginalPricePoolLpMint: marginalPricePoolLpMint,
                  twoPoolProgram: twoPoolProgram.programId,
                  memo: MEMO_PROGRAM_ID,
                })
                .preInstructions([setComputeUnitLimitIx])
                .signers([propellerEngineKeypair]);

            const completeNativeWithPayloadPubkeys =
              await completeNativeWithPayloadIxs.pubkeys();

            console.info(
              `completeNativeWithPayloadPubkeys: ${JSON.stringify(
                completeNativeWithPayloadPubkeys,
                null,
                2,
              )}`,
            );

            // const completeNativeWithPayloadTxn =
            //   await completeNativeWithPayloadIxs.transaction();
            //
            // console.info(
            //   `completeNativeWithPayloadTxn: ${JSON.stringify(
            //     completeNativeWithPayloadTxn,
            //     null,
            //     2,
            //   )}`,
            // );
            const completeNativeWithPayloadTxnSig =
              await completeNativeWithPayloadIxs.rpc();
            const providerBalanceAfter = await provider.connection.getBalance(
              provider.wallet.publicKey,
            );
            const providerBalanceDiff =
              providerBalanceBefore - providerBalanceAfter;
            const propellerEngineProviderBalanceAfter =
              await provider.connection.getBalance(
                propellerEngineAnchorProvider.wallet.publicKey,
              );
            const propellerEngineProviderBalanceDiff =
              propellerEngineProviderBalanceBefore -
              propellerEngineProviderBalanceAfter;
            console.info(`
              provider: ${provider.wallet.publicKey.toBase58()}
                balanceDiff: ${providerBalanceDiff}
            `);
            console.info(`
              propellerEngineWalletPubkey: ${propellerEngineWalletPubkey.toBase58()}
                balanceDiff: ${propellerEngineProviderBalanceDiff}
            `);

            const swimPayloadMessageAccount =
              await propellerProgram.account.swimPayloadMessage.fetch(
                expectedSwimPayloadMessage,
              );
            console.info(
              `swimPayloadMessageAccount: ${JSON.stringify(
                swimPayloadMessageAccount,
                null,
                2,
              )}`,
            );
            expect(swimPayloadMessageAccount.bump).toEqual(
              expectedSwimPayloadMessageBump,
            );
            // expect(swimPayloadMessageAccount.whMessage).toEqual(
            //   wormholeMessage,
            // );
            expect(swimPayloadMessageAccount.claim).toEqual(wormholeClaim);
            expect(
              Buffer.from(swimPayloadMessageAccount.vaaEmitterAddress),
            ).toEqual(ethTokenBridge);
            expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
              CHAIN_ID_ETH,
            );
            expect(
              swimPayloadMessageAccount.vaaSequence.eq(
                new BN(ethTokenBridgeSequence),
              ),
            ).toBeTruthy();

            // const {
            //   swimPayloadVersion,
            //   targetTokenId,
            //   owner,
            //   memo,
            //   propellerEnabled,
            //   gasKickstart
            // } = swimPayloadMessageAccount.swimPayload;
            expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
              swimPayloadVersion,
            );
            expect(swimPayloadMessageAccount.targetTokenId).toEqual(
              targetTokenId,
            );
            const swimPayloadMessageOwnerPubkey = new PublicKey(
              swimPayloadMessageAccount.owner,
            );
            expect(swimPayloadMessageOwnerPubkey).toEqual(owner);

            expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
              propellerEnabled,
            );
            expect(swimPayloadMessageAccount.gasKickstart).toEqual(
              gasKickstart,
            );

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

            const propellerEngineFeeTrackerAfter =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );
            console.info(
              `propellerEngineFeeTrackerAfter: ${JSON.stringify(
                propellerEngineFeeTrackerAfter,
                null,
                2,
              )}`,
            );
            const propellerEngineFeeTrackerFeesOwedAfter =
              propellerEngineFeeTrackerAfter.feesOwed;
            const propellerEngineFeeTrackerFeesOwedDiff =
              propellerEngineFeeTrackerFeesOwedAfter.sub(
                propellerEngineFeeTrackerFeesOwedBefore,
              );
            console.info(`
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
                diff: ${propellerEngineFeeTrackerFeesOwedDiff.toString()}
          `);
            expect(
              propellerEngineFeeTrackerFeesOwedAfter.gt(
                propellerEngineFeeTrackerFeesOwedBefore,
              ),
            ).toEqual(true);

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            expect(
              propellerFeeVaultBalanceAfter.eq(
                propellerFeeVaultBalanceBefore.add(
                  propellerEngineFeeTrackerFeesOwedDiff,
                ),
              ),
            ).toEqual(true);

            const wormholeMessageLength = (
              await connection.getAccountInfo(wormholeMessage)
            ).data.length;
            const wormholeClaimLength = (
              await connection.getAccountInfo(wormholeClaim)
            ).data.length;
            const wormholeMessageRentExemption =
              await connection.getMinimumBalanceForRentExemption(
                wormholeMessageLength,
              );
            const wormholeClaimRentExemption =
              await connection.getMinimumBalanceForRentExemption(
                wormholeClaimLength,
              );

            const totalRentExemptionInLamports =
              wormholeMessageRentExemption + wormholeClaimRentExemption;

            const expectedFeesInLamports = completeWithPayloadFee
              .add(secpVerifyInitFee)
              .add(secpVerifyFee)
              .add(postVaaFee)
              .add(new BN(totalRentExemptionInLamports));

            const feeSwimUsdBn = await convertLamportsToSwimUsdAtomic(
              expectedFeesInLamports,
            );

            expect(
              propellerEngineFeeTrackerFeesOwedDiff.eq(feeSwimUsdBn),
            ).toBeTruthy();

            const expectedSwimPayloadMessageTransferAmount = new BN(
              amount.toString(),
            ).sub(propellerEngineFeeTrackerFeesOwedDiff);
            expect(
              swimPayloadMessageAccount.transferAmount.eq(
                expectedSwimPayloadMessageTransferAmount,
              ),
            ).toBeTruthy();
            await checkTxnLogsForMemo(completeNativeWithPayloadTxnSig, memoStr);
            swimPayloadMessage = expectedSwimPayloadMessage;
          });

          it("creates owner token accounts", async () => {
            const pool = flagshipPool;
            const poolToken0Mint = usdcKeypair.publicKey;
            const poolToken1Mint = usdtKeypair.publicKey;
            const lpMint = swimUsdMint;

            const [userTokenAccount0, userTokenAccount1, userLpTokenAccount] =
              await Promise.all([
                getAssociatedTokenAddress(usdcKeypair.publicKey, owner),
                getAssociatedTokenAddress(usdtKeypair.publicKey, owner),
                getAssociatedTokenAddress(swimUsdKeypair.publicKey, owner),
              ]);
            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedBefore = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;

            await propellerEnginePropellerProgram.methods
              .propellerCreateOwnerTokenAccounts()
              .accounts({
                propeller,
                payer: propellerEngineKeypair.publicKey,
                redeemer: propellerRedeemer,
                redeemerEscrow: propellerRedeemerEscrowAccount,
                feeVault: propellerFeeVault,
                feeTracker: propellerEngineFeeTracker,
                claim: wormholeClaim,
                swimPayloadMessage,
                // tokenIdMap: ?
                pool,
                poolToken0Mint,
                poolToken1Mint,
                poolLpMint: lpMint,
                user: owner,

                userPoolToken0Account: userTokenAccount0,

                userPoolToken1Account: userTokenAccount1,

                userLpTokenAccount,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: splToken.programId,
                memo: MEMO_PROGRAM_ID,
                aggregator,
                marginalPricePool: marginalPricePool,
                marginalPricePoolToken0Account: marginalPricePoolToken0Account,
                marginalPricePoolToken1Account: marginalPricePoolToken1Account,
                marginalPricePoolLpMint: marginalPricePoolLpMint,
                twoPoolProgram: twoPoolProgram.programId,
              })
              .preInstructions([setComputeUnitLimitIx])
              .rpc();

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedAfter = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;
            expect(
              propellerFeeVaultBalanceAfter.gt(propellerFeeVaultBalanceBefore),
            ).toBeTruthy();
            expect(
              propellerEngineFeeTrackerFeesOwedAfter.gt(
                propellerEngineFeeTrackerFeesOwedBefore,
              ),
            ).toBeTruthy();
            const userTokenAccount0Data = await splToken.account.token.fetch(
              userTokenAccount0,
            );
            const userTokenAccount1Data = await splToken.account.token.fetch(
              userTokenAccount1,
            );
            const userLpTokenAccountData = await splToken.account.token.fetch(
              userLpTokenAccount,
            );
            expect(userTokenAccount0Data.amount.toNumber()).toEqual(0);
            expect(userTokenAccount0Data.authority.toBase58()).toEqual(
              owner.toBase58(),
            );
            expect(userTokenAccount1Data.amount.toNumber()).toEqual(0);
            expect(userTokenAccount1Data.authority.toBase58()).toEqual(
              owner.toBase58(),
            );
            expect(userLpTokenAccountData.amount.toNumber()).toEqual(0);
            expect(userLpTokenAccountData.authority.toBase58()).toEqual(
              owner.toBase58(),
            );
          });

          it("processes swim payload", async () => {
            const pool = flagshipPool;
            const poolTokenAccount0 = poolUsdcAtaAddr;
            const poolTokenAccount1 = poolUsdtAtaAddr;
            const lpMint = swimUsdMint;
            const governanceFeeAcct = flagshipPoolGovernanceFeeAcct;
            const [userTokenAccount0, userTokenAccount1, userLpTokenAccount] =
              await Promise.all([
                getAssociatedTokenAddress(usdcKeypair.publicKey, owner),
                getAssociatedTokenAddress(usdtKeypair.publicKey, owner),
                getAssociatedTokenAddress(swimUsdKeypair.publicKey, owner),
              ]);

            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedBefore = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;

            const userTransferAuthority = web3.Keypair.generate();
            const swimPayloadMessageAccount =
              await propellerProgram.account.swimPayloadMessage.fetch(
                swimPayloadMessage,
              );
            const swimPayloadMessageAccountTargetTokenId =
              swimPayloadMessageAccount.targetTokenId;
            const propellerRedeemerEscrowBalanceBefore = (
              await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
            ).amount;
            console.info(
              `propellerRedeemerEscrowBalanceBefore: ${propellerRedeemerEscrowBalanceBefore.toNumber()}`,
            );
            const userTokenAccount0BalanceBefore = (
              await splToken.account.token.fetch(userTokenAccount0)
            ).amount;
            const userTokenAccount1BalanceBefore = (
              await splToken.account.token.fetch(userTokenAccount1)
            ).amount;
            const [calculatedSwimClaim, calculatedSwimClaimBump] =
              await web3.PublicKey.findProgramAddress(
                [
                  Buffer.from("propeller"),
                  Buffer.from("claim"),
                  wormholeClaim.toBuffer(),
                ],
                propellerProgram.programId,
              );

            const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
              await web3.PublicKey.findProgramAddress(
                [
                  Buffer.from("propeller"),
                  Buffer.from("token_id"),
                  propeller.toBuffer(),
                  new BN(swimPayloadMessageAccountTargetTokenId).toArrayLike(
                    Buffer,
                    "le",
                    2,
                  ),
                ],
                propellerProgram.programId,
              );
            const processSwimPayloadPubkeys =
              await propellerEnginePropellerProgram.methods
                .processSwimPayload(
                  swimPayloadMessageAccountTargetTokenId,
                  new BN(0),
                )
                .accounts({
                  propeller,
                  payer: propellerEngineKeypair.publicKey,
                  claim: wormholeClaim,
                  // swimClaim: calculatedSwimClaim,
                  swimPayloadMessage,
                  swimPayloadMessagePayer:
                    swimPayloadMessageAccount.swimPayloadMessagePayer,
                  redeemer: propellerRedeemer,
                  redeemerEscrow: propellerRedeemerEscrowAccount,
                  // tokenIdMap: calculatedTokenIdMap,
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

                  twoPoolProgram: twoPoolProgram.programId,
                  systemProgram: web3.SystemProgram.programId,
                })
                .pubkeys();
            // const processSwimPayloadPubkeys =
            //   await processSwimPayload.pubkeys();
            //Note: anchor won't auto-derive nested accounts so you either specify
            // all of them or can use processSwimPayload().accounts({..}).pubkeys()
            const propellerProcessSwimPayloadIxs =
              propellerEnginePropellerProgram.methods
                .propellerProcessSwimPayload(
                  swimPayloadMessageAccountTargetTokenId,
                )
                .accounts({
                  // Note: anchor can't autoderive nested accounts.
                  // processSwimPayload: {
                  //   propeller,
                  //   payer: propellerEngineKeypair.publicKey,
                  //   message: wormholeMessage,
                  //   claim: wormholeClaim,
                  //   swimClaim: calculatedSwimClaim,
                  //   swimPayloadMessage,
                  //   redeemer: propellerRedeemer,
                  //   redeemerEscrow: propellerRedeemerEscrowAccount,
                  //   tokenIdMap: calculatedTokenIdMap,
                  //   pool,
                  //   poolTokenAccount0,
                  //   poolTokenAccount1,
                  //   lpMint,
                  //   governanceFee: governanceFeeAcct,
                  //   userTransferAuthority: userTransferAuthority.publicKey,
                  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  //   userTokenAccount0,
                  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  //   userTokenAccount1,
                  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  //   userLpTokenAccount,
                  //   tokenProgram: splToken.programId,
                  //   memo: MEMO_PROGRAM_ID,
                  //   twoPoolProgram: twoPoolProgram.programId,
                  //   systemProgram: web3.SystemProgram.programId,
                  // },
                  processSwimPayload: processSwimPayloadPubkeys,
                  feeVault: propellerFeeVault,
                  feeTracker: propellerEngineFeeTracker,
                  aggregator,
                  marginalPricePool: marginalPricePool,
                  marginalPricePoolToken0Account:
                    marginalPricePoolToken0Account,
                  marginalPricePoolToken1Account:
                    marginalPricePoolToken1Account,
                  marginalPricePoolLpMint: marginalPricePoolLpMint,
                  owner,
                  memo: MEMO_PROGRAM_ID,
                })
                .preInstructions([setComputeUnitLimitIx])
                .signers([userTransferAuthority, propellerEngineKeypair]);

            const propellerProcessSwimPayloadPubkeys =
              await propellerProcessSwimPayloadIxs.pubkeys();
            console.info(
              `${JSON.stringify(propellerProcessSwimPayloadPubkeys, null, 2)}`,
            );
            // if (!propellerProcessSwimPayloadPubkeys.tokenIdMap) {
            //   throw new Error("tokenIdMap not derived");
            // }

            const expectedTokenIdMap =
              outputTokenIdMappingAddrs.get(targetTokenId);
            if (!expectedTokenIdMap) {
              throw new Error("expectedTokenIdMap not found");
            }
            const expectedTokenIdMapAcct =
              await propellerProgram.account.tokenIdMap.fetch(
                expectedTokenIdMap,
              );
            console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
            expect(calculatedTokenIdMap).toEqual(expectedTokenIdMap);

            const processSwimPayloadTxnSig: string =
              await propellerProcessSwimPayloadIxs.rpc();
            console.info(
              `processSwimPayloadTxnSig: ${processSwimPayloadTxnSig}`,
            );

            const propellerEngineFeeTrackerAfter =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );
            console.info(
              `propellerEngineFeeTrackerAfter: ${JSON.stringify(
                propellerEngineFeeTrackerAfter,
                null,
                2,
              )}`,
            );
            const propellerEngineFeeTrackerFeesOwedAfter =
              propellerEngineFeeTrackerAfter.feesOwed;
            console.info(`
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
          `);
            const feeTrackerFeesOwedDiff =
              propellerEngineFeeTrackerFeesOwedAfter.sub(
                propellerEngineFeeTrackerFeesOwedBefore,
              );

            expect(
              propellerEngineFeeTrackerFeesOwedAfter.gt(
                propellerEngineFeeTrackerFeesOwedBefore,
              ),
            ).toEqual(true);

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            expect(
              propellerFeeVaultBalanceAfter.eq(
                propellerFeeVaultBalanceBefore.add(feeTrackerFeesOwedDiff),
              ),
            ).toEqual(true);

            const swimClaimAccount =
              await propellerProgram.account.swimClaim.fetch(
                calculatedSwimClaim,
              );
            expect(swimClaimAccount.bump).toEqual(calculatedSwimClaimBump);
            expect(swimClaimAccount.claimed).toBeTruthy();

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
                  swimPayloadMessageAccount.transferAmount,
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

          //TODO: create multiple fee trackers and test that correct amount is withdrawn
          it("claims its fees", async () => {
            const propellerEngineFeeTrackerBefore =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );
            const propellerEngineFeeTrackerFeesOwedBefore =
              propellerEngineFeeTrackerBefore.feesOwed;
            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            const propellerEngineSwimUsdFeeAccountBalanceBefore = (
              await splToken.account.token.fetch(
                propellerEngineSwimUsdFeeAccount,
              )
            ).amount;
            const claimFeesTxn = await propellerEnginePropellerProgram.methods
              .claimFees()
              .accounts({
                propeller,
                feeTracker: propellerEngineFeeTracker,
                payer: propellerEngineKeypair.publicKey,
                feeAccount: propellerEngineSwimUsdFeeAccount,
                feeVault: propellerFeeVault,
                tokenProgram: splToken.programId,
              })
              .rpc();
            console.info(`claimFeesTxn: ${claimFeesTxn}`);

            const propellerEngineFeeTrackerAfter =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );

            const propellerEngineFeeTrackerFeesOwedAfter =
              propellerEngineFeeTrackerAfter.feesOwed;
            expect(
              propellerEngineFeeTrackerFeesOwedAfter.eq(new BN(0)),
            ).toBeTruthy();
            const propellerEngineFeeTrackerFeesClaimed =
              propellerEngineFeeTrackerFeesOwedBefore.sub(
                propellerEngineFeeTrackerFeesOwedAfter,
              );

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            console.info(`
            propellerEngineFeeTrackerFeesOwed
              Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
              After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
            propellerFeeVaultBalance
              Before: ${propellerFeeVaultBalanceBefore.toString()}
              After: ${propellerFeeVaultBalanceAfter.toString()}
          `);
            expect(
              propellerFeeVaultBalanceAfter.eq(
                propellerFeeVaultBalanceBefore.sub(
                  propellerEngineFeeTrackerFeesClaimed,
                ),
              ),
            ).toEqual(true);
            const propellerEngineSwimUsdFeeAccountBalanceAfter = (
              await splToken.account.token.fetch(
                propellerEngineSwimUsdFeeAccount,
              )
            ).amount;
            expect(
              propellerEngineSwimUsdFeeAccountBalanceAfter.eq(
                propellerEngineSwimUsdFeeAccountBalanceBefore.add(
                  propellerEngineFeeTrackerFeesClaimed,
                ),
              ),
            ).toEqual(true);
          });

          //TODO: add min_output_amount test cases
        });
      });
      describe("for invalid target token id", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let swimPayloadMessage: web3.PublicKey;
        const owner = web3.Keypair.generate().publicKey;
        console.info(`new user: ${owner.toBase58()}`);
        // let owner: web3.PublicKey;

        const targetTokenId = 99;
        const memoStr = incMemoIdAndGet();
        let ownerSwimUsdAta: web3.PublicKey;
        let invalidTokenIdMapAddr: web3.PublicKey;

        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          const propellerFeeVaultBalanceBefore = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;

          const propellerEngineFeeTrackerFeesOwedBefore = (
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            )
          ).feesOwed;

          const memoBuffer = Buffer.alloc(16);
          memoBuffer.write(memoStr);

          const maxFee = new BN(1000000000);
          const swimPayload = {
            version: swimPayloadVersion,
            owner: owner.toBuffer(),
            propellerEnabled,
            gasKickstart,
            maxFee,
            targetTokenId,
            memo: memoBuffer,
          };
          // const swimPayload = {
          //   version: swimPayloadVersion,
          //   targetTokenId,
          //   owner: owner.toBuffer(),
          //   memo: memoBuffer,
          //   propellerEnabled,
          //   gasKickstart,
          // };
          const amount = parseUnits("100000", mintDecimal);
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

          console.info(
            `propellerRedeemerEscrowAccountBefore: ${propellerRedeemerEscrowAccountBefore.toString()}`,
          );
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

          // const [ethEndpointAccount] = await deriveEndpointPda(
          //   CHAIN_ID_ETH,
          //   ethTokenBridge,
          //   // parsedVaa.emitterChain,
          //   // parsedVaa.emitterAddress,
          //   WORMHOLE_TOKEN_BRIDGE,
          // );
          console.info(`endpointAccount: ${ethEndpointAccount.toBase58()}`);
          wormholeClaim = await getClaimAddressSolana(
            WORMHOLE_TOKEN_BRIDGE.toBase58(),
            tokenTransferWithPayloadSignedVaa,
          );

          const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
            await getSwimPayloadMessagePda(
              wormholeClaim,
              propellerProgram.programId,
            );
          // expect(expectedSwimPayloadMessage.toBase58()).toEqual(
          //   completeNativeWithPayloadPubkeys.swimPayloadMessage.toBase58(),
          // );
          console.info(`
            marginalPricePoolToken0Account: ${marginalPricePoolToken0Account.toBase58()}
            marginalPricePoolToken1Account: ${marginalPricePoolToken1Account.toBase58()}
          `);

          const providerBalanceBefore = await provider.connection.getBalance(
            provider.wallet.publicKey,
          );
          const propellerEngineWalletPubkey =
            propellerEngineAnchorProvider.wallet.publicKey;
          const propellerEngineProviderBalanceBefore =
            await provider.connection.getBalance(propellerEngineWalletPubkey);

          const completeNativeWithPayloadIxs =
            propellerEnginePropellerProgram.methods
              .propellerCompleteNativeWithPayload()
              .accounts({
                completeNativeWithPayload: {
                  propeller,
                  payer: propellerEngineKeypair.publicKey,
                  tokenBridgeConfig,
                  // userTokenBridgeAccount: userLpTokenAccount.address,
                  message: wormholeMessage,
                  claim: wormholeClaim,
                  swimPayloadMessage: expectedSwimPayloadMessage,
                  endpoint: ethEndpointAccount,
                  to: propellerRedeemerEscrowAccount,
                  redeemer: propellerRedeemer,
                  feeRecipient: propellerFeeVault,
                  // feeRecipient: propellerRedeemerEscrowAccount,
                  // tokenBridgeMint,
                  custody: custody,
                  swimUsdMint: swimUsdMint,
                  custodySigner,
                  rent: web3.SYSVAR_RENT_PUBKEY,
                  systemProgram: web3.SystemProgram.programId,
                  wormhole,
                  tokenProgram: splToken.programId,
                  tokenBridge,
                },
                feeTracker: propellerEngineFeeTracker,
                aggregator,
                // marginalPricePool: {
                //   pool: marginalPricePool,
                //   poolToken0Account: marginalPricePoolToken0Account,
                //   poolToken1Account: marginalPricePoolToken1Account,
                //   lpMint: marginalPricePoolLpMint,
                // },
                // twoPoolProgram: twoPoolProgram.programId,
                marginalPricePool: marginalPricePool,
                marginalPricePoolToken0Account: marginalPricePoolToken0Account,
                marginalPricePoolToken1Account: marginalPricePoolToken1Account,
                marginalPricePoolLpMint: marginalPricePoolLpMint,
                twoPoolProgram: twoPoolProgram.programId,
                memo: MEMO_PROGRAM_ID,
              })
              .preInstructions([setComputeUnitLimitIx])
              .signers([propellerEngineKeypair]);

          const completeNativeWithPayloadPubkeys =
            await completeNativeWithPayloadIxs.pubkeys();

          console.info(
            `completeNativeWithPayloadPubkeys: ${JSON.stringify(
              completeNativeWithPayloadPubkeys,
              null,
              2,
            )}`,
          );

          // const completeNativeWithPayloadTxn =
          //   await completeNativeWithPayloadIxs.transaction();
          //
          // console.info(
          //   `completeNativeWithPayloadTxn: ${JSON.stringify(
          //     completeNativeWithPayloadTxn,
          //     null,
          //     2,
          //   )}`,
          // );
          const completeNativeWithPayloadTxnSig =
            await completeNativeWithPayloadIxs.rpc();
          const providerBalanceAfter = await provider.connection.getBalance(
            provider.wallet.publicKey,
          );
          const providerBalanceDiff =
            providerBalanceBefore - providerBalanceAfter;
          const propellerEngineProviderBalanceAfter =
            await provider.connection.getBalance(
              propellerEngineAnchorProvider.wallet.publicKey,
            );
          const propellerEngineProviderBalanceDiff =
            propellerEngineProviderBalanceBefore -
            propellerEngineProviderBalanceAfter;
          console.info(`
              provider: ${provider.wallet.publicKey.toBase58()}
                balanceDiff: ${providerBalanceDiff}
            `);
          console.info(`
              propellerEngineWalletPubkey: ${propellerEngineWalletPubkey.toBase58()}
                balanceDiff: ${propellerEngineProviderBalanceDiff}
            `);

          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              expectedSwimPayloadMessage,
            );
          console.info(
            `swimPayloadMessageAccount: ${JSON.stringify(
              swimPayloadMessageAccount,
              null,
              2,
            )}`,
          );
          expect(swimPayloadMessageAccount.bump).toEqual(
            expectedSwimPayloadMessageBump,
          );
          // expect(swimPayloadMessageAccount.whMessage).toEqual(wormholeMessage);
          expect(swimPayloadMessageAccount.claim).toEqual(wormholeClaim);
          expect(
            Buffer.from(swimPayloadMessageAccount.vaaEmitterAddress),
          ).toEqual(ethTokenBridge);
          expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
            CHAIN_ID_ETH,
          );
          expect(
            swimPayloadMessageAccount.vaaSequence.eq(
              new BN(ethTokenBridgeSequence),
            ),
          ).toBeTruthy();

          // const {
          //   swimPayloadVersion,
          //   targetTokenId,
          //   owner,
          //   memo,
          //   propellerEnabled,
          //   gasKickstart
          // } = swimPayloadMessageAccount.swimPayload;
          expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          expect(swimPayloadMessageAccount.targetTokenId).toEqual(
            targetTokenId,
          );
          const swimPayloadMessageOwnerPubkey = new PublicKey(
            swimPayloadMessageAccount.owner,
          );
          expect(swimPayloadMessageOwnerPubkey).toEqual(owner);

          expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
            propellerEnabled,
          );
          expect(swimPayloadMessageAccount.gasKickstart).toEqual(gasKickstart);

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

          const propellerEngineFeeTrackerAfter =
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            );
          console.info(
            `propellerEngineFeeTrackerAfter: ${JSON.stringify(
              propellerEngineFeeTrackerAfter,
              null,
              2,
            )}`,
          );
          const propellerEngineFeeTrackerFeesOwedAfter =
            propellerEngineFeeTrackerAfter.feesOwed;
          const propellerEngineFeeTrackerFeesOwedDiff =
            propellerEngineFeeTrackerFeesOwedAfter.sub(
              propellerEngineFeeTrackerFeesOwedBefore,
            );
          console.info(`
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
                diff: ${propellerEngineFeeTrackerFeesOwedDiff.toString()}
          `);
          expect(
            propellerEngineFeeTrackerFeesOwedAfter.gt(
              propellerEngineFeeTrackerFeesOwedBefore,
            ),
          ).toEqual(true);

          const propellerFeeVaultBalanceAfter = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;
          expect(
            propellerFeeVaultBalanceAfter.eq(
              propellerFeeVaultBalanceBefore.add(
                propellerEngineFeeTrackerFeesOwedDiff,
              ),
            ),
          ).toEqual(true);

          const wormholeMessageLength = (
            await connection.getAccountInfo(wormholeMessage)
          ).data.length;
          const wormholeClaimLength = (
            await connection.getAccountInfo(wormholeClaim)
          ).data.length;
          const wormholeMessageRentExemption =
            await connection.getMinimumBalanceForRentExemption(
              wormholeMessageLength,
            );
          const wormholeClaimRentExemption =
            await connection.getMinimumBalanceForRentExemption(
              wormholeClaimLength,
            );

          const totalRentExemptionInLamports =
            wormholeMessageRentExemption + wormholeClaimRentExemption;

          const expectedFeesInLamports = completeWithPayloadFee
            .add(secpVerifyInitFee)
            .add(secpVerifyFee)
            .add(postVaaFee)
            .add(new BN(totalRentExemptionInLamports));

          const feeSwimUsdBn = await convertLamportsToSwimUsdAtomic(
            expectedFeesInLamports,
          );
          expect(
            propellerEngineFeeTrackerFeesOwedDiff.eq(feeSwimUsdBn),
          ).toBeTruthy();

          const expectedSwimPayloadMessageTransferAmount = new BN(
            amount.toString(),
          ).sub(propellerEngineFeeTrackerFeesOwedDiff);
          expect(
            swimPayloadMessageAccount.transferAmount.eq(
              expectedSwimPayloadMessageTransferAmount,
            ),
          ).toBeTruthy();
          await checkTxnLogsForMemo(completeNativeWithPayloadTxnSig, memoStr);
          swimPayloadMessage = expectedSwimPayloadMessage;
        });

        it("creates owner token bridge ata", async () => {
          ownerSwimUsdAta = await getAssociatedTokenAddress(swimUsdMint, owner);

          const propellerFeeVaultBalanceBefore = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;

          const propellerEngineFeeTrackerFeesOwedBefore = (
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            )
          ).feesOwed;

          [invalidTokenIdMapAddr] = await getTargetTokenIdMapAddr(
            propeller,
            targetTokenId,
            propellerEnginePropellerProgram.programId,
          );
          console.info(
            `invalidTokenIdMapAddr: ${invalidTokenIdMapAddr.toString()}`,
          );

          await propellerEnginePropellerProgram.methods
            .propellerCreateOwnerSwimUsdAta()
            .accounts({
              propeller,
              payer: propellerEngineKeypair.publicKey,
              redeemer: propellerRedeemer,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              feeVault: propellerFeeVault,
              feeTracker: propellerEngineFeeTracker,
              claim: wormholeClaim,
              swimPayloadMessage,
              tokenIdMap: invalidTokenIdMapAddr,
              swimUsdMint: swimUsdMint,
              owner,
              ownerSwimUsdAta: ownerSwimUsdAta,
              associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
              systemProgram: web3.SystemProgram.programId,
              tokenProgram: splToken.programId,
              // pool,
              // poolToken0Mint,
              // poolToken1Mint,
              // poolLpMint: lpMint,
              // user: owner,
              // // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              // userPoolToken0Account: userTokenAccount0,
              // // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              // userPoolToken1Account: userTokenAccount1,
              // // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              // userLpTokenAccount,

              memo: MEMO_PROGRAM_ID,
              aggregator,
              marginalPricePool: marginalPricePool,
              marginalPricePoolToken0Account: marginalPricePoolToken0Account,
              marginalPricePoolToken1Account: marginalPricePoolToken1Account,
              marginalPricePoolLpMint: marginalPricePoolLpMint,
              twoPoolProgram: twoPoolProgram.programId,
              rent: web3.SYSVAR_RENT_PUBKEY,
            })
            .preInstructions([setComputeUnitLimitIx])
            .rpc();

          const propellerFeeVaultBalanceAfter = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;

          const propellerEngineFeeTrackerFeesOwedAfter = (
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            )
          ).feesOwed;
          expect(
            propellerFeeVaultBalanceAfter.gt(propellerFeeVaultBalanceBefore),
          ).toBeTruthy();
          expect(
            propellerEngineFeeTrackerFeesOwedAfter.gt(
              propellerEngineFeeTrackerFeesOwedBefore,
            ),
          ).toBeTruthy();
          const userSwimUsdAtaData = await splToken.account.token.fetch(
            ownerSwimUsdAta,
          );
          expect(userSwimUsdAtaData.amount.toNumber()).toEqual(0);
          expect(userSwimUsdAtaData.authority.toBase58()).toEqual(
            owner.toBase58(),
          );
        });

        it("processes swim payload fallback", async () => {
          // const [userTokenAccount0, userTokenAccount1, userLpTokenAccount] =
          //   await Promise.all([
          //     getAssociatedTokenAddress(usdcKeypair.publicKey, owner),
          //     getAssociatedTokenAddress(usdtKeypair.publicKey, owner),
          //     getAssociatedTokenAddress(swimUsdKeypair.publicKey, owner),
          //   ]);

          const propellerFeeVaultBalanceBefore = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;

          const propellerEngineFeeTrackerFeesOwedBefore = (
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            )
          ).feesOwed;

          const userTransferAuthority = web3.Keypair.generate();
          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              swimPayloadMessage,
            );
          const propellerRedeemerEscrowBalanceBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userSwimUsdAtaBalanceBefore = (
            await splToken.account.token.fetch(ownerSwimUsdAta)
          ).amount;

          const [calculatedSwimClaim, calculatedSwimClaimBump] =
            await getSwimClaimPda(wormholeClaim, propellerProgram.programId);

          const propellerProcessSwimPayloadIxs =
            propellerEnginePropellerProgram.methods
              .propellerProcessSwimPayloadFallback()
              .accounts({
                propeller,
                payer: propellerEngineKeypair.publicKey,
                claim: wormholeClaim,
                swimClaim: calculatedSwimClaim,
                swimPayloadMessage,
                swimPayloadMessagePayer:
                  swimPayloadMessageAccount.swimPayloadMessagePayer,
                redeemer: propellerRedeemer,
                redeemerEscrow: propellerRedeemerEscrowAccount,
                tokenIdMap: invalidTokenIdMapAddr,
                userTransferAuthority: userTransferAuthority.publicKey,
                userSwimUsdAta: ownerSwimUsdAta,
                tokenProgram: splToken.programId,
                memo: MEMO_PROGRAM_ID,
                twoPoolProgram: twoPoolProgram.programId,
                systemProgram: web3.SystemProgram.programId,
                feeVault: propellerFeeVault,
                feeTracker: propellerEngineFeeTracker,
                aggregator,
                marginalPricePool: marginalPricePool,
                marginalPricePoolToken0Account: marginalPricePoolToken0Account,
                marginalPricePoolToken1Account: marginalPricePoolToken1Account,
                marginalPricePoolLpMint: marginalPricePoolLpMint,
                owner,
              })
              .preInstructions([setComputeUnitLimitIx])
              .signers([userTransferAuthority, propellerEngineKeypair]);

          const propellerProcessSwimPayloadPubkeys =
            await propellerProcessSwimPayloadIxs.pubkeys();
          console.info(
            `${JSON.stringify(propellerProcessSwimPayloadPubkeys, null, 2)}`,
          );
          // if (!propellerProcessSwimPayloadPubkeys.tokenIdMap) {
          //   throw new Error("tokenIdMap not derived");
          // }

          // const expectedTokenIdMap =
          //   outputTokenIdMappingAddrs.get(targetTokenId);
          // if (!expectedTokenIdMap) {
          //   throw new Error("expectedTokenIdMap not found");
          // }
          // const expectedTokenIdMapAcct =
          //   await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
          // console.info(`
          //   calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
          //   calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
          //   expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
          //   ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          // `);
          // expect(calculatedTokenIdMap).toEqual(expectedTokenIdMap);

          const processSwimPayloadTxnSig: string =
            await propellerProcessSwimPayloadIxs.rpc();
          console.info(`processSwimPayloadTxnSig: ${processSwimPayloadTxnSig}`);

          const propellerEngineFeeTrackerAfter =
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            );
          console.info(
            `propellerEngineFeeTrackerAfter: ${JSON.stringify(
              propellerEngineFeeTrackerAfter,
              null,
              2,
            )}`,
          );
          const propellerEngineFeeTrackerFeesOwedAfter =
            propellerEngineFeeTrackerAfter.feesOwed;
          console.info(`
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
          `);
          const feeTrackerFeesOwedDiff =
            propellerEngineFeeTrackerFeesOwedAfter.sub(
              propellerEngineFeeTrackerFeesOwedBefore,
            );

          expect(
            propellerEngineFeeTrackerFeesOwedAfter.gt(
              propellerEngineFeeTrackerFeesOwedBefore,
            ),
          ).toEqual(true);

          const propellerFeeVaultBalanceAfter = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;
          expect(
            propellerFeeVaultBalanceAfter.eq(
              propellerFeeVaultBalanceBefore.add(feeTrackerFeesOwedDiff),
            ),
          ).toEqual(true);

          const swimClaimAccount =
            await propellerProgram.account.swimClaim.fetch(calculatedSwimClaim);
          expect(swimClaimAccount.bump).toEqual(calculatedSwimClaimBump);
          expect(swimClaimAccount.claimed).toBeTruthy();

          const propellerRedeemerEscrowBalanceAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userSwimUsdAtaBalanceAfter = (
            await splToken.account.token.fetch(ownerSwimUsdAta)
          ).amount;
          // const userTokenAccount1BalanceAfter = (
          //   await splToken.account.token.fetch(userTokenAccount1)
          // ).amount;

          // console.info(`
          //   propellerRedeemerEscrowBalance
          //     Before: ${propellerRedeemerEscrowBalanceBefore.toString()}
          //     After: ${propellerRedeemerEscrowBalanceAfter.toString()}
          //   userTokenAccount0Balance
          //     Before: ${userSwimUsdAtaBalanceBefore.toString()}
          //     After: ${userSwimUsdAtaBalanceAfter.toString()}
          //   userTokenAccount1Balance
          //     Before: ${userTokenAccount1BalanceBefore.toString()}
          //     After: ${userTokenAccount1BalanceAfter.toString()}
          // `);
          expect(
            propellerRedeemerEscrowBalanceAfter.eq(
              propellerRedeemerEscrowBalanceBefore.sub(
                swimPayloadMessageAccount.transferAmount,
              ),
            ),
          ).toBeTruthy();

          expect(
            userSwimUsdAtaBalanceAfter.gt(userSwimUsdAtaBalanceBefore),
          ).toBeTruthy();

          await checkTxnLogsForMemo(processSwimPayloadTxnSig, memoStr);
        });

        //TODO: create multiple fee trackers and test that correct amount is withdrawn
        it("claims its fees", async () => {
          const propellerEngineFeeTrackerBefore =
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            );
          const propellerEngineFeeTrackerFeesOwedBefore =
            propellerEngineFeeTrackerBefore.feesOwed;
          const propellerFeeVaultBalanceBefore = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;
          const propellerEngineSwimUsdFeeAccountBalanceBefore = (
            await splToken.account.token.fetch(propellerEngineSwimUsdFeeAccount)
          ).amount;
          const claimFeesTxn = await propellerEnginePropellerProgram.methods
            .claimFees()
            .accounts({
              propeller,
              feeTracker: propellerEngineFeeTracker,
              payer: propellerEngineKeypair.publicKey,
              feeAccount: propellerEngineSwimUsdFeeAccount,
              feeVault: propellerFeeVault,
              tokenProgram: splToken.programId,
            })
            .rpc();
          console.info(`claimFeesTxn: ${claimFeesTxn}`);

          const propellerEngineFeeTrackerAfter =
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            );

          const propellerEngineFeeTrackerFeesOwedAfter =
            propellerEngineFeeTrackerAfter.feesOwed;
          expect(
            propellerEngineFeeTrackerFeesOwedAfter.eq(new BN(0)),
          ).toBeTruthy();
          const propellerEngineFeeTrackerFeesClaimed =
            propellerEngineFeeTrackerFeesOwedBefore.sub(
              propellerEngineFeeTrackerFeesOwedAfter,
            );

          const propellerFeeVaultBalanceAfter = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;
          console.info(`
            propellerEngineFeeTrackerFeesOwed
              Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
              After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
            propellerFeeVaultBalance
              Before: ${propellerFeeVaultBalanceBefore.toString()}
              After: ${propellerFeeVaultBalanceAfter.toString()}
          `);
          expect(
            propellerFeeVaultBalanceAfter.eq(
              propellerFeeVaultBalanceBefore.sub(
                propellerEngineFeeTrackerFeesClaimed,
              ),
            ),
          ).toEqual(true);
          const propellerEngineSwimUsdFeeAccountBalanceAfter = (
            await splToken.account.token.fetch(propellerEngineSwimUsdFeeAccount)
          ).amount;
          expect(
            propellerEngineSwimUsdFeeAccountBalanceAfter.eq(
              propellerEngineSwimUsdFeeAccountBalanceBefore.add(
                propellerEngineFeeTrackerFeesClaimed,
              ),
            ),
          ).toEqual(true);
        });

        //TODO: add min_output_amount test cases
      });
      // eslint-disable-next-line jest/no-commented-out-tests
      // describe.skip("for swimUSD as output token", () => {
      //   let wormholeClaim: web3.PublicKey;
      //   let wormholeMessage: web3.PublicKey;
      //   let swimPayloadMessage: web3.PublicKey;
      //
      //   const targetTokenId = SWIM_USD_TO_TOKEN_NUMBER;
      //
      //   const memoStr = incMemoIdAndGet();
      // eslint-disable-next-line jest/no-commented-out-tests
      //   it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
      //     const memoBuffer = Buffer.alloc(16);
      //     memoBuffer.write(memoStr);
      //
      //     const maxFee = new BN(1000000000);
      //     const swimPayload = {
      //       version: swimPayloadVersion,
      //       owner: provider.publicKey.toBuffer(),
      //       propellerEnabled,
      //       gasKickstart,
      //       maxFee,
      //       targetTokenId,
      //       memo: memoBuffer,
      //     };
      //
      //     // const swimPayload = {
      //     //   version: swimPayloadVersion,
      //     //   targetTokenId,
      //     //   // owner: tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA),
      //     //   // owner: Buffer.from(tryNativeToHexString(provider.publicKey.toBase58(), CHAIN_ID_SOLANA), 'hex'),
      //     //   owner: provider.publicKey.toBuffer(),
      //     //   // minOutputAmount: 0n,
      //     //   memo: memoBuffer,
      //     //   propellerEnabled,
      //     //   // minThreshold: BigInt(0),
      //     //   gasKickstart,
      //     // };
      //     const amount = parseUnits("1", mintDecimal);
      //     console.info(`amount: ${amount.toString()}`);
      //     /**
      //      * this is encoding a token transfer from eth routing contract
      //      * with a swimUSD token address that originated on solana
      //      * the same as initializing a `TransferWrappedWithPayload` from eth
      //      */
      //
      //     const nonce = createNonce().readUInt32LE(0);
      //     const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
      //       0,
      //       nonce,
      //       CHAIN_ID_ETH as number,
      //       ethTokenBridge,
      //       BigInt(++ethTokenBridgeSequence),
      //       encodeTokenTransferWithPayload(
      //         amount.toString(),
      //         swimUsdKeypair.publicKey.toBuffer(),
      //         CHAIN_ID_SOLANA,
      //         propellerProgram.programId,
      //         ethRoutingContract,
      //         encodeSwimPayload(swimPayload),
      //       ),
      //     );
      //     const propellerRedeemerEscrowAccountBefore = (
      //       await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
      //     ).amount;
      //
      //     await postVaaSolanaWithRetry(
      //       connection,
      //       // eslint-disable-next-line @typescript-eslint/require-await
      //       async (tx) => {
      //         tx.partialSign(userKeypair);
      //         return tx;
      //       },
      //       WORMHOLE_CORE_BRIDGE.toBase58(),
      //       userKeypair.publicKey.toBase58(),
      //       tokenTransferWithPayloadSignedVaa,
      //       10,
      //     );
      //
      //     [wormholeMessage] = await deriveMessagePda(
      //       tokenTransferWithPayloadSignedVaa,
      //       WORMHOLE_CORE_BRIDGE,
      //     );
      //
      //     // const [ethEndpointAccount] = await deriveEndpointPda(
      //     //   CHAIN_ID_ETH,
      //     //   ethTokenBridge,
      //     //   // parsedVaa.emitterChain,
      //     //   // parsedVaa.emitterAddress,
      //     //   WORMHOLE_TOKEN_BRIDGE,
      //     // );
      //     console.info(`endpointAccount: ${ethEndpointAccount.toBase58()}`);
      //     wormholeClaim = await getClaimAddressSolana(
      //       WORMHOLE_TOKEN_BRIDGE.toBase58(),
      //       tokenTransferWithPayloadSignedVaa,
      //     );
      //
      //     const completeNativeWithPayloadSwimUsdIxs = propellerProgram.methods
      //       .completeNativeWithPayload()
      //       .accounts({
      //         propeller,
      //         payer: userKeypair.publicKey,
      //         tokenBridgeConfig,
      //         // userTokenBridgeAccount: userLpTokenAccount.address,
      //         message: wormholeMessage,
      //         claim: wormholeClaim,
      //         endpoint: ethEndpointAccount,
      //         to: propellerRedeemerEscrowAccount,
      //         redeemer: propellerRedeemer,
      //         feeRecipient: userSwimUsdAtaAddr,
      //         // feeRecipient: propellerRedeemerEscrowAccount,
      //         // tokenBridgeMint,
      //         custody: custody,
      //         swimUsdMint: swimUsdMint,
      //         custodySigner,
      //         rent: web3.SYSVAR_RENT_PUBKEY,
      //         systemProgram: web3.SystemProgram.programId,
      //         memo: MEMO_PROGRAM_ID,
      //         wormhole,
      //         tokenProgram: splToken.programId,
      //         tokenBridge,
      //       })
      //       .preInstructions([setComputeUnitLimitIx]);
      //
      //     const completeNativeWithPayloadSwimUsdPubkeys =
      //       await completeNativeWithPayloadSwimUsdIxs.pubkeys();
      //
      //     if (!completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage) {
      //       throw new Error("swimPayloadMessage key not derived");
      //     }
      //     console.info(
      //       `completeNativeWithPayloadSwimUsdPubkeys: ${JSON.stringify(
      //         completeNativeWithPayloadSwimUsdPubkeys,
      //         null,
      //         2,
      //       )}`,
      //     );
      //
      //     const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
      //       await getSwimPayloadMessagePda(
      //         wormholeClaim,
      //         propellerProgram.programId,
      //       );
      //     expect(expectedSwimPayloadMessage.toBase58()).toEqual(
      //       completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage.toBase58(),
      //     );
      //
      //     swimPayloadMessage =
      //       completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage;
      //
      //     const completeNativeWithPayloadSwimUsdTxn =
      //       await completeNativeWithPayloadSwimUsdIxs.transaction();
      //     const completeNativeWithPayloadSwimUsdTxnSig =
      //       await provider.sendAndConfirm(
      //         completeNativeWithPayloadSwimUsdTxn,
      //         [userKeypair],
      //         {
      //           skipPreflight: true,
      //         },
      //       );
      //
      //     const swimPayloadMessageAccount =
      //       await propellerProgram.account.swimPayloadMessage.fetch(
      //         completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage,
      //       );
      //     console.info(
      //       `swimPayloadMessageAccount: ${JSON.stringify(
      //         swimPayloadMessageAccount,
      //         null,
      //         2,
      //       )}`,
      //     );
      //     expect(swimPayloadMessageAccount.bump).toEqual(
      //       expectedSwimPayloadMessageBump,
      //     );
      //     // expect(swimPayloadMessageAccount.whMessage).toEqual(wormholeMessage);
      //     expect(swimPayloadMessageAccount.claim).toEqual(wormholeClaim);
      //     expect(
      //       Buffer.from(swimPayloadMessageAccount.vaaEmitterAddress),
      //     ).toEqual(ethTokenBridge);
      //     expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
      //       CHAIN_ID_ETH,
      //     );
      //     expect(
      //       swimPayloadMessageAccount.vaaSequence.eq(
      //         new BN(ethTokenBridgeSequence),
      //       ),
      //     ).toBeTruthy();
      //     expect(
      //       swimPayloadMessageAccount.transferAmount.eq(
      //         new BN(amount.toString()),
      //       ),
      //     ).toBeTruthy();
      //     // const {
      //     //   swimPayloadVersion,
      //     //   targetTokenId,
      //     //   owner,
      //     //   memo,
      //     //   propellerEnabled,
      //     //   gasKickstart
      //     // } = swimPayloadMessageAccount.swimPayload;
      //     expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
      //       swimPayloadVersion,
      //     );
      //     expect(swimPayloadMessageAccount.targetTokenId).toEqual(
      //       targetTokenId,
      //     );
      //     const swimPayloadMessageOwnerPubkey = new PublicKey(
      //       swimPayloadMessageAccount.owner,
      //     );
      //     expect(swimPayloadMessageOwnerPubkey).toEqual(
      //       provider.wallet.publicKey,
      //     );
      //
      //     expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
      //       propellerEnabled,
      //     );
      //     expect(swimPayloadMessageAccount.gasKickstart).toEqual(gasKickstart);
      //
      //     const completeNativeWithPayloadSwimUsdTxnSize =
      //       completeNativeWithPayloadSwimUsdTxn.serialize().length;
      //     console.info(
      //       `completeNativeWithPayloadSwimUsdTxnSize: ${completeNativeWithPayloadSwimUsdTxnSize}`,
      //     );
      //     await connection.confirmTransaction({
      //       signature: completeNativeWithPayloadSwimUsdTxnSig,
      //       ...(await connection.getLatestBlockhash()),
      //     });
      //
      //     const propellerRedeemerEscrowAccountAfter = (
      //       await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
      //     ).amount;
      //     console.info(`
      //       propellerRedeemerEscrowAccount
      //         Before: ${propellerRedeemerEscrowAccountBefore.toString()}
      //         After: ${propellerRedeemerEscrowAccountAfter.toString()}
      //     `);
      //     expect(
      //       propellerRedeemerEscrowAccountAfter.gt(
      //         propellerRedeemerEscrowAccountBefore,
      //       ),
      //     ).toEqual(true);
      //     await checkTxnLogsForMemo(
      //       completeNativeWithPayloadSwimUsdTxnSig,
      //       memoStr,
      //     );
      //   });
      //
      // eslint-disable-next-line jest/no-commented-out-tests
      //   it("processes swim payload", async () => {
      //     const pool = flagshipPool;
      //     const poolTokenAccount0 = poolUsdcAtaAddr;
      //     const poolTokenAccount1 = poolUsdtAtaAddr;
      //     const lpMint = swimUsdMint;
      //     const governanceFeeAcct = flagshipPoolGovernanceFeeAcct;
      //     const userTokenAccount0 = userUsdcAtaAddr;
      //     const userTokenAccount1 = userUsdtAtaAddr;
      //     const userLpTokenAccount = userSwimUsdAtaAddr;
      //
      //     const userTransferAuthority = web3.Keypair.generate();
      //     const swimPayloadMessageAccount =
      //       await propellerProgram.account.swimPayloadMessage.fetch(
      //         swimPayloadMessage,
      //       );
      //     const swimPayloadMessageAccountTargetTokenId =
      //       swimPayloadMessageAccount.targetTokenId;
      //     const propellerRedeemerEscrowBalanceBefore = (
      //       await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
      //     ).amount;
      //     const userTokenAccount0BalanceBefore = (
      //       await splToken.account.token.fetch(userTokenAccount0)
      //     ).amount;
      //     const userTokenAccount1BalanceBefore = (
      //       await splToken.account.token.fetch(userTokenAccount1)
      //     ).amount;
      //     const userLpTokenAccountBalanceBefore = (
      //       await splToken.account.token.fetch(userLpTokenAccount)
      //     ).amount;
      //     const min_output_amount = new BN(0);
      //     const processSwimPayload = propellerProgram.methods
      //       .processSwimPayload(min_output_amount)
      //       .accounts({
      //         propeller,
      //         payer: userKeypair.publicKey,
      //         claim: wormholeClaim,
      //         swimPayloadMessage,
      //         redeemer: propellerRedeemer,
      //         redeemerEscrow: propellerRedeemerEscrowAccount,
      //         // tokenIdMap: ?
      //         // feeRecipient: propellerRedeemerEscrowAccount,
      //         pool,
      //         poolTokenAccount0,
      //         poolTokenAccount1,
      //         lpMint,
      //         governanceFee: governanceFeeAcct,
      //         userTransferAuthority: userTransferAuthority.publicKey,
      //         userTokenAccount0,
      //         userTokenAccount1,
      //         userLpTokenAccount,
      //         tokenProgram: splToken.programId,
      //         memo: MEMO_PROGRAM_ID,
      //         twoPoolProgram: twoPoolProgram.programId,
      //         systemProgram: web3.SystemProgram.programId,
      //       })
      //       .preInstructions([setComputeUnitLimitIx])
      //       .signers([userTransferAuthority]);
      //
      //     const processSwimPayloadPubkeys = await processSwimPayload.pubkeys();
      //     console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
      //     if (!processSwimPayloadPubkeys.tokenIdMap) {
      //       throw new Error("tokenIdMap not derived");
      //     }
      //
      //     const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
      //       await web3.PublicKey.findProgramAddress(
      //         [
      //           Buffer.from("propeller"),
      //           Buffer.from("token_id"),
      //           propeller.toBuffer(),
      //           new BN(swimPayloadMessageAccountTargetTokenId).toArrayLike(
      //             Buffer,
      //             "le",
      //             2,
      //           ),
      //         ],
      //         propellerProgram.programId,
      //       );
      //
      //     const expectedTokenIdMap =
      //       outputTokenIdMappingAddrs.get(targetTokenId);
      //     if (!expectedTokenIdMap) {
      //       throw new Error("expectedTokenIdMap not found");
      //     }
      //     const expectedTokenIdMapAcct =
      //       await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
      //     console.info(`
      //       calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
      //       calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
      //       expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
      //       ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
      //     `);
      //     const derivedTokenIdMap = processSwimPayloadPubkeys.tokenIdMap;
      //     expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
      //     if (!processSwimPayloadPubkeys.swimClaim) {
      //       throw new Error("swimClaim key not derived");
      //     }
      //     const [expectedSwimClaim, expectedSwimClaimBump] =
      //       await web3.PublicKey.findProgramAddress(
      //         [
      //           Buffer.from("propeller"),
      //           Buffer.from("claim"),
      //           wormholeClaim.toBuffer(),
      //         ],
      //         propellerProgram.programId,
      //       );
      //     expect(processSwimPayloadPubkeys.swimClaim).toEqual(
      //       expectedSwimClaim,
      //     );
      //
      //     const processSwimPayloadTxn: string = await processSwimPayload.rpc();
      //     console.info(`processSwimPayloadTxn: ${processSwimPayloadTxn}`);
      //     const swimClaimAccount =
      //       await propellerProgram.account.swimClaim.fetch(
      //         processSwimPayloadPubkeys.swimClaim,
      //       );
      //     expect(swimClaimAccount.bump).toEqual(expectedSwimClaimBump);
      //     expect(swimClaimAccount.claimed).toBeTruthy();
      //
      //     const propellerRedeemerEscrowBalanceAfter = (
      //       await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
      //     ).amount;
      //     const userTokenAccount0BalanceAfter = (
      //       await splToken.account.token.fetch(userTokenAccount0)
      //     ).amount;
      //     const userTokenAccount1BalanceAfter = (
      //       await splToken.account.token.fetch(userTokenAccount1)
      //     ).amount;
      //     const userLpTokenAccountBalanceAfter = (
      //       await splToken.account.token.fetch(userLpTokenAccount)
      //     ).amount;
      //
      //     console.info(`
      //       propellerRedeemerEscrowBalance
      //         Before: ${propellerRedeemerEscrowBalanceBefore.toString()}
      //         After: ${propellerRedeemerEscrowBalanceAfter.toString()}
      //       userTokenAccount0Balance
      //         Before: ${userTokenAccount0BalanceBefore.toString()}
      //         After: ${userTokenAccount0BalanceAfter.toString()}
      //       userTokenAccount1Balance
      //         Before: ${userTokenAccount1BalanceBefore.toString()}
      //         After: ${userTokenAccount1BalanceAfter.toString()}
      //     `);
      //     expect(
      //       propellerRedeemerEscrowBalanceAfter.eq(
      //         propellerRedeemerEscrowBalanceBefore.sub(
      //           swimPayloadMessageAccount.transferAmount,
      //         ),
      //       ),
      //     ).toBeTruthy();
      //
      //     expect(
      //       userTokenAccount0BalanceAfter.eq(userTokenAccount0BalanceBefore),
      //     ).toBeTruthy();
      //     expect(
      //       userTokenAccount1BalanceAfter.eq(userTokenAccount1BalanceBefore),
      //     ).toBeTruthy();
      //     expect(
      //       userLpTokenAccountBalanceAfter.eq(
      //         userLpTokenAccountBalanceBefore.add(
      //           swimPayloadMessageAccount.transferAmount,
      //         ),
      //       ),
      //     ).toBeTruthy();
      //     await checkTxnLogsForMemo(processSwimPayloadTxn, memoStr);
      //   });
      // });
      //
      // eslint-disable-next-line jest/no-commented-out-tests
      // describe.skip("for token from metapool as output token", () => {
      //   let wormholeClaim: web3.PublicKey;
      //   let wormholeMessage: web3.PublicKey;
      //   let swimPayloadMessage: web3.PublicKey;
      //   const targetTokenId = metapoolMint1OutputTokenIndex;
      //   const memoStr = incMemoIdAndGet();
      //   // const memo = "e45794d6c5a2750b";
      //
      // eslint-disable-next-line jest/no-commented-out-tests
      //   it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
      //     const memoBuffer = Buffer.alloc(16);
      //     memoBuffer.write(memoStr);
      //
      //     const maxFee = new BN(1000000000);
      //     const swimPayload = {
      //       version: swimPayloadVersion,
      //       owner: provider.publicKey.toBuffer(),
      //       propellerEnabled,
      //       gasKickstart,
      //       maxFee,
      //       targetTokenId,
      //       memo: memoBuffer,
      //     };
      //
      //     // const swimPayload = {
      //     //   version: swimPayloadVersion,
      //     //   targetTokenId,
      //     //   // owner: tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA),
      //     //   // owner: Buffer.from(tryNativeToHexString(provider.publicKey.toBase58(), CHAIN_ID_SOLANA), 'hex'),
      //     //   owner: provider.publicKey.toBuffer(),
      //     //   // minOutputAmount: 0n,
      //     //   memo: memoBuffer,
      //     //   propellerEnabled,
      //     //   // minThreshold: BigInt(0),
      //     //   gasKickstart,
      //     // };
      //     const amount = parseUnits("1", mintDecimal);
      //     console.info(`amount: ${amount.toString()}`);
      //     /**
      //      * this is encoding a token transfer from eth routing contract
      //      * with a swimUSD token address that originated on solana
      //      * the same as initializing a `TransferWrappedWithPayload` from eth
      //      */
      //
      //     const nonce = createNonce().readUInt32LE(0);
      //     const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
      //       0,
      //       nonce,
      //       CHAIN_ID_ETH as number,
      //       ethTokenBridge,
      //       BigInt(++ethTokenBridgeSequence),
      //       encodeTokenTransferWithPayload(
      //         amount.toString(),
      //         swimUsdKeypair.publicKey.toBuffer(),
      //         CHAIN_ID_SOLANA,
      //         propellerProgram.programId,
      //         ethRoutingContract,
      //         encodeSwimPayload(swimPayload),
      //       ),
      //     );
      //     const propellerRedeemerEscrowAccountBefore = (
      //       await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
      //     ).amount;
      //
      //     await postVaaSolanaWithRetry(
      //       connection,
      //       // eslint-disable-next-line @typescript-eslint/require-await
      //       async (tx) => {
      //         tx.partialSign(userKeypair);
      //         return tx;
      //       },
      //       WORMHOLE_CORE_BRIDGE.toBase58(),
      //       userKeypair.publicKey.toBase58(),
      //       tokenTransferWithPayloadSignedVaa,
      //       10,
      //     );
      //
      //     [wormholeMessage] = await deriveMessagePda(
      //       tokenTransferWithPayloadSignedVaa,
      //       WORMHOLE_CORE_BRIDGE,
      //     );
      //
      //     // const [ethEndpointAccount] = await deriveEndpointPda(
      //     //   CHAIN_ID_ETH,
      //     //   ethTokenBridge,
      //     //   // parsedVaa.emitterChain,
      //     //   // parsedVaa.emitterAddress,
      //     //   WORMHOLE_TOKEN_BRIDGE,
      //     // );
      //     console.info(`endpointAccount: ${ethEndpointAccount.toBase58()}`);
      //     wormholeClaim = await getClaimAddressSolana(
      //       WORMHOLE_TOKEN_BRIDGE.toBase58(),
      //       tokenTransferWithPayloadSignedVaa,
      //     );
      //
      //     const completeNativeWithPayloadMetapoolIxs = propellerProgram.methods
      //       .completeNativeWithPayload()
      //       .accounts({
      //         propeller,
      //         payer: userKeypair.publicKey,
      //         tokenBridgeConfig,
      //         // userTokenBridgeAccount: userLpTokenAccount.address,
      //         message: wormholeMessage,
      //         claim: wormholeClaim,
      //         endpoint: ethEndpointAccount,
      //         to: propellerRedeemerEscrowAccount,
      //         redeemer: propellerRedeemer,
      //         feeRecipient: userSwimUsdAtaAddr,
      //         // feeRecipient: propellerRedeemerEscrowAccount,
      //         // tokenBridgeMint,
      //         custody: custody,
      //         swimUsdMint: swimUsdMint,
      //         custodySigner,
      //         rent: web3.SYSVAR_RENT_PUBKEY,
      //         systemProgram: web3.SystemProgram.programId,
      //         memo: MEMO_PROGRAM_ID,
      //         wormhole,
      //         tokenProgram: splToken.programId,
      //         tokenBridge,
      //       })
      //       .preInstructions([setComputeUnitLimitIx]);
      //
      //     const completeNativeWithPayloadMetapoolPubkeys =
      //       await completeNativeWithPayloadMetapoolIxs.pubkeys();
      //
      //     if (!completeNativeWithPayloadMetapoolPubkeys.swimPayloadMessage) {
      //       throw new Error("swimPayloadMessage key not derived");
      //     }
      //     console.info(
      //       `completeNativeWithPayloadMetapoolPubkeys: ${JSON.stringify(
      //         completeNativeWithPayloadMetapoolPubkeys,
      //         null,
      //         2,
      //       )}`,
      //     );
      //
      //     const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
      //       await getSwimPayloadMessagePda(
      //         wormholeClaim,
      //         propellerProgram.programId,
      //       );
      //     expect(expectedSwimPayloadMessage.toBase58()).toEqual(
      //       completeNativeWithPayloadMetapoolPubkeys.swimPayloadMessage.toBase58(),
      //     );
      //
      //     swimPayloadMessage =
      //       completeNativeWithPayloadMetapoolPubkeys.swimPayloadMessage;
      //
      //     const completeNativeWithPayloadMetapoolTxn =
      //       await completeNativeWithPayloadMetapoolIxs.transaction();
      //     const transferNativeTxnSig = await provider.sendAndConfirm(
      //       completeNativeWithPayloadMetapoolTxn,
      //       [userKeypair],
      //       {
      //         skipPreflight: true,
      //       },
      //     );
      //
      //     const swimPayloadMessageAccount =
      //       await propellerProgram.account.swimPayloadMessage.fetch(
      //         completeNativeWithPayloadMetapoolPubkeys.swimPayloadMessage,
      //       );
      //     console.info(
      //       `swimPayloadMessageAccount: ${JSON.stringify(
      //         swimPayloadMessageAccount,
      //         null,
      //         2,
      //       )}`,
      //     );
      //     expect(swimPayloadMessageAccount.bump).toEqual(
      //       expectedSwimPayloadMessageBump,
      //     );
      //     // expect(swimPayloadMessageAccount.whMessage).toEqual(wormholeMessage);
      //     expect(swimPayloadMessageAccount.claim).toEqual(wormholeClaim);
      //     expect(
      //       Buffer.from(swimPayloadMessageAccount.vaaEmitterAddress),
      //     ).toEqual(ethTokenBridge);
      //     expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
      //       CHAIN_ID_ETH,
      //     );
      //     expect(
      //       swimPayloadMessageAccount.vaaSequence.eq(
      //         new BN(ethTokenBridgeSequence),
      //       ),
      //     ).toBeTruthy();
      //     expect(
      //       swimPayloadMessageAccount.transferAmount.eq(
      //         new BN(amount.toString()),
      //       ),
      //     ).toBeTruthy();
      //     // const {
      //     //   swimPayloadVersion,
      //     //   targetTokenId,
      //     //   owner,
      //     //   memo,
      //     //   propellerEnabled,
      //     //   gasKickstart
      //     // } = swimPayloadMessageAccount.swimPayload;
      //     expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
      //       swimPayloadVersion,
      //     );
      //     expect(swimPayloadMessageAccount.targetTokenId).toEqual(
      //       targetTokenId,
      //     );
      //     const swimPayloadMessageOwnerPubKey = new PublicKey(
      //       swimPayloadMessageAccount.owner,
      //     );
      //     expect(swimPayloadMessageOwnerPubKey).toEqual(
      //       provider.wallet.publicKey,
      //     );
      //     expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
      //       propellerEnabled,
      //     );
      //     expect(swimPayloadMessageAccount.gasKickstart).toEqual(gasKickstart);
      //
      //     const completeNativeWithPayloadMetapoolTxnSize =
      //       completeNativeWithPayloadMetapoolTxn.serialize().length;
      //     console.info(
      //       `completeNativeWithPayloadMetapoolTxnSize: ${completeNativeWithPayloadMetapoolTxnSize}`,
      //     );
      //     await connection.confirmTransaction({
      //       signature: transferNativeTxnSig,
      //       ...(await connection.getLatestBlockhash()),
      //     });
      //
      //     const propellerRedeemerEscrowAccountAfter = (
      //       await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
      //     ).amount;
      //     console.info(`
      //       propellerRedeemerEscrowAccount
      //         Before: ${propellerRedeemerEscrowAccountBefore.toString()}
      //         After: ${propellerRedeemerEscrowAccountAfter.toString()}
      //     `);
      //     expect(
      //       propellerRedeemerEscrowAccountAfter.gt(
      //         propellerRedeemerEscrowAccountBefore,
      //       ),
      //     ).toEqual(true);
      //     await checkTxnLogsForMemo(transferNativeTxnSig, memoStr);
      //   });
      //
      // eslint-disable-next-line jest/no-commented-out-tests
      //   it("processes swim payload", async () => {
      //     const pool = metapool;
      //     const poolTokenAccount0 = metapoolPoolToken0Ata;
      //     const poolTokenAccount1 = metapoolPoolToken1Ata;
      //     const lpMint = metapoolLpMint;
      //     const governanceFeeAcct = metapoolGovernanceFeeAta;
      //     // user's swimUSdTokenAccount. should be unchanged.
      //     const userTokenAccount0 = userMetapoolTokenAccount0;
      //     // user's output_token_index token account. should be increased.
      //     const userTokenAccount1 = userMetapoolTokenAccount1;
      //     // user's lp token account. should be unchanged.
      //     const userLpTokenAccount = userMetapoolLpTokenAccount;
      //
      //     const userTransferAuthority = web3.Keypair.generate();
      //     const swimPayloadMessageAccount =
      //       await propellerProgram.account.swimPayloadMessage.fetch(
      //         swimPayloadMessage,
      //       );
      //     const swimPayloadMessageAccountTargetTokenId =
      //       swimPayloadMessageAccount.targetTokenId;
      //     const propellerRedeemerEscrowBalanceBefore = (
      //       await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
      //     ).amount;
      //     const userTokenAccount0BalanceBefore = (
      //       await splToken.account.token.fetch(userTokenAccount0)
      //     ).amount;
      //     const userTokenAccount1BalanceBefore = (
      //       await splToken.account.token.fetch(userTokenAccount1)
      //     ).amount;
      //     const userLpTokenAccountBalanceBefore = (
      //       await splToken.account.token.fetch(userLpTokenAccount)
      //     ).amount;
      //     const min_output_amount = new BN(0);
      //     const processSwimPayload = propellerProgram.methods
      //       .processSwimPayload(min_output_amount)
      //       .accounts({
      //         propeller,
      //         payer: userKeypair.publicKey,
      //         claim: wormholeClaim,
      //         swimPayloadMessage,
      //         redeemer: propellerRedeemer,
      //         redeemerEscrow: propellerRedeemerEscrowAccount,
      //         // tokenIdMap: ?
      //         // feeRecipient: propellerRedeemerEscrowAccount,
      //         pool,
      //         poolTokenAccount0,
      //         poolTokenAccount1,
      //         lpMint,
      //         governanceFee: governanceFeeAcct,
      //         userTransferAuthority: userTransferAuthority.publicKey,
      //         userTokenAccount0,
      //         userTokenAccount1,
      //         userLpTokenAccount,
      //         tokenProgram: splToken.programId,
      //         memo: MEMO_PROGRAM_ID,
      //         twoPoolProgram: twoPoolProgram.programId,
      //         systemProgram: web3.SystemProgram.programId,
      //       })
      //       .preInstructions([setComputeUnitLimitIx])
      //       .signers([userTransferAuthority]);
      //
      //     const processSwimPayloadPubkeys = await processSwimPayload.pubkeys();
      //     console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
      //     if (!processSwimPayloadPubkeys.tokenIdMap) {
      //       throw new Error("tokenIdMap not derived");
      //     }
      //     const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
      //       await web3.PublicKey.findProgramAddress(
      //         [
      //           Buffer.from("propeller"),
      //           Buffer.from("token_id"),
      //           propeller.toBuffer(),
      //           new BN(swimPayloadMessageAccountTargetTokenId).toArrayLike(
      //             Buffer,
      //             "le",
      //             2,
      //           ),
      //         ],
      //         propellerProgram.programId,
      //       );
      //
      //     const expectedTokenIdMap =
      //       outputTokenIdMappingAddrs.get(targetTokenId);
      //     if (!expectedTokenIdMap) {
      //       throw new Error("expectedTokenIdMap not found");
      //     }
      //     const expectedTokenIdMapAcct =
      //       await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
      //     console.info(`
      //       calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
      //       calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
      //       expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
      //       ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
      //     `);
      //     const derivedTokenIdMap = processSwimPayloadPubkeys.tokenIdMap;
      //     expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
      //     if (!processSwimPayloadPubkeys.swimClaim) {
      //       throw new Error("swimClaim key not derived");
      //     }
      //     const [expectedSwimClaim, expectedSwimClaimBump] =
      //       await getSwimClaimPda(wormholeClaim, propellerProgram.programId);
      //     expect(processSwimPayloadPubkeys.swimClaim).toEqual(
      //       expectedSwimClaim,
      //     );
      //
      //     const processSwimPayloadTxn: string = await processSwimPayload.rpc();
      //     console.info(`processSwimPayloadTxn: ${processSwimPayloadTxn}`);
      //     const swimClaimAccount =
      //       await propellerProgram.account.swimClaim.fetch(
      //         processSwimPayloadPubkeys.swimClaim,
      //       );
      //     expect(swimClaimAccount.bump).toEqual(expectedSwimClaimBump);
      //     expect(swimClaimAccount.claimed).toBeTruthy();
      //
      //     const propellerRedeemerEscrowBalanceAfter = (
      //       await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
      //     ).amount;
      //     const userTokenAccount0BalanceAfter = (
      //       await splToken.account.token.fetch(userTokenAccount0)
      //     ).amount;
      //     const userTokenAccount1BalanceAfter = (
      //       await splToken.account.token.fetch(userTokenAccount1)
      //     ).amount;
      //     const userLpTokenAccountBalanceAfter = (
      //       await splToken.account.token.fetch(userLpTokenAccount)
      //     ).amount;
      //
      //     console.info(`
      //       propellerRedeemerEscrowBalance
      //         Before: ${propellerRedeemerEscrowBalanceBefore.toString()}
      //         After: ${propellerRedeemerEscrowBalanceAfter.toString()}
      //       userTokenAccount0Balance
      //         Before: ${userTokenAccount0BalanceBefore.toString()}
      //         After: ${userTokenAccount0BalanceAfter.toString()}
      //       userTokenAccount1Balance
      //         Before: ${userTokenAccount1BalanceBefore.toString()}
      //         After: ${userTokenAccount1BalanceAfter.toString()}
      //     `);
      //     expect(
      //       propellerRedeemerEscrowBalanceAfter.eq(
      //         propellerRedeemerEscrowBalanceBefore.sub(
      //           swimPayloadMessageAccount.transferAmount,
      //         ),
      //       ),
      //     ).toBeTruthy();
      //
      //     const outputAmount = userTokenAccount1BalanceAfter.sub(
      //       userTokenAccount1BalanceBefore,
      //     );
      //     expect(
      //       userTokenAccount0BalanceAfter.eq(userTokenAccount0BalanceBefore),
      //     ).toBeTruthy();
      //     expect(
      //       userTokenAccount1BalanceAfter.gt(userTokenAccount1BalanceBefore),
      //     ).toBeTruthy();
      //     expect(
      //       userLpTokenAccountBalanceAfter.eq(userLpTokenAccountBalanceBefore),
      //     ).toBeTruthy();
      //     console.info(`outputAmount: ${outputAmount.toString()}`);
      //     await checkTxnLogsForMemo(processSwimPayloadTxn, memoStr);
      //   });
      // });
    });

    describe("with gas kickstart", () => {
      const gasKickstart = true;

      describe("for new user with no token accounts", () => {
        describe("for token from flagship pool as output token", () => {
          let wormholeClaim: web3.PublicKey;
          let wormholeMessage: web3.PublicKey;
          let swimPayloadMessage: web3.PublicKey;
          const owner = web3.Keypair.generate().publicKey;
          console.info(`new user: ${owner.toBase58()}`);
          // let owner: web3.PublicKey;

          const targetTokenId = USDC_TO_TOKEN_NUMBER;
          const memoStr = incMemoIdAndGet();

          it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedBefore = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;

            const memoBuffer = Buffer.alloc(16);
            memoBuffer.write(memoStr);

            const maxFee = new BN(1000000000);
            const swimPayload = {
              version: swimPayloadVersion,
              owner: owner.toBuffer(),
              propellerEnabled,
              gasKickstart,
              maxFee,
              targetTokenId,
              memo: memoBuffer,
            };
            // const swimPayload = {
            //   version: swimPayloadVersion,
            //   targetTokenId,
            //   owner: owner.toBuffer(),
            //   memo: memoBuffer,
            //   propellerEnabled,
            //   gasKickstart,
            // };
            const amount = parseUnits("100000", mintDecimal);
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

            console.info(
              `propellerRedeemerEscrowAccountBefore: ${propellerRedeemerEscrowAccountBefore.toString()}`,
            );
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

            // const [ethEndpointAccount] = await deriveEndpointPda(
            //   CHAIN_ID_ETH,
            //   ethTokenBridge,
            //   // parsedVaa.emitterChain,
            //   // parsedVaa.emitterAddress,
            //   WORMHOLE_TOKEN_BRIDGE,
            // );
            console.info(`endpointAccount: ${ethEndpointAccount.toBase58()}`);
            wormholeClaim = await getClaimAddressSolana(
              WORMHOLE_TOKEN_BRIDGE.toBase58(),
              tokenTransferWithPayloadSignedVaa,
            );

            const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
              await getSwimPayloadMessagePda(
                wormholeClaim,
                propellerProgram.programId,
              );
            // const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
            //   await web3.PublicKey.findProgramAddress(
            //     [
            //       Buffer.from("propeller"),
            //       wormholeClaim.toBuffer(),
            //       wormholeMessage.toBuffer(),
            //     ],
            //     propellerProgram.programId,
            //   );
            // expect(expectedSwimPayloadMessage.toBase58()).toEqual(
            //   completeNativeWithPayloadPubkeys.swimPayloadMessage.toBase58(),
            // );
            console.info(`
            marginalPricePoolToken0Account: ${marginalPricePoolToken0Account.toBase58()}
            marginalPricePoolToken1Account: ${marginalPricePoolToken1Account.toBase58()}
          `);

            const providerBalanceBefore = await provider.connection.getBalance(
              provider.wallet.publicKey,
            );
            const propellerEngineWalletPubkey =
              propellerEngineAnchorProvider.wallet.publicKey;
            const propellerEngineProviderBalanceBefore =
              await provider.connection.getBalance(propellerEngineWalletPubkey);

            const completeNativeWithPayloadIxs =
              propellerEnginePropellerProgram.methods
                .propellerCompleteNativeWithPayload()
                .accounts({
                  completeNativeWithPayload: {
                    propeller,
                    payer: propellerEngineKeypair.publicKey,
                    tokenBridgeConfig,
                    // userTokenBridgeAccount: userLpTokenAccount.address,
                    message: wormholeMessage,
                    claim: wormholeClaim,
                    swimPayloadMessage: expectedSwimPayloadMessage,
                    endpoint: ethEndpointAccount,
                    to: propellerRedeemerEscrowAccount,
                    redeemer: propellerRedeemer,
                    feeRecipient: propellerFeeVault,
                    // feeRecipient: propellerRedeemerEscrowAccount,
                    // tokenBridgeMint,
                    custody: custody,
                    swimUsdMint: swimUsdMint,
                    custodySigner,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    wormhole,
                    tokenProgram: splToken.programId,
                    tokenBridge,
                  },
                  feeTracker: propellerEngineFeeTracker,
                  aggregator,
                  // marginalPricePool: {
                  //   pool: marginalPricePool,
                  //   poolToken0Account: marginalPricePoolToken0Account,
                  //   poolToken1Account: marginalPricePoolToken1Account,
                  //   lpMint: marginalPricePoolLpMint,
                  // },
                  // twoPoolProgram: twoPoolProgram.programId,
                  marginalPricePool: marginalPricePool,
                  marginalPricePoolToken0Account:
                    marginalPricePoolToken0Account,
                  marginalPricePoolToken1Account:
                    marginalPricePoolToken1Account,
                  marginalPricePoolLpMint: marginalPricePoolLpMint,
                  twoPoolProgram: twoPoolProgram.programId,
                  memo: MEMO_PROGRAM_ID,
                })
                .preInstructions([setComputeUnitLimitIx])
                .signers([propellerEngineKeypair]);

            const completeNativeWithPayloadPubkeys =
              await completeNativeWithPayloadIxs.pubkeys();

            console.info(
              `completeNativeWithPayloadPubkeys: ${JSON.stringify(
                completeNativeWithPayloadPubkeys,
                null,
                2,
              )}`,
            );

            // const solUsdFeedVal = (await aggregatorAccount.getLatestValue())!;
            // const completeNativeWithPayloadTxn =
            //   await completeNativeWithPayloadIxs.transaction();
            //
            // console.info(
            //   `completeNativeWithPayloadTxn: ${JSON.stringify(
            //     completeNativeWithPayloadTxn,
            //     null,
            //     2,
            //   )}`,
            // );
            const completeNativeWithPayloadTxnSig =
              await completeNativeWithPayloadIxs.rpc();
            const providerBalanceAfter = await provider.connection.getBalance(
              provider.wallet.publicKey,
            );
            const providerBalanceDiff =
              providerBalanceBefore - providerBalanceAfter;
            const propellerEngineProviderBalanceAfter =
              await provider.connection.getBalance(
                propellerEngineAnchorProvider.wallet.publicKey,
              );
            const propellerEngineProviderBalanceDiff =
              propellerEngineProviderBalanceBefore -
              propellerEngineProviderBalanceAfter;
            console.info(`
              provider: ${provider.wallet.publicKey.toBase58()}
                balanceDiff: ${providerBalanceDiff}
            `);
            console.info(`
              propellerEngineWalletPubkey: ${propellerEngineWalletPubkey.toBase58()}
                balanceDiff: ${propellerEngineProviderBalanceDiff}
            `);

            const swimPayloadMessageAccount =
              await propellerProgram.account.swimPayloadMessage.fetch(
                expectedSwimPayloadMessage,
              );
            console.info(
              `swimPayloadMessageAccount: ${JSON.stringify(
                swimPayloadMessageAccount,
                null,
                2,
              )}`,
            );
            expect(swimPayloadMessageAccount.bump).toEqual(
              expectedSwimPayloadMessageBump,
            );
            // expect(swimPayloadMessageAccount.whMessage).toEqual(
            //   wormholeMessage,
            // );
            expect(swimPayloadMessageAccount.claim).toEqual(wormholeClaim);
            expect(
              Buffer.from(swimPayloadMessageAccount.vaaEmitterAddress),
            ).toEqual(ethTokenBridge);
            expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
              CHAIN_ID_ETH,
            );
            expect(
              swimPayloadMessageAccount.vaaSequence.eq(
                new BN(ethTokenBridgeSequence),
              ),
            ).toBeTruthy();

            // const {
            //   swimPayloadVersion,
            //   targetTokenId,
            //   owner,
            //   memo,
            //   propellerEnabled,
            //   gasKickstart
            // } = swimPayloadMessageAccount.swimPayload;
            expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
              swimPayloadVersion,
            );
            expect(swimPayloadMessageAccount.targetTokenId).toEqual(
              targetTokenId,
            );
            const swimPayloadMessageOwnerPubkey = new PublicKey(
              swimPayloadMessageAccount.owner,
            );
            expect(swimPayloadMessageOwnerPubkey).toEqual(owner);

            expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
              propellerEnabled,
            );
            expect(swimPayloadMessageAccount.gasKickstart).toEqual(
              gasKickstart,
            );

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

            const propellerEngineFeeTrackerAfter =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );
            console.info(
              `propellerEngineFeeTrackerAfter: ${JSON.stringify(
                propellerEngineFeeTrackerAfter,
                null,
                2,
              )}`,
            );
            const propellerEngineFeeTrackerFeesOwedAfter =
              propellerEngineFeeTrackerAfter.feesOwed;
            const propellerEngineFeeTrackerFeesOwedDiff =
              propellerEngineFeeTrackerFeesOwedAfter.sub(
                propellerEngineFeeTrackerFeesOwedBefore,
              );
            console.info(`
              gasKickstart new user
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
                diff: ${propellerEngineFeeTrackerFeesOwedDiff.toString()}
          `);
            expect(
              propellerEngineFeeTrackerFeesOwedAfter.gt(
                propellerEngineFeeTrackerFeesOwedBefore,
              ),
            ).toEqual(true);

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            expect(
              propellerFeeVaultBalanceAfter.eq(
                propellerFeeVaultBalanceBefore.add(
                  propellerEngineFeeTrackerFeesOwedDiff,
                ),
              ),
            ).toEqual(true);

            const wormholeMessageLength = (
              await connection.getAccountInfo(wormholeMessage)
            ).data.length;
            const wormholeClaimLength = (
              await connection.getAccountInfo(wormholeClaim)
            ).data.length;

            const wormholeMessageRentExemption =
              await connection.getMinimumBalanceForRentExemption(
                wormholeMessageLength,
              );
            const wormholeClaimRentExemption =
              await connection.getMinimumBalanceForRentExemption(
                wormholeClaimLength,
              );

            const totalRentExemptionInLamports =
              wormholeMessageRentExemption + wormholeClaimRentExemption;

            const expectedFeesInLamports = completeWithPayloadFee
              .add(secpVerifyInitFee)
              .add(secpVerifyFee)
              .add(postVaaFee)
              .add(new BN(totalRentExemptionInLamports));

            const feeSwimUsdBn = await convertLamportsToSwimUsdAtomic(
              expectedFeesInLamports,
            );
            expect(
              propellerEngineFeeTrackerFeesOwedDiff.eq(feeSwimUsdBn),
            ).toBeTruthy();

            const expectedSwimPayloadMessageTransferAmount = new BN(
              amount.toString(),
            ).sub(propellerEngineFeeTrackerFeesOwedDiff);
            expect(
              swimPayloadMessageAccount.transferAmount.eq(
                expectedSwimPayloadMessageTransferAmount,
              ),
            ).toBeTruthy();
            await checkTxnLogsForMemo(completeNativeWithPayloadTxnSig, memoStr);
            swimPayloadMessage = expectedSwimPayloadMessage;
          });

          it("creates owner token accounts", async () => {
            const pool = flagshipPool;
            const poolToken0Mint = usdcKeypair.publicKey;
            const poolToken1Mint = usdtKeypair.publicKey;
            const lpMint = swimUsdMint;

            const [userTokenAccount0, userTokenAccount1, userLpTokenAccount] =
              await Promise.all([
                getAssociatedTokenAddress(usdcKeypair.publicKey, owner),
                getAssociatedTokenAddress(usdtKeypair.publicKey, owner),
                getAssociatedTokenAddress(swimUsdKeypair.publicKey, owner),
              ]);
            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedBefore = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;

            await propellerEnginePropellerProgram.methods
              .propellerCreateOwnerTokenAccounts()
              .accounts({
                propeller,
                payer: propellerEngineKeypair.publicKey,
                redeemer: propellerRedeemer,
                redeemerEscrow: propellerRedeemerEscrowAccount,
                feeVault: propellerFeeVault,
                feeTracker: propellerEngineFeeTracker,
                claim: wormholeClaim,
                swimPayloadMessage,
                // tokenIdMap: ?
                pool,
                poolToken0Mint,
                poolToken1Mint,
                poolLpMint: lpMint,
                user: owner,

                userPoolToken0Account: userTokenAccount0,

                userPoolToken1Account: userTokenAccount1,

                userLpTokenAccount,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                systemProgram: web3.SystemProgram.programId,
                tokenProgram: splToken.programId,
                memo: MEMO_PROGRAM_ID,
                aggregator,
                marginalPricePool: marginalPricePool,
                marginalPricePoolToken0Account: marginalPricePoolToken0Account,
                marginalPricePoolToken1Account: marginalPricePoolToken1Account,
                marginalPricePoolLpMint: marginalPricePoolLpMint,
                twoPoolProgram: twoPoolProgram.programId,
              })
              .preInstructions([setComputeUnitLimitIx])
              .rpc();

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedAfter = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;
            expect(
              propellerFeeVaultBalanceAfter.gt(propellerFeeVaultBalanceBefore),
            ).toBeTruthy();
            expect(
              propellerEngineFeeTrackerFeesOwedAfter.gt(
                propellerEngineFeeTrackerFeesOwedBefore,
              ),
            ).toBeTruthy();
            const userTokenAccount0Data = await splToken.account.token.fetch(
              userTokenAccount0,
            );
            const userTokenAccount1Data = await splToken.account.token.fetch(
              userTokenAccount1,
            );
            const userLpTokenAccountData = await splToken.account.token.fetch(
              userLpTokenAccount,
            );
            expect(userTokenAccount0Data.amount.toNumber()).toEqual(0);
            expect(userTokenAccount0Data.authority.toBase58()).toEqual(
              owner.toBase58(),
            );
            expect(userTokenAccount1Data.amount.toNumber()).toEqual(0);
            expect(userTokenAccount1Data.authority.toBase58()).toEqual(
              owner.toBase58(),
            );
            expect(userLpTokenAccountData.amount.toNumber()).toEqual(0);
            expect(userLpTokenAccountData.authority.toBase58()).toEqual(
              owner.toBase58(),
            );
          });

          it("processes swim payload", async () => {
            const pool = flagshipPool;
            const poolTokenAccount0 = poolUsdcAtaAddr;
            const poolTokenAccount1 = poolUsdtAtaAddr;
            const lpMint = swimUsdMint;
            const governanceFeeAcct = flagshipPoolGovernanceFeeAcct;
            const userBalanceBefore = await connection.getBalance(owner);
            const [userTokenAccount0, userTokenAccount1, userLpTokenAccount] =
              await Promise.all([
                getAssociatedTokenAddress(usdcKeypair.publicKey, owner),
                getAssociatedTokenAddress(usdtKeypair.publicKey, owner),
                getAssociatedTokenAddress(swimUsdKeypair.publicKey, owner),
              ]);

            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedBefore = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;

            const userTransferAuthority = web3.Keypair.generate();
            const swimPayloadMessageAccount =
              await propellerProgram.account.swimPayloadMessage.fetch(
                swimPayloadMessage,
              );
            const swimPayloadMessageAccountTargetTokenId =
              swimPayloadMessageAccount.targetTokenId;
            const propellerRedeemerEscrowBalanceBefore = (
              await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
            ).amount;
            const userTokenAccount0BalanceBefore = (
              await splToken.account.token.fetch(userTokenAccount0)
            ).amount;
            const userTokenAccount1BalanceBefore = (
              await splToken.account.token.fetch(userTokenAccount1)
            ).amount;
            const processSwimPayloadPubkeys =
              await propellerEnginePropellerProgram.methods
                .processSwimPayload(
                  swimPayloadMessageAccountTargetTokenId,
                  new BN(0),
                )
                .accounts({
                  propeller,
                  payer: propellerEngineKeypair.publicKey,
                  claim: wormholeClaim,
                  swimPayloadMessage,
                  swimPayloadMessagePayer:
                    swimPayloadMessageAccount.swimPayloadMessagePayer,
                  redeemer: propellerRedeemer,
                  redeemerEscrow: propellerRedeemerEscrowAccount,
                  // tokenIdMap: ?
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

                  twoPoolProgram: twoPoolProgram.programId,
                  systemProgram: web3.SystemProgram.programId,
                })
                .pubkeys();

            const propellerProcessSwimPayloadIxs =
              propellerEnginePropellerProgram.methods
                .propellerProcessSwimPayload(
                  swimPayloadMessageAccountTargetTokenId,
                )
                .accounts({
                  processSwimPayload: processSwimPayloadPubkeys,
                  feeVault: propellerFeeVault,
                  feeTracker: propellerEngineFeeTracker,
                  aggregator,
                  marginalPricePool: marginalPricePool,
                  marginalPricePoolToken0Account:
                    marginalPricePoolToken0Account,
                  marginalPricePoolToken1Account:
                    marginalPricePoolToken1Account,
                  marginalPricePoolLpMint: marginalPricePoolLpMint,
                  owner,
                  memo: MEMO_PROGRAM_ID,
                })
                .preInstructions([setComputeUnitLimitIx])
                .signers([userTransferAuthority, propellerEngineKeypair]);

            const propellerProcessSwimPayloadPubkeys =
              await propellerProcessSwimPayloadIxs.pubkeys();
            console.info(
              `${JSON.stringify(propellerProcessSwimPayloadPubkeys, null, 2)}`,
            );
            if (!processSwimPayloadPubkeys.tokenIdMap) {
              throw new Error("tokenIdMap not derived");
            }
            const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
              await web3.PublicKey.findProgramAddress(
                [
                  Buffer.from("propeller"),
                  Buffer.from("token_id"),
                  propeller.toBuffer(),
                  new BN(swimPayloadMessageAccountTargetTokenId).toArrayLike(
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
              await propellerProgram.account.tokenIdMap.fetch(
                expectedTokenIdMap,
              );
            console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
            const derivedTokenIdMap = processSwimPayloadPubkeys.tokenIdMap;
            expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
            if (!processSwimPayloadPubkeys.swimClaim) {
              throw new Error("swimClaim key not derived");
            }
            const [expectedSwimClaim, expectedSwimClaimBump] =
              await getSwimClaimPda(wormholeClaim, propellerProgram.programId);

            expect(processSwimPayloadPubkeys.swimClaim).toEqual(
              expectedSwimClaim,
            );

            const processSwimPayloadTxnSig: string =
              await propellerProcessSwimPayloadIxs.rpc();
            console.info(
              `processSwimPayloadTxnSig: ${processSwimPayloadTxnSig}`,
            );

            const userBalanceAfter = await connection.getBalance(owner);
            console.info(`
              userBalance:
                before: ${userBalanceBefore}
                after: ${userBalanceAfter}
            `);
            expect(userBalanceAfter - userBalanceBefore).toEqual(
              gasKickstartAmount.toNumber(),
            );
            const propellerEngineFeeTrackerAfter =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );
            console.info(
              `propellerEngineFeeTrackerAfter: ${JSON.stringify(
                propellerEngineFeeTrackerAfter,
                null,
                2,
              )}`,
            );
            const propellerEngineFeeTrackerFeesOwedAfter =
              propellerEngineFeeTrackerAfter.feesOwed;
            console.info(`
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
          `);
            const feeTrackerFeesOwedDiff =
              propellerEngineFeeTrackerFeesOwedAfter.sub(
                propellerEngineFeeTrackerFeesOwedBefore,
              );

            expect(
              propellerEngineFeeTrackerFeesOwedAfter.gt(
                propellerEngineFeeTrackerFeesOwedBefore,
              ),
            ).toEqual(true);

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            expect(
              propellerFeeVaultBalanceAfter.eq(
                propellerFeeVaultBalanceBefore.add(feeTrackerFeesOwedDiff),
              ),
            ).toEqual(true);

            const swimClaimAccount =
              await propellerProgram.account.swimClaim.fetch(
                processSwimPayloadPubkeys.swimClaim,
              );
            expect(swimClaimAccount.bump).toEqual(expectedSwimClaimBump);
            expect(swimClaimAccount.claimed).toBeTruthy();

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
                  swimPayloadMessageAccount.transferAmount,
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

          //TODO: create multiple fee trackers and test that correct amount is withdrawn
          it("claims its fees", async () => {
            const propellerEngineFeeTrackerBefore =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );
            const propellerEngineFeeTrackerFeesOwedBefore =
              propellerEngineFeeTrackerBefore.feesOwed;
            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            const propellerEngineSwimUsdFeeAccountBalanceBefore = (
              await splToken.account.token.fetch(
                propellerEngineSwimUsdFeeAccount,
              )
            ).amount;
            const claimFeesTxn = await propellerEnginePropellerProgram.methods
              .claimFees()
              .accounts({
                propeller,
                feeTracker: propellerEngineFeeTracker,
                payer: propellerEngineKeypair.publicKey,
                feeAccount: propellerEngineSwimUsdFeeAccount,
                feeVault: propellerFeeVault,
                tokenProgram: splToken.programId,
              })
              .rpc();
            console.info(`claimFeesTxn: ${claimFeesTxn}`);

            const propellerEngineFeeTrackerAfter =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );

            const propellerEngineFeeTrackerFeesOwedAfter =
              propellerEngineFeeTrackerAfter.feesOwed;
            expect(
              propellerEngineFeeTrackerFeesOwedAfter.eq(new BN(0)),
            ).toBeTruthy();
            const propellerEngineFeeTrackerFeesClaimed =
              propellerEngineFeeTrackerFeesOwedBefore.sub(
                propellerEngineFeeTrackerFeesOwedAfter,
              );

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            console.info(`
            propellerEngineFeeTrackerFeesOwed
              Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
              After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
            propellerFeeVaultBalance
              Before: ${propellerFeeVaultBalanceBefore.toString()}
              After: ${propellerFeeVaultBalanceAfter.toString()}
          `);
            expect(
              propellerFeeVaultBalanceAfter.eq(
                propellerFeeVaultBalanceBefore.sub(
                  propellerEngineFeeTrackerFeesClaimed,
                ),
              ),
            ).toEqual(true);
            const propellerEngineSwimUsdFeeAccountBalanceAfter = (
              await splToken.account.token.fetch(
                propellerEngineSwimUsdFeeAccount,
              )
            ).amount;
            expect(
              propellerEngineSwimUsdFeeAccountBalanceAfter.eq(
                propellerEngineSwimUsdFeeAccountBalanceBefore.add(
                  propellerEngineFeeTrackerFeesClaimed,
                ),
              ),
            ).toEqual(true);
          });

          //TODO: add min_output_amount test cases
        });
      });
    });

    describe("test utility functions", () => {
      const gasKickstart = true;
      describe("for new user, valid target token id and with gas kickstart", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let swimPayloadMessage: web3.PublicKey;
        const owner = web3.Keypair.generate().publicKey;
        console.info(`new user: ${owner.toBase58()}`);
        // let owner: web3.PublicKey;

        const targetTokenId = USDC_TO_TOKEN_NUMBER;
        const memoStr = incMemoIdAndGet();

        const memoBuffer = Buffer.alloc(16);
        memoBuffer.write(memoStr);

        const maxFee = new BN(1000000000);
        const swimPayload = {
          version: swimPayloadVersion,
          owner: owner.toBuffer(),
          propellerEnabled,
          gasKickstart,
          maxFee,
          targetTokenId,
          memo: memoBuffer,
        };
        // const swimPayload = {
        //   version: swimPayloadVersion,
        //   targetTokenId,
        //   owner: owner.toBuffer(),
        //   memo: memoBuffer,
        //   propellerEnabled,
        //   gasKickstart,
        // };
        const amount = parseUnits("100000", mintDecimal);
        console.info(`amount: ${amount.toString()}`);
        /**
         * this is encoding a token transfer from eth routing contract
         * with a swimUSD token address that originated on solana
         * the same as initializing a `TransferWrappedWithPayload` from eth
         */

        const nonce = createNonce().readUInt32LE(0);
        let tokenTransferWithPayloadSignedVaa: Buffer;

        let txns: readonly web3.Transaction[] = [];
        let txnIdx = 0;
        let propellerRedeemerEscrowAccountBefore: BN;
        const userTransferAuthority = web3.Keypair.generate();

        beforeAll(async () => {
          tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
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
          propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          console.info(`postingVaa for test utility function`);
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
          const propellerEngineFeeTrackerData =
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            );
          console.info(`
            beforeAll:
              propellerEngineFeeTracker: ${propellerEngineFeeTracker.toBase58()}
              propellerEngineFeeTrackerData: ${JSON.stringify(
                propellerEngineFeeTrackerData,
              )}
          `);
          txns = await generatePropellerEngineTxns(
            propellerEnginePropellerProgram,
            tokenTransferWithPayloadSignedVaa,
            propeller,
            swimUsdMint,
            wormholeAddresses,
            propellerEngineKeypair,
            twoPoolProgram,
            splToken,
            aggregator,
            userTransferAuthority,
          );
          console.info(`txns: ${JSON.stringify(txns)}`);
        });

        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          const propellerFeeVaultBalanceBefore = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;

          const propellerEngineFeeTrackerFeesOwedBefore = (
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            )
          ).feesOwed;

          [wormholeMessage] = await deriveMessagePda(
            tokenTransferWithPayloadSignedVaa,
            WORMHOLE_CORE_BRIDGE,
          );

          // const [ethEndpointAccount] = await deriveEndpointPda(
          //   CHAIN_ID_ETH,
          //   ethTokenBridge,
          //   // parsedVaa.emitterChain,
          //   // parsedVaa.emitterAddress,
          //   WORMHOLE_TOKEN_BRIDGE,
          // );
          console.info(`endpointAccount: ${ethEndpointAccount.toBase58()}`);
          wormholeClaim = await getClaimAddressSolana(
            WORMHOLE_TOKEN_BRIDGE.toBase58(),
            tokenTransferWithPayloadSignedVaa,
          );

          // const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
          //   await web3.PublicKey.findProgramAddress(
          //     [
          //       Buffer.from("propeller"),
          //       wormholeClaim.toBuffer(),
          //       wormholeMessage.toBuffer(),
          //     ],
          //     propellerProgram.programId,
          //   );

          const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
            await getSwimPayloadMessagePda(
              wormholeClaim,
              propellerProgram.programId,
            );
          /*
                          [Ricky]:
                  wormholeMessage: 8jE3PGhGY8XVrqSV7fUVrkh5FdDTPqQGrzUdzdAgQJ5D
                  wormholeClaim: Gs5rVWe85yXGXncphCsGgnLXYuzFEQgyzSUcuYpXR9UL
                  expectedSwimPayloadMessage: DsBgVKx71iC7JYgT6RhhPahkwBHanqaz6zpDbPejTE9y

           */
          console.info(`
            [Ricky]:
              wormholeMessage: ${wormholeMessage.toBase58()}
              wormholeClaim: ${wormholeClaim.toBase58()}
              expectedSwimPayloadMessage: ${expectedSwimPayloadMessage.toBase58()}
          `);
          // expect(expectedSwimPayloadMessage.toBase58()).toEqual(
          //   completeNativeWithPayloadPubkeys.swimPayloadMessage.toBase58(),
          // );
          console.info(`
            marginalPricePoolToken0Account: ${marginalPricePoolToken0Account.toBase58()}
            marginalPricePoolToken1Account: ${marginalPricePoolToken1Account.toBase58()}
          `);

          const providerBalanceBefore = await provider.connection.getBalance(
            provider.wallet.publicKey,
          );
          const propellerEngineWalletPubkey =
            propellerEngineAnchorProvider.wallet.publicKey;
          const propellerEngineProviderBalanceBefore =
            await provider.connection.getBalance(propellerEngineWalletPubkey);

          const completeNativeWithPayloadTxn = txns[txnIdx++];
          const completeNativeWithPayloadTxnSig =
            await propellerEngineAnchorProvider.sendAndConfirm(
              completeNativeWithPayloadTxn,
            );

          const providerBalanceAfter = await provider.connection.getBalance(
            provider.wallet.publicKey,
          );
          const providerBalanceDiff =
            providerBalanceBefore - providerBalanceAfter;
          const propellerEngineProviderBalanceAfter =
            await provider.connection.getBalance(
              propellerEngineAnchorProvider.wallet.publicKey,
            );
          const propellerEngineProviderBalanceDiff =
            propellerEngineProviderBalanceBefore -
            propellerEngineProviderBalanceAfter;
          console.info(`
              provider: ${provider.wallet.publicKey.toBase58()}
                balanceDiff: ${providerBalanceDiff}
            `);
          console.info(`
              propellerEngineWalletPubkey: ${propellerEngineWalletPubkey.toBase58()}
                balanceDiff: ${propellerEngineProviderBalanceDiff}
            `);

          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              expectedSwimPayloadMessage,
            );
          console.info(
            `swimPayloadMessage:
                    Address: ${expectedSwimPayloadMessage.toBase58()}
                    Account: ${JSON.stringify(
                      swimPayloadMessageAccount,
                      null,
                      2,
                    )}`,
          );
          expect(swimPayloadMessageAccount.bump).toEqual(
            expectedSwimPayloadMessageBump,
          );
          // expect(swimPayloadMessageAccount.whMessage).toEqual(wormholeMessage);
          expect(swimPayloadMessageAccount.claim).toEqual(wormholeClaim);
          expect(
            Buffer.from(swimPayloadMessageAccount.vaaEmitterAddress),
          ).toEqual(ethTokenBridge);
          expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
            CHAIN_ID_ETH,
          );
          console.info(`
            swimPayloadMessageAccount.vaaSequence: ${swimPayloadMessageAccount.vaaSequence.toString()}
            ethTokenBridgeSeq: ${new BN(ethTokenBridgeSequence).toString()}
          `);
          expect(
            swimPayloadMessageAccount.vaaSequence.eq(
              new BN(ethTokenBridgeSequence),
            ),
          ).toBeTruthy();

          // const {
          //   swimPayloadVersion,
          //   targetTokenId,
          //   owner,
          //   memo,
          //   propellerEnabled,
          //   gasKickstart
          // } = swimPayloadMessageAccount.swimPayload;
          expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          expect(swimPayloadMessageAccount.targetTokenId).toEqual(
            targetTokenId,
          );
          const swimPayloadMessageOwnerPubkey = new PublicKey(
            swimPayloadMessageAccount.owner,
          );
          expect(swimPayloadMessageOwnerPubkey).toEqual(owner);

          expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
            propellerEnabled,
          );
          expect(swimPayloadMessageAccount.gasKickstart).toEqual(gasKickstart);

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

          const propellerEngineFeeTrackerAfter =
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            );
          console.info(
            `propellerEngineFeeTrackerAfter: ${JSON.stringify(
              propellerEngineFeeTrackerAfter,
              null,
              2,
            )}`,
          );
          const propellerEngineFeeTrackerFeesOwedAfter =
            propellerEngineFeeTrackerAfter.feesOwed;
          const propellerEngineFeeTrackerFeesOwedDiff =
            propellerEngineFeeTrackerFeesOwedAfter.sub(
              propellerEngineFeeTrackerFeesOwedBefore,
            );
          console.info(`
              gasKickstart new user
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
                diff: ${propellerEngineFeeTrackerFeesOwedDiff.toString()}
          `);
          expect(
            propellerEngineFeeTrackerFeesOwedAfter.gt(
              propellerEngineFeeTrackerFeesOwedBefore,
            ),
          ).toEqual(true);

          const propellerFeeVaultBalanceAfter = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;
          expect(
            propellerFeeVaultBalanceAfter.eq(
              propellerFeeVaultBalanceBefore.add(
                propellerEngineFeeTrackerFeesOwedDiff,
              ),
            ),
          ).toEqual(true);

          const wormholeMessageLength = (
            await connection.getAccountInfo(wormholeMessage)
          ).data.length;
          const wormholeClaimLength = (
            await connection.getAccountInfo(wormholeClaim)
          ).data.length;
          const wormholeMessageRentExemption =
            await connection.getMinimumBalanceForRentExemption(
              wormholeMessageLength,
            );
          const wormholeClaimRentExemption =
            await connection.getMinimumBalanceForRentExemption(
              wormholeClaimLength,
            );

          const totalRentExemptionInLamports =
            wormholeMessageRentExemption + wormholeClaimRentExemption;

          const expectedFeesInLamports = completeWithPayloadFee
            .add(secpVerifyInitFee)
            .add(secpVerifyFee)
            .add(postVaaFee)
            .add(new BN(totalRentExemptionInLamports));

          const feeSwimUsdBn = await convertLamportsToSwimUsdAtomic(
            expectedFeesInLamports,
          );
          expect(
            propellerEngineFeeTrackerFeesOwedDiff.eq(feeSwimUsdBn),
          ).toBeTruthy();

          const expectedSwimPayloadMessageTransferAmount = new BN(
            amount.toString(),
          ).sub(propellerEngineFeeTrackerFeesOwedDiff);
          expect(
            swimPayloadMessageAccount.transferAmount.eq(
              expectedSwimPayloadMessageTransferAmount,
            ),
          ).toBeTruthy();
          await checkTxnLogsForMemo(completeNativeWithPayloadTxnSig, memoStr);
          swimPayloadMessage = expectedSwimPayloadMessage;
          console.info(
            `[Ricky] swimPayloadMessage: ${swimPayloadMessage.toString()}`,
          );
        });
        it("creates owner token accounts", async () => {
          // const [userTokenAccount0, userTokenAccount1, userLpTokenAccount] =
          //   await Promise.all([
          //     getAssociatedTokenAddress(usdcKeypair.publicKey, owner),
          //     getAssociatedTokenAddress(usdtKeypair.publicKey, owner),
          //     getAssociatedTokenAddress(swimUsdKeypair.publicKey, owner),
          //   ]);
          const userPoolAtas = await getOwnerTokenAccountsForPool(
            flagshipPool,
            owner,
            twoPoolProgram,
          );
          const [userTokenAccount0, userTokenAccount1, userLpTokenAccount] =
            userPoolAtas;
          const propellerFeeVaultBalanceBefore = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;

          const propellerEngineFeeTrackerFeesOwedBefore = (
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            )
          ).feesOwed;

          const createOwnerAtaTxn = txns[txnIdx++];

          await propellerEngineAnchorProvider.sendAndConfirm(createOwnerAtaTxn);

          const propellerFeeVaultBalanceAfter = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;

          const propellerEngineFeeTrackerFeesOwedAfter = (
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            )
          ).feesOwed;
          expect(
            propellerFeeVaultBalanceAfter.gt(propellerFeeVaultBalanceBefore),
          ).toBeTruthy();
          expect(
            propellerEngineFeeTrackerFeesOwedAfter.gt(
              propellerEngineFeeTrackerFeesOwedBefore,
            ),
          ).toBeTruthy();
          const userTokenAccount0Data = await splToken.account.token.fetch(
            userTokenAccount0,
          );
          const userTokenAccount1Data = await splToken.account.token.fetch(
            userTokenAccount1,
          );
          const userLpTokenAccountData = await splToken.account.token.fetch(
            userLpTokenAccount,
          );
          expect(userTokenAccount0Data.amount.toNumber()).toEqual(0);
          expect(userTokenAccount0Data.authority.toBase58()).toEqual(
            owner.toBase58(),
          );
          expect(userTokenAccount1Data.amount.toNumber()).toEqual(0);
          expect(userTokenAccount1Data.authority.toBase58()).toEqual(
            owner.toBase58(),
          );
          expect(userLpTokenAccountData.amount.toNumber()).toEqual(0);
          expect(userLpTokenAccountData.authority.toBase58()).toEqual(
            owner.toBase58(),
          );
        });
        it("processes swim payload", async () => {
          console.info(
            `[Ricky] swimPayloadMessage: ${swimPayloadMessage.toString()}`,
          );
          const userBalanceBefore = await connection.getBalance(owner);
          const userPoolAtas = await getOwnerTokenAccountsForPool(
            flagshipPool,
            owner,
            twoPoolProgram,
          );
          const [userTokenAccount0, userTokenAccount1] = userPoolAtas;

          const propellerFeeVaultBalanceBefore = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;

          const propellerEngineFeeTrackerFeesOwedBefore = (
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            )
          ).feesOwed;

          [wormholeMessage] = await deriveMessagePda(
            tokenTransferWithPayloadSignedVaa,
            wormhole,
          );
          wormholeClaim = await getClaimAddressSolana(
            WORMHOLE_TOKEN_BRIDGE.toBase58(),
            tokenTransferWithPayloadSignedVaa,
          );
          // [swimPayloadMessage] = await web3.PublicKey.findProgramAddress(
          //   [
          //     Buffer.from("propeller"),
          //     wormholeClaim.toBuffer(),
          //     wormholeMessage.toBuffer(),
          //   ],
          //   propellerProgram.programId,
          // );

          const propellerRedeemerEscrowBalanceBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const userTokenAccount0BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount0)
          ).amount;
          const userTokenAccount1BalanceBefore = (
            await splToken.account.token.fetch(userTokenAccount1)
          ).amount;
          // need to fetch account BEFORE sending processSwimPayload since it'll be closed afterwards
          const swimPayloadMessageData =
            await propellerProgram.account.swimPayloadMessage.fetch(
              swimPayloadMessage,
            );

          const processSwimPayloadTxn = txns[txnIdx++];
          const processSwimPayloadTxnSig =
            await propellerEngineAnchorProvider.sendAndConfirm(
              processSwimPayloadTxn,
              [userTransferAuthority],
            );
          // const processSwimPayloadPubkeys =
          //   await propellerEnginePropellerProgram.methods
          //                                        .processSwimPayload(
          //                                          swimPayloadMessageAccountTargetTokenId,
          //                                          new BN(0),
          //                                        )
          //                                        .accounts({
          //                                          propeller,
          //                                          payer: propellerEngineKeypair.publicKey,
          //                                          message: wormholeMessage,
          //                                          claim: wormholeClaim,
          //                                          swimPayloadMessage,
          //                                          redeemer: propellerRedeemer,
          //                                          redeemerEscrow: propellerRedeemerEscrowAccount,
          //                                          // tokenIdMap: ?
          //                                          pool,
          //                                          poolTokenAccount0,
          //                                          poolTokenAccount1,
          //                                          lpMint,
          //                                          governanceFee: governanceFeeAcct,
          //                                          userTransferAuthority: userTransferAuthority.publicKey,
          //                                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          //                                          userTokenAccount0,
          //                                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          //                                          userTokenAccount1,
          //                                          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          //                                          userLpTokenAccount,
          //                                          tokenProgram: splToken.programId,
          //                                          memo: MEMO_PROGRAM_ID,
          //                                          twoPoolProgram: twoPoolProgram.programId,
          //                                          systemProgram: web3.SystemProgram.programId,
          //                                        })
          //                                        .pubkeys();
          //
          // const propellerProcessSwimPayloadIxs =
          //   propellerEnginePropellerProgram.methods
          //                                  .propellerProcessSwimPayload(
          //                                    swimPayloadMessageAccountTargetTokenId,
          //                                  )
          //                                  .accounts({
          //                                    processSwimPayload: processSwimPayloadPubkeys,
          //                                    feeVault: propellerFeeVault,
          //                                    feeTracker: propellerEngineFeeTracker,
          //                                    aggregator,
          //                                    marginalPricePool: marginalPricePool,
          //                                    marginalPricePoolToken0Account:
          //                                    marginalPricePoolToken0Account,
          //                                    marginalPricePoolToken1Account:
          //                                    marginalPricePoolToken1Account,
          //                                    marginalPricePoolLpMint: marginalPricePoolLpMint,
          //                                    owner,
          //                                  })
          //                                  .preInstructions([requestUnitsIx])
          //                                  .signers([userTransferAuthority, propellerEngineKeypair]);
          //
          // const propellerProcessSwimPayloadPubkeys =
          //   await propellerProcessSwimPayloadIxs.pubkeys();
          // console.info(
          //   `${JSON.stringify(propellerProcessSwimPayloadPubkeys, null, 2)}`,
          // );
          // if (!processSwimPayloadPubkeys.tokenIdMap) {
          //   throw new Error("tokenIdMap not derived");
          // }
          // const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
          //   await web3.PublicKey.findProgramAddress(
          //     [
          //       Buffer.from("propeller"),
          //       Buffer.from("token_id"),
          //       propeller.toBuffer(),
          //       new BN(swimPayloadMessageAccountTargetTokenId).toArrayLike(
          //         Buffer,
          //         "le",
          //         2,
          //       ),
          //     ],
          //     propellerProgram.programId,
          //   );
          //
          // const expectedTokenIdMap =
          //   outputTokenIdMappingAddrs.get(targetTokenId);
          // if (!expectedTokenIdMap) {
          //   throw new Error("expectedTokenIdMap not found");
          // }
          // const expectedTokenIdMapAcct =
          //   await propellerProgram.account.tokenIdMap.fetch(
          //     expectedTokenIdMap,
          //   );
          // console.info(`
          //   calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
          //   calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
          //   expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
          //   ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          // `);
          // const derivedTokenIdMap = processSwimPayloadPubkeys.tokenIdMap;
          // expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
          // if (!processSwimPayloadPubkeys.swimClaim) {
          //   throw new Error("swimClaim key not derived");
          // }
          // const [expectedSwimClaim, expectedSwimClaimBump] =
          //   await web3.PublicKey.findProgramAddress(
          //     [
          //       Buffer.from("propeller"),
          //       Buffer.from("claim"),
          //       wormholeClaim.toBuffer(),
          //     ],
          //     propellerProgram.programId,
          //   );
          // expect(processSwimPayloadPubkeys.swimClaim).toEqual(
          //   expectedSwimClaim,
          // );
          //
          // const processSwimPayloadTxnSig: string =
          //   await propellerProcessSwimPayloadIxs.rpc();
          console.info(`processSwimPayloadTxnSig: ${processSwimPayloadTxnSig}`);

          const userBalanceAfter = await connection.getBalance(owner);
          console.info(`
              userBalance:
                before: ${userBalanceBefore}
                after: ${userBalanceAfter}
            `);
          expect(userBalanceAfter - userBalanceBefore).toEqual(
            gasKickstartAmount.toNumber(),
          );
          const propellerEngineFeeTrackerAfter =
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            );
          console.info(
            `propellerEngineFeeTrackerAfter: ${JSON.stringify(
              propellerEngineFeeTrackerAfter,
              null,
              2,
            )}`,
          );
          const propellerEngineFeeTrackerFeesOwedAfter =
            propellerEngineFeeTrackerAfter.feesOwed;
          console.info(`
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
          `);
          const feeTrackerFeesOwedDiff =
            propellerEngineFeeTrackerFeesOwedAfter.sub(
              propellerEngineFeeTrackerFeesOwedBefore,
            );

          expect(
            propellerEngineFeeTrackerFeesOwedAfter.gt(
              propellerEngineFeeTrackerFeesOwedBefore,
            ),
          ).toEqual(true);

          const propellerFeeVaultBalanceAfter = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;
          expect(
            propellerFeeVaultBalanceAfter.eq(
              propellerFeeVaultBalanceBefore.add(feeTrackerFeesOwedDiff),
            ),
          ).toEqual(true);

          const [swimClaim, swimClaimBump] = await getSwimClaimPda(
            wormholeClaim,
            propellerProgram.programId,
          );

          const swimClaimAccountData =
            await propellerProgram.account.swimClaim.fetch(swimClaim);
          expect(swimClaimAccountData.bump).toEqual(swimClaimBump);
          expect(swimClaimAccountData.claimed).toBeTruthy();

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
                swimPayloadMessageData.transferAmount,
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
      });
      describe("for new user, invalid target token id with gas kickstart", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let swimPayloadMessage: web3.PublicKey;
        const owner = web3.Keypair.generate().publicKey;
        console.info(`new user: ${owner.toBase58()}`);
        // let owner: web3.PublicKey;

        const targetTokenId = 99;
        const memoStr = incMemoIdAndGet();
        const memoBuffer = Buffer.alloc(16);
        memoBuffer.write(memoStr);

        let ownerSwimUsdAta: web3.PublicKey;
        let invalidTokenIdMapAddr: web3.PublicKey;

        const maxFee = new BN(1000000000);
        const swimPayload = {
          version: swimPayloadVersion,
          owner: owner.toBuffer(),
          propellerEnabled,
          gasKickstart,
          maxFee,
          targetTokenId,
          memo: memoBuffer,
        };
        // const swimPayload = {
        //   version: swimPayloadVersion,
        //   targetTokenId,
        //   owner: owner.toBuffer(),
        //   memo: memoBuffer,
        //   propellerEnabled,
        //   gasKickstart,
        // };
        const amount = parseUnits("100000", mintDecimal);
        console.info(`amount: ${amount.toString()}`);
        /**
         * this is encoding a token transfer from eth routing contract
         * with a swimUSD token address that originated on solana
         * the same as initializing a `TransferWrappedWithPayload` from eth
         */

        const nonce = createNonce().readUInt32LE(0);
        let tokenTransferWithPayloadSignedVaa: Buffer;

        let txns: readonly web3.Transaction[] = [];
        let txnIdx = 0;
        let propellerRedeemerEscrowAccountBefore: BN;
        const userTransferAuthority = web3.Keypair.generate();

        beforeAll(async () => {
          tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
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
          propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          console.info(`postingVaa for test utility function`);
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
          const propellerEngineFeeTrackerData =
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            );
          console.info(`
            beforeAll:
              propellerEngineFeeTracker: ${propellerEngineFeeTracker.toBase58()}
              propellerEngineFeeTrackerData: ${JSON.stringify(
                propellerEngineFeeTrackerData,
              )}
          `);
          txns = await generatePropellerEngineTxns(
            propellerEnginePropellerProgram,
            tokenTransferWithPayloadSignedVaa,
            propeller,
            swimUsdMint,
            wormholeAddresses,
            propellerEngineKeypair,
            twoPoolProgram,
            splToken,
            aggregator,
            userTransferAuthority,
          );
          console.info(`txns: ${JSON.stringify(txns)}`);
        });

        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          const propellerFeeVaultBalanceBefore = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;

          const propellerEngineFeeTrackerFeesOwedBefore = (
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            )
          ).feesOwed;

          [wormholeMessage] = await deriveMessagePda(
            tokenTransferWithPayloadSignedVaa,
            WORMHOLE_CORE_BRIDGE,
          );

          // const [ethEndpointAccount] = await deriveEndpointPda(
          //   CHAIN_ID_ETH,
          //   ethTokenBridge,
          //   // parsedVaa.emitterChain,
          //   // parsedVaa.emitterAddress,
          //   WORMHOLE_TOKEN_BRIDGE,
          // );
          console.info(`endpointAccount: ${ethEndpointAccount.toBase58()}`);
          wormholeClaim = await getClaimAddressSolana(
            WORMHOLE_TOKEN_BRIDGE.toBase58(),
            tokenTransferWithPayloadSignedVaa,
          );

          const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
            await getSwimPayloadMessagePda(
              wormholeClaim,
              propellerProgram.programId,
            );
          // const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
          //   await web3.PublicKey.findProgramAddress(
          //     [
          //       Buffer.from("propeller"),
          //       wormholeClaim.toBuffer(),
          //       wormholeMessage.toBuffer(),
          //     ],
          //     propellerProgram.programId,
          //   );
          // expect(expectedSwimPayloadMessage.toBase58()).toEqual(
          //   completeNativeWithPayloadPubkeys.swimPayloadMessage.toBase58(),
          // );
          console.info(`
            marginalPricePoolToken0Account: ${marginalPricePoolToken0Account.toBase58()}
            marginalPricePoolToken1Account: ${marginalPricePoolToken1Account.toBase58()}
          `);

          const providerBalanceBefore = await provider.connection.getBalance(
            provider.wallet.publicKey,
          );
          const propellerEngineWalletPubkey =
            propellerEngineAnchorProvider.wallet.publicKey;
          const propellerEngineProviderBalanceBefore =
            await provider.connection.getBalance(propellerEngineWalletPubkey);

          const completeNativeWithPayloadTxn = txns[txnIdx++];
          const completeNativeWithPayloadTxnSig =
            await propellerEngineAnchorProvider.sendAndConfirm(
              completeNativeWithPayloadTxn,
            );

          const providerBalanceAfter = await provider.connection.getBalance(
            provider.wallet.publicKey,
          );
          const providerBalanceDiff =
            providerBalanceBefore - providerBalanceAfter;
          const propellerEngineProviderBalanceAfter =
            await provider.connection.getBalance(
              propellerEngineAnchorProvider.wallet.publicKey,
            );
          const propellerEngineProviderBalanceDiff =
            propellerEngineProviderBalanceBefore -
            propellerEngineProviderBalanceAfter;
          console.info(`
              provider: ${provider.wallet.publicKey.toBase58()}
                balanceDiff: ${providerBalanceDiff}
            `);
          console.info(`
              propellerEngineWalletPubkey: ${propellerEngineWalletPubkey.toBase58()}
                balanceDiff: ${propellerEngineProviderBalanceDiff}
            `);

          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              expectedSwimPayloadMessage,
            );
          console.info(
            `swimPayloadMessageAccount: ${JSON.stringify(
              swimPayloadMessageAccount,
              null,
              2,
            )}`,
          );
          expect(swimPayloadMessageAccount.bump).toEqual(
            expectedSwimPayloadMessageBump,
          );
          // expect(swimPayloadMessageAccount.whMessage).toEqual(wormholeMessage);
          expect(swimPayloadMessageAccount.claim).toEqual(wormholeClaim);
          expect(
            Buffer.from(swimPayloadMessageAccount.vaaEmitterAddress),
          ).toEqual(ethTokenBridge);
          expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
            CHAIN_ID_ETH,
          );
          console.info(`
            swimPayloadMessageAccount.vaaSequence: ${swimPayloadMessageAccount.vaaSequence.toString()}
            ethTokenBridgeSeq: ${new BN(ethTokenBridgeSequence).toString()}
          `);
          expect(
            swimPayloadMessageAccount.vaaSequence.eq(
              new BN(ethTokenBridgeSequence),
            ),
          ).toBeTruthy();

          // const {
          //   swimPayloadVersion,
          //   targetTokenId,
          //   owner,
          //   memo,
          //   propellerEnabled,
          //   gasKickstart
          // } = swimPayloadMessageAccount.swimPayload;
          expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          expect(swimPayloadMessageAccount.targetTokenId).toEqual(
            targetTokenId,
          );
          const swimPayloadMessageOwnerPubkey = new PublicKey(
            swimPayloadMessageAccount.owner,
          );
          expect(swimPayloadMessageOwnerPubkey).toEqual(owner);

          expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
            propellerEnabled,
          );
          expect(swimPayloadMessageAccount.gasKickstart).toEqual(gasKickstart);

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

          const propellerEngineFeeTrackerAfter =
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            );
          console.info(
            `propellerEngineFeeTrackerAfter: ${JSON.stringify(
              propellerEngineFeeTrackerAfter,
              null,
              2,
            )}`,
          );
          const propellerEngineFeeTrackerFeesOwedAfter =
            propellerEngineFeeTrackerAfter.feesOwed;
          const propellerEngineFeeTrackerFeesOwedDiff =
            propellerEngineFeeTrackerFeesOwedAfter.sub(
              propellerEngineFeeTrackerFeesOwedBefore,
            );
          console.info(`
              gasKickstart new user
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
                diff: ${propellerEngineFeeTrackerFeesOwedDiff.toString()}
          `);
          expect(
            propellerEngineFeeTrackerFeesOwedAfter.gt(
              propellerEngineFeeTrackerFeesOwedBefore,
            ),
          ).toEqual(true);

          const propellerFeeVaultBalanceAfter = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;
          expect(
            propellerFeeVaultBalanceAfter.eq(
              propellerFeeVaultBalanceBefore.add(
                propellerEngineFeeTrackerFeesOwedDiff,
              ),
            ),
          ).toEqual(true);

          const wormholeMessageLength = (
            await connection.getAccountInfo(wormholeMessage)
          ).data.length;
          const wormholeClaimLength = (
            await connection.getAccountInfo(wormholeClaim)
          ).data.length;
          const wormholeMessageRentExemption =
            await connection.getMinimumBalanceForRentExemption(
              wormholeMessageLength,
            );
          const wormholeClaimRentExemption =
            await connection.getMinimumBalanceForRentExemption(
              wormholeClaimLength,
            );

          const totalRentExemptionInLamports =
            wormholeMessageRentExemption + wormholeClaimRentExemption;

          const expectedFeesInLamports = completeWithPayloadFee
            .add(secpVerifyInitFee)
            .add(secpVerifyFee)
            .add(postVaaFee)
            .add(new BN(totalRentExemptionInLamports));

          const feeSwimUsdBn = await convertLamportsToSwimUsdAtomic(
            expectedFeesInLamports,
          );
          expect(
            propellerEngineFeeTrackerFeesOwedDiff.eq(feeSwimUsdBn),
          ).toBeTruthy();

          const expectedSwimPayloadMessageTransferAmount = new BN(
            amount.toString(),
          ).sub(propellerEngineFeeTrackerFeesOwedDiff);
          expect(
            swimPayloadMessageAccount.transferAmount.eq(
              expectedSwimPayloadMessageTransferAmount,
            ),
          ).toBeTruthy();
          await checkTxnLogsForMemo(completeNativeWithPayloadTxnSig, memoStr);
          swimPayloadMessage = expectedSwimPayloadMessage;
        });

        it("creates owner token bridge ata", async () => {
          ownerSwimUsdAta = await getAssociatedTokenAddress(swimUsdMint, owner);
          const ownerSwimUsdAtaData =
            await splToken.account.token.fetchNullable(ownerSwimUsdAta);
          if (ownerSwimUsdAtaData) {
            throw new Error("ownerSwimUsdAta should not exist yet");
          }
          // ensure no other ata exists before and after the txn.
          const ownerUsdcAta = await getAssociatedTokenAddress(
            usdcKeypair.publicKey,
            owner,
          );

          let ownerUsdcAtaData = await splToken.account.token.fetchNullable(
            ownerUsdcAta,
          );
          if (ownerUsdcAtaData) {
            throw new Error("ownerUsdcAtaData should not exist");
          }

          const propellerFeeVaultBalanceBefore = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;

          const propellerEngineFeeTrackerFeesOwedBefore = (
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            )
          ).feesOwed;

          [invalidTokenIdMapAddr] = await getTargetTokenIdMapAddr(
            propeller,
            targetTokenId,
            propellerEnginePropellerProgram.programId,
          );
          console.info(
            `invalidTokenIdMapAddr: ${invalidTokenIdMapAddr.toString()}`,
          );

          const createOwnerTokenBridgeAtaTxn = txns[txnIdx++];
          await propellerEngineAnchorProvider.sendAndConfirm(
            createOwnerTokenBridgeAtaTxn,
          );

          ownerUsdcAtaData = await splToken.account.token.fetchNullable(
            ownerUsdcAta,
          );
          if (ownerUsdcAtaData) {
            throw new Error(
              "ownerUsdcAtaData should not exist after createOwnerTokenBridgeAtaTxn",
            );
          }

          const propellerFeeVaultBalanceAfter = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;

          const propellerEngineFeeTrackerFeesOwedAfter = (
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            )
          ).feesOwed;
          expect(
            propellerFeeVaultBalanceAfter.gt(propellerFeeVaultBalanceBefore),
          ).toBeTruthy();
          expect(
            propellerEngineFeeTrackerFeesOwedAfter.gt(
              propellerEngineFeeTrackerFeesOwedBefore,
            ),
          ).toBeTruthy();
          const userTokenBridgeMintAtaData = await splToken.account.token.fetch(
            ownerSwimUsdAta,
          );
          expect(userTokenBridgeMintAtaData.amount.toNumber()).toEqual(0);
          expect(userTokenBridgeMintAtaData.authority.toBase58()).toEqual(
            owner.toBase58(),
          );
        });
        it("processes swim payload fallback", async () => {
          const userBalanceBefore = await connection.getBalance(owner);
          const ownerSwimUsdAtaBalanceBefore = (
            await splToken.account.token.fetch(ownerSwimUsdAta)
          ).amount;
          expect(ownerSwimUsdAtaBalanceBefore.toNumber()).toEqual(0);

          const propellerFeeVaultBalanceBefore = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;

          const propellerEngineFeeTrackerFeesOwedBefore = (
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            )
          ).feesOwed;

          [wormholeMessage] = await deriveMessagePda(
            tokenTransferWithPayloadSignedVaa,
            wormhole,
          );
          wormholeClaim = await getClaimAddressSolana(
            WORMHOLE_TOKEN_BRIDGE.toBase58(),
            tokenTransferWithPayloadSignedVaa,
          );

          [swimPayloadMessage] = await getSwimPayloadMessagePda(
            wormholeClaim,
            propellerProgram.programId,
          );

          const propellerRedeemerEscrowBalanceBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;

          const swimPayloadMessageData =
            await propellerProgram.account.swimPayloadMessage.fetch(
              swimPayloadMessage,
            );

          const processSwimPayloadTxn = txns[txnIdx++];
          const processSwimPayloadTxnSig =
            await propellerEngineAnchorProvider.sendAndConfirm(
              processSwimPayloadTxn,
              [userTransferAuthority],
            );
          console.info(`processSwimPayloadTxnSig: ${processSwimPayloadTxnSig}`);

          const userBalanceAfter = await connection.getBalance(owner);
          console.info(`
              userBalance:
                before: ${userBalanceBefore}
                after: ${userBalanceAfter}
            `);
          expect(userBalanceAfter - userBalanceBefore).toEqual(
            gasKickstartAmount.toNumber(),
          );
          const propellerEngineFeeTrackerAfter =
            await propellerProgram.account.feeTracker.fetch(
              propellerEngineFeeTracker,
            );
          console.info(
            `propellerEngineFeeTrackerAfter: ${JSON.stringify(
              propellerEngineFeeTrackerAfter,
              null,
              2,
            )}`,
          );
          const propellerEngineFeeTrackerFeesOwedAfter =
            propellerEngineFeeTrackerAfter.feesOwed;
          console.info(`
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
          `);
          const feeTrackerFeesOwedDiff =
            propellerEngineFeeTrackerFeesOwedAfter.sub(
              propellerEngineFeeTrackerFeesOwedBefore,
            );

          expect(
            propellerEngineFeeTrackerFeesOwedAfter.gt(
              propellerEngineFeeTrackerFeesOwedBefore,
            ),
          ).toEqual(true);

          const propellerFeeVaultBalanceAfter = (
            await splToken.account.token.fetch(propellerFeeVault)
          ).amount;
          expect(
            propellerFeeVaultBalanceAfter.eq(
              propellerFeeVaultBalanceBefore.add(feeTrackerFeesOwedDiff),
            ),
          ).toEqual(true);

          const [swimClaim, swimClaimBump] = await getSwimClaimPda(
            wormholeClaim,
            propellerProgram.programId,
          );

          const swimClaimAccountData =
            await propellerProgram.account.swimClaim.fetch(swimClaim);
          expect(swimClaimAccountData.bump).toEqual(swimClaimBump);
          expect(swimClaimAccountData.claimed).toBeTruthy();

          const propellerRedeemerEscrowBalanceAfter = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;
          const ownerSwimUsdAtaBalanceAfter = (
            await splToken.account.token.fetch(ownerSwimUsdAta)
          ).amount;

          console.info(`
            propellerRedeemerEscrowBalance
              Before: ${propellerRedeemerEscrowBalanceBefore.toString()}
              After: ${propellerRedeemerEscrowBalanceAfter.toString()}
            ownerSwimUsdAta
              Before: ${ownerSwimUsdAtaBalanceBefore.toString()}
              After: ${ownerSwimUsdAtaBalanceAfter.toString()}
          `);

          expect(
            propellerRedeemerEscrowBalanceAfter.eq(
              propellerRedeemerEscrowBalanceBefore.sub(
                swimPayloadMessageData.transferAmount,
              ),
            ),
          ).toBeTruthy();

          expect(
            ownerSwimUsdAtaBalanceAfter.gt(ownerSwimUsdAtaBalanceBefore),
          ).toBeTruthy();
          // expect(
          //   userTokenAccount0BalanceAfter.gt(userTokenAccount0BalanceBefore),
          // ).toBeTruthy();
          // expect(
          //   userTokenAccount1BalanceAfter.eq(userTokenAccount1BalanceBefore),
          // ).toBeTruthy();

          await checkTxnLogsForMemo(processSwimPayloadTxnSig, memoStr);
        });
      });
    });

    describe("as 3rd party integrator (call evmRouting.propellerInitiate w/o memo)", () => {
      const gasKickstart = true;
      describe("for new user with no token accounts", () => {
        describe("for token from flagship pool as output token", () => {
          let wormholeClaim: web3.PublicKey;
          let wormholeMessage: web3.PublicKey;
          let swimPayloadMessage: web3.PublicKey;
          const owner = web3.Keypair.generate().publicKey;
          console.info(`new user: ${owner.toBase58()}`);
          // let owner: web3.PublicKey;

          const targetTokenId = USDC_TO_TOKEN_NUMBER;
          const memoStr = incMemoIdAndGet();

          it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedBefore = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;

            const memoBuffer = Buffer.alloc(16);
            memoBuffer.write(memoStr);

            const maxFee = new BN(1000000000);
            const swimPayload = {
              version: swimPayloadVersion,
              owner: owner.toBuffer(),
              propellerEnabled,
              gasKickstart,
              maxFee,
              targetTokenId,
              // memo: memoBuffer,
            };
            // const swimPayload = {
            //   version: swimPayloadVersion,
            //   targetTokenId,
            //   owner: owner.toBuffer(),
            //   memo: memoBuffer,
            //   propellerEnabled,
            //   gasKickstart,
            // };
            const amount = parseUnits("100000", mintDecimal);
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

            console.info(
              `propellerRedeemerEscrowAccountBefore: ${propellerRedeemerEscrowAccountBefore.toString()}`,
            );
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

            // const [ethEndpointAccount] = await deriveEndpointPda(
            //   CHAIN_ID_ETH,
            //   ethTokenBridge,
            //   // parsedVaa.emitterChain,
            //   // parsedVaa.emitterAddress,
            //   WORMHOLE_TOKEN_BRIDGE,
            // );
            console.info(`endpointAccount: ${ethEndpointAccount.toBase58()}`);
            wormholeClaim = await getClaimAddressSolana(
              WORMHOLE_TOKEN_BRIDGE.toBase58(),
              tokenTransferWithPayloadSignedVaa,
            );

            const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
              await getSwimPayloadMessagePda(
                wormholeClaim,
                propellerProgram.programId,
              );

            console.info(`
            marginalPricePoolToken0Account: ${marginalPricePoolToken0Account.toBase58()}
            marginalPricePoolToken1Account: ${marginalPricePoolToken1Account.toBase58()}
          `);

            const providerBalanceBefore = await provider.connection.getBalance(
              provider.wallet.publicKey,
            );
            const propellerEngineWalletPubkey =
              propellerEngineAnchorProvider.wallet.publicKey;
            const propellerEngineProviderBalanceBefore =
              await provider.connection.getBalance(propellerEngineWalletPubkey);

            const completeNativeWithPayloadIxs =
              propellerEnginePropellerProgram.methods
                .propellerCompleteNativeWithPayload()
                .accounts({
                  completeNativeWithPayload: {
                    propeller,
                    payer: propellerEngineKeypair.publicKey,
                    tokenBridgeConfig,
                    // userTokenBridgeAccount: userLpTokenAccount.address,
                    message: wormholeMessage,
                    claim: wormholeClaim,
                    swimPayloadMessage: expectedSwimPayloadMessage,
                    endpoint: ethEndpointAccount,
                    to: propellerRedeemerEscrowAccount,
                    redeemer: propellerRedeemer,
                    feeRecipient: propellerFeeVault,
                    // feeRecipient: propellerRedeemerEscrowAccount,
                    // tokenBridgeMint,
                    custody: custody,
                    swimUsdMint: swimUsdMint,
                    custodySigner,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                    systemProgram: web3.SystemProgram.programId,
                    wormhole,
                    tokenProgram: splToken.programId,
                    tokenBridge,
                  },
                  feeTracker: propellerEngineFeeTracker,
                  aggregator,

                  marginalPricePool: marginalPricePool,
                  marginalPricePoolToken0Account:
                    marginalPricePoolToken0Account,
                  marginalPricePoolToken1Account:
                    marginalPricePoolToken1Account,
                  marginalPricePoolLpMint: marginalPricePoolLpMint,
                  twoPoolProgram: twoPoolProgram.programId,
                  memo: MEMO_PROGRAM_ID,
                })
                .preInstructions([setComputeUnitLimitIx])
                .signers([propellerEngineKeypair]);

            const completeNativeWithPayloadPubkeys =
              await completeNativeWithPayloadIxs.pubkeys();

            console.info(
              `completeNativeWithPayloadPubkeys: ${JSON.stringify(
                completeNativeWithPayloadPubkeys,
                null,
                2,
              )}`,
            );

            const completeNativeWithPayloadTxnSig =
              await completeNativeWithPayloadIxs.rpc();
            const providerBalanceAfter = await provider.connection.getBalance(
              provider.wallet.publicKey,
            );
            const providerBalanceDiff =
              providerBalanceBefore - providerBalanceAfter;
            const propellerEngineProviderBalanceAfter =
              await provider.connection.getBalance(
                propellerEngineAnchorProvider.wallet.publicKey,
              );
            const propellerEngineProviderBalanceDiff =
              propellerEngineProviderBalanceBefore -
              propellerEngineProviderBalanceAfter;
            console.info(`
              provider: ${provider.wallet.publicKey.toBase58()}
                balanceDiff: ${providerBalanceDiff}
            `);
            console.info(`
              propellerEngineWalletPubkey: ${propellerEngineWalletPubkey.toBase58()}
                balanceDiff: ${propellerEngineProviderBalanceDiff}
            `);

            const swimPayloadMessageAccount =
              await propellerProgram.account.swimPayloadMessage.fetch(
                expectedSwimPayloadMessage,
              );
            console.info(
              `swimPayloadMessageAccount: ${JSON.stringify(
                swimPayloadMessageAccount,
                null,
                2,
              )}`,
            );
            expect(swimPayloadMessageAccount.bump).toEqual(
              expectedSwimPayloadMessageBump,
            );
            // expect(swimPayloadMessageAccount.whMessage).toEqual(
            //   wormholeMessage,
            // );
            expect(swimPayloadMessageAccount.claim).toEqual(wormholeClaim);
            expect(
              Buffer.from(swimPayloadMessageAccount.vaaEmitterAddress),
            ).toEqual(ethTokenBridge);
            expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
              CHAIN_ID_ETH,
            );
            expect(
              swimPayloadMessageAccount.vaaSequence.eq(
                new BN(ethTokenBridgeSequence),
              ),
            ).toBeTruthy();

            // const {
            //   swimPayloadVersion,
            //   targetTokenId,
            //   owner,
            //   memo,
            //   propellerEnabled,
            //   gasKickstart
            // } = swimPayloadMessageAccount.swimPayload;
            expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
              swimPayloadVersion,
            );
            expect(swimPayloadMessageAccount.targetTokenId).toEqual(
              targetTokenId,
            );
            const swimPayloadMessageOwnerPubkey = new PublicKey(
              swimPayloadMessageAccount.owner,
            );
            expect(swimPayloadMessageOwnerPubkey).toEqual(owner);

            expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
              propellerEnabled,
            );
            expect(swimPayloadMessageAccount.gasKickstart).toEqual(
              gasKickstart,
            );

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

            const propellerEngineFeeTrackerAfter =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );
            console.info(
              `propellerEngineFeeTrackerAfter: ${JSON.stringify(
                propellerEngineFeeTrackerAfter,
                null,
                2,
              )}`,
            );
            const propellerEngineFeeTrackerFeesOwedAfter =
              propellerEngineFeeTrackerAfter.feesOwed;
            const propellerEngineFeeTrackerFeesOwedDiff =
              propellerEngineFeeTrackerFeesOwedAfter.sub(
                propellerEngineFeeTrackerFeesOwedBefore,
              );
            console.info(`
              gasKickstart new user
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
                diff: ${propellerEngineFeeTrackerFeesOwedDiff.toString()}
          `);
            expect(
              propellerEngineFeeTrackerFeesOwedAfter.gt(
                propellerEngineFeeTrackerFeesOwedBefore,
              ),
            ).toEqual(true);

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            expect(
              propellerFeeVaultBalanceAfter.eq(
                propellerFeeVaultBalanceBefore.add(
                  propellerEngineFeeTrackerFeesOwedDiff,
                ),
              ),
            ).toEqual(true);

            const wormholeMessageLength = (
              await connection.getAccountInfo(wormholeMessage)
            ).data.length;
            const wormholeClaimLength = (
              await connection.getAccountInfo(wormholeClaim)
            ).data.length;
            const wormholeMessageRentExemption =
              await connection.getMinimumBalanceForRentExemption(
                wormholeMessageLength,
              );
            const wormholeClaimRentExemption =
              await connection.getMinimumBalanceForRentExemption(
                wormholeClaimLength,
              );

            const totalRentExemptionInLamports =
              wormholeMessageRentExemption + wormholeClaimRentExemption;

            const expectedFeesInLamports = completeWithPayloadFee
              .add(secpVerifyInitFee)
              .add(secpVerifyFee)
              .add(postVaaFee)
              .add(new BN(totalRentExemptionInLamports));

            const feeSwimUsdBn = await convertLamportsToSwimUsdAtomic(
              expectedFeesInLamports,
            );
            expect(
              propellerEngineFeeTrackerFeesOwedDiff.eq(feeSwimUsdBn),
            ).toBeTruthy();

            const expectedSwimPayloadMessageTransferAmount = new BN(
              amount.toString(),
            ).sub(propellerEngineFeeTrackerFeesOwedDiff);
            expect(
              swimPayloadMessageAccount.transferAmount.eq(
                expectedSwimPayloadMessageTransferAmount,
              ),
            ).toBeTruthy();
            await checkTxnLogsForMemo(
              completeNativeWithPayloadTxnSig,
              memoStr,
              false,
            );
            swimPayloadMessage = expectedSwimPayloadMessage;
          });

          it("creates owner token accounts", async () => {
            const pool = flagshipPool;
            const poolToken0Mint = usdcKeypair.publicKey;
            const poolToken1Mint = usdtKeypair.publicKey;
            const lpMint = swimUsdMint;

            const [userTokenAccount0, userTokenAccount1, userLpTokenAccount] =
              await Promise.all([
                getAssociatedTokenAddress(usdcKeypair.publicKey, owner),
                getAssociatedTokenAddress(usdtKeypair.publicKey, owner),
                getAssociatedTokenAddress(swimUsdKeypair.publicKey, owner),
              ]);
            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedBefore = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;

            const createOwnerAtaTxn =
              await propellerEnginePropellerProgram.methods
                .propellerCreateOwnerTokenAccounts()
                .accounts({
                  propeller,
                  payer: propellerEngineKeypair.publicKey,
                  redeemer: propellerRedeemer,
                  redeemerEscrow: propellerRedeemerEscrowAccount,
                  feeVault: propellerFeeVault,
                  feeTracker: propellerEngineFeeTracker,
                  claim: wormholeClaim,
                  swimPayloadMessage,
                  // tokenIdMap: ?
                  pool,
                  poolToken0Mint,
                  poolToken1Mint,
                  poolLpMint: lpMint,
                  user: owner,

                  userPoolToken0Account: userTokenAccount0,

                  userPoolToken1Account: userTokenAccount1,

                  userLpTokenAccount,
                  associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                  systemProgram: web3.SystemProgram.programId,
                  tokenProgram: splToken.programId,
                  memo: MEMO_PROGRAM_ID,
                  aggregator,
                  marginalPricePool: marginalPricePool,
                  marginalPricePoolToken0Account:
                    marginalPricePoolToken0Account,
                  marginalPricePoolToken1Account:
                    marginalPricePoolToken1Account,
                  marginalPricePoolLpMint: marginalPricePoolLpMint,
                  twoPoolProgram: twoPoolProgram.programId,
                })
                .preInstructions([setComputeUnitLimitIx])
                .rpc();

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedAfter = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;
            expect(
              propellerFeeVaultBalanceAfter.gt(propellerFeeVaultBalanceBefore),
            ).toBeTruthy();
            expect(
              propellerEngineFeeTrackerFeesOwedAfter.gt(
                propellerEngineFeeTrackerFeesOwedBefore,
              ),
            ).toBeTruthy();
            const userTokenAccount0Data = await splToken.account.token.fetch(
              userTokenAccount0,
            );
            const userTokenAccount1Data = await splToken.account.token.fetch(
              userTokenAccount1,
            );
            const userLpTokenAccountData = await splToken.account.token.fetch(
              userLpTokenAccount,
            );
            expect(userTokenAccount0Data.amount.toNumber()).toEqual(0);
            expect(userTokenAccount0Data.authority.toBase58()).toEqual(
              owner.toBase58(),
            );
            expect(userTokenAccount1Data.amount.toNumber()).toEqual(0);
            expect(userTokenAccount1Data.authority.toBase58()).toEqual(
              owner.toBase58(),
            );
            expect(userLpTokenAccountData.amount.toNumber()).toEqual(0);
            expect(userLpTokenAccountData.authority.toBase58()).toEqual(
              owner.toBase58(),
            );
            await checkTxnLogsForMemo(createOwnerAtaTxn, memoStr, false);
          });

          it("processes swim payload", async () => {
            const pool = flagshipPool;
            const poolTokenAccount0 = poolUsdcAtaAddr;
            const poolTokenAccount1 = poolUsdtAtaAddr;
            const lpMint = swimUsdMint;
            const governanceFeeAcct = flagshipPoolGovernanceFeeAcct;
            const userBalanceBefore = await connection.getBalance(owner);
            const [
              userTokenAccount0,
              userTokenAccount1,
              userLpTokenAccount,
            ]: readonly web3.PublicKey[] = await Promise.all([
              getAssociatedTokenAddress(usdcKeypair.publicKey, owner),
              getAssociatedTokenAddress(usdtKeypair.publicKey, owner),
              getAssociatedTokenAddress(swimUsdKeypair.publicKey, owner),
            ]);

            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;

            const propellerEngineFeeTrackerFeesOwedBefore = (
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              )
            ).feesOwed;

            const userTransferAuthority = web3.Keypair.generate();
            const swimPayloadMessageAccount =
              await propellerProgram.account.swimPayloadMessage.fetch(
                swimPayloadMessage,
              );
            const swimPayloadMessageAccountTargetTokenId =
              swimPayloadMessageAccount.targetTokenId;
            const propellerRedeemerEscrowBalanceBefore = (
              await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
            ).amount;
            const userTokenAccount0BalanceBefore = (
              await splToken.account.token.fetch(userTokenAccount0)
            ).amount;
            const userTokenAccount1BalanceBefore = (
              await splToken.account.token.fetch(userTokenAccount1)
            ).amount;
            const processSwimPayloadPubkeys =
              await propellerEnginePropellerProgram.methods
                .processSwimPayload(
                  swimPayloadMessageAccountTargetTokenId,
                  new BN(0),
                )
                .accounts({
                  propeller,
                  payer: propellerEngineKeypair.publicKey,
                  claim: wormholeClaim,
                  swimPayloadMessage,
                  swimPayloadMessagePayer:
                    swimPayloadMessageAccount.swimPayloadMessagePayer,
                  redeemer: propellerRedeemer,
                  redeemerEscrow: propellerRedeemerEscrowAccount,
                  // tokenIdMap: ?
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
                  twoPoolProgram: twoPoolProgram.programId,
                  systemProgram: web3.SystemProgram.programId,
                })
                .pubkeys();

            const propellerProcessSwimPayloadIxs =
              propellerEnginePropellerProgram.methods
                .propellerProcessSwimPayload(
                  swimPayloadMessageAccountTargetTokenId,
                )
                .accounts({
                  processSwimPayload: processSwimPayloadPubkeys,
                  feeVault: propellerFeeVault,
                  feeTracker: propellerEngineFeeTracker,
                  aggregator,
                  marginalPricePool: marginalPricePool,
                  marginalPricePoolToken0Account:
                    marginalPricePoolToken0Account,
                  marginalPricePoolToken1Account:
                    marginalPricePoolToken1Account,
                  marginalPricePoolLpMint: marginalPricePoolLpMint,
                  owner,
                  memo: MEMO_PROGRAM_ID,
                })
                .preInstructions([setComputeUnitLimitIx])
                .signers([userTransferAuthority, propellerEngineKeypair]);

            const propellerProcessSwimPayloadPubkeys =
              await propellerProcessSwimPayloadIxs.pubkeys();
            console.info(
              `${JSON.stringify(propellerProcessSwimPayloadPubkeys, null, 2)}`,
            );
            if (!processSwimPayloadPubkeys.tokenIdMap) {
              throw new Error("tokenIdMap not derived");
            }
            const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
              await web3.PublicKey.findProgramAddress(
                [
                  Buffer.from("propeller"),
                  Buffer.from("token_id"),
                  propeller.toBuffer(),
                  new BN(swimPayloadMessageAccountTargetTokenId).toArrayLike(
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
              await propellerProgram.account.tokenIdMap.fetch(
                expectedTokenIdMap,
              );
            console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
            const derivedTokenIdMap = processSwimPayloadPubkeys.tokenIdMap;
            expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
            if (!processSwimPayloadPubkeys.swimClaim) {
              throw new Error("swimClaim key not derived");
            }
            const [expectedSwimClaim, expectedSwimClaimBump] =
              await getSwimClaimPda(wormholeClaim, propellerProgram.programId);

            expect(processSwimPayloadPubkeys.swimClaim).toEqual(
              expectedSwimClaim,
            );

            const processSwimPayloadTxnSig: string =
              await propellerProcessSwimPayloadIxs.rpc();
            console.info(
              `processSwimPayloadTxnSig: ${processSwimPayloadTxnSig}`,
            );

            const userBalanceAfter = await connection.getBalance(owner);
            console.info(`
              userBalance:
                before: ${userBalanceBefore}
                after: ${userBalanceAfter}
            `);
            expect(userBalanceAfter - userBalanceBefore).toEqual(
              gasKickstartAmount.toNumber(),
            );
            const propellerEngineFeeTrackerAfter =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );
            console.info(
              `propellerEngineFeeTrackerAfter: ${JSON.stringify(
                propellerEngineFeeTrackerAfter,
                null,
                2,
              )}`,
            );
            const propellerEngineFeeTrackerFeesOwedAfter =
              propellerEngineFeeTrackerAfter.feesOwed;
            console.info(`
              propellerEngineFeeTrackerBalance
                Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
                After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
          `);
            const feeTrackerFeesOwedDiff =
              propellerEngineFeeTrackerFeesOwedAfter.sub(
                propellerEngineFeeTrackerFeesOwedBefore,
              );

            expect(
              propellerEngineFeeTrackerFeesOwedAfter.gt(
                propellerEngineFeeTrackerFeesOwedBefore,
              ),
            ).toEqual(true);

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            expect(
              propellerFeeVaultBalanceAfter.eq(
                propellerFeeVaultBalanceBefore.add(feeTrackerFeesOwedDiff),
              ),
            ).toEqual(true);

            const swimClaimAccount =
              await propellerProgram.account.swimClaim.fetch(
                processSwimPayloadPubkeys.swimClaim,
              );
            expect(swimClaimAccount.bump).toEqual(expectedSwimClaimBump);
            expect(swimClaimAccount.claimed).toBeTruthy();

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
                  swimPayloadMessageAccount.transferAmount,
                ),
              ),
            ).toBeTruthy();

            expect(
              userTokenAccount0BalanceAfter.gt(userTokenAccount0BalanceBefore),
            ).toBeTruthy();
            expect(
              userTokenAccount1BalanceAfter.eq(userTokenAccount1BalanceBefore),
            ).toBeTruthy();

            await checkTxnLogsForMemo(processSwimPayloadTxnSig, memoStr, false);
          });

          //TODO: create multiple fee trackers and test that correct amount is withdrawn
          it("claims its fees", async () => {
            const propellerEngineFeeTrackerBefore =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );
            const propellerEngineFeeTrackerFeesOwedBefore =
              propellerEngineFeeTrackerBefore.feesOwed;
            const propellerFeeVaultBalanceBefore = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            const propellerEngineSwimUsdFeeAccountBalanceBefore = (
              await splToken.account.token.fetch(
                propellerEngineSwimUsdFeeAccount,
              )
            ).amount;
            const claimFeesTxn = await propellerEnginePropellerProgram.methods
              .claimFees()
              .accounts({
                propeller,
                feeTracker: propellerEngineFeeTracker,
                payer: propellerEngineKeypair.publicKey,
                feeAccount: propellerEngineSwimUsdFeeAccount,
                feeVault: propellerFeeVault,
                tokenProgram: splToken.programId,
              })
              .rpc();
            console.info(`claimFeesTxn: ${claimFeesTxn}`);

            const propellerEngineFeeTrackerAfter =
              await propellerProgram.account.feeTracker.fetch(
                propellerEngineFeeTracker,
              );

            const propellerEngineFeeTrackerFeesOwedAfter =
              propellerEngineFeeTrackerAfter.feesOwed;
            expect(
              propellerEngineFeeTrackerFeesOwedAfter.eq(new BN(0)),
            ).toBeTruthy();
            const propellerEngineFeeTrackerFeesClaimed =
              propellerEngineFeeTrackerFeesOwedBefore.sub(
                propellerEngineFeeTrackerFeesOwedAfter,
              );

            const propellerFeeVaultBalanceAfter = (
              await splToken.account.token.fetch(propellerFeeVault)
            ).amount;
            console.info(`
            propellerEngineFeeTrackerFeesOwed
              Before: ${propellerEngineFeeTrackerFeesOwedBefore.toString()}
              After: ${propellerEngineFeeTrackerFeesOwedAfter.toString()}
            propellerFeeVaultBalance
              Before: ${propellerFeeVaultBalanceBefore.toString()}
              After: ${propellerFeeVaultBalanceAfter.toString()}
          `);
            expect(
              propellerFeeVaultBalanceAfter.eq(
                propellerFeeVaultBalanceBefore.sub(
                  propellerEngineFeeTrackerFeesClaimed,
                ),
              ),
            ).toEqual(true);
            const propellerEngineSwimUsdFeeAccountBalanceAfter = (
              await splToken.account.token.fetch(
                propellerEngineSwimUsdFeeAccount,
              )
            ).amount;
            expect(
              propellerEngineSwimUsdFeeAccountBalanceAfter.eq(
                propellerEngineSwimUsdFeeAccountBalanceBefore.add(
                  propellerEngineFeeTrackerFeesClaimed,
                ),
              ),
            ).toEqual(true);
          });

          //TODO: add min_output_amount test cases
        });
      });
    });
  });

  async function checkTxnLogsForMemo(
    txSig: string,
    memoStr: string,
    exists = true,
  ) {
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
    expect(memoLogFound).toEqual(exists);
  }
});

// const getUserTokenAccounts = async (
//   swimPayloadMessage: web3.PublicKey,
//   // propeller: web3.PublicKey,
//   propellerProgramId: web3.PublicKey,
// ) => {
//   const swimPayloadMessageData =
//     await propellerProgram.account.swimPayloadMessage.fetch(swimPayloadMessage);
//
//   const targetTokenId = swimPayloadMessageData.targetTokenId;
//
//   if (targetTokenId === 0) {
//     // getting out swimUSD. is this an accepted route?
//   }
//
//   const owner = new web3.PublicKey(swimPayloadMessageData.owner);
//   const [tokenIdMap] = await web3.PublicKey.findProgramAddress(
//     [
//       Buffer.from("propeller"),
//       Buffer.from("token_id"),
//       propeller.toBuffer(),
//       new BN(targetTokenId).toArrayLike(Buffer, "le", 2),
//     ],
//     propellerProgramId,
//   );
//   const tokenIdMapData = await propellerProgram.account.tokenIdMap.fetch(
//     tokenIdMap,
//   );
//   const poolKey = tokenIdMapData.pool;
//   const poolData = await twoPoolProgram.account.twoPool.fetch(poolKey);
//   return {
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//     userTokenAccount0: await getAssociatedTokenAddress(
//       poolData.tokenMintKeys[0],
//       owner,
//     ),
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//     userTokenAccount1: await getAssociatedTokenAddress(
//       poolData.tokenMintKeys[1],
//       owner,
//     ),
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//     userLpTokenAccount: await getAssociatedTokenAddress(
//       poolData.lpMintKey,
//       owner,
//     ),
//   };
//   // let userTokenAccount0: web3.PublicKey;
//   // let userTokenAccount1: web3.PublicKey;
//   // let userLpTokenAccount: web3.PublicKey;
//   // for (let i = 0; i < poolData.tokenMintKeys.length; i++){
//   //   const userTokenAccount = await getAssociatedTokenAddress(poolData.tokenMintKeys[i], owner);
//   //   result[`userTokenAccount${i}`] = userTokenAccount;
//   // }
//   // for (const mint of poolData.tokenMintKeys) {
//   //
//   // }
//   // // TODO: optimize this by only requiring the userToken matching the poolTokenIndex to actually be the owner's ATA
//   // // const poolTokenIndex = tokenIdMapData.poolTokenIndex;
//   // // const poolTokenMint = tokenIdMapData.poolTokenMint;
//   //
//   //
//   // userTokenAccount0 = await getAssociatedTokenAddress(poolTokenMint, owner);
//   // const t = {
//   //   userTokenAccount0: await getAssociatedTokenAddress(pool.)
//   // }
//   // userTokenAccount1 =
//   // const poolData = await twoPoolProgram.account.twoPool.fetch(poolKey);
//   // need swimPayloadMessage.swimPayload.targetTokenId
//   // if(targetTokenId === 0)
//   // getTargetTokenMapping(target_token_id)
// };
//
// const setupFlagshipPool = async () => {
//   ({
//     poolPubkey: flagshipPool,
//     poolTokenAccounts: [poolUsdcAtaAddr, poolUsdtAtaAddr],
//     governanceFeeAccount: flagshipPoolGovernanceFeeAcct,
//   } = await setupPoolPrereqs(
//     twoPoolProgram,
//     splToken,
//     poolMintKeypairs,
//     poolMintDecimals,
//     poolMintAuthorities.map((k) => k.publicKey),
//     swimUsdKeypair.publicKey,
//     governanceKeypair.publicKey,
//   ));
//   const initFlagshipPoolTxn = twoPoolProgram.methods
//     // .initialize(params)
//     .initialize(ampFactor, lpFee, governanceFee)
//     .accounts({
//       payer: provider.publicKey,
//       poolMint0: usdcKeypair.publicKey,
//       poolMint1: usdtKeypair.publicKey,
//       lpMint: swimUsdKeypair.publicKey,
//       poolTokenAccount0: poolUsdcAtaAddr,
//       poolTokenAccount1: poolUsdtAtaAddr,
//       pauseKey: pauseKeypair.publicKey,
//       governanceAccount: governanceKeypair.publicKey,
//       governanceFeeAccount: flagshipPoolGovernanceFeeAcct,
//       tokenProgram: splToken.programId,
//       associatedTokenProgram: splAssociatedToken.programId,
//       systemProgram: web3.SystemProgram.programId,
//       rent: web3.SYSVAR_RENT_PUBKEY,
//     })
//     .signers([swimUsdKeypair]);
//
//   const pubkeys = await initFlagshipPoolTxn.pubkeys();
//
//   console.info(`pubkeys: ${JSON.stringify(pubkeys)}`);
//   if (!pubkeys.pool) {
//     throw new Error("Pool Pubkey not auto derived");
//   }
//   const pool = pubkeys.pool;
//   console.info(
//     `poolKey: ${pool.toBase58()}, expected: ${flagshipPool.toBase58()}`,
//   );
//
//   expect(pool.toBase58()).toBe(flagshipPool.toBase58());
//   const initFlagshipPoolTxnSig = await initFlagshipPoolTxn.rpc(
//     rpcCommitmentConfig,
//   );
//
//   console.info(`initFlagshipPoolTxnSig: ${initFlagshipPoolTxnSig}`);
//
//   const flagshipPoolData = await twoPoolProgram.account.twoPool.fetch(pool);
//   console.info(
//     `flagshipPoolData: ${JSON.stringify(flagshipPoolData, null, 2)}`,
//   );
//
//   marginalPricePool = flagshipPool;
//   marginalPricePoolToken0Account = poolUsdcAtaAddr;
//   marginalPricePoolToken1Account = poolUsdtAtaAddr;
//   marginalPricePoolLpMint = swimUsdKeypair.publicKey;
//
//   const calculatedSwimPoolPda = await web3.PublicKey.createProgramAddress(
//     [
//       Buffer.from("two_pool"),
//       ...poolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
//       swimUsdKeypair.publicKey.toBytes(),
//       Buffer.from([flagshipPoolData.bump]),
//     ],
//     twoPoolProgram.programId,
//   );
//   expect(flagshipPool.toBase58()).toBe(calculatedSwimPoolPda.toBase58());
//
//   console.info(`setting up user token accounts for flagship pool`);
//   ({
//     userPoolTokenAtas: [userUsdcAtaAddr, userUsdtAtaAddr],
//     userLpTokenAta: userSwimUsdAtaAddr,
//   } = await setupUserAssociatedTokenAccts(
//     provider.connection,
//     user,
//     poolMintKeypairs.map((kp) => kp.publicKey),
//     poolMintAuthorities,
//     swimUsdKeypair.publicKey,
//     initialMintAmount,
//     userKeypair,
//     splToken,
//     commitment,
//     rpcCommitmentConfig,
//   ));
//
//   console.info(
//     `done setting up flagship pool and relevant user token accounts`,
//   );
//   console.info(`
//       flagshipPool: ${JSON.stringify(flagshipPoolData, null, 2)}
//       user: {
//         userUsdcAtaAddr: ${userUsdcAtaAddr.toBase58()}
//         userUsdtAtaAddr: ${userUsdtAtaAddr.toBase58()}
//         userSwimUsdAtaAddr: ${userSwimUsdAtaAddr.toBase58()}
//       }
//     `);
// };
//
// const seedFlagshipPool = async () => {
//   const inputAmounts = [new BN(10_000_000_000_000), new BN(5_000_000_000_000)];
//   const minimumMintAmount = new BN(0);
//   // const addParams = {
//   //   inputAmounts,
//   //   minimumMintAmount,
//   // };
//   const userTransferAuthority = web3.Keypair.generate();
//   const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
//     splToken,
//     [userUsdcAtaAddr, userUsdtAtaAddr],
//     inputAmounts,
//     userTransferAuthority.publicKey,
//     userKeypair,
//   );
//
//   const addTxn = twoPoolProgram.methods
//     .add(inputAmounts, minimumMintAmount)
//     .accounts({
//       // propeller: propeller,
//       poolTokenAccount0: poolUsdcAtaAddr,
//       poolTokenAccount1: poolUsdtAtaAddr,
//       lpMint: swimUsdKeypair.publicKey,
//       governanceFee: flagshipPoolGovernanceFeeAcct,
//       userTransferAuthority: userTransferAuthority.publicKey,
//       userTokenAccount0: userUsdcAtaAddr,
//       userTokenAccount1: userUsdtAtaAddr,
//       userLpTokenAccount: userSwimUsdAtaAddr,
//       tokenProgram: splToken.programId,
//     })
//     .preInstructions([...approveIxs])
//     .postInstructions([...revokeIxs])
//     .signers([userTransferAuthority]);
//   // .rpc(rpcCommitmentConfig);
//
//   const addTxnPubkeys = await addTxn.pubkeys();
//   console.info(`addTxPubkeys: ${JSON.stringify(addTxnPubkeys, null, 2)}`);
//
//   const addTxnSig = await addTxn.rpc(rpcCommitmentConfig);
//
//   console.info(`addTxSig: ${addTxnSig}`);
// };
//
// const setupMetaPool = async () => {
//   const [metapoolPda, metapoolBump] = await web3.PublicKey.findProgramAddress(
//     [
//       Buffer.from("two_pool"),
//       ...metapoolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
//       metapoolLpMintKeypair.publicKey.toBytes(),
//     ],
//     twoPoolProgram.programId,
//   );
//
//   ({
//     poolPubkey: metapool,
//     poolTokenAccounts: [metapoolPoolToken0Ata, metapoolPoolToken1Ata],
//     governanceFeeAccount: metapoolGovernanceFeeAta,
//   } = await setupPoolPrereqs(
//     twoPoolProgram,
//     splToken,
//     metapoolMintKeypairs,
//     metapoolMintDecimals,
//     [flagshipPool, metapoolMint1Authority.publicKey],
//     // [metapoolMintKeypair1],
//     // [metapoolMint1Decimal],
//     // [metapoolMint1Authority.publicKey],
//     metapoolLpMintKeypair.publicKey,
//     governanceKeypair.publicKey,
//   ));
//
//   const initMetapoolTxn = twoPoolProgram.methods
//     // .initialize(params)
//     .initialize(ampFactor, lpFee, governanceFee)
//     .accounts({
//       payer: provider.publicKey,
//       poolMint0: metapoolMintKeypairs[0].publicKey,
//       poolMint1: metapoolMintKeypairs[1].publicKey,
//       lpMint: metapoolLpMintKeypair.publicKey,
//       poolTokenAccount0: metapoolPoolToken0Ata,
//       poolTokenAccount1: metapoolPoolToken1Ata,
//       pauseKey: pauseKeypair.publicKey,
//       governanceAccount: governanceKeypair.publicKey,
//       governanceFeeAccount: metapoolGovernanceFeeAta,
//       tokenProgram: splToken.programId,
//       associatedTokenProgram: splAssociatedToken.programId,
//       systemProgram: web3.SystemProgram.programId,
//       rent: web3.SYSVAR_RENT_PUBKEY,
//     })
//     .signers([metapoolLpMintKeypair]);
//   // .rpc({skipPreflight: true});
//   // console.info(`initMetapoolTxn: ${JSON.stringify(initMetapoolTxn, null, 2)}`);
//
//   const initMetapoolTxnPubkeys = await initMetapoolTxn.pubkeys();
//   console.info(
//     `initMetapoolTxnPubkeys: ${JSON.stringify(initMetapoolTxnPubkeys)}`,
//   );
//
//   if (!initMetapoolTxnPubkeys.pool) {
//     throw new Error("Metapool address not auto-derived");
//   }
//   const derivedMetapool = initMetapoolTxnPubkeys.pool;
//   console.info(
//     `derivedMetapool: ${derivedMetapool.toBase58()}, expected: ${metapool.toBase58()}`,
//   );
//   expect(metapoolPda.toBase58()).toBe(derivedMetapool.toBase58());
//   expect(derivedMetapool.toBase58()).toBe(metapool.toBase58());
//
//   const initMetapoolTxnSig = await initMetapoolTxn.rpc(rpcCommitmentConfig);
//
//   console.info(`initMetapoolTxnSig: ${initMetapoolTxnSig}`);
//
//   const metapoolData = await twoPoolProgram.account.twoPool.fetch(metapool);
//   console.info(`metapoolData: ${JSON.stringify(metapoolData, null, 2)}`);
//   expect(metapoolBump).toBe(metapoolData.bump);
//
//   const calculatedMetapoolPda = await web3.PublicKey.createProgramAddress(
//     [
//       Buffer.from("two_pool"),
//       ...metapoolMintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
//       metapoolLpMintKeypair.publicKey.toBytes(),
//       Buffer.from([metapoolData.bump]),
//     ],
//     twoPoolProgram.programId,
//   );
//   expect(metapool.toBase58()).toBe(calculatedMetapoolPda.toBase58());
//
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//   userMetapoolTokenAccount0 = (
//     await getOrCreateAssociatedTokenAccount(
//       provider.connection,
//       userKeypair,
//       swimUsdKeypair.publicKey,
//       user,
//       false,
//       commitment,
//       rpcCommitmentConfig,
//     )
//   ).address;
//
//   ({
//     userPoolTokenAtas: [userMetapoolTokenAccount1],
//     userLpTokenAta: userMetapoolLpTokenAccount,
//   } = await setupUserAssociatedTokenAccts(
//     provider.connection,
//     user,
//     [metapoolMint1Keypair.publicKey],
//     [metapoolMint1Authority],
//     metapoolLpMintKeypair.publicKey,
//     initialMintAmount,
//     userKeypair,
//     splToken,
//     commitment,
//     rpcCommitmentConfig,
//   ));
// };
//
// const seedMetaPool = async () => {
//   const inputAmounts = [new BN(2_000_000_000_000), new BN(1_000_000_000_000)];
//   const minimumMintAmount = new BN(0);
//   // const addParams = {
//   //   inputAmounts,
//   //   minimumMintAmount,
//   // };
//   const userTransferAuthority = web3.Keypair.generate();
//   const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
//     splToken,
//     [userMetapoolTokenAccount0, userMetapoolTokenAccount1],
//     inputAmounts,
//     userTransferAuthority.publicKey,
//     userKeypair,
//   );
//
//   const addTxn = twoPoolProgram.methods
//     .add(inputAmounts, minimumMintAmount)
//     .accounts({
//       // propeller: propeller,
//       poolTokenAccount0: metapoolPoolToken0Ata,
//       poolTokenAccount1: metapoolPoolToken1Ata,
//       lpMint: metapoolLpMintKeypair.publicKey,
//       governanceFee: metapoolGovernanceFeeAta,
//       userTransferAuthority: userTransferAuthority.publicKey,
//       userTokenAccount0: userMetapoolTokenAccount0,
//       userTokenAccount1: userMetapoolTokenAccount1,
//       userLpTokenAccount: userMetapoolLpTokenAccount,
//       tokenProgram: splToken.programId,
//     })
//     .preInstructions([...approveIxs])
//     .postInstructions([...revokeIxs])
//     .signers([userTransferAuthority]);
//   // .rpc(rpcCommitmentConfig);
//
//   const addTxnPubkeys = await addTxn.pubkeys();
//   console.info(
//     `seedMetaPool addTxPubkeys: ${JSON.stringify(addTxnPubkeys, null, 2)}`,
//   );
//
//   const addTxnSig = await addTxn.rpc(rpcCommitmentConfig);
//
//   console.info(`addTxSig: ${addTxnSig}`);
//
//   console.info(`
//       user: {
//         userMetapoolTokenAccount0: ${userMetapoolTokenAccount0.toBase58()}
//         userMetapoolTokenAccount1: ${userMetapoolTokenAccount1.toBase58()}
//         userMetapoolLpTokenAccount: ${userMetapoolLpTokenAccount.toBase58()}
//       }
//     `);
// };

const initializePropeller = async () => {
  const expectedPropellerAddr = await getPropellerPda(
    swimUsdMint,
    propellerProgram.programId,
  );

  propellerFeeVault = await getAssociatedTokenAddress(
    swimUsdMint,
    expectedPropellerAddr,
    true,
  );

  const expectedPropellerRedeemerAddr = await getPropellerRedeemerPda(
    propellerProgram.programId,
  );
  const propellerRedeemerEscrowAddr: web3.PublicKey =
    await getAssociatedTokenAddress(
      swimUsdMint,
      expectedPropellerRedeemerAddr,
      true,
    );
  const initializeParams = {
    gasKickstartAmount,
    secpVerifyInitFee,
    secpVerifyFee,
    postVaaFee,
    completeWithPayloadFee,
    initAtaFee,
    processSwimPayloadFee,
    // propellerMinTransferAmount,
    // propellerEthMinTransferAmount,
    marginalPricePool,
    marginalPricePoolTokenIndex,
    marginalPricePoolTokenMint,
    // evmRoutingContractAddress: ethRoutingContract,
    // evmRoutingContractAddress: ethRoutingContractEthUint8Arr
  };
  const tx = propellerProgram.methods
    .initialize(initializeParams)
    .accounts({
      propellerRedeemerEscrow: propellerRedeemerEscrowAddr,
      propellerFeeVault,
      admin: propellerAdmin.publicKey,
      swimUsdMint: swimUsdMint,
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
      aggregator,
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

  console.info(
    `gasKickstartAmount: ${propellerData.gasKickstartAmount.toString()}`,
  );
  // console.info(
  //   `propellerMinTransferAmount: ${propellerData.propellerMinTransferAmount.toString()}`,
  // );

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
        outputTokenIndex: SWIM_USD_TO_TOKEN_NUMBER,
        tokenIdMap: swimUsdTokenIdMap,
      },
      { outputTokenIndex: USDC_TO_TOKEN_NUMBER, tokenIdMap: usdcTokenIdMap },
      { outputTokenIndex: USDT_TO_TOKEN_NUMBER, tokenIdMap: usdtTokenIdMap },
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

const createTargetChainMaps = async () => {
  const targetChainMaps = await Promise.all(
    routingContracts.map(async ({ targetChainId, address }) => {
      const createTargetChainMap = propellerEnginePropellerProgram.methods
        .createTargetChainMap(targetChainId, address)
        .accounts({
          propeller,
          admin: propellerAdmin.publicKey,
          payer: propellerEngineKeypair.publicKey,
          systemProgram: web3.SystemProgram.programId,
          // rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([propellerAdmin]);

      const createTargetChainMapPubkeys = await createTargetChainMap.pubkeys();
      await createTargetChainMap.rpc();
      const targetChainMapData =
        await propellerProgram.account.targetChainMap.fetch(
          createTargetChainMapPubkeys.targetChainMap,
        );
      return {
        targetChainId,
        targetAddress: address,
        targetChainMapData,
      };
    }),
  );
  targetChainMaps.forEach(
    ({ targetChainId, targetAddress, targetChainMapData }) => {
      expect(targetChainMapData.targetChain).toEqual(targetChainId);
      expect(Buffer.from(targetChainMapData.targetAddress)).toEqual(
        targetAddress,
      );
    },
  );
};

const seedWormholeCustody = async () => {
  const userLpTokenBalanceBefore = (
    await splToken.account.token.fetch(userSwimUsdAtaAddr)
  ).amount;

  const transferAmount = userLpTokenBalanceBefore.div(new BN(2));
  const memo = "e45794d6c5a2750a";
  const memoBuffer = Buffer.alloc(16);
  memoBuffer.write(memo);
  const wormholeMessage = web3.Keypair.generate();
  const crossChainTransferNativeTxnSig = await propellerProgram.methods
    .crossChainTransferNativeWithPayload(transferAmount, CHAIN_ID_ETH, evmOwner)
    .accounts({
      propeller,
      payer: payer.publicKey,
      tokenBridgeConfig,
      userSwimUsdAta: userSwimUsdAtaAddr,
      swimUsdMint: swimUsdMint,
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
    })
    .preInstructions([setComputeUnitLimitIx])
    .signers([wormholeMessage])
    .rpc();

  console.info(
    `crossChainTransferNativeTxnSig(seedWormholeCustody): ${crossChainTransferNativeTxnSig}`,
  );
};

const convertLamportsToSwimUsdAtomic = async (feeInLamports: BN) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const marginalPrices = await twoPoolProgram.methods
    .marginalPrices()
    .accounts({
      pool: marginalPricePool,
      poolTokenAccount0: marginalPricePoolToken0Account,
      poolTokenAccount1: marginalPricePoolToken1Account,
      lpMint: swimUsdKeypair.publicKey,
    })
    .view();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { mantissa: marginalPriceMantissa, scale: marginalPriceScale } =
    marginalPrices[marginalPricePoolTokenIndex];
  const marginalPriceDecimal = new Big(marginalPriceMantissa.toString()).div(
    new Big(10).pow(marginalPriceScale),
  );
  const solUsdFeedVal = await aggregatorAccount.getLatestValue();
  const lamportUsdVal = solUsdFeedVal.div(new Big(LAMPORTS_PER_SOL));

  const feeSwimUsdDecimal = lamportUsdVal
    .mul(new Big(feeInLamports.toString()))
    .div(marginalPriceDecimal);

  console.info(`feeSwimUsdDecimal: ${feeSwimUsdDecimal.toString()}`);
  const feeSwimUsdAtomic = new Big(feeSwimUsdDecimal).mul(new Big(10).pow(6));

  console.info(`feeSwimUsdAtomic: ${feeSwimUsdAtomic.toString()}`);
  //trunc
  return new BN(feeSwimUsdAtomic.toNumber());
};

function incMemoIdAndGet() {
  return (++memoId).toString().padStart(16, "0");
}
