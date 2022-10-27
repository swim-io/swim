import * as crypto from "crypto";

import {
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  createNonce,
  getClaimAddressSolana,
  postVaaSolanaWithRetry,
  setDefaultWasm,
  tryNativeToHexString,
  uint8ArrayToHex,
} from "@certusone/wormhole-sdk";
import { parseUnits } from "@ethersproject/units";
import {
  AnchorProvider,
  BN,
  Program,
  Spl,
  setProvider,
  web3,
} from "@project-serum/anchor";
// eslint-disable-next-line import/order
import type { Idl } from "@project-serum/anchor";

import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { createMemoInstruction } from "@solana/spl-memo";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

import type { Propeller } from "../../artifacts/propeller";
import type { TwoPool } from "../../artifacts/two_pool";
import { getApproveAndRevokeIxs, idl } from "../../index";
import {
  DEFAULT_SOL_USD_FEED,
  PROPELLER_PID,
  SWIM_MEMO_LENGTH,
  SWIM_USD_TO_TOKEN_NUMBER,
  TWO_POOL_PID,
  USDC_TO_TOKEN_NUMBER,
  USDT_TO_TOKEN_NUMBER,
  ampFactor,
  bscTokenBridge,
  commitment,
  completeWithPayloadFee,
  ethTokenBridge,
  ethTokenBridgeNativeStr,
  evmOwner,
  evmRoutingContractBuffer,
  evmRoutingContractHexStr,
  evmTargetTokenId,
  gasKickstartAmount,
  governanceFee,
  initAtaFee,
  lpFee,
  marginalPricePoolTokenIndex,
  maxStaleness,
  metapoolMint1PoolTokenIndex,
  metapoolMint1ToTokenNumber,
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
} from "../consts";
import {
  getAddOrRemoveAccounts,
  getPoolTokenAccountBalances,
  getPoolUserBalances,
  getUserAtaBalancesForPool,
  printBeforeAndAfterPoolUserBalances,
  printPoolUserBalances,
  setupPoolPrereqs,
  setupUserAssociatedTokenAccts,
} from "../twoPool/poolTestUtils";

