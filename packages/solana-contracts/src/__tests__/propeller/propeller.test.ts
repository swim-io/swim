import {
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
  createNonce,
  getClaimAddressSolana,
  postVaaSolanaWithRetry,
  setDefaultWasm,
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
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

import type { Propeller } from "../../artifacts/propeller";
import type { TwoPool } from "../../artifacts/two_pool";
import { getApproveAndRevokeIxs, idl } from "../../index";
import {
  DEFAULT_SOL_USD_FEED,
  PROPELLER_PID,
  SWIM_USD_TO_TOKEN_NUMBER,
  TWO_POOL_PID,
  USDC_TO_TOKEN_NUMBER,
  USDT_TO_TOKEN_NUMBER,
  ampFactor,
  commitment,
  completeWithPayloadFee,
  ethRoutingContract,
  ethRoutingContractEthHexStr,
  ethTokenBridge,
  evmOwner,
  evmTargetTokenId,
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
} from "../consts";
import {
  getPoolUserBalances,
  printBeforeAndAfterPoolUserBalances,
  printPoolUserBalances,
  setupPoolPrereqs,
  setupUserAssociatedTokenAccts,
} from "../twoPool/poolTestUtils";

import {
  encodeSwimPayload,
  formatParsedTokenTransferWithSwimPayloadPostedMessage,
  getPropellerPda,
  getPropellerRedeemerPda,
  getPropellerSenderPda,
  getSwimClaimPda,
  getSwimPayloadMessagePda,
  parseTokenTransferWithSwimPayloadPostedMessage,
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

// this just breaks everything for some reason...
//  think it was something related to the cjs/esm stuff for spl-memo
//
// const MEMO_PROGRAM_ID: PublicKey = new PublicKey(
//   "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
// );
setDefaultWasm("node");
// const pr2 = new AnchorProvider(
// 	connection,
// 	provider.wallet,
// 	{
// 		commitment: "confirmed",
// 	}
// )
// const process = require("process");
// const url = process.env.ANCHOR_PROVIDER_URL;
// const provider = AnchorProvider.local(url, {commitment: "confirmed"});
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
let ethTokenBridgeSequence = 1000;
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

    // [custodyOrWrappedMeta] = await (async () => {
    //     const mintInfo = await getMint(program.provider.connection, swimUsdMint);
    //     if (mintInfo.mintAuthority! === tokenMintSigner) {
    //         //First derive the Wrapped Mint Key
    //         //[Ricky] - this call is propellerLpAta wormhole-sdk
    //         const nativeInfo = await getOriginalAssetSol(
    //             program.provider.connection,
    //             tokenBridge.toString(),
    //             swimUsdMint.toString()
    //         );
    //         const [wrappedMintKey] = await web3.PublicKey.findProgramAddress(
    //             [
    //                 Buffer.from("wrapped"),
    //                 // serializeuint16 as uint8array
    //                 // ` data.token_chain.to_be_bytes().to_vec(),`
    //                 serializeUint16(nativeInfo.chainId as number),
    //                 swimUsdMint.toBytes()
    //             ],
    //             tokenBridge
    //         );
    //         //Then derive the Wrapped Meta Key
    //         return await web3.PublicKey.findProgramAddress([Buffer.from("meta"), wrappedMintKey.toBytes()], tokenBridge);
    //     } else {
    //         // transfer native sol asset
    //         return await web3.PublicKey.findProgramAddress([swimUsdMint.toBytes()], tokenBridge);
    //     }
    // })();

    // note - there's also wasm generated helper methods to derive these addresses as well.
    // assuming always sending solana native token so this will be custody.
    [custody] = await (async () => {
      return await web3.PublicKey.findProgramAddress(
        [swimUsdMint.toBytes()],
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
    expect(propellerData.admin).toEqual(propellerAdmin.publicKey);
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

  it("Creates Token Id Mappings", async () => {
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
            payer: payer.publicKey,
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

        const fetchedTokenIdMap =
          await propellerProgram.account.tokenIdMap.fetch(tokenIdMapAddr);
        expect(fetchedTokenIdMap.outputTokenIndex).toEqual(outputTokenIndex);
        expect(fetchedTokenIdMap.pool).toEqual(tokenIdMap.pool);
        expect(fetchedTokenIdMap.poolTokenIndex).toEqual(
          tokenIdMap.poolTokenIndex,
        );
        expect(fetchedTokenIdMap.poolTokenMint).toEqual(
          tokenIdMap.poolTokenMint,
        );
        expect(fetchedTokenIdMap.poolIx).toEqual(tokenIdMap.poolIx);
        expect(fetchedTokenIdMap.bump).toEqual(calculatedTokenIdMapBump);
        return { outputTokenIndex, tokenIdMapAddr };
      }),
    );

    outputTokenIdMappingAddrs = new Map(
      outputTokenIdMapAddrEntries.map(
        ({ outputTokenIndex, tokenIdMapAddr }) => {
          return [outputTokenIndex, tokenIdMapAddr];
        },
      ),
    );
    for (const [
      outputTokenIndex,
      tokenIdMapAddr,
    ] of outputTokenIdMappingAddrs.entries()) {
      console.info(`
        outputTokenIndex: ${outputTokenIndex}
        tokenIdMapAddr: ${tokenIdMapAddr.toBase58()}
        tokenIdMap: ${JSON.stringify(
          await propellerProgram.account.tokenIdMap.fetch(tokenIdMapAddr),
        )}
      `);
    }
  });

  it("Creates target chain maps", async () => {
    const targetChainMaps = await Promise.all(
      routingContracts.map(async ({ targetChainId, address }) => {
        const createTargetChainMap = propellerProgram.methods
          .createTargetChainMap(targetChainId, address)
          .accounts({
            propeller,
            admin: propellerAdmin.publicKey,
            payer: payer.publicKey,
            systemProgram: web3.SystemProgram.programId,
            // rent: web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([propellerAdmin]);

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

  describe("Propeller Pool Ixs", () => {
    describe("Propeller Flagship Pool ixs", () => {
      it("Cross Chain Add", async () => {
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
          .crossChainAdd(inputAmounts, minimumMintAmount)
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
      describe("Propeller Add", () => {
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
            .propellerAdd(inputAmounts, maxFee)
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
              .propellerAdd(inputAmounts, maxFee)
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

    describe("Propeller Metapool Pool ixs", () => {
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
      describe("Swap Exact Input", () => {
        it("CrossChainSwapExactInput", async () => {
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
          const exactInputAmount = new BN(100_000);
          const minimumOutputAmount = new BN(0);
          const userTransferAuthority = web3.Keypair.generate();
          const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
            splToken,
            [userMetapoolTokenAccount1],
            [exactInputAmount],
            userTransferAuthority.publicKey,
            payer,
          );
          const memoStr = createMemoId();

          const swapExactInputTxn = propellerProgram.methods
            .crossChainSwapExactInput(exactInputAmount, minimumOutputAmount)
            .accounts({
              poolTokenAccount0: metapoolPoolToken0Ata,
              poolTokenAccount1: metapoolPoolToken1Ata,
              lpMint: metapoolLpMintKeypair.publicKey,
              governanceFee: metapoolGovernanceFeeAta,
              userTransferAuthority: userTransferAuthority.publicKey,
              userTokenAccount0: userMetapoolTokenAccount0,
              userTokenAccount1: userMetapoolTokenAccount1,
              tokenProgram: splToken.programId,
              twoPoolProgram: twoPoolProgram.programId,
              swimUsdMint: swimUsdMint,
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
              userToken1AtaBalanceBefore.sub(exactInputAmount),
            ),
          ).toEqual(true);
          expect(userLpTokenBalanceAfter.eq(userLpTokenBalanceBefore)).toEqual(
            true,
          );
          expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
        });
        describe("PropellerSwapExactInput", () => {
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
            const exactInputAmount = new BN(100_000);
            const maxFee = new BN(0);
            const userTransferAuthority = web3.Keypair.generate();
            const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
              splToken,
              [userMetapoolTokenAccount1],
              [exactInputAmount],
              userTransferAuthority.publicKey,
              payer,
            );
            const memoStr = createMemoId();

            const swapExactInputTxn = propellerProgram.methods
              .propellerSwapExactInput(exactInputAmount, maxFee)
              .accounts({
                poolTokenAccount0: metapoolPoolToken0Ata,
                poolTokenAccount1: metapoolPoolToken1Ata,
                lpMint: metapoolLpMintKeypair.publicKey,
                governanceFee: metapoolGovernanceFeeAta,
                userTransferAuthority: userTransferAuthority.publicKey,
                userTokenAccount0: userMetapoolTokenAccount0,
                userTokenAccount1: userMetapoolTokenAccount1,
                tokenProgram: splToken.programId,
                twoPoolProgram: twoPoolProgram.programId,
                swimUsdMint: swimUsdMint,
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
                userToken1AtaBalanceBefore.sub(exactInputAmount),
              ),
            ).toEqual(true);
            expect(
              userLpTokenBalanceAfter.eq(userLpTokenBalanceBefore),
            ).toEqual(true);
            expect(!previousDepthAfter.eq(previousDepthBefore)).toBeTruthy();
          });
          it("fails if output amount < max fee", async () => {
            const exactInputAmount = new BN(100_000);
            const maxFee = new BN(100_000_000_000);
            const userTransferAuthority = web3.Keypair.generate();
            const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
              splToken,
              [userMetapoolTokenAccount1],
              [exactInputAmount],
              userTransferAuthority.publicKey,
              payer,
            );
            const memoStr = createMemoId();

            const swapExactInputTxn = propellerProgram.methods
              .propellerSwapExactInput(exactInputAmount, maxFee)
              .accounts({
                poolTokenAccount0: metapoolPoolToken0Ata,
                poolTokenAccount1: metapoolPoolToken1Ata,
                lpMint: metapoolLpMintKeypair.publicKey,
                governanceFee: metapoolGovernanceFeeAta,
                userTransferAuthority: userTransferAuthority.publicKey,
                userTokenAccount0: userMetapoolTokenAccount0,
                userTokenAccount1: userMetapoolTokenAccount1,
                tokenProgram: splToken.programId,
                twoPoolProgram: twoPoolProgram.programId,
                swimUsdMint: swimUsdMint,
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

      const nonceBefore = (
        await propellerProgram.account.propeller.fetch(propeller)
      ).nonce;
      const transferNativeTxn = await propellerProgram.methods
        .crossChainTransferNativeWithPayload(
          transferAmount,
          CHAIN_ID_ETH,
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
        .transaction();

      const transferNativeTxnSig = await provider.sendAndConfirm(
        transferNativeTxn,
        [payer, wormholeMessage],
        rpcCommitmentConfig,
      );

      const nonceAfter = (
        await propellerProgram.account.propeller.fetch(propeller)
      ).nonce;
      expect(nonceAfter).toEqual(nonceBefore + 1);

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
        ethRoutingContractEthHexStr,
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
      expect(tokenTransferMessage.core.nonce).toEqual(nonceBefore);
      expect(swimPayload.owner).toEqual(evmOwner);
      expect(swimPayload.propellerEnabled).toBeUndefined();
      expect(swimPayload.gasKickstart).toBeUndefined();
      expect(swimPayload.maxFee).toBeUndefined();
      expect(swimPayload.targetTokenId).toBeUndefined();
      expect(swimPayload.memo).toBeUndefined();
      // this fails due to capitalization
      // expect(formattedTokenTransferMessage.tokenTransfer.to).to.equal(ethRoutingContractStr);
      // console.info(`
      //   tokenTransferMessage: ${JSON.stringify(tokenTransferMessage, null ,2)}
      // `)
      // console.info(`postedMessage:\n${JSON.stringify(postedMessage)}`);
      // console.info(`postedMessagePayload:\n${JSON.stringify(postedMessagePayload)}`);
      // const {
      //   payload: swimPayload
      // } = postedMessagePayload;
      // console.info(`
      //   evmOwnerEthHexStr: ${evmOwnerEthHexStr}
      //   evmOwner(Buffer.toString('hex')): ${evmOwner.toString('hex')}
      //   evmTargetTokenAddrEthHexStr: ${evmTargetTokenAddrEthHexStr}
      //   evmTargetTokenAddr(Buffer.toString('hex')): ${evmTargetTokenAddr.toString('hex')}
      // `);
      // console.info(`swimPayload:\n${JSON.stringify(swimPayload)}`);
      // const transferAmountBuffer = transferAmount.toBuffer('be');
      // console.info(`transferAmountBufferHexStr: ${transferAmountBuffer.toString('hex')}`);
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
      const nonceBefore = (
        await propellerProgram.account.propeller.fetch(propeller)
      ).nonce;
      const propellerTransferNativeTxn = await propellerProgram.methods
        .propellerTransferNativeWithPayload(
          transferAmount,
          CHAIN_ID_ETH,
          evmOwner,
          gasKickstart,
          maxFee,
          evmTargetTokenId,
          Buffer.from(memo, "hex"),
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
        .transaction();

      const propellerTransferNativeTxnSig = await provider.sendAndConfirm(
        propellerTransferNativeTxn,
        [payer, wormholeMessage],
        rpcCommitmentConfig,
      );

      const nonceAfter = (
        await propellerProgram.account.propeller.fetch(propeller)
      ).nonce;
      expect(nonceAfter).toEqual(nonceBefore + 1);

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
        ethRoutingContractEthHexStr,
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
      expect(tokenTransferMessage.core.nonce).toEqual(nonceBefore);
      expect(swimPayload.owner).toEqual(evmOwner);
      expect(swimPayload.propellerEnabled).toEqual(true);
      expect(swimPayload.gasKickstart).toEqual(gasKickstart);
      expect(swimPayload.maxFee).toEqual(maxFee);
      expect(swimPayload.targetTokenId).toEqual(evmTargetTokenId);
      expect(swimPayload.memo.toString("hex")).toEqual(memo.toString("hex"));
      await checkTxnLogsForMemo(
        propellerTransferNativeTxnSig,
        memo.toString("hex"),
      );
      // this fails due to capitalization
      // expect(formattedTokenTransferMessage.tokenTransfer.to).to.equal(ethRoutingContractStr);
      // console.info(`
      //   tokenTransferMessage: ${JSON.stringify(tokenTransferMessage, null ,2)}
      // `)
      // console.info(`postedMessage:\n${JSON.stringify(postedMessage)}`);
      // console.info(`postedMessagePayload:\n${JSON.stringify(postedMessagePayload)}`);
      // const {
      //   payload: swimPayload
      // } = postedMessagePayload;
      // console.info(`
      //   evmOwnerEthHexStr: ${evmOwnerEthHexStr}
      //   evmOwner(Buffer.toString('hex')): ${evmOwner.toString('hex')}
      //   evmTargetTokenAddrEthHexStr: ${evmTargetTokenAddrEthHexStr}
      //   evmTargetTokenAddr(Buffer.toString('hex')): ${evmTargetTokenAddr.toString('hex')}
      // `);
      // console.info(`swimPayload:\n${JSON.stringify(swimPayload)}`);
      // const transferAmountBuffer = transferAmount.toBuffer('be');
      // console.info(`transferAmountBufferHexStr: ${transferAmountBuffer.toString('hex')}`);
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
      const nonceBefore = (
        await propellerProgram.account.propeller.fetch(propeller)
      ).nonce;
      const propellerTransferNativeTxn = await propellerProgram.methods
        .propellerTransferNativeWithPayload(
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
        .preInstructions([setComputeUnitLimitIx])
        .transaction();

      const transferNativeTxnSig = await provider.sendAndConfirm(
        propellerTransferNativeTxn,
        [payer, wormholeMessage],
        rpcCommitmentConfig,
      );

      const nonceAfter = (
        await propellerProgram.account.propeller.fetch(propeller)
      ).nonce;
      expect(nonceAfter).toEqual(nonceBefore + 1);
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
        ethRoutingContractEthHexStr,
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
      expect(tokenTransferMessage.core.nonce).toEqual(nonceBefore);
      expect(swimPayload.owner).toEqual(evmOwner);
      expect(swimPayload.propellerEnabled).toEqual(true);
      expect(swimPayload.gasKickstart).toEqual(gasKickstart);
      expect(swimPayload.maxFee).toEqual(maxFee);
      expect(swimPayload.targetTokenId).toEqual(evmTargetTokenId);
      expect(swimPayload.memo).toBeUndefined();
      await checkTxnLogsForMemo(
        transferNativeTxnSig,
        memo.toString("hex"),
        false,
      );
      // this fails due to capitalization
      // expect(formattedTokenTransferMessage.tokenTransfer.to).to.equal(ethRoutingContractStr);
      // console.info(`
      //   tokenTransferMessage: ${JSON.stringify(tokenTransferMessage, null ,2)}
      // `)
      // console.info(`postedMessage:\n${JSON.stringify(postedMessage)}`);
      // console.info(`postedMessagePayload:\n${JSON.stringify(postedMessagePayload)}`);
      // const {
      //   payload: swimPayload
      // } = postedMessagePayload;
      // console.info(`
      //   evmOwnerEthHexStr: ${evmOwnerEthHexStr}
      //   evmOwner(Buffer.toString('hex')): ${evmOwner.toString('hex')}
      //   evmTargetTokenAddrEthHexStr: ${evmTargetTokenAddrEthHexStr}
      //   evmTargetTokenAddr(Buffer.toString('hex')): ${evmTargetTokenAddr.toString('hex')}
      // `);
      // console.info(`swimPayload:\n${JSON.stringify(swimPayload)}`);
      // const transferAmountBuffer = transferAmount.toBuffer('be');
      // console.info(`transferAmountBufferHexStr: ${transferAmountBuffer.toString('hex')}`);
    });

    it("Fails propellerTransferNativeWithPayload if transferAmount <= maxFee for targetChain", async () => {
      const transferAmount = new BN(100_000_000);

      const wormholeMessage = web3.Keypair.generate();
      const gasKickstart = false;
      const maxFee = transferAmount.add(new BN(1));
      await expect(() => {
        return propellerProgram.methods
          .propellerTransferNativeWithPayload(
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
            // owner: owner.toBuffer(),
            // propellerEnabled,
            // gasKickstart,
            // maxFee,
            // targetTokenId,
            // memo: memoBuffer,
          };
          //
          // const swimPayload = {
          //   version: swimPayloadVersion,
          //   targetTokenId,
          //   owner: provider.publicKey.toBuffer(),
          //   memo: memoBuffer,
          //   propellerEnabled,
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
              to: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              // this is only used in propellerCompleteNativeWithPayload
              // but must still be passed.
              // tokenBridge.completeNativeWithPayload just checks mint is
              // correct.
              feeRecipient: userSwimUsdAtaAddr,
              // feeRecipient: propellerFeeVault,
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
            await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
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
              to: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              // this is only used in propellerCompleteNativeWithPayload
              // but must still be passed.
              // tokenBridge.completeNativeWithPayload just checks mint is
              // correct.
              feeRecipient: userSwimUsdAtaAddr,
              // feeRecipient: propellerFeeVault,
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
          ).toEqual(ethTokenBridge);
          expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
            CHAIN_ID_ETH,
          );
          expect(
            swimPayloadMessageAccount.vaaSequence.eq(
              new BN(ethTokenBridgeSequence),
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
            await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
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
        const targetTokenId = metapoolMint1OutputTokenIndex;
        const memoStr = createMemoId();
        // const memo = "e45794d6c5a2750b";

        it("mocks token transfer with payload then verifySig & postVaa then executes CompleteWithPayload", async () => {
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
              to: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              // this is only used in propellerCompleteNativeWithPayload
              // but must still be passed.
              // tokenBridge.completeNativeWithPayload just checks mint is
              // correct.
              feeRecipient: userSwimUsdAtaAddr,
              // feeRecipient: propellerFeeVault,
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
          ).toEqual(ethTokenBridge);
          expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
            CHAIN_ID_ETH,
          );
          expect(
            swimPayloadMessageAccount.vaaSequence.eq(
              new BN(ethTokenBridgeSequence),
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
            await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
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
              to: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              // this is only used in propellerCompleteNativeWithPayload
              // but must still be passed.
              // tokenBridge.completeNativeWithPayload just checks mint is
              // correct.
              feeRecipient: userSwimUsdAtaAddr,
              // feeRecipient: propellerFeeVault,
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
          ).toEqual(ethTokenBridge);
          expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
            CHAIN_ID_ETH,
          );
          expect(
            swimPayloadMessageAccount.vaaSequence.eq(
              new BN(ethTokenBridgeSequence),
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
            await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
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
              to: propellerRedeemerEscrowAccount,
              redeemer: propellerRedeemer,
              // this is only used in propellerCompleteNativeWithPayload
              // but must still be passed.
              // tokenBridge.completeNativeWithPayload just checks mint is
              // correct.
              feeRecipient: userSwimUsdAtaAddr,
              // feeRecipient: propellerFeeVault,
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
          ).toEqual(ethTokenBridge);
          expect(swimPayloadMessageAccount.vaaEmitterChain).toEqual(
            CHAIN_ID_ETH,
          );
          expect(
            swimPayloadMessageAccount.vaaSequence.eq(
              new BN(ethTokenBridgeSequence),
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
            await propellerProgram.account.tokenIdMap.fetch(expectedTokenIdMap);
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

  async function checkTxnLogsForMemo(
    txSig: string,
    memoStr: Buffer,
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
        log.includes(memoStr.toString("hex")),
    );
    expect(memoLogFound).toEqual(exists);
  }

  function createMemoId() {
    const SWIM_MEMO_LENGTH = 16;
    // NOTE: Please always use random bytes to avoid conflicts with other users
    return crypto.randomBytes(SWIM_MEMO_LENGTH);
    // return (++memoId).toString().padStart(16, "0");
  }
});