import type { WormholeAddresses } from "./propellerUtils";
import {
  DummyForeignRoutingProgram,
  encodeSwimPayload,
  formatParsedTokenTransferWithSwimPayloadPostedMessage,
  getCompleteNativeWithPayloadTxn,
  getProcessSwimPayloadTxn,
  getPropellerPda,
  getPropellerRedeemerPda,
  getPropellerSenderPda,
  getSwimClaimPda,
  getSwimPayloadMessagePda,
  getTargetChainMapAddr,
  getToTokenNumberMapAddr,
  getWormholeAddressesForMint,
  parseTokenTransferWithSwimPayloadPostedMessage,
  postVaaToSolana,
} from "./propellerUtils";
import {
  deriveEndpointPda,
  deriveMessagePda,
  encodeTokenTransferWithPayload,
  formatParsedTokenTransferPostedMessage,
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
const payer = (provider.wallet as NodeWallet).payer;
const splToken = Spl.token(provider);
const splAssociatedToken = Spl.associatedToken(provider);
// Configure the client to use the local cluster.
setProvider(provider);

const propellerProgram = new Program(
  idl.propeller as Idl,
  PROPELLER_PID,
  provider,
) as unknown as Program<Propeller>;
const twoPoolProgram = new Program(
  idl.twoPool as Idl,
  TWO_POOL_PID,
  provider,
) as unknown as Program<TwoPool>;
const wormhole = WORMHOLE_CORE_BRIDGE;
const tokenBridge = WORMHOLE_TOKEN_BRIDGE;

// start these higher to avoid issues when running this suite & engine.test.ts suite in one go
const ethTokenBridgeSequence = 1000;
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
const propellerGovernanceKey: web3.Keypair = web3.Keypair.generate();
const propellerPauseKey: web3.Keypair = web3.Keypair.generate();
let propellerFeeVault: web3.PublicKey;

const dummyUser = payer;
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
const poolMintAuthorities = [payer, payer];
const swimUsdKeypair = web3.Keypair.generate();
const poolGovernanceKeypair = web3.Keypair.generate();
const poolPauseKeypair = web3.Keypair.generate();

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
let wormholeAddresses: WormholeAddresses;
const metapoolMint0Keypair = swimUsdKeypair;
const metapoolMint1Keypair = web3.Keypair.generate();
const metapoolMint1Authority = payer;
const metapoolMint1Decimal = 8;
const metapoolMintKeypairs = [metapoolMint0Keypair, metapoolMint1Keypair];
const metapoolMintDecimals = [mintDecimal, metapoolMint1Decimal];
// const metapoolMintAuthorities = [flagshipPool, metapoolMint1Authority];

const metapoolLpMintKeypair = web3.Keypair.generate();
const metapoolLpMint = metapoolLpMintKeypair.publicKey;
let metapoolPoolToken0Ata: web3.PublicKey;
let metapoolPoolToken1Ata: web3.PublicKey;
let metapoolGovernanceFeeAta: web3.PublicKey;

let marginalPricePool: web3.PublicKey;
const marginalPricePoolTokenMint = usdcKeypair.publicKey;

let outputTokenIdMappingAddrs: ReadonlyMap<number, PublicKey>;
// const poolRemoveExactBurnIx = {removeExactBurn: {} };
// const poolSwapExactInputIx = {swapExactInput: {} };
// type TokenIdMapPoolIx = poolRemoveExactBurnIx | poolSwapExactInputIx;
// type TokenIdMapPoolIx2 = "removeExactBurn" | "swapExactInput";
// type PoolIx = {
//   readonly [key in TokenIdMapPoolIx2]?: Record<string, never>;
// };
// type TokenIdMap = {
//   readonly pool: web3.PublicKey;
//   readonly poolTokenIndex: number;
//   readonly poolTokenMint: web3.PublicKey;
//   readonly poolIx: PoolIx;
// };
// type TokenIdMapping = {
//
// }
// let usdcTokenIdMap: TokenIdMap;
// let usdtTokenIdMap: TokenIdMap;
// // let metapoolMint1TokenIdMap: TokenIdMap;
// let outputTokenIdMappings: ReadonlyMap<number, TokenIdMap>;

// let swimUSDMintInfo: MintInfo;

let custody: web3.PublicKey;
let wormholeConfig: web3.PublicKey;
let wormholeFeeCollector: web3.PublicKey;
let wormholeEmitter: web3.PublicKey;
let wormholeSequence: web3.PublicKey;
let authoritySigner: web3.PublicKey;
let tokenBridgeConfig: web3.PublicKey;
let custodySigner: web3.PublicKey;
const aggregator: web3.PublicKey = DEFAULT_SOL_USD_FEED;

const dummyEthTokenBridge: DummyForeignRoutingProgram =
  new DummyForeignRoutingProgram(
    ethTokenBridgeNativeStr,
    CHAIN_ID_ETH,
    ethTokenBridgeSequence,
    swimUsdMint.toBuffer(),
    propellerProgram.programId,
    evmRoutingContractBuffer,
  );

describe("propeller", () => {
  beforeAll(async () => {
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
      poolGovernanceKeypair.publicKey,
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
        pauseKey: poolPauseKeypair.publicKey,
        governanceAccount: poolGovernanceKeypair.publicKey,
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
      poolGovernanceKeypair.publicKey,
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
        pauseKey: poolPauseKeypair.publicKey,
        governanceAccount: poolGovernanceKeypair.publicKey,
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
      tokenBridgeConfig,
      wormholeConfig,
      wormholeEmitter,
      wormholeFeeCollector,
      wormholeSequence,
    } = wormholeAddresses);

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
  }, 30000);

  it("Initializes propeller", async () => {
    const expectedPropellerAddr = await getPropellerPda(
      swimUsdMint,
      propellerProgram.programId,
    );
    const expectedPropellerRedeemerAddr = await getPropellerRedeemerPda(
      propellerProgram.programId,
    );

    propellerFeeVault = await getAssociatedTokenAddress(
      swimUsdMint,
      expectedPropellerAddr,
      true,
    );

    const propellerRedeemerEscrowAddr: web3.PublicKey =
      await getAssociatedTokenAddress(
        swimUsdMint,
        expectedPropellerRedeemerAddr,
        true,
      );
    const initializeParams = {
      gasKickstartAmount,
      initAtaFee,
      secpVerifyInitFee,
      secpVerifyFee,
      postVaaFee,
      completeWithPayloadFee,
      processSwimPayloadFee,
      // propellerMinTransferAmount,
      // propellerEthMinTransferAmount,
      marginalPricePool,
      marginalPricePoolTokenIndex,
      marginalPricePoolTokenMint,
      maxStaleness,
      // evmRoutingContractAddress: evmRoutingContractBuffer,
      // evmRoutingContractAddress: ethRoutingContractEthUint8Arr
    };
    const tx = propellerProgram.methods
      .initialize(initializeParams)
      .accounts({
        propellerRedeemerEscrow: propellerRedeemerEscrowAddr,
        propellerFeeVault,
        governanceKey: propellerGovernanceKey.publicKey,
        pauseKey: propellerPauseKey.publicKey,
        swimUsdMint: swimUsdMint,
        payer: payer.publicKey,
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
      .signers([propellerGovernanceKey, propellerPauseKey]);

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
    // propellerRedeemerEscrowAccount = await getOrCreateAssociatedTokenAccount(
    // 	connection,
    // 	payer,
    // 	swimUsdMint,
    // 	propellerRedeemer,
    // 	true
    // );

    // if (pubkeys.propellerRedeemerEscrow) {
    // 	propellerRedeemerEscrowAccount = pubkeys.propellerRedeemerEscrow;
    // } else {
    // 	assert.ok(false);
    // }

    const txSig = await tx.rpc({ skipPreflight: true });
    await connection.confirmTransaction({
      signature: txSig,
      ...(await connection.getLatestBlockhash()),
    });

    propellerRedeemerEscrowAccount = (
      await getAccount(connection, propellerRedeemerEscrowAddr)
    ).address;
    // propellerRedeemerEscrowAccount = await getAccount(connection,propellerRedeemerEscrowAddr);
    // .then((address) => getAccount(connection, address));

    // const propellerData = await propellerProgram.account.propeller.fetch(propeller);
    expect(expectedPropellerAddr).toEqual(propeller);

    const expectedPropellerSenderAddr = await getPropellerSenderPda(
      propellerProgram.programId,
    );
    expect(propellerSender).toEqual(expectedPropellerSenderAddr);

    expect(propellerRedeemer).toEqual(expectedPropellerRedeemerAddr);

    const propellerAcct = await connection.getAccountInfo(propeller);
    console.info(`propellerAcct.owner: ${propellerAcct.owner.toBase58()}`);

    const propellerData = await propellerProgram.account.propeller.fetch(
      propeller,
    );
    console.info(`propellerData: ${JSON.stringify(propellerData)}`);
    expect(propellerData.governanceKey).toEqual(
      propellerGovernanceKey.publicKey,
    );
    expect(propellerData.swimUsdMint).toEqual(swimUsdMint);

    console.info(
      `gasKickstartAmount: ${propellerData.gasKickstartAmount.toString()}`,
    );
    // console.info(
    //   `propellerMinTransferAmount: ${propellerData.propellerMinTransferAmount.toString()}`,
    // );
    expect(propellerData.gasKickstartAmount.eq(gasKickstartAmount)).toEqual(
      true,
    );
    // expect(
    //   propellerData.propellerMinTransferAmount.eq(propellerMinTransferAmount),
    // ).toEqual(true);
    console.info(`
			propeller: ${propeller.toBase58()}
			propellerSender: ${propellerSender.toBase58()}
			propellerRedeemer: ${propellerRedeemer.toBase58()}
			propellerRedeemerEscrowAccount: ${propellerRedeemerEscrowAccount.toBase58()}
		`);
  });

  it("Creates Token Number Maps", async () => {
    const swimUsdTokenNumberMap = {
      pool: flagshipPool,
      poolTokenIndex: 0,
      poolTokenMint: swimUsdKeypair.publicKey,
      toTokenStep: { transfer: {} },
    };
    const usdcTokenNumberMap = {
      pool: flagshipPool,
      poolTokenIndex: usdcPoolTokenIndex,
      poolTokenMint: usdcKeypair.publicKey,
      toTokenStep: { removeExactBurn: {} },
    };
    const usdtTokenNumberMap = {
      pool: flagshipPool,
      poolTokenIndex: usdtPoolTokenIndex,
      poolTokenMint: usdtKeypair.publicKey,
      toTokenStep: { removeExactBurn: {} },
    };
    const metapoolMint1TokenNumberMap = {
      pool: metapool,
      poolTokenIndex: metapoolMint1PoolTokenIndex,
      poolTokenMint: metapoolMint1Keypair.publicKey,
      toTokenStep: { swapExactInput: {} },
    };

    const toTokenNumberMapAddrEntries = await Promise.all(
      [
        {
          toTokenNumber: SWIM_USD_TO_TOKEN_NUMBER,
          tokenNumberMap: swimUsdTokenNumberMap,
        },
        {
          toTokenNumber: USDC_TO_TOKEN_NUMBER,
          tokenNumberMap: usdcTokenNumberMap,
        },
        {
          toTokenNumber: USDT_TO_TOKEN_NUMBER,
          tokenNumberMap: usdtTokenNumberMap,
        },
        {
          toTokenNumber: metapoolMint1ToTokenNumber,
          tokenNumberMap: metapoolMint1TokenNumberMap,
        },
      ].map(async ({ toTokenNumber, tokenNumberMap }) => {
        console.info(`creating tokenNumberMap for ${toTokenNumber}`);
        const createTokenNumberMapTxn = propellerProgram.methods
          .createTokenNumberMap(
            toTokenNumber,
            tokenNumberMap.pool,
            tokenNumberMap.poolTokenIndex,
            tokenNumberMap.poolTokenMint,
            tokenNumberMap.toTokenStep,
          )
          .accounts({
            propeller,
            governanceKey: propellerGovernanceKey.publicKey,
            payer: payer.publicKey,
            systemProgram: web3.SystemProgram.programId,
            // rent: web3.SYSVAR_RENT_PUBKEY,
            pool: tokenNumberMap.pool,
            twoPoolProgram: twoPoolProgram.programId,
          })
          .signers([propellerGovernanceKey]);

        const pubkeys = await createTokenNumberMapTxn.pubkeys();
        if (!pubkeys.tokenNumberMap) {
          throw new Error("Token Id Map PDA Address was not auto-derived");
        }
        const tokenNumberMapAddr = pubkeys.tokenNumberMap;
        expect(tokenNumberMapAddr).toBeTruthy();

        const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
          await getToTokenNumberMapAddr(
            propeller,
            toTokenNumber,
            propellerProgram.programId,
          );

        expect(tokenNumberMapAddr).toEqual(calculatedTokenIdMap);
        await createTokenNumberMapTxn.rpc();

        const fetchedTokenIdMap =
          await propellerProgram.account.tokenNumberMap.fetch(
            tokenNumberMapAddr,
          );
        expect(fetchedTokenIdMap.toTokenNumber).toEqual(toTokenNumber);
        expect(fetchedTokenIdMap.pool).toEqual(tokenNumberMap.pool);
        expect(fetchedTokenIdMap.poolTokenIndex).toEqual(
          tokenNumberMap.poolTokenIndex,
        );
        expect(fetchedTokenIdMap.poolTokenMint).toEqual(
          tokenNumberMap.poolTokenMint,
        );
        expect(fetchedTokenIdMap.toTokenStep).toEqual(
          tokenNumberMap.toTokenStep,
        );
        expect(fetchedTokenIdMap.bump).toEqual(calculatedTokenIdMapBump);
        return { toTokenNumber, tokenNumberMapAddr };
      }),
    );

    outputTokenIdMappingAddrs = new Map(
      toTokenNumberMapAddrEntries.map(
        ({ toTokenNumber, tokenNumberMapAddr }) => {
          return [toTokenNumber, tokenNumberMapAddr];
        },
      ),
    );
    for (const [
      toTokenNumber,
      tokenNumberMapAddr,
    ] of outputTokenIdMappingAddrs.entries()) {
      console.info(`
        toTokenNumber: ${toTokenNumber}
        tokenNumberMapAddr: ${tokenNumberMapAddr.toBase58()}
        tokenNumberMap: ${JSON.stringify(
          await propellerProgram.account.tokenNumberMap.fetch(
            tokenNumberMapAddr,
          ),
        )}
      `);
    }
  });

  describe("Target Chain Maps", () => {
    it("Creates target chain maps", async () => {
      const targetChainMaps = await Promise.all(
        routingContracts.map(async ({ targetChainId, address }) => {
          const createTargetChainMap = propellerProgram.methods
            .createTargetChainMap(targetChainId, address)
            .accounts({
              propeller,
              governanceKey: propellerGovernanceKey.publicKey,
              payer: payer.publicKey,
              systemProgram: web3.SystemProgram.programId,
              // rent: web3.SYSVAR_RENT_PUBKEY,
            })
            .signers([propellerGovernanceKey]);

          const createTargetChainMapPubkeys =
            await createTargetChainMap.pubkeys();
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
    });
    it("Updates target chain maps", async () => {
      const targetChain = CHAIN_ID_ETH;
      const [targetChainMapAddr] = await getTargetChainMapAddr(
        propeller,
        targetChain,
        propellerProgram.programId,
      );
      const newTargetAddressNativeStr =
        "0x280999aB9aBfDe9DC5CE7aFB25497d6BB3e8bDD5";
      const newTargetAddress = Buffer.from(
        tryNativeToHexString(newTargetAddressNativeStr, targetChain),
        "hex",
      );
      await propellerProgram.methods
        .updateTargetChainMap(targetChain, newTargetAddress)
        .accounts({
          propeller,
          governanceKey: propellerGovernanceKey.publicKey,
          payer: payer.publicKey,
          targetChainMap: targetChainMapAddr,
        })
        .signers([propellerGovernanceKey])
        .rpc();

      const targetChainMapDataAfter =
        await propellerProgram.account.targetChainMap.fetch(targetChainMapAddr);
      expect(Buffer.from(targetChainMapDataAfter.targetAddress)).toEqual(
        newTargetAddress,
      );

      await propellerProgram.methods
        .updateTargetChainMap(targetChain, evmRoutingContractBuffer)
        .accounts({
          propeller,
          governanceKey: propellerGovernanceKey.publicKey,
          payer: payer.publicKey,
          targetChainMap: targetChainMapAddr,
        })
        .signers([propellerGovernanceKey])
        .rpc();

      const targetChainMapDataAfter2 =
        await propellerProgram.account.targetChainMap.fetch(targetChainMapAddr);
      expect(Buffer.from(targetChainMapDataAfter2.targetAddress)).toEqual(
        evmRoutingContractBuffer,
      );
    });
  });

  describe("InitToSwimUSD", () => {
    describe("for swimUSD pool", () => {
      it("crossChainInitToSwimUsd", async () => {
        const poolUserBalancesBefore = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          poolUsdcAtaAddr,
          poolUsdtAtaAddr,
          flagshipPoolGovernanceFeeAcct,
          userUsdcAtaAddr,
          userUsdtAtaAddr,
          userSwimUsdAtaAddr,
          flagshipPool,
          swimUsdKeypair.publicKey,
        );

        const inputAmounts = [
          new BN(50_000_000_000_000),
          new BN(50_000_000_000_000),
        ];
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
          payer,
        );
        const memoStr = createMemoId();

        const addTxn = propellerProgram.methods
          .crossChainInitToSwimUsd(inputAmounts, minimumMintAmount)
          .accounts({
            propeller: propeller,
            poolTokenAccount0: poolUsdcAtaAddr,
            poolTokenAccount1: poolUsdtAtaAddr,
            lpMint: swimUsdKeypair.publicKey,
            governanceFee: flagshipPoolGovernanceFeeAcct,
            userTransferAuthority: userTransferAuthority.publicKey,
            userTokenAccount0: userUsdcAtaAddr,
            userTokenAccount1: userUsdtAtaAddr,
            userLpTokenAccount: userSwimUsdAtaAddr,
            tokenProgram: splToken.programId,
            twoPoolProgram: twoPoolProgram.programId,
          })
          .preInstructions([...approveIxs])
          .postInstructions([
            ...revokeIxs,
            createMemoInstruction(memoStr.toString("hex")),
          ])
          .signers([userTransferAuthority]);
        // .rpc(rpcCommitmentConfig);

        const addTxnPubkeys = await addTxn.pubkeys();
        console.info(`addTxPubkeys: ${JSON.stringify(addTxnPubkeys, null, 2)}`);

        const addTxnSig = await addTxn.rpc(rpcCommitmentConfig);

        console.info(`addTxSig: ${addTxnSig}`);

        const poolUserBalancesAfter = await getPoolUserBalances(
          splToken,
          twoPoolProgram,
          poolUsdcAtaAddr,
          poolUsdtAtaAddr,
          flagshipPoolGovernanceFeeAcct,
          userUsdcAtaAddr,
          userUsdtAtaAddr,
          userSwimUsdAtaAddr,
          flagshipPool,
          swimUsdKeypair.publicKey,
        );
        printBeforeAndAfterPoolUserBalances(
          "add (non propeller-enabled) balances",
          [poolUserBalancesBefore, poolUserBalancesAfter],
        );

        const {
          poolTokenBalances: [
            poolUsdcAtaBalanceBefore,
            poolUsdtAtaBalanceBefore,
          ],
          governanceFeeBalance: governanceFeeBalanceBefore,
          userTokenBalances: [
            userUsdcAtaBalanceBefore,
            userUsdtAtaBalanceBefore,
          ],
          userLpTokenBalance: userLpTokenBalanceBefore,
          previousDepth: previousDepthBefore,
        } = poolUserBalancesBefore;

        const {
          poolTokenBalances: [poolUsdcAtaBalanceAfter, poolUsdtAtaBalanceAfter],
          governanceFeeBalance: governanceFeeBalanceAfter,
          userTokenBalances: [userUsdcAtaBalanceAfter, userUsdtAtaBalanceAfter],
          userLpTokenBalance: userLpTokenBalanceAfter,
          previousDepth: previousDepthAfter,
        } = poolUserBalancesAfter;

        expect(poolUsdcAtaBalanceAfter.gt(poolUsdcAtaBalanceBefore)).toEqual(
          true,
        );
        expect(poolUsdtAtaBalanceAfter.gt(poolUsdtAtaBalanceBefore)).toEqual(
          true,
        );
        expect(
          governanceFeeBalanceAfter.gte(governanceFeeBalanceBefore),
        ).toEqual(true);
        expect(userUsdcAtaBalanceAfter.lt(userUsdcAtaBalanceBefore)).toEqual(
          true,
        );
        expect(userUsdtAtaBalanceAfter.lt(userUsdtAtaBalanceBefore)).toEqual(
          true,
        );
        expect(userLpTokenBalanceAfter.gt(userLpTokenBalanceBefore)).toEqual(
          true,
        );
        expect(previousDepthAfter.gt(previousDepthBefore)).toEqual(true);
        await checkTxnLogsForMemo(addTxnSig, memoStr);
      });
      describe("propellerInitToSwimUsd", () => {
        it("executes successfully", async () => {
          const poolUserBalancesBefore = await getPoolUserBalances(
            splToken,
            twoPoolProgram,
            poolUsdcAtaAddr,
            poolUsdtAtaAddr,
            flagshipPoolGovernanceFeeAcct,
            userUsdcAtaAddr,
            userUsdtAtaAddr,
            userSwimUsdAtaAddr,
            flagshipPool,
            swimUsdKeypair.publicKey,
          );

          const inputAmounts = [new BN(50_000_000), new BN(50_000_000)];
          const userTransferAuthority = web3.Keypair.generate();
          const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
            splToken,
            [userUsdcAtaAddr, userUsdtAtaAddr],
            inputAmounts,
            userTransferAuthority.publicKey,
            payer,
          );
          const memoStr = createMemoId();

          const maxFee = new BN(100);
          const addTxn = propellerProgram.methods
            .propellerInitToSwimUsd(inputAmounts, maxFee)
            .accounts({
              propeller: propeller,
              poolTokenAccount0: poolUsdcAtaAddr,
              poolTokenAccount1: poolUsdtAtaAddr,
              lpMint: swimUsdKeypair.publicKey,
              governanceFee: flagshipPoolGovernanceFeeAcct,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0: userUsdcAtaAddr,
              userTokenAccount1: userUsdtAtaAddr,
              userLpTokenAccount: userSwimUsdAtaAddr,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
            })
            .preInstructions([...approveIxs])
            .postInstructions([
              ...revokeIxs,
              createMemoInstruction(memoStr.toString("hex")),
            ])
            .signers([userTransferAuthority]);
          // .rpc(rpcCommitmentConfig);

          const addTxnPubkeys = await addTxn.pubkeys();
          console.info(
            `addTxPubkeys: ${JSON.stringify(addTxnPubkeys, null, 2)}`,
          );

          const addTxnSig = await addTxn.rpc(rpcCommitmentConfig);

          console.info(`addTxSig: ${addTxnSig}`);

          const poolUserBalancesAfter = await getPoolUserBalances(
            splToken,
            twoPoolProgram,
            poolUsdcAtaAddr,
            poolUsdtAtaAddr,
            flagshipPoolGovernanceFeeAcct,
            userUsdcAtaAddr,
            userUsdtAtaAddr,
            userSwimUsdAtaAddr,
            flagshipPool,
            swimUsdKeypair.publicKey,
          );
          printBeforeAndAfterPoolUserBalances(
            "add (non propeller-enabled) balances",
            [poolUserBalancesBefore, poolUserBalancesAfter],
          );

          const {
            poolTokenBalances: [
              poolUsdcAtaBalanceBefore,
              poolUsdtAtaBalanceBefore,
            ],
            governanceFeeBalance: governanceFeeBalanceBefore,
            userTokenBalances: [
              userUsdcAtaBalanceBefore,
              userUsdtAtaBalanceBefore,
            ],
            userLpTokenBalance: userLpTokenBalanceBefore,
            previousDepth: previousDepthBefore,
          } = poolUserBalancesBefore;

          const {
            poolTokenBalances: [
              poolUsdcAtaBalanceAfter,
              poolUsdtAtaBalanceAfter,
            ],
            governanceFeeBalance: governanceFeeBalanceAfter,
            userTokenBalances: [
              userUsdcAtaBalanceAfter,
              userUsdtAtaBalanceAfter,
            ],
            userLpTokenBalance: userLpTokenBalanceAfter,
            previousDepth: previousDepthAfter,
          } = poolUserBalancesAfter;

          expect(poolUsdcAtaBalanceAfter.gt(poolUsdcAtaBalanceBefore)).toEqual(
            true,
          );
          expect(poolUsdtAtaBalanceAfter.gt(poolUsdtAtaBalanceBefore)).toEqual(
            true,
          );
          expect(
            governanceFeeBalanceAfter.gte(governanceFeeBalanceBefore),
          ).toEqual(true);
          expect(userUsdcAtaBalanceAfter.lt(userUsdcAtaBalanceBefore)).toEqual(
            true,
          );
          expect(userUsdtAtaBalanceAfter.lt(userUsdtAtaBalanceBefore)).toEqual(
            true,
          );
          expect(userLpTokenBalanceAfter.gt(userLpTokenBalanceBefore)).toEqual(
            true,
          );
          expect(previousDepthAfter.gt(previousDepthBefore)).toEqual(true);
          await checkTxnLogsForMemo(addTxnSig, memoStr);
        });
        it("fails if output amount < max fee", async () => {
          const inputAmounts = [new BN(50), new BN(50)];
          const userTransferAuthority = web3.Keypair.generate();
          const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
            splToken,
            [userUsdcAtaAddr, userUsdtAtaAddr],
            inputAmounts,
            userTransferAuthority.publicKey,
            payer,
          );
          const memoStr = createMemoId();

          const maxFee = new BN(50_000_000_000);
          await expect(() => {
            return propellerProgram.methods
              .propellerInitToSwimUsd(inputAmounts, maxFee)
              .accounts({
                propeller: propeller,
                poolTokenAccount0: poolUsdcAtaAddr,
                poolTokenAccount1: poolUsdtAtaAddr,
                lpMint: swimUsdKeypair.publicKey,
                governanceFee: flagshipPoolGovernanceFeeAcct,
                userTransferAuthority: userTransferAuthority.publicKey,
                userTokenAccount0: userUsdcAtaAddr,
                userTokenAccount1: userUsdtAtaAddr,
                userLpTokenAccount: userSwimUsdAtaAddr,
                tokenProgram: splToken.programId,
                twoPoolProgram: twoPoolProgram.programId,
              })
              .preInstructions([...approveIxs])
              .postInstructions([
                ...revokeIxs,
                createMemoInstruction(memoStr.toString("hex")),
              ])
              .signers([userTransferAuthority])
              .rpc();
          }).rejects.toThrow("Insufficient Amount being transferred");
        });
      });
    });
    describe("for metapool", () => {
      beforeAll(async () => {
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
          `inputAmounts: ${JSON.stringify(
            inputAmounts.map((x) => x.toString()),
          )}`,
        );
        // const inputAmounts = [
        //   //100_000_000_000
        //   new BN(2_000_000_000_000),
        //   //100_000_000_000_000
        //   new BN(1_000_000_000_000),
        // ];
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
          payer,
        );
        const seedMetapoolAccts = await getAddOrRemoveAccounts(
          metapool,
          payer.publicKey,
          userTransferAuthority.publicKey,
          twoPoolProgram,
        );
        const seedMetapoolTxn = await twoPoolProgram.methods
          .add(inputAmounts, minimumMintAmount)
          .accounts(seedMetapoolAccts)
          .preInstructions([...approveIxs])
          .postInstructions([...revokeIxs])
          .signers([userTransferAuthority])
          .rpc();

        console.info(`seedMetapoolTxn: ${seedMetapoolTxn}`);
        const poolUserBalancesAfter = await getPoolUserBalances(
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
        printBeforeAndAfterPoolUserBalances("seeding metapool", [
          poolUserBalancesBefore,
          poolUserBalancesAfter,
        ]);
      });
      it("crossChainInitToSwimUsd", async () => {
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
        printPoolUserBalances("poolUserBalancesBefore", poolUserBalancesBefore);
        const exactInputAmounts = [new BN(0), new BN(100_000)];
        const minimumOutputAmount = new BN(0);
        const userTransferAuthority = web3.Keypair.generate();
        const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
          splToken,
          [userMetapoolTokenAccount0, userMetapoolTokenAccount1],
          exactInputAmounts,
          userTransferAuthority.publicKey,
          payer,
        );
        const memoStr = createMemoId();

        const swapExactInputTxnSig = await propellerProgram.methods
          .crossChainInitToSwimUsd(exactInputAmounts, minimumOutputAmount)
          .accounts({
            propeller,
            poolTokenAccount0: metapoolPoolToken0Ata,
            poolTokenAccount1: metapoolPoolToken1Ata,
            lpMint: metapoolLpMintKeypair.publicKey,
            governanceFee: metapoolGovernanceFeeAta,
            userTransferAuthority: userTransferAuthority.publicKey,
            userTokenAccount0: userMetapoolTokenAccount0,
            userTokenAccount1: userMetapoolTokenAccount1,
            userLpTokenAccount: userMetapoolLpTokenAccount,
            tokenProgram: splToken.programId,
            twoPoolProgram: twoPoolProgram.programId,
          })
          .preInstructions([...approveIxs])
          .postInstructions([
            ...revokeIxs,
            createMemoInstruction(memoStr.toString("hex")),
          ])
          .signers([userTransferAuthority])
          .rpc(rpcCommitmentConfig);

        console.info(`swapExactInputTxnSig: ${swapExactInputTxnSig}`);
        await checkTxnLogsForMemo(swapExactInputTxnSig, memoStr);

        const poolUserBalancesAfter = await getPoolUserBalances(
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
        console.info(`swapExactInput (non propeller-enabled) balances`);
        printBeforeAndAfterPoolUserBalances(
          "swapExactInput (non propeller-enabled) balances",
          [poolUserBalancesBefore, poolUserBalancesAfter],
        );

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceBefore,
            poolToken1AtaBalanceBefore,
          ],
          governanceFeeBalance: governanceFeeBalanceBefore,
          userTokenBalances: [
            userToken0AtaBalanceBefore,
            userToken1AtaBalanceBefore,
          ],
          userLpTokenBalance: userLpTokenBalanceBefore,
          previousDepth: previousDepthBefore,
        } = poolUserBalancesBefore;

        const {
          poolTokenBalances: [
            poolToken0AtaBalanceAfter,
            poolToken1AtaBalanceAfter,
          ],
          governanceFeeBalance: governanceFeeBalanceAfter,
          userTokenBalances: [
            userToken0AtaBalanceAfter,
            userToken1AtaBalanceAfter,
          ],
          userLpTokenBalance: userLpTokenBalanceAfter,
          previousDepth: previousDepthAfter,
        } = poolUserBalancesAfter;

        expect(
          poolToken0AtaBalanceAfter.lt(poolToken0AtaBalanceBefore),
        ).toEqual(true);
        expect(
          poolToken1AtaBalanceAfter.gt(poolToken1AtaBalanceBefore),
        ).toEqual(true);

        expect(
          governanceFeeBalanceAfter.gt(governanceFeeBalanceBefore),
        ).toEqual(true);
        expect(
          userToken0AtaBalanceAfter.gt(userToken0AtaBalanceBefore),
        ).toEqual(true);
        expect(
          userToken1AtaBalanceAfter.eq(
            userToken1AtaBalanceBefore.sub(exactInputAmounts[1]),
          ),
        ).toEqual(true);
        expect(userLpTokenBalanceAfter.eq(userLpTokenBalanceBefore)).toEqual(
          true,
        );
        expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
      });
      describe("propellerInitToSwimUsd", () => {
        it("executes successfully", async () => {
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
            "poolUserBalancesBefore",
            poolUserBalancesBefore,
          );
          const exactInputAmounts = [new BN(0), new BN(100_000)];
          const maxFee = new BN(0);
          const userTransferAuthority = web3.Keypair.generate();
          const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
            splToken,
            [userMetapoolTokenAccount0, userMetapoolTokenAccount1],
            exactInputAmounts,
            userTransferAuthority.publicKey,
            payer,
          );

          const memoStr = createMemoId();

          const swapExactInputTxn = propellerProgram.methods
            .propellerInitToSwimUsd(exactInputAmounts, maxFee)
            .accounts({
              propeller,
              poolTokenAccount0: metapoolPoolToken0Ata,
              poolTokenAccount1: metapoolPoolToken1Ata,
              lpMint: metapoolLpMintKeypair.publicKey,
              governanceFee: metapoolGovernanceFeeAta,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0: userMetapoolTokenAccount0,
              userTokenAccount1: userMetapoolTokenAccount1,
              userLpTokenAccount: userMetapoolLpTokenAccount,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
            })
            .preInstructions([...approveIxs])
            .postInstructions([
              ...revokeIxs,
              createMemoInstruction(memoStr.toString("hex")),
            ])
            .signers([userTransferAuthority]);
          // .rpc(rpcCommitmentConfig);

          const swapExactInputTxnPubkeys = await swapExactInputTxn.pubkeys();
          console.info(
            `swapExactInputTxPubkeys: ${JSON.stringify(
              swapExactInputTxnPubkeys,
              null,
              2,
            )}`,
          );

          const swapExactInputTxnSig = await swapExactInputTxn.rpc(
            rpcCommitmentConfig,
          );
          console.info(`swapExactInputTxnSig: ${swapExactInputTxnSig}`);
          await checkTxnLogsForMemo(swapExactInputTxnSig, memoStr);

          const poolUserBalancesAfter = await getPoolUserBalances(
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
          console.info(`swapExactInput (non propeller-enabled) balances`);
          printBeforeAndAfterPoolUserBalances(
            "swapExactInput (non propeller-enabled) balances",
            [poolUserBalancesBefore, poolUserBalancesAfter],
          );

          const {
            poolTokenBalances: [
              poolToken0AtaBalanceBefore,
              poolToken1AtaBalanceBefore,
            ],
            governanceFeeBalance: governanceFeeBalanceBefore,
            userTokenBalances: [
              userToken0AtaBalanceBefore,
              userToken1AtaBalanceBefore,
            ],
            userLpTokenBalance: userLpTokenBalanceBefore,
            previousDepth: previousDepthBefore,
          } = poolUserBalancesBefore;

          const {
            poolTokenBalances: [
              poolToken0AtaBalanceAfter,
              poolToken1AtaBalanceAfter,
            ],
            governanceFeeBalance: governanceFeeBalanceAfter,
            userTokenBalances: [
              userToken0AtaBalanceAfter,
              userToken1AtaBalanceAfter,
            ],
            userLpTokenBalance: userLpTokenBalanceAfter,
            previousDepth: previousDepthAfter,
          } = poolUserBalancesAfter;

          expect(
            poolToken0AtaBalanceAfter.lt(poolToken0AtaBalanceBefore),
          ).toEqual(true);
          expect(
            poolToken1AtaBalanceAfter.gt(poolToken1AtaBalanceBefore),
          ).toEqual(true);

          expect(
            governanceFeeBalanceAfter.gt(governanceFeeBalanceBefore),
          ).toEqual(true);
          expect(
            userToken0AtaBalanceAfter.gt(userToken0AtaBalanceBefore),
          ).toEqual(true);
          expect(
            userToken1AtaBalanceAfter.eq(
              userToken1AtaBalanceBefore.sub(exactInputAmounts[1]),
            ),
          ).toEqual(true);
          expect(userLpTokenBalanceAfter.eq(userLpTokenBalanceBefore)).toEqual(
            true,
          );
          expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
        });
        it("fails if output amount < max fee", async () => {
          const exactInputAmounts = [new BN(0), new BN(100_000_000)];
          const maxFee = new BN(100_000_000_000);
          const userTransferAuthority = web3.Keypair.generate();
          const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
            splToken,
            [userMetapoolTokenAccount0, userMetapoolTokenAccount1],
            exactInputAmounts,
            userTransferAuthority.publicKey,
            payer,
          );
          const memoStr = createMemoId();

          const swapExactInputTxn = propellerProgram.methods
            .propellerInitToSwimUsd(exactInputAmounts, maxFee)
            .accounts({
              propeller,
              poolTokenAccount0: metapoolPoolToken0Ata,
              poolTokenAccount1: metapoolPoolToken1Ata,
              lpMint: metapoolLpMintKeypair.publicKey,
              governanceFee: metapoolGovernanceFeeAta,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0: userMetapoolTokenAccount0,
              userTokenAccount1: userMetapoolTokenAccount1,
              userLpTokenAccount: userMetapoolLpTokenAccount,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
            })
            .preInstructions([...approveIxs])
            .postInstructions([
              ...revokeIxs,
              createMemoInstruction(memoStr.toString("hex")),
            ])
            .signers([userTransferAuthority]);
          await expect(swapExactInputTxn.rpc()).rejects.toThrow(
            "Insufficient Amount being transferred",
          );
        });
      });
    });
  });

  describe("propeller wormhole ixs", () => {
    it("calls crossChainTransferNativeWithPayload", async () => {
      const userLpTokenBalanceBefore = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;

      try {
        await splToken.account.token.fetch(custody);
        expect(false).toBeTruthy();
      } catch (e) {
        console.info(
          `expected err from fetching custody account: ${JSON.stringify(e)}`,
        );
      }
      const custodyAmountBefore = new BN(0);
      const transferAmount = new BN(100_000_000);

      const memo = createMemoId();
      const wormholeMessage = web3.Keypair.generate();

      const nonce = createNonce().readUInt32LE(0);
      const targetChain = CHAIN_ID_ETH;
      const [targetChainMap] = await getTargetChainMapAddr(
        propeller,
        targetChain,
        propellerProgram.programId,
      );
      const transferNativeTxn = await propellerProgram.methods
        .crossChainTransferNativeWithPayload(
          nonce,
          transferAmount,
          targetChain,
          evmOwner,
        )
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
          targetChainMap,
        })
        .preInstructions([setComputeUnitLimitIx])
        .postInstructions([createMemoInstruction(memo.toString("hex"))])
        .transaction();

      const transferNativeTxnSig = await provider.sendAndConfirm(
        transferNativeTxn,
        [payer, wormholeMessage],
        rpcCommitmentConfig,
      );

      const transferNativeTxnSize = transferNativeTxn.serialize().length;
      console.info(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`);
      await connection.confirmTransaction({
        signature: transferNativeTxnSig,
        ...(await connection.getLatestBlockhash()),
      });

      const userLpTokenBalanceAfter2 = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      console.info(
        `userLpTokenBalanceAfter2: ${userLpTokenBalanceAfter2.toString()}`,
      );
      expect(
        userLpTokenBalanceAfter2.eq(
          userLpTokenBalanceBefore.sub(transferAmount),
        ),
      ).toEqual(true);

      const custodyAmountAfter = (await splToken.account.token.fetch(custody))
        .amount;
      console.info(`custodyAmountAfter: ${custodyAmountAfter.toString()}`);
      expect(
        custodyAmountAfter.eq(custodyAmountBefore.add(transferAmount)),
      ).toEqual(true);

      const messageAccountInfo = await connection.getAccountInfo(
        wormholeMessage.publicKey,
      );
      if (!messageAccountInfo) {
        throw new Error("No Message Account Info found");
      }
      console.info(
        `messageAccountInfo: ${JSON.stringify(messageAccountInfo.data)}`,
      );

      const parsedTokenTransferWithSwimPayloadPostedMessage =
        await parseTokenTransferWithSwimPayloadPostedMessage(
          messageAccountInfo.data,
        );
      console.info(`
      parsedTokenTransferWithSwimPayloadPostedMessage:
        ${JSON.stringify(
          formatParsedTokenTransferWithSwimPayloadPostedMessage(
            parsedTokenTransferWithSwimPayloadPostedMessage,
          ),
          null,
          2,
        )}
      `);

      const { tokenTransferMessage, swimPayload } =
        parsedTokenTransferWithSwimPayloadPostedMessage;

      const tokenTransferTo = tokenTransferMessage.tokenTransfer.to;
      expect(uint8ArrayToHex(tokenTransferTo)).toEqual(
        evmRoutingContractHexStr,
      );
      const formattedTokenTransferMessage =
        formatParsedTokenTransferPostedMessage(tokenTransferMessage);
      console.info(
        `formattedTokenTransferMessage: ${JSON.stringify(
          formattedTokenTransferMessage,
          null,
          2,
        )}`,
      );
      expect(swimPayload.owner).toEqual(evmOwner);
      expect(swimPayload.propellerEnabled).toBeUndefined();
      expect(swimPayload.gasKickstart).toBeUndefined();
      expect(swimPayload.maxFee).toBeUndefined();
      expect(swimPayload.targetTokenId).toBeUndefined();
      expect(swimPayload.memo).toBeUndefined();
    });

    it("calls propellerTransferNativeWithPayload with memo", async () => {
      const userLpTokenBalanceBefore = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;

      try {
        await splToken.account.token.fetch(custody);
        expect(false).toBeTruthy();
      } catch (e) {
        console.info(
          `expected err from fetching custody account: ${JSON.stringify(e)}`,
        );
      }
      const custodyAmountBefore = (await splToken.account.token.fetch(custody))
        .amount;
      const transferAmount = new BN(100_000_000);

      const memo = createMemoId();
      const wormholeMessage = web3.Keypair.generate();
      const gasKickstart = false;
      const maxFee = new BN(100_000);
      const nonce = createNonce().readUInt32LE(0);

      const targetChain = CHAIN_ID_ETH;
      const [targetChainMap] = await getTargetChainMapAddr(
        propeller,
        targetChain,
        propellerProgram.programId,
      );
      const propellerTransferNativeTxn = await propellerProgram.methods
        .propellerTransferNativeWithPayload(
          nonce,
          transferAmount,
          targetChain,
          evmOwner,
          gasKickstart,
          maxFee,
          evmTargetTokenId,
          memo,
        )
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
          targetChainMap,
        })
        .preInstructions([setComputeUnitLimitIx])
        .postInstructions([createMemoInstruction(memo.toString("hex"))])
        .transaction();

      const propellerTransferNativeTxnSig = await provider.sendAndConfirm(
        propellerTransferNativeTxn,
        [payer, wormholeMessage],
        rpcCommitmentConfig,
      );

      const transferNativeTxnSize =
        propellerTransferNativeTxn.serialize().length;
      console.info(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`);
      await connection.confirmTransaction({
        signature: propellerTransferNativeTxnSig,
        ...(await connection.getLatestBlockhash()),
      });

      const userLpTokenBalanceAfter2 = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      console.info(
        `userLpTokenBalanceAfter2: ${userLpTokenBalanceAfter2.toString()}`,
      );
      expect(
        userLpTokenBalanceAfter2.eq(
          userLpTokenBalanceBefore.sub(transferAmount),
        ),
      ).toEqual(true);

      const custodyAmountAfter = (await splToken.account.token.fetch(custody))
        .amount;
      console.info(`custodyAmountAfter: ${custodyAmountAfter.toString()}`);
      expect(
        custodyAmountAfter.eq(custodyAmountBefore.add(transferAmount)),
      ).toEqual(true);

      const messageAccountInfo = await connection.getAccountInfo(
        wormholeMessage.publicKey,
      );
      if (!messageAccountInfo) {
        throw new Error("No Message Account Info found");
      }
      console.info(
        `messageAccountInfo: ${JSON.stringify(messageAccountInfo.data)}`,
      );

      const parsedTokenTransferWithSwimPayloadPostedMessage =
        await parseTokenTransferWithSwimPayloadPostedMessage(
          messageAccountInfo.data,
        );
      console.info(`
      parsedTokenTransferWithSwimPayloadPostedMessage:
        ${JSON.stringify(
          formatParsedTokenTransferWithSwimPayloadPostedMessage(
            parsedTokenTransferWithSwimPayloadPostedMessage,
          ),
          null,
          2,
        )}
      `);

      const { tokenTransferMessage, swimPayload } =
        parsedTokenTransferWithSwimPayloadPostedMessage;

      expect(swimPayload.maxFee.eq(maxFee)).toBeTruthy();
      const tokenTransferTo = tokenTransferMessage.tokenTransfer.to;
      expect(uint8ArrayToHex(tokenTransferTo)).toEqual(
        evmRoutingContractHexStr,
      );
      const formattedTokenTransferMessage =
        formatParsedTokenTransferPostedMessage(tokenTransferMessage);
      console.info(
        `formattedTokenTransferMessage: ${JSON.stringify(
          formattedTokenTransferMessage,
          null,
          2,
        )}`,
      );
      expect(swimPayload.owner).toEqual(evmOwner);
      expect(swimPayload.propellerEnabled).toEqual(true);
      expect(swimPayload.gasKickstart).toEqual(gasKickstart);
      expect(swimPayload.maxFee).toEqual(maxFee);
      expect(swimPayload.targetTokenId).toEqual(evmTargetTokenId);
      expect(swimPayload.memo.toString("hex")).toEqual(memo.toString("hex"));
      await checkTxnLogsForMemo(propellerTransferNativeTxnSig, memo);
    });

    it("calls propellerTransferNativeWithPayload without memo", async () => {
      const userLpTokenBalanceBefore = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;

      try {
        await splToken.account.token.fetch(custody);
        expect(false).toBeTruthy();
      } catch (e) {
        console.info(
          `expected err from fetching custody account: ${JSON.stringify(e)}`,
        );
      }
      const custodyAmountBefore = (await splToken.account.token.fetch(custody))
        .amount;
      const transferAmount = new BN(100_000_000);
      const memo = createMemoId();
      const wormholeMessage = web3.Keypair.generate();
      const gasKickstart = false;
      const maxFee = new BN(100_000);
      const nonce = createNonce().readUInt32LE(0);
      const targetChain = CHAIN_ID_ETH;
      const [targetChainMap] = await getTargetChainMapAddr(
        propeller,
        targetChain,
        propellerProgram.programId,
      );

      const propellerTransferNativeTxn = await propellerProgram.methods
        .propellerTransferNativeWithPayload(
          nonce,
          transferAmount,
          targetChain,
          evmOwner,
          gasKickstart,
          maxFee,
          evmTargetTokenId,
          null,
        )
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
          targetChainMap,
        })
        .preInstructions([setComputeUnitLimitIx])
        .transaction();

      const transferNativeTxnSig = await provider.sendAndConfirm(
        propellerTransferNativeTxn,
        [payer, wormholeMessage],
        rpcCommitmentConfig,
      );

      const transferNativeTxnSize =
        propellerTransferNativeTxn.serialize().length;
      console.info(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`);
      await connection.confirmTransaction({
        signature: transferNativeTxnSig,
        ...(await connection.getLatestBlockhash()),
      });

      const userLpTokenBalanceAfter2 = (
        await splToken.account.token.fetch(userSwimUsdAtaAddr)
      ).amount;
      console.info(
        `userLpTokenBalanceAfter2: ${userLpTokenBalanceAfter2.toString()}`,
      );
      expect(
        userLpTokenBalanceAfter2.eq(
          userLpTokenBalanceBefore.sub(transferAmount),
        ),
      ).toEqual(true);

      const custodyAmountAfter = (await splToken.account.token.fetch(custody))
        .amount;
      console.info(`custodyAmountAfter: ${custodyAmountAfter.toString()}`);
      expect(
        custodyAmountAfter.eq(custodyAmountBefore.add(transferAmount)),
      ).toEqual(true);

      const messageAccountInfo = await connection.getAccountInfo(
        wormholeMessage.publicKey,
      );
      if (!messageAccountInfo) {
        throw new Error("No Message Account Info found");
      }
      console.info(
        `messageAccountInfo: ${JSON.stringify(messageAccountInfo.data)}`,
      );

      const parsedTokenTransferWithSwimPayloadPostedMessage =
        await parseTokenTransferWithSwimPayloadPostedMessage(
          messageAccountInfo.data,
        );
      console.info(`
      parsedTokenTransferWithSwimPayloadPostedMessage:
        ${JSON.stringify(
          formatParsedTokenTransferWithSwimPayloadPostedMessage(
            parsedTokenTransferWithSwimPayloadPostedMessage,
          ),
          null,
          2,
        )}
      `);

      const { tokenTransferMessage, swimPayload } =
        parsedTokenTransferWithSwimPayloadPostedMessage;

      expect(swimPayload.maxFee.eq(maxFee)).toBeTruthy();
      const tokenTransferTo = tokenTransferMessage.tokenTransfer.to;
      expect(uint8ArrayToHex(tokenTransferTo)).toEqual(
        evmRoutingContractHexStr,
      );
      const formattedTokenTransferMessage =
        formatParsedTokenTransferPostedMessage(tokenTransferMessage);
      console.info(
        `formattedTokenTransferMessage: ${JSON.stringify(
          formattedTokenTransferMessage,
          null,
          2,
        )}`,
      );
      expect(swimPayload.owner).toEqual(evmOwner);
      expect(swimPayload.propellerEnabled).toEqual(true);
      expect(swimPayload.gasKickstart).toEqual(gasKickstart);
      expect(swimPayload.maxFee).toEqual(maxFee);
      expect(swimPayload.targetTokenId).toEqual(evmTargetTokenId);
      expect(swimPayload.memo).toBeUndefined();
      await checkTxnLogsForMemo(transferNativeTxnSig, memo, false);
    });

    describe("error cases", () => {
      it("Fails propellerTransferNativeWithPayload if transferAmount <= maxFee for targetChain", async () => {
        const transferAmount = new BN(100_000_000);

        const wormholeMessage = web3.Keypair.generate();
        const gasKickstart = false;
        const maxFee = transferAmount.add(new BN(1));
        const nonce = createNonce().readUInt32LE(0);
        await expect(() => {
          return propellerProgram.methods
            .propellerTransferNativeWithPayload(
              nonce,
              transferAmount,
              CHAIN_ID_ETH,
              evmOwner,
              gasKickstart,
              maxFee,
              evmTargetTokenId,
              null,
            )
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
            .signers([wormholeMessage])
            .preInstructions([setComputeUnitLimitIx])
            .rpc();
        }).rejects.toThrow("Insufficient Amount being transferred");
      });
      it("fails if targetChain is paused", async () => {
        const targetChain = CHAIN_ID_ETH;
        let isPaused = true;
        const [targetChainMapAddr] = await getTargetChainMapAddr(
          propeller,
          targetChain,
          propellerProgram.programId,
        );
        await propellerProgram.methods
          .targetChainMapSetPaused(targetChain, isPaused)
          .accounts({
            propeller,
            pauseKey: propellerPauseKey.publicKey,
            payer: payer.publicKey,
            targetChainMap: targetChainMapAddr,
          })
          .signers([propellerPauseKey])
          .rpc();

        const targetChainMapData =
          await propellerProgram.account.targetChainMap.fetch(
            targetChainMapAddr,
          );
        expect(targetChainMapData.isPaused).toEqual(isPaused);
        const transferAmount = new BN(100_000_000);

        const memo = createMemoId();
        let wormholeMessage = web3.Keypair.generate();

        const nonce = createNonce().readUInt32LE(0);
        await expect(() => {
          return propellerProgram.methods
            .crossChainTransferNativeWithPayload(
              nonce,
              transferAmount,
              targetChain,
              evmOwner,
            )
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
            .postInstructions([createMemoInstruction(memo.toString("hex"))])
            .signers([wormholeMessage])
            .rpc();
        }).rejects.toThrow("Target Chain is paused");

        wormholeMessage = web3.Keypair.generate();
        const gasKickstart = false;
        const maxFee = new BN(100_000);

        await expect(() => {
          return propellerProgram.methods
            .propellerTransferNativeWithPayload(
              nonce,
              transferAmount,
              targetChain,
              evmOwner,
              gasKickstart,
              maxFee,
              evmTargetTokenId,
              null,
            )
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
        }).rejects.toThrow("Target Chain is paused");

        isPaused = false;
        await propellerProgram.methods
          .targetChainMapSetPaused(targetChain, isPaused)
          .accounts({
            propeller,
            pauseKey: propellerPauseKey.publicKey,
            payer: payer.publicKey,
            targetChainMap: targetChainMapAddr,
          })
          .signers([propellerPauseKey])
          .rpc();

        const targetChainMapDataAfter =
          await propellerProgram.account.targetChainMap.fetch(
            targetChainMapAddr,
          );
        expect(targetChainMapDataAfter.isPaused).toEqual(isPaused);

        await propellerProgram.methods
          .propellerTransferNativeWithPayload(
            nonce,
            transferAmount,
            targetChain,
            evmOwner,
            gasKickstart,
            maxFee,
            evmTargetTokenId,
            null,
          )
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
      });
    });

    describe("User submitted CompleteWithPayload and ProcessSwimPayload", () => {
      const propellerEnabled = false;
      const gasKickstart = false;

      describe("for token from flagship pool as output token", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let swimPayloadMessage: web3.PublicKey;

        const targetTokenId = USDC_TO_TOKEN_NUMBER;
        const memoStr = createMemoId();

        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          // const maxFee = new BN(1_000_000_000);
          const swimPayload = {
            version: swimPayloadVersion,
            owner: provider.publicKey.toBuffer(),
          };

          const amount = parseUnits("1", mintDecimal);
          console.info(`amount: ${amount.toString()}`);
          const tokenTransferWithPayloadSignedVaa =
            dummyEthTokenBridge.createSignedTokenTransferWithSwimPayloadVAA(
              amount.toString(),
              swimPayload,
            );
          const propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;

          await postVaaSolanaWithRetry(
            connection,
            async (tx) => {
              return provider.wallet.signTransaction(tx);
            },
            WORMHOLE_CORE_BRIDGE.toBase58(),
            payer.publicKey.toBase58(),
            tokenTransferWithPayloadSignedVaa,
            10,
          );

          [wormholeMessage] = await deriveMessagePda(
            tokenTransferWithPayloadSignedVaa,
            WORMHOLE_CORE_BRIDGE,
          );
          const wormholeMessageAccount = await connection.getAccountInfo(
            wormholeMessage,
          );
          if (!wormholeMessageAccount) {
            throw new Error("Wormhole message account not found");
          }
          const {
            swimPayload: swimPayloadFromPostVaa,
            tokenTransferMessage: tokenTransferMessageFromPostVaa,
          } = await parseTokenTransferWithSwimPayloadPostedMessage(
            wormholeMessageAccount.data,
          );
          expect(tokenTransferMessageFromPostVaa.tokenTransfer.amount).toEqual(
            amount.toString(),
          );
          expect(swimPayloadFromPostVaa.owner).toEqual(
            provider.publicKey.toBuffer(),
          );

          const [ethEndpointAccount] = await deriveEndpointPda(
            CHAIN_ID_ETH,
            ethTokenBridge,
            // parsedVaa.emitterChain,
            // parsedVaa.emitterAddress,
            WORMHOLE_TOKEN_BRIDGE,
          );
          console.info(`endpointAccount: ${ethEndpointAccount.toBase58()}`);
          wormholeClaim = await getClaimAddressSolana(
            WORMHOLE_TOKEN_BRIDGE.toBase58(),
            tokenTransferWithPayloadSignedVaa,
          );

          const completeNativeWithPayloadIxs = propellerProgram.methods
            .completeNativeWithPayload()
            .accounts({
              propeller,
              payer: payer.publicKey,
              tokenBridgeConfig,
              // userTokenBridgeAccount: userLpTokenAccount.address,
              message: wormholeMessage,
              claim: wormholeClaim,
              endpoint: ethEndpointAccount,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              feeVault: propellerFeeVault,
              custody: custody,
              swimUsdMint: swimUsdMint,
              custodySigner,
              rent: web3.SYSVAR_RENT_PUBKEY,
              systemProgram: web3.SystemProgram.programId,
              wormhole,
              tokenProgram: splToken.programId,
              tokenBridge,
            })
            .preInstructions([setComputeUnitLimitIx])
            .postInstructions([createMemoInstruction(memoStr.toString("hex"))]);

          const completeNativeWithPayloadPubkeys =
            await completeNativeWithPayloadIxs.pubkeys();

          if (!completeNativeWithPayloadPubkeys.swimPayloadMessage) {
            throw new Error("swimPayloadMessage key not derived");
          }
          console.info(
            `completeNativeWithPayloadPubkeys: ${JSON.stringify(
              completeNativeWithPayloadPubkeys,
              null,
              2,
            )}`,
          );

          const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
            await getSwimPayloadMessagePda(
              wormholeClaim,
              propellerProgram.programId,
            );

          expect(expectedSwimPayloadMessage.toBase58()).toEqual(
            completeNativeWithPayloadPubkeys.swimPayloadMessage.toBase58(),
          );

          swimPayloadMessage =
            completeNativeWithPayloadPubkeys.swimPayloadMessage;

          const completeNativeWithPayloadTxn =
            await completeNativeWithPayloadIxs.transaction();
          const completeNativeWithPayloadTxnSig = await provider.sendAndConfirm(
            completeNativeWithPayloadTxn,
            [payer],
            {
              skipPreflight: true,
            },
          );

          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              completeNativeWithPayloadPubkeys.swimPayloadMessage,
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
          expect(swimPayloadMessageAccount.claim).toEqual(wormholeClaim);
          expect(
            Buffer.from(swimPayloadMessageAccount.vaaEmitterAddress),
          ).toEqual(dummyEthTokenBridge.emitterAddress);
          expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
            dummyEthTokenBridge.emitterChain,
          );
          expect(
            swimPayloadMessageAccount.vaaSequence.eq(
              new BN(dummyEthTokenBridge.sequence),
            ),
          ).toBeTruthy();
          expect(
            swimPayloadMessageAccount.transferAmount.eq(
              new BN(amount.toString()),
            ),
          ).toBeTruthy();

          expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          const swimPayloadMessageOwnerPubKey = new PublicKey(
            swimPayloadMessageAccount.owner,
          );
          expect(swimPayloadMessageOwnerPubKey).toEqual(
            provider.wallet.publicKey,
          );
          expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
            propellerEnabled,
          );
          expect(swimPayloadMessageAccount.gasKickstart).toEqual(gasKickstart);

          const completeNativeWithPayloadTxnSize =
            completeNativeWithPayloadTxn.serialize().length;
          console.info(
            `completeNativeWithPayloadTxnSize: ${completeNativeWithPayloadTxnSize}`,
          );
          await connection.confirmTransaction({
            signature: completeNativeWithPayloadTxnSig,
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
          await checkTxnLogsForMemo(completeNativeWithPayloadTxnSig, memoStr);
          const swimPayloadMessageAccountInfo = await connection.getAccountInfo(
            swimPayloadMessage,
          );
          console.info(`
            swimPayloadMessageAccountInfo: ${JSON.stringify(
              swimPayloadMessageAccountInfo,
              null,
              2,
            )}
          `);
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
          const minOutputAmount = new BN(0);
          const processSwimPayloadIxs = propellerProgram.methods
            .processSwimPayload(targetTokenId, minOutputAmount)
            .accounts({
              propeller,
              payer: payer.publicKey,
              claim: wormholeClaim,
              swimPayloadMessage,
              swimPayloadMessagePayer: payer.publicKey,
              redeemer: propellerRedeemer,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              // tokenIdMap: ?
              pool,
              poolTokenAccount0,
              poolTokenAccount1,
              lpMint,
              governanceFee: governanceFeeAcct,
              userTokenAccount0,
              userTokenAccount1,
              userLpTokenAccount,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
              systemProgram: web3.SystemProgram.programId,
            })
            .preInstructions([setComputeUnitLimitIx])
            .postInstructions([createMemoInstruction(memoStr.toString("hex"))]);

          const processSwimPayloadPubkeys =
            await processSwimPayloadIxs.pubkeys();
          console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
          if (!processSwimPayloadPubkeys.tokenNumberMap) {
            throw new Error("tokenIdMap not derived");
          }
          const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
            await getToTokenNumberMapAddr(
              propeller,
              swimPayloadMessageAccountTargetTokenId,
              propellerProgram.programId,
            );

          const expectedTokenIdMap =
            outputTokenIdMappingAddrs.get(targetTokenId);
          if (!expectedTokenIdMap) {
            throw new Error("expectedTokenIdMap not found");
          }
          const expectedTokenIdMapAcct =
            await propellerProgram.account.tokenNumberMap.fetch(
              expectedTokenIdMap,
            );
          console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
          const derivedTokenIdMap = processSwimPayloadPubkeys.tokenNumberMap;
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
            await processSwimPayloadIxs.rpc();
          console.info(`processSwimPayloadTxnSig: ${processSwimPayloadTxnSig}`);
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

        //TODO: add min_output_amount test cases
      });

      describe("for swimUSD as output token", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let swimPayloadMessage: web3.PublicKey;

        const targetTokenId = SWIM_USD_TO_TOKEN_NUMBER;

        const memoStr = createMemoId();
        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          // const maxFee = new BN(1000000000);
          const swimPayload = {
            version: swimPayloadVersion,
            owner: provider.publicKey.toBuffer(),
          };

          const amount = parseUnits("1", mintDecimal);
          console.info(`amount: ${amount.toString()}`);

          const tokenTransferWithPayloadSignedVaa =
            dummyEthTokenBridge.createSignedTokenTransferWithSwimPayloadVAA(
              amount.toString(),
              swimPayload,
            );
          const propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;

          await postVaaSolanaWithRetry(
            connection,
            // eslint-disable-next-line @typescript-eslint/require-await
            async (tx) => {
              tx.partialSign(payer);
              return tx;
            },
            WORMHOLE_CORE_BRIDGE.toBase58(),
            payer.publicKey.toBase58(),
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
              payer: payer.publicKey,
              tokenBridgeConfig,
              // userTokenBridgeAccount: userLpTokenAccount.address,
              message: wormholeMessage,
              claim: wormholeClaim,
              endpoint: endpointAccount,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              feeVault: propellerFeeVault,
              custody: custody,
              swimUsdMint: swimUsdMint,
              custodySigner,
              rent: web3.SYSVAR_RENT_PUBKEY,
              systemProgram: web3.SystemProgram.programId,
              wormhole,
              tokenProgram: splToken.programId,
              tokenBridge,
            })
            .preInstructions([setComputeUnitLimitIx])
            .postInstructions([createMemoInstruction(memoStr.toString("hex"))]);

          const completeNativeWithPayloadSwimUsdPubkeys =
            await completeNativeWithPayloadSwimUsdIxs.pubkeys();

          if (!completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage) {
            throw new Error("swimPayloadMessage key not derived");
          }
          console.info(
            `completeNativeWithPayloadSwimUsdPubkeys: ${JSON.stringify(
              completeNativeWithPayloadSwimUsdPubkeys,
              null,
              2,
            )}`,
          );

          const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
            await getSwimPayloadMessagePda(
              wormholeClaim,
              propellerProgram.programId,
            );
          expect(expectedSwimPayloadMessage.toBase58()).toEqual(
            completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage.toBase58(),
          );

          swimPayloadMessage =
            completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage;

          const completeNativeWithPayloadSwimUsdTxn =
            await completeNativeWithPayloadSwimUsdIxs.transaction();
          const completeNativeWithPayloadSwimUsdTxnSig =
            await provider.sendAndConfirm(
              completeNativeWithPayloadSwimUsdTxn,
              [payer],
              {
                skipPreflight: true,
              },
            );

          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage,
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
          ).toEqual(dummyEthTokenBridge.emitterAddress);
          expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
            dummyEthTokenBridge.emitterChain,
          );
          expect(
            swimPayloadMessageAccount.vaaSequence.eq(
              new BN(dummyEthTokenBridge.sequence),
            ),
          ).toBeTruthy();
          expect(
            swimPayloadMessageAccount.transferAmount.eq(
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
          // } = swimPayloadMessageAccount.swimPayload;
          expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          expect(swimPayloadMessageAccount.targetTokenId).toEqual(
            targetTokenId,
          );
          const swimPayloadMessageOwnerPubKey = new PublicKey(
            swimPayloadMessageAccount.owner,
          );
          expect(swimPayloadMessageOwnerPubKey).toEqual(
            provider.wallet.publicKey,
          );
          expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
            propellerEnabled,
          );
          expect(swimPayloadMessageAccount.gasKickstart).toEqual(gasKickstart);

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
          const lpMint = swimUsdMint;
          const governanceFeeAcct = flagshipPoolGovernanceFeeAcct;
          const userTokenAccount0 = userUsdcAtaAddr;
          const userTokenAccount1 = userUsdtAtaAddr;
          const userLpTokenAccount = userSwimUsdAtaAddr;

          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              swimPayloadMessage,
            );
          const swimPayloadMessageAccountToTokenNumber =
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
          const userLpTokenAccountBalanceBefore = (
            await splToken.account.token.fetch(userLpTokenAccount)
          ).amount;
          const minOutputAmount = new BN(0);
          const processSwimPayload = propellerProgram.methods
            .processSwimPayload(targetTokenId, minOutputAmount)
            .accounts({
              propeller,
              payer: payer.publicKey,
              claim: wormholeClaim,
              swimPayloadMessage,
              swimPayloadMessagePayer: payer.publicKey,
              redeemer: propellerRedeemer,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              // tokenIdMap: ?
              pool,
              poolTokenAccount0,
              poolTokenAccount1,
              lpMint,
              governanceFee: governanceFeeAcct,
              userTokenAccount0,
              userTokenAccount1,
              userLpTokenAccount,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
              systemProgram: web3.SystemProgram.programId,
            })
            .preInstructions([setComputeUnitLimitIx])
            .postInstructions([createMemoInstruction(memoStr.toString("hex"))]);

          const processSwimPayloadPubkeys = await processSwimPayload.pubkeys();
          console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
          if (!processSwimPayloadPubkeys.tokenNumberMap) {
            throw new Error("tokenIdMap not derived");
          }

          const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
            await getToTokenNumberMapAddr(
              propeller,
              swimPayloadMessageAccountToTokenNumber,
              propellerProgram.programId,
            );
          const expectedTokenIdMap =
            outputTokenIdMappingAddrs.get(targetTokenId);
          if (!expectedTokenIdMap) {
            throw new Error("expectedTokenIdMap not found");
          }
          const expectedTokenIdMapAcct =
            await propellerProgram.account.tokenNumberMap.fetch(
              expectedTokenIdMap,
            );
          console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
          const derivedTokenIdMap = processSwimPayloadPubkeys.tokenNumberMap;
          expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
          if (!processSwimPayloadPubkeys.swimClaim) {
            throw new Error("swimClaim key not derived");
          }
          const [expectedSwimClaim, expectedSwimClaimBump] =
            await getSwimClaimPda(wormholeClaim, propellerProgram.programId);
          expect(processSwimPayloadPubkeys.swimClaim).toEqual(
            expectedSwimClaim,
          );

          const processSwimPayloadTxn: string = await processSwimPayload.rpc();
          console.info(`processSwimPayloadTxn: ${processSwimPayloadTxn}`);
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
                swimPayloadMessageAccount.transferAmount,
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
                swimPayloadMessageAccount.transferAmount,
              ),
            ),
          ).toBeTruthy();
          await checkTxnLogsForMemo(processSwimPayloadTxn, memoStr);
        });
      });

      describe("for token from metapool as output token", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let swimPayloadMessage: web3.PublicKey;
        const targetTokenId = metapoolMint1ToTokenNumber;
        const memoStr = createMemoId();
        // const memo = "e45794d6c5a2750b";

        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          const swimPayload = {
            version: swimPayloadVersion,
            owner: provider.publicKey.toBuffer(),
          };

          const amount = parseUnits("1", mintDecimal);
          console.info(`amount: ${amount.toString()}`);

          const tokenTransferWithPayloadSignedVaa =
            dummyEthTokenBridge.createSignedTokenTransferWithSwimPayloadVAA(
              amount.toString(),
              swimPayload,
            );
          const propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;

          await postVaaSolanaWithRetry(
            connection,
            // eslint-disable-next-line @typescript-eslint/require-await
            async (tx) => {
              tx.partialSign(payer);
              return tx;
            },
            WORMHOLE_CORE_BRIDGE.toBase58(),
            payer.publicKey.toBase58(),
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
              payer: payer.publicKey,
              tokenBridgeConfig,
              // userTokenBridgeAccount: userLpTokenAccount.address,
              message: wormholeMessage,
              claim: wormholeClaim,
              endpoint: endpointAccount,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              feeVault: propellerFeeVault,
              custody: custody,
              swimUsdMint: swimUsdMint,
              custodySigner,
              rent: web3.SYSVAR_RENT_PUBKEY,
              systemProgram: web3.SystemProgram.programId,
              wormhole,
              tokenProgram: splToken.programId,
              tokenBridge,
            })
            .preInstructions([setComputeUnitLimitIx])
            .postInstructions([createMemoInstruction(memoStr.toString("hex"))]);

          const completeNativeWithPayloadMetapoolPubkeys =
            await completeNativeWithPayloadMetapoolIxs.pubkeys();

          if (!completeNativeWithPayloadMetapoolPubkeys.swimPayloadMessage) {
            throw new Error("swimPayloadMessage key not derived");
          }
          console.info(
            `completeNativeWithPayloadMetapoolPubkeys: ${JSON.stringify(
              completeNativeWithPayloadMetapoolPubkeys,
              null,
              2,
            )}`,
          );

          const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
            await getSwimPayloadMessagePda(
              wormholeClaim,
              propellerProgram.programId,
            );
          expect(expectedSwimPayloadMessage.toBase58()).toEqual(
            completeNativeWithPayloadMetapoolPubkeys.swimPayloadMessage.toBase58(),
          );

          swimPayloadMessage =
            completeNativeWithPayloadMetapoolPubkeys.swimPayloadMessage;

          const completeNativeWithPayloadMetapoolTxn =
            await completeNativeWithPayloadMetapoolIxs.transaction();
          const transferNativeTxnSig = await provider.sendAndConfirm(
            completeNativeWithPayloadMetapoolTxn,
            [payer],
            {
              skipPreflight: true,
            },
          );

          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              completeNativeWithPayloadMetapoolPubkeys.swimPayloadMessage,
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
          ).toEqual(dummyEthTokenBridge.emitterAddress);
          expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
            dummyEthTokenBridge.emitterChain,
          );
          expect(
            swimPayloadMessageAccount.vaaSequence.eq(
              new BN(dummyEthTokenBridge.sequence),
            ),
          ).toBeTruthy();
          expect(
            swimPayloadMessageAccount.transferAmount.eq(
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
          // } = swimPayloadMessageAccount.swimPayload;
          expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          const swimPayloadMessageOwnerPubKey = new PublicKey(
            swimPayloadMessageAccount.owner,
          );
          expect(swimPayloadMessageOwnerPubKey).toEqual(
            provider.wallet.publicKey,
          );

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

          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              swimPayloadMessage,
            );
          const swimPayloadMessageAccountToTokenNumber =
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
          const userLpTokenAccountBalanceBefore = (
            await splToken.account.token.fetch(userLpTokenAccount)
          ).amount;
          const minOutputAmount = new BN(0);
          const processSwimPayload = propellerProgram.methods
            .processSwimPayload(targetTokenId, minOutputAmount)
            .accounts({
              propeller,
              payer: payer.publicKey,
              claim: wormholeClaim,
              swimPayloadMessage,
              swimPayloadMessagePayer: payer.publicKey,
              redeemer: propellerRedeemer,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              // tokenIdMap: ?
              pool,
              poolTokenAccount0,
              poolTokenAccount1,
              lpMint,
              governanceFee: governanceFeeAcct,
              userTokenAccount0,
              userTokenAccount1,
              userLpTokenAccount,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
              systemProgram: web3.SystemProgram.programId,
            })
            .preInstructions([setComputeUnitLimitIx])
            .postInstructions([createMemoInstruction(memoStr.toString("hex"))]);

          const processSwimPayloadPubkeys = await processSwimPayload.pubkeys();
          console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
          if (!processSwimPayloadPubkeys.tokenNumberMap) {
            throw new Error("tokenIdMap not derived");
          }
          const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
            await getToTokenNumberMapAddr(
              propeller,
              swimPayloadMessageAccountToTokenNumber,
              propellerProgram.programId,
            );

          const expectedTokenIdMap =
            outputTokenIdMappingAddrs.get(targetTokenId);
          if (!expectedTokenIdMap) {
            throw new Error("expectedTokenIdMap not found");
          }
          const expectedTokenIdMapAcct =
            await propellerProgram.account.tokenNumberMap.fetch(
              expectedTokenIdMap,
            );
          console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
          const derivedTokenIdMap = processSwimPayloadPubkeys.tokenNumberMap;
          expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
          if (!processSwimPayloadPubkeys.swimClaim) {
            throw new Error("swimClaim key not derived");
          }
          const [expectedSwimClaim, expectedSwimClaimBump] =
            await getSwimClaimPda(wormholeClaim, propellerProgram.programId);
          expect(processSwimPayloadPubkeys.swimClaim).toEqual(
            expectedSwimClaim,
          );

          const processSwimPayloadTxn: string = await processSwimPayload.rpc();
          console.info(`processSwimPayloadTxn: ${processSwimPayloadTxn}`);
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
                swimPayloadMessageAccount.transferAmount,
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

      describe("for targetTokenId != swimPayload.targetTokenId", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let swimPayloadMessage: web3.PublicKey;

        let targetTokenId = SWIM_USD_TO_TOKEN_NUMBER;

        const memoStr = createMemoId();
        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          // const maxFee = new BN(1000000000);
          const swimPayload = {
            version: swimPayloadVersion,
            owner: provider.publicKey.toBuffer(),
            // owner: owner.toBuffer(),
            // propellerEnabled,
            // gasKickstart,
            // maxFee,
            // targetTokenId,
            // memo: memoBuffer,
          };
          // const swimPayload = {
          //   version: swimPayloadVersion,
          //   targetTokenId,
          //   // owner: tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA),
          //   // owner: Buffer.from(tryNativeToHexString(provider.publicKey.toBase58(), CHAIN_ID_SOLANA), 'hex'),
          //   owner: provider.publicKey.toBuffer(),
          //   // minOutputAmount: 0n,
          //   memo: memoBuffer,
          //   propellerEnabled,
          //   // minThreshold: BigInt(0),
          //   gasKickstart,
          // };
          const amount = parseUnits("1", mintDecimal);
          console.info(`amount: ${amount.toString()}`);
          /**
           * this is encoding a token transfer from eth routing contract
           * with a swimUSD token address that originated on solana
           * the same as initializing a `TransferWrappedWithPayload` from eth
           */

          const nonce = createNonce().readUInt32LE(0);
          // const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
          //   0,
          //   nonce,
          //   CHAIN_ID_ETH as number,
          //   ethTokenBridge,
          //   BigInt(++ethTokenBridgeSequence),
          //   encodeTokenTransferWithPayload(
          //     amount.toString(),
          //     swimUsdKeypair.publicKey.toBuffer(),
          //     CHAIN_ID_SOLANA,
          //     propellerProgram.programId,
          //     evmRoutingContractBuffer,
          //     encodeSwimPayload(swimPayload),
          //   ),
          // );
          const tokenTransferWithPayloadSignedVaa =
            dummyEthTokenBridge.createSignedTokenTransferWithSwimPayloadVAA(
              amount.toString(),
              swimPayload,
            );
          const propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;

          await postVaaSolanaWithRetry(
            connection,
            // eslint-disable-next-line @typescript-eslint/require-await
            async (tx) => {
              tx.partialSign(payer);
              return tx;
            },
            WORMHOLE_CORE_BRIDGE.toBase58(),
            payer.publicKey.toBase58(),
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
              payer: payer.publicKey,
              tokenBridgeConfig,
              // userTokenBridgeAccount: userLpTokenAccount.address,
              message: wormholeMessage,
              claim: wormholeClaim,
              endpoint: endpointAccount,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              feeVault: propellerFeeVault,
              custody: custody,
              swimUsdMint: swimUsdMint,
              custodySigner,
              rent: web3.SYSVAR_RENT_PUBKEY,
              systemProgram: web3.SystemProgram.programId,
              wormhole,
              tokenProgram: splToken.programId,
              tokenBridge,
            })
            .preInstructions([setComputeUnitLimitIx])
            .postInstructions([createMemoInstruction(memoStr.toString("hex"))]);

          const completeNativeWithPayloadSwimUsdPubkeys =
            await completeNativeWithPayloadSwimUsdIxs.pubkeys();

          if (!completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage) {
            throw new Error("swimPayloadMessage key not derived");
          }
          console.info(
            `completeNativeWithPayloadSwimUsdPubkeys: ${JSON.stringify(
              completeNativeWithPayloadSwimUsdPubkeys,
              null,
              2,
            )}`,
          );

          const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
            await getSwimPayloadMessagePda(
              wormholeClaim,
              propellerProgram.programId,
            );

          expect(expectedSwimPayloadMessage.toBase58()).toEqual(
            completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage.toBase58(),
          );

          swimPayloadMessage =
            completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage;

          const completeNativeWithPayloadSwimUsdTxn =
            await completeNativeWithPayloadSwimUsdIxs.transaction();
          const completeNativeWithPayloadSwimUsdTxnSig =
            await provider.sendAndConfirm(
              completeNativeWithPayloadSwimUsdTxn,
              [payer],
              {
                skipPreflight: true,
              },
            );

          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage,
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
          ).toEqual(dummyEthTokenBridge.emitterAddress);
          expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
            dummyEthTokenBridge.emitterChain,
          );
          expect(
            swimPayloadMessageAccount.vaaSequence.eq(
              new BN(dummyEthTokenBridge.sequence),
            ),
          ).toBeTruthy();
          expect(
            swimPayloadMessageAccount.transferAmount.eq(
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
          // } = swimPayloadMessageAccount.swimPayload;
          expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          expect(swimPayloadMessageAccount.targetTokenId).toEqual(
            targetTokenId,
          );
          const swimPayloadMessageOwnerPubKey = new PublicKey(
            swimPayloadMessageAccount.owner,
          );
          expect(swimPayloadMessageOwnerPubKey).toEqual(
            provider.wallet.publicKey,
          );
          expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
            propellerEnabled,
          );
          expect(swimPayloadMessageAccount.gasKickstart).toEqual(gasKickstart);

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
          const lpMint = swimUsdMint;
          const governanceFeeAcct = flagshipPoolGovernanceFeeAcct;
          const userTokenAccount0 = userUsdcAtaAddr;
          const userTokenAccount1 = userUsdtAtaAddr;
          const userLpTokenAccount = userSwimUsdAtaAddr;

          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              swimPayloadMessage,
            );
          const swimPayloadMessageAccountToTokenNumber =
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
          //specifiying targetTokenId != payload.outputTokenId
          targetTokenId = USDC_TO_TOKEN_NUMBER;
          const minOutputAmount = new BN(0);
          const processSwimPayloadIxs = propellerProgram.methods
            .processSwimPayload(targetTokenId, minOutputAmount)
            .accounts({
              propeller,
              payer: payer.publicKey,
              claim: wormholeClaim,
              swimPayloadMessage,
              swimPayloadMessagePayer: payer.publicKey,
              redeemer: propellerRedeemer,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              // tokenIdMap: ?
              pool,
              poolTokenAccount0,
              poolTokenAccount1,
              lpMint,
              governanceFee: governanceFeeAcct,
              userTokenAccount0,
              userTokenAccount1,
              userLpTokenAccount,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
              systemProgram: web3.SystemProgram.programId,
            })
            .preInstructions([setComputeUnitLimitIx])
            .postInstructions([createMemoInstruction(memoStr.toString("hex"))]);

          const processSwimPayloadPubkeys =
            await processSwimPayloadIxs.pubkeys();
          console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
          if (!processSwimPayloadPubkeys.tokenNumberMap) {
            throw new Error("tokenIdMap not derived");
          }

          const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
            await getToTokenNumberMapAddr(
              propeller,
              swimPayloadMessageAccountToTokenNumber,
              propellerProgram.programId,
            );

          const expectedTokenIdMap =
            outputTokenIdMappingAddrs.get(targetTokenId);
          if (!expectedTokenIdMap) {
            throw new Error("expectedTokenIdMap not found");
          }
          const expectedTokenIdMapAcct =
            await propellerProgram.account.tokenNumberMap.fetch(
              expectedTokenIdMap,
            );
          console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
          const derivedTokenIdMap = processSwimPayloadPubkeys.tokenNumberMap;
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
            await processSwimPayloadIxs.rpc();
          console.info(`processSwimPayloadTxnSig: ${processSwimPayloadTxnSig}`);
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
      });

      describe("for swimUSD as output token with shortened SwimPayload in Raw VAA", () => {
        let wormholeClaim: web3.PublicKey;
        let wormholeMessage: web3.PublicKey;
        let swimPayloadMessage: web3.PublicKey;

        const targetTokenId = SWIM_USD_TO_TOKEN_NUMBER;

        const memoStr = createMemoId();
        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
          const swimPayload = {
            version: swimPayloadVersion,
            owner: provider.publicKey.toBuffer(),
            // owner: owner.toBuffer(),
            // propellerEnabled,
            // gasKickstart,
            // maxFee,
            // targetTokenId,
            // memo: memoBuffer,
          };

          // const swimPayload = {
          //   version: swimPayloadVersion,
          //   targetTokenId,
          //   // owner: tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA),
          //   // owner: Buffer.from(tryNativeToHexString(provider.publicKey.toBase58(), CHAIN_ID_SOLANA), 'hex'),
          //   owner: provider.publicKey.toBuffer(),
          //   // minOutputAmount: 0n,
          //   memo: memoBuffer,
          //   propellerEnabled,
          //   // minThreshold: BigInt(0),
          //   gasKickstart,
          // };
          const amount = parseUnits("1", mintDecimal);
          console.info(`amount: ${amount.toString()}`);
          /**
           * this is encoding a token transfer from eth routing contract
           * with a swimUSD token address that originated on solana
           * the same as initializing a `TransferWrappedWithPayload` from eth
           */

          const nonce = createNonce().readUInt32LE(0);
          // const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
          //   0,
          //   nonce,
          //   CHAIN_ID_ETH as number,
          //   ethTokenBridge,
          //   BigInt(++ethTokenBridgeSequence),
          //   encodeTokenTransferWithPayload(
          //     amount.toString(),
          //     swimUsdKeypair.publicKey.toBuffer(),
          //     CHAIN_ID_SOLANA,
          //     propellerProgram.programId,
          //     evmRoutingContractBuffer,
          //     encodeSwimPayload(swimPayload),
          //   ),
          // );
          const tokenTransferWithPayloadSignedVaa =
            dummyEthTokenBridge.createSignedTokenTransferWithSwimPayloadVAA(
              amount.toString(),
              swimPayload,
            );
          const propellerRedeemerEscrowAccountBefore = (
            await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
          ).amount;

          await postVaaSolanaWithRetry(
            connection,
            // eslint-disable-next-line @typescript-eslint/require-await
            async (tx) => {
              tx.partialSign(payer);
              return tx;
            },
            WORMHOLE_CORE_BRIDGE.toBase58(),
            payer.publicKey.toBase58(),
            tokenTransferWithPayloadSignedVaa,
            10,
          );

          [wormholeMessage] = await deriveMessagePda(
            tokenTransferWithPayloadSignedVaa,
            WORMHOLE_CORE_BRIDGE,
          );

          const wormholeMessageAccountInfo = await connection.getAccountInfo(
            wormholeMessage,
          );
          const parsedTokenTransferWithSwimPayloadPostedMessage =
            await parseTokenTransferWithSwimPayloadPostedMessage(
              wormholeMessageAccountInfo.data,
            );

          // this is still the "raw/shortened" form of the swimPayload that was encoded in the VAA

          const swimPayloadFromWormholeMessage =
            parsedTokenTransferWithSwimPayloadPostedMessage.swimPayload;
          console.info(
            `swimPayloadFromWormholeMessage: ${JSON.stringify(
              swimPayloadFromWormholeMessage,
            )}`,
          );
          expect(swimPayloadFromWormholeMessage.memo).toBeUndefined();

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
              payer: payer.publicKey,
              tokenBridgeConfig,
              // userTokenBridgeAccount: userLpTokenAccount.address,
              message: wormholeMessage,
              claim: wormholeClaim,
              endpoint: endpointAccount,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              feeVault: propellerFeeVault,
              custody: custody,
              swimUsdMint: swimUsdMint,
              custodySigner,
              rent: web3.SYSVAR_RENT_PUBKEY,
              systemProgram: web3.SystemProgram.programId,
              wormhole,
              tokenProgram: splToken.programId,
              tokenBridge,
            })
            .preInstructions([setComputeUnitLimitIx])
            .postInstructions([createMemoInstruction(memoStr.toString("hex"))]);

          const completeNativeWithPayloadSwimUsdPubkeys =
            await completeNativeWithPayloadSwimUsdIxs.pubkeys();

          if (!completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage) {
            throw new Error("swimPayloadMessage key not derived");
          }
          console.info(
            `completeNativeWithPayloadSwimUsdPubkeys: ${JSON.stringify(
              completeNativeWithPayloadSwimUsdPubkeys,
              null,
              2,
            )}`,
          );

          const [expectedSwimPayloadMessage, expectedSwimPayloadMessageBump] =
            await getSwimPayloadMessagePda(
              wormholeClaim,
              propellerProgram.programId,
            );
          expect(expectedSwimPayloadMessage.toBase58()).toEqual(
            completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage.toBase58(),
          );

          swimPayloadMessage =
            completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage;

          const completeNativeWithPayloadSwimUsdTxn =
            await completeNativeWithPayloadSwimUsdIxs.transaction();
          const completeNativeWithPayloadSwimUsdTxnSig =
            await provider.sendAndConfirm(
              completeNativeWithPayloadSwimUsdTxn,
              [payer],
              {
                skipPreflight: true,
              },
            );

          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              completeNativeWithPayloadSwimUsdPubkeys.swimPayloadMessage,
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
          ).toEqual(dummyEthTokenBridge.emitterAddress);
          expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
            dummyEthTokenBridge.emitterChain,
          );
          expect(
            swimPayloadMessageAccount.vaaSequence.eq(
              new BN(dummyEthTokenBridge.sequence),
            ),
          ).toBeTruthy();
          expect(
            swimPayloadMessageAccount.transferAmount.eq(
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
          // } = swimPayloadMessageAccount.swimPayload;
          expect(swimPayloadMessageAccount.swimPayloadVersion).toEqual(
            swimPayloadVersion,
          );
          expect(swimPayloadMessageAccount.targetTokenId).toEqual(
            targetTokenId,
          );
          const swimPayloadMessageOwnerPubKey = new PublicKey(
            swimPayloadMessageAccount.owner,
          );
          expect(swimPayloadMessageOwnerPubKey).toEqual(
            provider.wallet.publicKey,
          );
          expect(swimPayloadMessageAccount.propellerEnabled).toEqual(
            propellerEnabled,
          );
          expect(swimPayloadMessageAccount.gasKickstart).toEqual(gasKickstart);

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
          const lpMint = swimUsdMint;
          const governanceFeeAcct = flagshipPoolGovernanceFeeAcct;
          const userTokenAccount0 = userUsdcAtaAddr;
          const userTokenAccount1 = userUsdtAtaAddr;
          const userLpTokenAccount = userSwimUsdAtaAddr;

          const swimPayloadMessageAccount =
            await propellerProgram.account.swimPayloadMessage.fetch(
              swimPayloadMessage,
            );
          const swimPayloadMessageAccountToTokenNumber =
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
          const userLpTokenAccountBalanceBefore = (
            await splToken.account.token.fetch(userLpTokenAccount)
          ).amount;
          const minOutputAmount = new BN(0);
          const processSwimPayload = propellerProgram.methods
            .processSwimPayload(targetTokenId, minOutputAmount)
            .accounts({
              propeller,
              payer: payer.publicKey,
              claim: wormholeClaim,
              swimPayloadMessage,
              swimPayloadMessagePayer: payer.publicKey,
              redeemer: propellerRedeemer,
              redeemerEscrow: propellerRedeemerEscrowAccount,
              // tokenIdMap: ?
              pool,
              poolTokenAccount0,
              poolTokenAccount1,
              lpMint,
              governanceFee: governanceFeeAcct,
              userTokenAccount0,
              userTokenAccount1,
              userLpTokenAccount,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
              systemProgram: web3.SystemProgram.programId,
            })
            .preInstructions([setComputeUnitLimitIx])
            .postInstructions([createMemoInstruction(memoStr.toString("hex"))]);

          const processSwimPayloadPubkeys = await processSwimPayload.pubkeys();
          console.info(`${JSON.stringify(processSwimPayloadPubkeys, null, 2)}`);
          if (!processSwimPayloadPubkeys.tokenNumberMap) {
            throw new Error("tokenIdMap not derived");
          }

          const [calculatedTokenIdMap, calculatedTokenIdMapBump] =
            await getToTokenNumberMapAddr(
              propeller,
              swimPayloadMessageAccountToTokenNumber,
              propellerProgram.programId,
            );

          const expectedTokenIdMap =
            outputTokenIdMappingAddrs.get(targetTokenId);
          if (!expectedTokenIdMap) {
            throw new Error("expectedTokenIdMap not found");
          }
          const expectedTokenIdMapAcct =
            await propellerProgram.account.tokenNumberMap.fetch(
              expectedTokenIdMap,
            );
          console.info(`
            calculatedTokenIdMap: ${calculatedTokenIdMap.toBase58()}
            calculatedTokenIdMapBump: ${calculatedTokenIdMapBump}
            expectedTokenIdMapAcct: ${expectedTokenIdMap.toBase58()} :
            ${JSON.stringify(expectedTokenIdMapAcct, null, 2)}
          `);
          const derivedTokenIdMap = processSwimPayloadPubkeys.tokenNumberMap;
          expect(derivedTokenIdMap).toEqual(expectedTokenIdMap);
          if (!processSwimPayloadPubkeys.swimClaim) {
            throw new Error("swimClaim key not derived");
          }
          const [expectedSwimClaim, expectedSwimClaimBump] =
            await getSwimClaimPda(wormholeClaim, propellerProgram.programId);
          expect(processSwimPayloadPubkeys.swimClaim).toEqual(
            expectedSwimClaim,
          );

          const processSwimPayloadTxn: string = await processSwimPayload.rpc();
          console.info(`processSwimPayloadTxn: ${processSwimPayloadTxn}`);
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
                swimPayloadMessageAccount.transferAmount,
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
                swimPayloadMessageAccount.transferAmount,
              ),
            ),
          ).toBeTruthy();
          await checkTxnLogsForMemo(processSwimPayloadTxn, memoStr);
        });
      });
    });
  });

  describe("Updating/Closing Token Number Maps", () => {
    let newMetapool: web3.PublicKey;
    let newMetapoolToken0Ata: web3.PublicKey;
    let newMetapoolToken1Ata: web3.PublicKey;
    const newMetapoolLpMintKeypair = web3.Keypair.generate();
    let newMetapoolGovernanceFeeAta: web3.PublicKey;
    let userNewMetapoolLpTokenAta: web3.PublicKey;

    // intiialize new metapool with same token_mint_keys as previous metapool but new lp token
    beforeAll(async () => {
      ({
        poolPubkey: newMetapool,
        poolTokenAccounts: [newMetapoolToken0Ata, newMetapoolToken1Ata],
        governanceFeeAccount: newMetapoolGovernanceFeeAta,
      } = await setupPoolPrereqs(
        twoPoolProgram,
        splToken,
        metapoolMintKeypairs,
        metapoolMintDecimals,
        [flagshipPool, metapoolMint1Authority.publicKey],
        newMetapoolLpMintKeypair.publicKey,
        poolGovernanceKeypair.publicKey,
      ));

      await twoPoolProgram.methods
        .initialize(ampFactor, lpFee, governanceFee)
        .accounts({
          payer: provider.publicKey,
          poolMint0: metapoolMintKeypairs[0].publicKey,
          poolMint1: metapoolMintKeypairs[1].publicKey,
          lpMint: newMetapoolLpMintKeypair.publicKey,
          poolTokenAccount0: newMetapoolToken0Ata,
          poolTokenAccount1: newMetapoolToken1Ata,
          pauseKey: poolPauseKeypair.publicKey,
          governanceAccount: poolGovernanceKeypair.publicKey,
          governanceFeeAccount: newMetapoolGovernanceFeeAta,
          tokenProgram: splToken.programId,
          associatedTokenProgram: splAssociatedToken.programId,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([newMetapoolLpMintKeypair])
        .rpc();
      const newMetapoolData = await twoPoolProgram.account.twoPool.fetch(
        newMetapool,
      );
      console.info(`
        newMetapool: ${newMetapool.toBase58()}
        newMetapoolData: ${JSON.stringify(newMetapoolData, null, 2)}
      `);
      console.info("seeding new metapool");
      userNewMetapoolLpTokenAta = (
        await getOrCreateAssociatedTokenAccount(
          connection,
          payer,
          newMetapoolLpMintKeypair.publicKey,
          dummyUser.publicKey,
        )
      ).address;
      const uiInputAmounts: readonly BN[] = [new BN(2_000), new BN(1_500)];
      const inputAmounts: readonly BN[] = uiInputAmounts.map(
        (bn: BN, i: number) => {
          const powerOfTen = new BN(10).pow(new BN(metapoolMintDecimals[i]));
          return bn.mul(powerOfTen);
        },
      );
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
        payer,
      );
      const seedNewMetapoolAccts = await getAddOrRemoveAccounts(
        newMetapool,
        dummyUser.publicKey,
        userTransferAuthority.publicKey,
        twoPoolProgram,
      );
      const seedNewMetapoolTxn = await twoPoolProgram.methods
        .add(inputAmounts, minimumMintAmount)
        .accounts(seedNewMetapoolAccts)
        .preInstructions([...approveIxs])
        .postInstructions([...revokeIxs])
        .signers([userTransferAuthority])
        .rpc();

      console.info(`seedNewMetapoolTxn: ${seedNewMetapoolTxn}`);
      const newMetapoolTokenAccountAmounts = (
        await Promise.all(
          newMetapoolData.tokenKeys.map(async (key) => {
            return await splToken.account.token.fetch(key);
          }),
        )
      ).map((account) => account.amount.toString());

      console.info(`
        newMetapoolTokenAccountAmounts: ${newMetapoolTokenAccountAmounts.toString()}
      `);
      // seed new metapool
      // await twoPoolProgram.methods.add().accounts({}).rpc();
    });

    it("Can update a token number map", async () => {
      const [tokenNumberMapAddr] = await getToTokenNumberMapAddr(
        propeller,
        metapoolMint1ToTokenNumber,
        propellerProgram.programId,
      );
      const tokenNumberMapDataBefore =
        await propellerProgram.account.tokenNumberMap.fetch(tokenNumberMapAddr);
      expect(tokenNumberMapDataBefore.toTokenNumber).toEqual(
        metapoolMint1ToTokenNumber,
      );
      expect(tokenNumberMapDataBefore.poolTokenMint).toEqual(
        metapoolMintKeypairs[1].publicKey,
      );
      expect(tokenNumberMapDataBefore.pool).toEqual(metapool);
      expect(tokenNumberMapDataBefore.poolTokenIndex).toEqual(1);
      const poolTokenIndex = 1;
      const poolTokenMint = metapoolMint1Keypair.publicKey;
      const toTokenStep = { swapExactInput: {} };
      await propellerProgram.methods
        .updateTokenNumberMap(
          metapoolMint1ToTokenNumber,
          poolTokenIndex,
          poolTokenMint,
          toTokenStep,
        )
        .accounts({
          propeller,
          governanceKey: propellerGovernanceKey.publicKey,
          payer: payer.publicKey,
          // rent: web3.SYSVAR_RENT_PUBKEY,
          pool: newMetapool,
          twoPoolProgram: twoPoolProgram.programId,
        })
        .signers([propellerGovernanceKey])
        .rpc();
      // create new metapool with same metapoolMint1

      const tokenNumberMapDataAfter =
        await propellerProgram.account.tokenNumberMap.fetch(tokenNumberMapAddr);
      expect(tokenNumberMapDataAfter.toTokenNumber).toEqual(
        metapoolMint1ToTokenNumber,
      );
      expect(tokenNumberMapDataAfter.poolTokenMint).toEqual(
        metapoolMintKeypairs[1].publicKey,
      );
      expect(tokenNumberMapDataAfter.pool).toEqual(newMetapool);
      expect(tokenNumberMapDataAfter.poolTokenIndex).toEqual(1);

      const oldMetapoolTokenAccountBalancesBefore =
        await getPoolTokenAccountBalances(metapool, twoPoolProgram, splToken);

      const newMetapoolTokenAccountBalancesBefore =
        await getPoolTokenAccountBalances(
          newMetapool,
          twoPoolProgram,
          splToken,
        );

      //

      const targetTokenId = metapoolMint1ToTokenNumber;
      const memoStr = createMemoId();

      const swimPayload = {
        version: swimPayloadVersion,
        owner: provider.publicKey.toBuffer(),
      };

      const amount = parseUnits("1", mintDecimal);
      console.info(`amount: ${amount.toString()}`);
      /**
       * this is encoding a token transfer from eth routing contract
       * with a swimUSD token address that originated on solana
       * the same as initializing a `TransferWrappedWithPayload` from eth
       */

      const nonce = createNonce().readUInt32LE(0);
      // const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
      //   0,
      //   nonce,
      //   CHAIN_ID_ETH as number,
      //   ethTokenBridge,
      //   BigInt(++ethTokenBridgeSequence),
      //   encodeTokenTransferWithPayload(
      //     amount.toString(),
      //     swimUsdKeypair.publicKey.toBuffer(),
      //     CHAIN_ID_SOLANA,
      //     propellerProgram.programId,
      //     evmRoutingContractBuffer,
      //     encodeSwimPayload(swimPayload),
      //   ),
      // );
      const tokenTransferWithPayloadSignedVaa =
        dummyEthTokenBridge.createSignedTokenTransferWithSwimPayloadVAA(
          amount.toString(),
          swimPayload,
        );
      const propellerRedeemerEscrowAccountBefore = (
        await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
      ).amount;

      const newMetapoolUserAtaBalancesBefore = await getUserAtaBalancesForPool(
        dummyUser.publicKey,
        newMetapool,
        twoPoolProgram,
        splToken,
      );

      await postVaaSolanaWithRetry(
        connection,
        async (tx) => {
          return provider.wallet.signTransaction(tx);
        },
        WORMHOLE_CORE_BRIDGE.toBase58(),
        payer.publicKey.toBase58(),
        tokenTransferWithPayloadSignedVaa,
        10,
      );

      const [wormholeMessage] = await deriveMessagePda(
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
      const wormholeClaim = await getClaimAddressSolana(
        WORMHOLE_TOKEN_BRIDGE.toBase58(),
        tokenTransferWithPayloadSignedVaa,
      );

      const completeNativeWithPayloadMetapoolIxs = propellerProgram.methods
        .completeNativeWithPayload()
        .accounts({
          propeller,
          payer: payer.publicKey,
          tokenBridgeConfig,
          // userTokenBridgeAccount: userLpTokenAccount.address,
          message: wormholeMessage,
          claim: wormholeClaim,
          endpoint: endpointAccount,
          redeemerEscrow: propellerRedeemerEscrowAccount,
          redeemer: propellerRedeemer,
          feeVault: propellerFeeVault,
          custody: custody,
          swimUsdMint: swimUsdMint,
          custodySigner,
          rent: web3.SYSVAR_RENT_PUBKEY,
          systemProgram: web3.SystemProgram.programId,
          wormhole,
          tokenProgram: splToken.programId,
          tokenBridge,
        })
        .preInstructions([setComputeUnitLimitIx])
        .postInstructions([createMemoInstruction(memoStr.toString("hex"))]);

      const completeNativeWithPayloadMetapoolPubkeys =
        await completeNativeWithPayloadMetapoolIxs.pubkeys();

      if (!completeNativeWithPayloadMetapoolPubkeys.swimPayloadMessage) {
        throw new Error("swimPayloadMessage key not derived");
      }

      const swimPayloadMessage =
        completeNativeWithPayloadMetapoolPubkeys.swimPayloadMessage;

      const completeNativeWithPayloadMetapoolTxn =
        await completeNativeWithPayloadMetapoolIxs.transaction();
      const transferNativeTxnSig = await provider.sendAndConfirm(
        completeNativeWithPayloadMetapoolTxn,
        [payer],
        {
          skipPreflight: true,
        },
      );

      const swimPayloadMessageAccount =
        await propellerProgram.account.swimPayloadMessage.fetch(
          completeNativeWithPayloadMetapoolPubkeys.swimPayloadMessage,
        );

      await connection.confirmTransaction({
        signature: transferNativeTxnSig,
        ...(await connection.getLatestBlockhash()),
      });

      const propellerRedeemerEscrowAccountAfter = (
        await splToken.account.token.fetch(propellerRedeemerEscrowAccount)
      ).amount;

      expect(
        propellerRedeemerEscrowAccountAfter.gt(
          propellerRedeemerEscrowAccountBefore,
        ),
      ).toEqual(true);
      await checkTxnLogsForMemo(transferNativeTxnSig, memoStr);

      const minOutputAmount = new BN(0);
      await propellerProgram.methods
        .processSwimPayload(targetTokenId, minOutputAmount)
        .accounts({
          propeller,
          payer: payer.publicKey,
          claim: wormholeClaim,
          swimPayloadMessage,
          swimPayloadMessagePayer:
            swimPayloadMessageAccount.swimPayloadMessagePayer,
          redeemer: propellerRedeemer,
          redeemerEscrow: propellerRedeemerEscrowAccount,
          // tokenIdMap: ?
          pool: newMetapool,
          poolTokenAccount0: newMetapoolToken0Ata,
          poolTokenAccount1: newMetapoolToken1Ata,
          lpMint: newMetapoolLpMintKeypair.publicKey,
          governanceFee: newMetapoolGovernanceFeeAta,
          userTokenAccount0: userMetapoolTokenAccount0,
          userTokenAccount1: userMetapoolTokenAccount1,
          userLpTokenAccount: userNewMetapoolLpTokenAta,
          tokenProgram: splToken.programId,
          twoPoolProgram: twoPoolProgram.programId,
          systemProgram: web3.SystemProgram.programId,
        })
        .preInstructions([setComputeUnitLimitIx])
        .postInstructions([createMemoInstruction(memoStr.toString("hex"))])
        .rpc();

      const oldMetapoolTokenAccountBalancesAfter =
        await getPoolTokenAccountBalances(metapool, twoPoolProgram, splToken);

      const newMetapoolTokenAccountBalancesAfter =
        await getPoolTokenAccountBalances(
          newMetapool,
          twoPoolProgram,
          splToken,
        );

      expect(
        oldMetapoolTokenAccountBalancesAfter[0].eq(
          oldMetapoolTokenAccountBalancesBefore[0],
        ),
      ).toBeTruthy();
      expect(
        oldMetapoolTokenAccountBalancesAfter[1].eq(
          oldMetapoolTokenAccountBalancesBefore[1],
        ),
      ).toBeTruthy();
      expect(
        newMetapoolTokenAccountBalancesAfter[0].gt(
          newMetapoolTokenAccountBalancesBefore[0],
        ),
      ).toBeTruthy();
      expect(
        newMetapoolTokenAccountBalancesAfter[1].lt(
          newMetapoolTokenAccountBalancesBefore[1],
        ),
      ).toBeTruthy();

      const newMetapoolUserAtaBalancesAfter = await getUserAtaBalancesForPool(
        dummyUser.publicKey,
        newMetapool,
        twoPoolProgram,
        splToken,
      );

      expect(
        newMetapoolUserAtaBalancesBefore[0].eq(
          newMetapoolUserAtaBalancesAfter[0],
        ),
      ).toBeTruthy();
      // should have received metapool token 1
      expect(
        newMetapoolUserAtaBalancesBefore[1].lt(
          newMetapoolUserAtaBalancesAfter[1],
        ),
      ).toBeTruthy();
      expect(
        newMetapoolUserAtaBalancesBefore[2].eq(
          newMetapoolUserAtaBalancesAfter[2],
        ),
      ).toBeTruthy();
    });
    it("Can close and re-create a token number map", async () => {
      const [tokenNumberMapAddr] = await getToTokenNumberMapAddr(
        propeller,
        metapoolMint1ToTokenNumber,
        propellerProgram.programId,
      );
      await propellerProgram.methods
        .closeTokenNumberMap(metapoolMint1ToTokenNumber)
        .accounts({
          propeller,
          governanceKey: propellerGovernanceKey.publicKey,
          payer: payer.publicKey,
          tokenNumberMap: tokenNumberMapAddr,
        })
        .signers([propellerGovernanceKey])
        .rpc();
      const tokenNumberMapDataAfterClose =
        await propellerProgram.account.tokenNumberMap.fetchNullable(
          tokenNumberMapAddr,
        );
      expect(tokenNumberMapDataAfterClose).toBeNull();

      const swimPayload = {
        version: swimPayloadVersion,
        owner: provider.publicKey.toBuffer(),
      };

      const amount = parseUnits("1", mintDecimal);
      console.info(`amount: ${amount.toString()}`);

      const tokenTransferWithPayloadSignedVaa =
        dummyEthTokenBridge.createSignedTokenTransferWithSwimPayloadVAA(
          amount.toString(),
          swimPayload,
        );
      await postVaaToSolana(
        tokenTransferWithPayloadSignedVaa,
        provider,
        wormhole,
      );

      const completeNativeWithPayloadTxn =
        await getCompleteNativeWithPayloadTxn(
          tokenTransferWithPayloadSignedVaa,
          wormhole,
          tokenBridge,
          propellerProgram,
        );
      await provider.sendAndConfirm(completeNativeWithPayloadTxn);

      await expect(() => {
        return getProcessSwimPayloadTxn(
          metapoolMint1ToTokenNumber,
          new BN(0),
          tokenTransferWithPayloadSignedVaa,
          wormhole,
          tokenBridge,
          propellerProgram,
          twoPoolProgram,
          splToken,
        );
      }).rejects.toThrow("Token number map does not exist");

      //recreate tokenNumberMap with original metapool
      const metapoolMint1TokenNumberMap = {
        pool: metapool,
        poolTokenIndex: metapoolMint1PoolTokenIndex,
        poolTokenMint: metapoolMint1Keypair.publicKey,
        toTokenStep: { swapExactInput: {} },
      };

      await propellerProgram.methods
        .createTokenNumberMap(
          metapoolMint1ToTokenNumber,
          metapoolMint1TokenNumberMap.pool,
          metapoolMint1TokenNumberMap.poolTokenIndex,
          metapoolMint1TokenNumberMap.poolTokenMint,
          metapoolMint1TokenNumberMap.toTokenStep,
        )
        .accounts({
          propeller,
          governanceKey: propellerGovernanceKey.publicKey,
          payer: payer.publicKey,
          systemProgram: web3.SystemProgram.programId,
          // rent: web3.SYSVAR_RENT_PUBKEY,
          pool: metapool,
          twoPoolProgram: twoPoolProgram.programId,
        })
        .signers([propellerGovernanceKey])
        .rpc();

      const tokenNumberMapDataAfterRecreate =
        await propellerProgram.account.tokenNumberMap.fetch(tokenNumberMapAddr);
      expect(tokenNumberMapDataAfterRecreate.pool.toBase58()).toEqual(
        metapool.toBase58(),
      );
      const originalMetapoolAtaBalancesBefore =
        await getPoolTokenAccountBalances(metapool, twoPoolProgram, splToken);
      const processSwimPayloadTxn = await getProcessSwimPayloadTxn(
        metapoolMint1ToTokenNumber,
        new BN(0),
        tokenTransferWithPayloadSignedVaa,
        wormhole,
        tokenBridge,
        propellerProgram,
        twoPoolProgram,
        splToken,
      );
      await provider.sendAndConfirm(processSwimPayloadTxn);
      const originalMetapoolAtaBalancesAfter =
        await getPoolTokenAccountBalances(metapool, twoPoolProgram, splToken);
      //original metapool token[0] (swimUSD) balance should go up
      expect(
        originalMetapoolAtaBalancesAfter[0].gt(
          originalMetapoolAtaBalancesBefore[0],
        ),
      ).toBeTruthy();
      // pool token[1] balance should go down
      expect(
        originalMetapoolAtaBalancesAfter[1].lt(
          originalMetapoolAtaBalancesBefore[1],
        ),
      ).toBeTruthy();
    }); // end of close/recreate token number map test
  });

  describe("Updating fees & oracles", () => {});

  async function checkTxnLogsForMemo(
    txSig: string,
    memoBuffer: Buffer,
    exists = true,
  ) {
    console.info(`txSig: ${txSig}`);
    const txnInfo = await connection.getTransaction(txSig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
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
      (log) =>
        log.startsWith("Program log: Memo") &&
        log.includes(memoBuffer.toString("hex")),
    );
    expect(memoLogFound).toEqual(exists);
  }

  function createMemoId() {
    // NOTE: Please always use random bytes to avoid conflicts with other users
    return crypto.randomBytes(SWIM_MEMO_LENGTH);
    // return (++memoId).toString().padStart(16, "0");
  }
});
