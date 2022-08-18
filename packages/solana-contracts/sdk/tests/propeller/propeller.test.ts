import type {Program} from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import {web3, Spl} from "@project-serum/anchor";
import type {Propeller} from "../../src/artifacts/propeller";
import type {TwoPool} from "../../src/artifacts/two_pool";
import {
    addToPoolIx, deserializeSwimPool, initalizeTwoPoolV2, MintInfo, SwimPoolState, TWO_POOL_PROGRAM_ID
} from "./pool-utils";
import {
	Account, ASSOCIATED_TOKEN_PROGRAM_ID, getAccount,
	getAssociatedTokenAddress,
	getOrCreateAssociatedTokenAccount,
	mintTo,
	TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import {
	assert, expect
} from "chai";
import {
  formatParsedVaa,
  ParsedVaa,
  parseVaa,
  signAndEncodeVaa,
  WORMHOLE_CORE_BRIDGE, WORMHOLE_TOKEN_BRIDGE,
} from "./wormhole-utils";
import * as byteify from "byteify";
import {
  ChainId,
  CHAIN_ID_ETH,
  createNonce,
  importCoreWasm,
  setDefaultWasm,
  tryHexToNativeAssetString,
  CHAIN_ID_SOLANA,
  toChainName,
  tryNativeToHexString,
  postVaaSolanaWithRetry,
  attestFromSolana,
  parseSequenceFromLogSolana,
  importTokenWasm,
  getForeignAssetEth,
  redeemOnSolana,
  createPostVaaInstructionSolana,
  createVerifySignaturesInstructionsSolana,
  chunks,
  parseTransferPayload,
  tryHexToNativeString,
  ixFromRust,
  tryNativeToUint8Array, getSignedVAAHash, getClaimAddressSolana, getEmitterAddressSolana, ChainName,
} from "@certusone/wormhole-sdk";
import {BigNumber} from "ethers";
import {
  deriveEndpointPda,
  deriveMessagePda,
  encodeAttestMeta,
  encodeTokenTransfer,
  encodeTokenTransferWithPayload, formatParsedTokenTransferPostedMessage,
  formatParsedTokenTransferSignedVaa,
  getMintMetaPdas,
  ParsedTokenTransfer,
  ParsedTokenTransferPostedMessage,
  ParsedTokenTransferSignedVaa, parseTokenTransferPostedMessage,
  parseTokenTransferSignedVaa,
  toBigNumberHex,
} from "./token-bridge-utils";
import { parseUnits } from "ethers/lib/utils";
import {tryUint8ArrayToNative} from "@certusone/wormhole-sdk/lib/cjs/utils/array";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Secp256k1Program,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {SwitchboardTestContext} from "@switchboard-xyz/sbv2-utils";
import { setupPoolPrereqs, setupUserAssociatedTokenAccts } from "../twoPool/poolTestUtils";
import { getApproveAndRevokeIxs } from "../../src";
// this just breaks everything for some reason...
// import { MEMO_PROGRAM_ID } from "@solana/spl-memo";
const MEMO_PROGRAM_ID: PublicKey = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

// import {getAssociatedTokenAddress} from "@solana/spl-token/src/state";

// import {WORMHOLE_CORE_BRIDGE, WORMHOLE_TOKEN_BRIDGE} from "./wormhole_utils";

setDefaultWasm("node");
// const pr2 = new anchor.AnchorProvider(
// 	connection,
// 	provider.wallet,
// 	{
// 		commitment: "confirmed",
// 	}
// )
// const process = require("process");
// const url = process.env.ANCHOR_PROVIDER_URL;
// const provider = anchor.AnchorProvider.local(url, {commitment: "confirmed"});
const envProvider = anchor.AnchorProvider.env();

const confirmedCommitment = {commitment: "confirmed" as web3.Finality};
const commitment = "confirmed" as web3.Commitment;
const rpcCommitmentConfig = {
  commitment,
  preflightCommitment: commitment,
  skipPreflight: true
};
const provider = new anchor.AnchorProvider(
  envProvider.connection,
  envProvider.wallet,
  rpcCommitmentConfig
);
const connection = provider.connection;
const payer = (provider.wallet as NodeWallet).payer;
const splToken = Spl.token(provider);
const splAssociatedToken = Spl.associatedToken(provider);
// Configure the client to use the local cluster.
anchor.setProvider(provider);

//eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
const propellerProgram = anchor.workspace.Propeller as Program<Propeller>;
const twoPoolProgram = anchor.workspace.TwoPool as Program<TwoPool>;

const wormhole = WORMHOLE_CORE_BRIDGE;
const tokenBridge = WORMHOLE_TOKEN_BRIDGE;


let ethTokenBridgeSequence = 0n;


const ethTokenBridgeStr = "0x0290FB167208Af455bB137780163b7B7a9a10C16";
//0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
const ethTokenBridgeEthHexStr = tryNativeToHexString(ethTokenBridgeStr, CHAIN_ID_ETH);
//ethTokenBridge.toString() = gibberish
// ethTokenBridge.toString("hex") = 0000000000000000000000000290fb167208af455bb137780163b7b7a9a10c16
const ethTokenBridge = Buffer.from(
  ethTokenBridgeEthHexStr,
	"hex"
);


const ethRoutingContractStr = "0x0290FB167208Af455bB137780163b7B7a9a10C17";
const ethRoutingContractEthHexStr = tryNativeToHexString(ethRoutingContractStr, CHAIN_ID_ETH);
const ethRoutingContract = Buffer.from(
	ethRoutingContractEthHexStr,
	"hex"
);

const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
	// units: 420690,
	units: 900000,
	additionalFee: 0,
});


let metapool: web3.PublicKey;
let metapoolData: SwimPoolState;
let metapoolAuth: web3.PublicKey;
let userMetapoolTokenAccount0: web3.PublicKey;
let userMetapoolTokenAccount1: web3.PublicKey;
let userMetapoolLpTokenAccount: web3.PublicKey;

let propeller: web3.PublicKey;
let propellerSender: web3.PublicKey;
let propellerRedeemer: web3.PublicKey;
let propellerRedeemerEscrowAccount: Account;
const propellerAdmin: web3.Keypair = web3.Keypair.generate();

const dummyUser = payer;
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
const poolMintAuthorities = [payer, payer];
const swimUsdKeypair = web3.Keypair.generate();
const governanceKeypair = web3.Keypair.generate();
const pauseKeypair = web3.Keypair.generate();

let poolUsdcAtaAddr: web3.PublicKey;
let poolUsdtAtaAddr: web3.PublicKey;
let governanceFeeAddr: web3.PublicKey;

let userUsdcAtaAddr: web3.PublicKey;
let userUsdtAtaAddr: web3.PublicKey;
let userSwimUsdAtaAddr: web3.PublicKey;
const ampFactor  = { value: new anchor.BN(300), decimals: 0 };
const lpFee =  { value: new anchor.BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
const governanceFee = { value: new anchor.BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps

let flagshipPool: web3.PublicKey;
// let flagshipPoolData: SwimPoolState;
// let poolAuth: web3.PublicKey;
const tokenBridgeMint: web3.PublicKey = swimUsdKeypair.publicKey;

const metapoolMintKeypair0 = swimUsdKeypair;
const metapoolMintKeypair1 = web3.Keypair.generate();
const metapoolMintAuthority1 = payer;
const metapoolMintDecimal1 = 8;
const metapoolMintKeypairs = [metapoolMintKeypair0, metapoolMintKeypair1];
const metapoolMintDecimals = [mintDecimal, metapoolMintDecimal1];
// const metapoolMintAuthorities = [flagshipPool, metapoolMintAuthority1];

const metapoolLpMintKeypair = web3.Keypair.generate();
let metapoolPoolTokenAta0: web3.PublicKey;
let metapoolPoolTokenAta1: web3.PublicKey;
let metapoolGovernanceFeeAta: web3.PublicKey;

const gasKickstartAmount: anchor.BN = new anchor.BN(0.75 * LAMPORTS_PER_SOL);
const propellerFee: anchor.BN = new anchor.BN(0.25 * LAMPORTS_PER_SOL);
const propellerMinThreshold = new anchor.BN(5_000_000);
let marginalPricePool: web3.PublicKey;
// USDC token index in flagship pool
const marginalPricePoolTokenIndex = 0;
const marginalPricePoolTokenMint = usdcKeypair.publicKey;





let swimUSDMintInfo: MintInfo;

let custody: web3.PublicKey;
let wormholeConfig: web3.PublicKey;
let wormholeFeeCollector: web3.PublicKey;
let wormholeEmitter: web3.PublicKey;
let wormholeSequence: web3.PublicKey
let authoritySigner: web3.PublicKey;
let tokenBridgeConfig: web3.PublicKey;
let custodySigner: web3.PublicKey;

const evmTargetTokenId = 2;
const evmTargetTokenAddrEthHexStr = tryNativeToHexString("0x0000000000000000000000000000000000000003", CHAIN_ID_ETH)
const evmTargetTokenAddr = Buffer.from(
  evmTargetTokenAddrEthHexStr,
	"hex"
);

const evmOwnerEthHexStr = tryNativeToHexString("0x0000000000000000000000000000000000000004", CHAIN_ID_ETH);
const evmOwner = Buffer.from(
	evmOwnerEthHexStr,
	"hex"
);

let switchboard: SwitchboardTestContext;
let aggregatorKey: PublicKey;

describe("propeller", () => {

	before("setup", async () => {
		console.log(`initializing two pool v2`);
    ({
      poolPubkey: flagshipPool,
      poolTokenAccounts: [poolUsdcAtaAddr, poolUsdtAtaAddr],
      governanceFeeAccount: governanceFeeAddr,
    } = await setupPoolPrereqs(
      twoPoolProgram,
      splToken,
      poolMintKeypairs,
      poolMintDecimals,
      poolMintAuthorities.map(k => k.publicKey),
      swimUsdKeypair.publicKey,
      governanceKeypair.publicKey,
    ));
    const initFlagshipPoolTxn = await twoPoolProgram
      .methods
      // .initialize(params)
      .initialize(
        ampFactor,
        lpFee,
        governanceFee,
      )
      .accounts({
        payer: provider.publicKey,
        poolMint0: usdcKeypair.publicKey,
        poolMint1: usdtKeypair.publicKey,
        lpMint: swimUsdKeypair.publicKey,
        poolTokenAccount0: poolUsdcAtaAddr,
        poolTokenAccount1: poolUsdtAtaAddr,
        pauseKey: pauseKeypair.publicKey,
        governanceAccount: governanceKeypair.publicKey,
        governanceFeeAccount: governanceFeeAddr,
        tokenProgram: splToken.programId,
        associatedTokenProgram: splAssociatedToken.programId,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([swimUsdKeypair]);

    const pubkeys = (await initFlagshipPoolTxn.pubkeys());
    console.log(`pubkeys: ${JSON.stringify(pubkeys)}`);
    const pool = pubkeys.pool!;
    console.log(`poolKey: ${pool.toBase58()}, expected: ${flagshipPool.toBase58()}`);

    expect(pool.toBase58()).to.equal(flagshipPool.toBase58());
    const initFlagshipPoolTxnSig = await initFlagshipPoolTxn.rpc(rpcCommitmentConfig);

    console.log(`initFlagshipPoolTxnSig: ${initFlagshipPoolTxnSig}`);

    const flagshipPoolData = await twoPoolProgram.account.twoPool.fetch(pool);
    console.log(`flagshipPoolData: ${JSON.stringify(flagshipPoolData, null, 2)}`);

    marginalPricePool = flagshipPool;

    const calculatedSwimPoolPda = await web3.PublicKey.createProgramAddress(
      [
        Buffer.from("two_pool"),
        ...poolMintKeypairs.map(
          (keypair) => keypair.publicKey.toBytes()
        ),
        swimUsdKeypair.publicKey.toBytes(),
        Buffer.from([flagshipPoolData.bump]),
      ],
      twoPoolProgram.programId
    );
    expect(flagshipPool.toBase58()).to.equal(calculatedSwimPoolPda.toBase58());

    console.log(`setting up user token accounts for flagship pool`);
    ({
      userPoolTokenAtas: [userUsdcAtaAddr, userUsdtAtaAddr],
      userLpTokenAta: userSwimUsdAtaAddr
    }  = await setupUserAssociatedTokenAccts(
      provider.connection,
      dummyUser.publicKey,
      poolMintKeypairs.map(kp => kp.publicKey),
      poolMintAuthorities,
      swimUsdKeypair.publicKey,
      initialMintAmount,
      payer,
      commitment,
      rpcCommitmentConfig
    ));

    console.log(`done setting up flagship pool and relevant user token accounts`);
    console.log(`
      flagshipPool: ${JSON.stringify(flagshipPoolData, null, 2)}
      user: {
        userUsdcAtaAddr: ${userUsdcAtaAddr.toBase58()}
        userUsdtAtaAddr: ${userUsdtAtaAddr.toBase58()}
        userSwimUsdAtaAddr: ${userSwimUsdAtaAddr.toBase58()}
      }
    `);

		console.log(`metapool initializeV2 `);


    const [metapoolPda, metapoolBump] = await web3.PublicKey.findProgramAddress(
      [
        Buffer.from("two_pool"),
        ...metapoolMintKeypairs.map(
          (keypair) => keypair.publicKey.toBytes()
        ),
        metapoolLpMintKeypair.publicKey.toBytes(),
      ],
      twoPoolProgram.programId
    );

    ({
      poolPubkey: metapool,
      poolTokenAccounts: [metapoolPoolTokenAta0, metapoolPoolTokenAta1],
      governanceFeeAccount: metapoolGovernanceFeeAta,
    } = await setupPoolPrereqs(
      twoPoolProgram,
      splToken,
      metapoolMintKeypairs,
      metapoolMintDecimals,
      [flagshipPool, metapoolMintAuthority1.publicKey],
      // [metapoolMintKeypair1],
      // [metapoolMintDecimal1],
      // [metapoolMintAuthority1.publicKey],
      metapoolLpMintKeypair.publicKey,
      governanceKeypair.publicKey,
    ));


    const initMetapoolTxn = await twoPoolProgram
      .methods
      // .initialize(params)
      .initialize(
        ampFactor,
        lpFee,
        governanceFee,
      )
      .accounts({
        payer: provider.publicKey,
        poolMint0: metapoolMintKeypairs[0].publicKey,
        poolMint1: metapoolMintKeypairs[1].publicKey,
        lpMint: metapoolLpMintKeypair.publicKey,
        poolTokenAccount0: metapoolPoolTokenAta0,
        poolTokenAccount1: metapoolPoolTokenAta1,
        pauseKey: pauseKeypair.publicKey,
        governanceAccount: governanceKeypair.publicKey,
        governanceFeeAccount: metapoolGovernanceFeeAta,
        tokenProgram: splToken.programId,
        associatedTokenProgram: splAssociatedToken.programId,
        systemProgram: web3.SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([metapoolLpMintKeypair])
      // .rpc({skipPreflight: true});
    // console.log(`initMetapoolTxn: ${JSON.stringify(initMetapoolTxn, null, 2)}`);

    const initMetapoolTxnPubkeys = (await initMetapoolTxn.pubkeys());
    console.log(`initMetapoolTxnPubkeys: ${JSON.stringify(initMetapoolTxnPubkeys)}`);


    const derivedMetapool = initMetapoolTxnPubkeys.pool!;
    console.log(`derivedMetapool: ${derivedMetapool.toBase58()}, expected: ${metapool.toBase58()}`);
    expect(metapoolPda.toBase58()).to.equal(derivedMetapool.toBase58());
    expect(derivedMetapool.toBase58()).to.equal(metapool.toBase58());


    const initMetapoolTxnSig = await initMetapoolTxn.rpc(rpcCommitmentConfig);

    console.log(`initMetapoolTxnSig: ${initMetapoolTxnSig}`);

    const metapoolData = await twoPoolProgram.account.twoPool.fetch(metapool);
    console.log(`metapoolData: ${JSON.stringify(metapoolData, null, 2)}`);
    expect(metapoolBump).to.equal(metapoolData.bump);


    const calculatedMetapoolPda = await web3.PublicKey.createProgramAddress(
      [
        Buffer.from("two_pool"),
        ...metapoolMintKeypairs.map(
          (keypair) => keypair.publicKey.toBytes()
        ),
        metapoolLpMintKeypair.publicKey.toBytes(),
        Buffer.from([metapoolData.bump]),
      ],
      twoPoolProgram.programId
    );
    expect(metapool.toBase58()).to.equal(calculatedMetapoolPda.toBase58());

    userMetapoolTokenAccount0 = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      metapoolLpMintKeypair.publicKey,
      dummyUser.publicKey,
      false,
      commitment,
      rpcCommitmentConfig
    )).address;

    ({
      userPoolTokenAtas: [userMetapoolTokenAccount1],
      userLpTokenAta: userMetapoolLpTokenAccount
    }  = await setupUserAssociatedTokenAccts(
      provider.connection,
      dummyUser.publicKey,
      [metapoolMintKeypair1.publicKey],
      [metapoolMintAuthority1],
      metapoolLpMintKeypair.publicKey,
      initialMintAmount,
      payer,
      commitment,
      rpcCommitmentConfig
    ));

    console.log(`Done setting up metapool & relevant user token accounts`);
    console.log(`
      metapool: ${JSON.stringify(metapoolData, null, 2)}
      user: {
        userMetapoolTokenAccount0: ${userMetapoolTokenAccount0.toBase58()}
        userMetapoolTokenAccount1: ${userMetapoolTokenAccount1.toBase58()}
        userMetapoolLpTokenAccount: ${userMetapoolLpTokenAccount.toBase58()}
      }
    `);



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
			return await web3.PublicKey.findProgramAddress([tokenBridgeMint.toBytes()], tokenBridge);
		})();

		[wormholeConfig] = await web3.PublicKey.findProgramAddress([Buffer.from("Bridge")], wormhole);
		[wormholeFeeCollector] = await web3.PublicKey.findProgramAddress([Buffer.from("fee_collector")], wormhole);
    // wh functions return in a hex string format
    // wormholeEmitter = new web3.PublicKey(
    //   tryHexToNativeString(await getEmitterAddressSolana(tokenBridge.toBase58()), CHAIN_ID_SOLANA)
    //   );
		[wormholeEmitter] = await web3.PublicKey.findProgramAddress([Buffer.from("emitter")], tokenBridge);
		[wormholeSequence] = await web3.PublicKey.findProgramAddress([Buffer.from("Sequence"), wormholeEmitter.toBytes()], wormhole);

		[authoritySigner] = await web3.PublicKey.findProgramAddress([Buffer.from("authority_signer")], tokenBridge);
		[tokenBridgeConfig] = await web3.PublicKey.findProgramAddress([Buffer.from("config")], tokenBridge);
		[custodySigner] = await web3.PublicKey.findProgramAddress([Buffer.from("custody_signer")], tokenBridge);

		console.log(`
            custodyOrWrappedMeta: ${custody.toString()}
            wormholeConfig: ${wormholeConfig.toString()}
            wormholeFeeCollector: ${wormholeFeeCollector.toString()}
            wormholeEmitter: ${wormholeEmitter.toString()}
            wormholeSequence: ${wormholeSequence.toString()}
            authoritySigner: ${authoritySigner.toString()}
            tokenBridgeConfig: ${tokenBridgeConfig.toString()}
            custodySigner: ${custodySigner.toString()}
        `)

		// console.log(`setting up switchboard`);
		// // If fails, fallback to looking for a local env file
		// try {
		// 	switchboard = await SwitchboardTestContext.loadFromEnv(provider);
		// 	const aggregatorAccount = await switchboard.createStaticFeed(100);
		// 	aggregatorKey = aggregatorAccount.publicKey ?? PublicKey.default;
		// 	console.log("local env detected");
		// 	return;
		// } catch (error: any) {
		// 	console.log(`Error: SBV2 Localnet - ${error.message}`);
		// 	throw new Error(`Failed to load localenv SwitchboardTestContext: ${error.message}`);
		// }
	});

	it("Initializes propeller PDA", async () => {
		const expectedPropellerRedeemerAddr = await getPropellerRedeemerPda();
		const propellerRedeemerEscrowAddr = await getAssociatedTokenAddress(
			tokenBridgeMint,
			expectedPropellerRedeemerAddr,
			true
		);
		const initializeParams =  {
			gasKickstartAmount,
			propellerFee,
      propellerMinThreshold,
      marginalPricePool,
      marginalPricePoolTokenIndex,
      marginalPricePoolTokenMint,
		}
		let tx = propellerProgram
			.methods
			.initialize(initializeParams)
			.accounts({
				propellerRedeemerEscrow: propellerRedeemerEscrowAddr,
				admin: propellerAdmin.publicKey,
				tokenBridgeMint,
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
			})
			.signers([propellerAdmin]);

		let pubkeys = await tx.pubkeys()
		console.log(`pubkeys: ${JSON.stringify(pubkeys, null, 2)}`);
		if (pubkeys.propeller) {
			propeller = pubkeys.propeller;
		} else {
			assert.ok(false)
		}
		console.log(`propeller: ${propeller.toBase58()}`);
		if (pubkeys.propellerSender) {
			propellerSender = pubkeys.propellerSender;
		} else {
			assert.ok(false);
		}

		if (pubkeys.propellerRedeemer) {
			propellerRedeemer = pubkeys.propellerRedeemer;
		} else {
			assert.ok(false);
		}
		// propellerRedeemerEscrowAccount = await getOrCreateAssociatedTokenAccount(
		// 	connection,
		// 	payer,
		// 	tokenBridgeMint,
		// 	propellerRedeemer,
		// 	true
		// );


		// if (pubkeys.propellerRedeemerEscrow) {
		// 	propellerRedeemerEscrowAccount = pubkeys.propellerRedeemerEscrow;
		// } else {
		// 	assert.ok(false);
		// }

		const txSig = await tx.rpc({skipPreflight: true});
		await connection.confirmTransaction({
			signature: txSig,
			...(await connection.getLatestBlockhash())
		});

		propellerRedeemerEscrowAccount = await getAccount(connection, propellerRedeemerEscrowAddr);

		// propellerRedeemerEscrowAccount = await getAccount(connection,propellerRedeemerEscrowAddr);
		// .then((address) => getAccount(connection, address));

		const expectedPropellerAddr = await getPropellerPda(tokenBridgeMint);
		expect(expectedPropellerAddr).to.deep.equal(propeller);

		const expectedPropellerSenderAddr = await getPropellerSenderPda();
		expect(propellerSender).to.deep.equal(expectedPropellerSenderAddr);

		expect(propellerRedeemer).to.deep.equal(expectedPropellerRedeemerAddr);

		const propellerAcct = await connection.getAccountInfo(propeller);
		console.log(`propellerAcct.owner: ${propellerAcct!.owner.toBase58()}`);



		const propellerData = await propellerProgram.account.propeller.fetch(propeller);
		console.log(`propellerData: ${JSON.stringify(propellerData)}`);
		expect(propellerData.admin).to.deep.equal(propellerAdmin.publicKey);
		expect(propellerData.tokenBridgeMint).to.deep.equal(tokenBridgeMint);

    console.log(`propellerFee: ${propellerData.propellerFee.toString()}`);
    console.log(`gasKickstartAmount: ${propellerData.gasKickstartAmount.toString()}`);
    console.log(`propellerMinThreshold: ${propellerData.propellerMinThreshold.toString()}`);
    assert.isTrue(propellerData.propellerFee.eq(propellerFee));
    assert.isTrue(propellerData.gasKickstartAmount.eq(gasKickstartAmount));
    assert.isTrue(propellerData.propellerMinThreshold.eq(propellerMinThreshold));
		console.log(`
			propeller: ${propeller.toBase58()}
			propellerSender: ${propellerSender.toBase58()}
			propellerRedeemer: ${propellerRedeemer.toBase58()}
			propellerRedeemerEscrowAccount: ${propellerRedeemerEscrowAccount.address.toBase58()}
		`);
	});

  describe ("Propeller Pool Ixs", async() => {
    it("Propeller Add", async() => {
      const poolUserBalancesBefore = await getFlagshipTokenAccountBalances();

      const inputAmounts = [new anchor.BN(100_000_000), new anchor.BN(100_000_000)];
      const minimumMintAmount = new anchor.BN(0);
      const addParams = {
        inputAmounts,
        minimumMintAmount,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userUsdcAtaAddr, userUsdtAtaAddr],
        inputAmounts,
        userTransferAuthority.publicKey,
        payer
      )
      const memoString = "propeller add";
      const memo = Buffer.from(memoString, "utf-8");
      const addTxn = await propellerProgram
        .methods
        .add(
          inputAmounts,
          minimumMintAmount,
          memo,
        )
        .accounts({
          // propeller: propeller,
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          userLpTokenAccount: userSwimUsdAtaAddr,
          tokenProgram: splToken.programId,
          memo: MEMO_PROGRAM_ID,
          twoPoolProgram: twoPoolProgram.programId,
        })
        .preInstructions(approveIxs)
        .postInstructions(revokeIxs)
        .signers([userTransferAuthority]);
        // .rpc(rpcCommitmentConfig);

      const addTxnPubkeys = await addTxn.pubkeys();
      console.log(`addTxPubkeys: ${JSON.stringify(addTxnPubkeys, null, 2)}`);

      const addTxnSig = await addTxn.rpc(rpcCommitmentConfig);

      console.log(`addTxSig: ${addTxnSig}`);

      const poolUserBalancesAfter = await getFlagshipTokenAccountBalances();
      printBeforeAndAfterPoolUserBalances([poolUserBalancesBefore, poolUserBalancesAfter]);

      const {
        poolTokenBalances: [poolUsdcAtaBalanceBefore, poolUsdtAtaBalanceBefore],
        governanceFeeBalance: governanceFeeBalanceBefore,
        userTokenBalances: [userUsdcAtaBalanceBefore, userUsdtAtaBalanceBefore],
        userLpTokenBalance: userLpTokenBalanceBefore,
        previousDepth: previousDepthBefore,
      } = poolUserBalancesBefore;

      const {
        poolTokenBalances: [poolUsdcAtaBalanceAfter, poolUsdtAtaBalanceAfter],
        governanceFeeBalance: governanceFeeBalanceAfter,
        userTokenBalances: [userUsdcAtaBalanceAfter, userUsdtAtaBalanceAfter],
        userLpTokenBalance: userLpTokenBalanceAfter,
        previousDepth: previousDepthAfter,
      } =  poolUserBalancesAfter;

      assert.isTrue(poolUsdcAtaBalanceAfter.gt(poolUsdcAtaBalanceBefore));
      assert.isTrue(poolUsdtAtaBalanceAfter.gt(poolUsdtAtaBalanceBefore));
      assert.isTrue(governanceFeeBalanceAfter.gte(governanceFeeBalanceBefore));
      assert.isTrue(userUsdcAtaBalanceAfter.lt(userUsdcAtaBalanceBefore));
      assert.isTrue(userUsdtAtaBalanceAfter.lt(userUsdtAtaBalanceBefore));
      assert.isTrue(userLpTokenBalanceAfter.gt(userLpTokenBalanceBefore));
      assert.isTrue(previousDepthAfter.gt(previousDepthBefore));
      await checkTxnLogsForMemo(addTxnSig, memoString);

    });

    it("Propeller SwapExactInput", async () => {
      const poolUserBalancesBefore = await getFlagshipTokenAccountBalances();
      const exactInputAmounts = [new anchor.BN(100_000), new anchor.BN(0)];
      const outputTokenIndex = 1;
      const minimumOutputAmount = new anchor.BN(0);
      const swapExactInputParams = {
        exactInputAmounts,
        outputTokenIndex,
        minimumOutputAmount,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userUsdcAtaAddr, userUsdtAtaAddr],
        exactInputAmounts,
        userTransferAuthority.publicKey,
        payer
      )
      const memoString = "propeller SwapExactInput";
      const memo = Buffer.from(memoString, "utf-8");

      const swapExactInputTxn = await propellerProgram
        .methods
        // .swapExactInput(swapExactInputParams)
        .swapExactInput(
          exactInputAmounts,
          outputTokenIndex,
          minimumOutputAmount,
          memo
        )
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          tokenProgram: splToken.programId,
          memo: MEMO_PROGRAM_ID,
          twoPoolProgram: twoPoolProgram.programId,
        })
        .preInstructions(approveIxs)
        .postInstructions(revokeIxs)
        .signers([userTransferAuthority]);
        // .rpc(rpcCommitmentConfig);

      const swapExactInputTxnPubkeys = await swapExactInputTxn.pubkeys();
      console.log(`swapExactInputTxPubkeys: ${JSON.stringify(swapExactInputTxnPubkeys, null, 2)}`);

      const swapExactInputTxnSig = await swapExactInputTxn.rpc(rpcCommitmentConfig);
      console.log(`swapExactInputTxnSig: ${swapExactInputTxnSig}`);
      await checkTxnLogsForMemo(swapExactInputTxnSig, memoString);

      const poolUserBalancesAfter = await getFlagshipTokenAccountBalances();
      printBeforeAndAfterPoolUserBalances([poolUserBalancesBefore, poolUserBalancesAfter]);

      const {
        poolTokenBalances: [poolUsdcAtaBalanceBefore, poolUsdtAtaBalanceBefore],
        governanceFeeBalance: governanceFeeBalanceBefore,
        userTokenBalances: [userUsdcAtaBalanceBefore, userUsdtAtaBalanceBefore],
        userLpTokenBalance: userLpTokenBalanceBefore,
        previousDepth: previousDepthBefore,
      } = poolUserBalancesBefore;

      const {
        poolTokenBalances: [poolUsdcAtaBalanceAfter, poolUsdtAtaBalanceAfter],
        governanceFeeBalance: governanceFeeBalanceAfter,
        userTokenBalances: [userUsdcAtaBalanceAfter, userUsdtAtaBalanceAfter],
        userLpTokenBalance: userLpTokenBalanceAfter,
        previousDepth: previousDepthAfter,
      } =  poolUserBalancesAfter;



      assert.isTrue(poolUsdcAtaBalanceAfter.gt(poolUsdcAtaBalanceBefore));
      assert.isTrue(poolUsdtAtaBalanceAfter.lt(poolUsdtAtaBalanceBefore));
      assert.isTrue(governanceFeeBalanceAfter.gt(governanceFeeBalanceBefore));
      assert.isTrue(userUsdcAtaBalanceAfter.eq(userUsdcAtaBalanceBefore.sub(exactInputAmounts[0])));
      assert.isTrue(userUsdtAtaBalanceAfter.gt(userUsdtAtaBalanceBefore));
      assert.isTrue(userLpTokenBalanceAfter.eq(userLpTokenBalanceBefore));
      assert(!previousDepthAfter.eq(previousDepthBefore));

    });

    it("Propeller SwapExactOutput", async () => {
      const poolUserBalancesBefore = await getFlagshipTokenAccountBalances();

      const inputTokenIndex = 0;
      const maximumInputAmount = new anchor.BN(100_000)
      const maximumInputAmounts = [
        maximumInputAmount,
        new anchor.BN(0)
      ];
      maximumInputAmounts[inputTokenIndex] = maximumInputAmount;
      const exactOutputAmounts = [new anchor.BN(0), new anchor.BN(50_000)];
      const swapExactOutputParams = {
        maximumInputAmount,
        inputTokenIndex,
        exactOutputAmounts,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userUsdcAtaAddr, userUsdtAtaAddr],
        maximumInputAmounts,
        userTransferAuthority.publicKey,
        payer
      )

      const memoString = "propeller SwapExactOutput";
      const memo = Buffer.from(memoString, "utf-8");

      const swapExactOutputTxnSig = await propellerProgram
        .methods
        .swapExactOutput(
          maximumInputAmount,
          inputTokenIndex,
          exactOutputAmounts,
          memo
        )
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          tokenProgram: splToken.programId,
          memo: MEMO_PROGRAM_ID,
          twoPoolProgram: twoPoolProgram.programId,
        })
        .preInstructions(approveIxs)
        .postInstructions(revokeIxs)
        .signers([userTransferAuthority])
        .rpc(rpcCommitmentConfig);

      console.log(`swapExactOutputTxnSig: ${swapExactOutputTxnSig}`);
      await checkTxnLogsForMemo(swapExactOutputTxnSig, memoString);

      const poolUserBalancesAfter = await getFlagshipTokenAccountBalances();
      printBeforeAndAfterPoolUserBalances([poolUserBalancesBefore, poolUserBalancesAfter]);

      const {
        poolTokenBalances: [poolUsdcAtaBalanceBefore, poolUsdtAtaBalanceBefore],
        governanceFeeBalance: governanceFeeBalanceBefore,
        userTokenBalances: [userUsdcAtaBalanceBefore, userUsdtAtaBalanceBefore],
        userLpTokenBalance: userLpTokenBalanceBefore,
        previousDepth: previousDepthBefore,
      } = poolUserBalancesBefore;

      const {
        poolTokenBalances: [poolUsdcAtaBalanceAfter, poolUsdtAtaBalanceAfter],
        governanceFeeBalance: governanceFeeBalanceAfter,
        userTokenBalances: [userUsdcAtaBalanceAfter, userUsdtAtaBalanceAfter],
        userLpTokenBalance: userLpTokenBalanceAfter,
        previousDepth: previousDepthAfter,
      } =  poolUserBalancesAfter;
      assert.isTrue(poolUsdcAtaBalanceAfter.gt(poolUsdcAtaBalanceBefore));
      assert.isTrue(poolUsdtAtaBalanceAfter.lt(poolUsdtAtaBalanceBefore.add(exactOutputAmounts[1])));
      assert.isTrue(userUsdcAtaBalanceAfter.lt(userUsdcAtaBalanceBefore));
      assert.isTrue(userUsdtAtaBalanceAfter.eq(userUsdtAtaBalanceBefore.add(exactOutputAmounts[1])));
      assert.isTrue(userLpTokenBalanceBefore.gt(governanceFeeBalanceBefore));
      assert.isTrue(!previousDepthAfter.eq(previousDepthBefore));
    });

    it("Propeller RemoveUniform", async() => {
      const poolUserBalancesBefore = await getFlagshipTokenAccountBalances();

      const exactBurnAmount = new anchor.BN(100_000)
      const minimumOutputAmounts = [new anchor.BN(10_000), new anchor.BN(10_000)];
      const removeUniformParams = {
        exactBurnAmount,
        minimumOutputAmounts,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userSwimUsdAtaAddr],
        [exactBurnAmount],
        userTransferAuthority.publicKey,
        payer
      )

      const memoString = "propeller RemoveUniform";
      const memo = Buffer.from(memoString, "utf-8");

      const removeUniformTxnSig = await propellerProgram
        .methods
        .removeUniform(
          exactBurnAmount,
          minimumOutputAmounts,
          memo
        )
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          userLpTokenAccount: userSwimUsdAtaAddr,
          tokenProgram: splToken.programId,
          memo: MEMO_PROGRAM_ID,
          twoPoolProgram: twoPoolProgram.programId,
        })
        .preInstructions(approveIxs)
        .postInstructions(revokeIxs)
        .signers([userTransferAuthority])
        .rpc(rpcCommitmentConfig);

      console.log(`removeUniformTxnSig: ${removeUniformTxnSig}`);
      await checkTxnLogsForMemo(removeUniformTxnSig, memoString);

      const poolUserBalancesAfter = await getFlagshipTokenAccountBalances();
      printBeforeAndAfterPoolUserBalances([poolUserBalancesBefore, poolUserBalancesAfter]);

      const {
        poolTokenBalances: [poolUsdcAtaBalanceBefore, poolUsdtAtaBalanceBefore],
        governanceFeeBalance: governanceFeeBalanceBefore,
        userTokenBalances: [userUsdcAtaBalanceBefore, userUsdtAtaBalanceBefore],
        userLpTokenBalance: userLpTokenBalanceBefore,
        previousDepth: previousDepthBefore,
      } = poolUserBalancesBefore;

      const {
        poolTokenBalances: [poolUsdcAtaBalanceAfter, poolUsdtAtaBalanceAfter],
        governanceFeeBalance: governanceFeeBalanceAfter,
        userTokenBalances: [userUsdcAtaBalanceAfter, userUsdtAtaBalanceAfter],
        userLpTokenBalance: userLpTokenBalanceAfter,
        previousDepth: previousDepthAfter,
      } =  poolUserBalancesAfter;

      assert.isTrue(poolUsdcAtaBalanceAfter.lt(poolUsdcAtaBalanceBefore));
      assert.isTrue(poolUsdtAtaBalanceAfter.lt(poolUsdtAtaBalanceBefore));
      assert.isTrue(userUsdcAtaBalanceAfter.gte(userUsdcAtaBalanceBefore.add(minimumOutputAmounts[0])));
      assert.isTrue(userUsdtAtaBalanceAfter.gte(userUsdtAtaBalanceBefore.add(minimumOutputAmounts[1])));
      assert.isTrue(userLpTokenBalanceAfter.eq(userLpTokenBalanceBefore.sub(exactBurnAmount)));
      assert.isTrue(governanceFeeBalanceAfter.eq(governanceFeeBalanceBefore));
      assert.isTrue(!previousDepthAfter.eq(previousDepthBefore));

    });

    it("Propeller RemoveExactBurn", async() => {
      const previousDepthBefore = (await twoPoolProgram.account.twoPool.fetch(flagshipPool)).previousDepth;
      const userUsdcTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const userSwimUsdTokenAcctBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      const governanceFeeAcctBalanceBefore = (await splToken.account.token.fetch(governanceFeeAddr)).amount;
      const exactBurnAmount = new anchor.BN(100_000)
      const outputTokenIndex = 0;
      const minimumOutputAmount = new anchor.BN(10_000);
      const removeExactBurnParams = {
        exactBurnAmount,
        outputTokenIndex,
        minimumOutputAmount,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userSwimUsdAtaAddr],
        [exactBurnAmount],
        userTransferAuthority.publicKey,
        payer
      )
      const memoString = "propeller RemoveExactBurn";
      const memo = Buffer.from(memoString, "utf-8");

      const removeExactBurnTxnSig = await propellerProgram
        .methods
        .removeExactBurn(
          exactBurnAmount,
          outputTokenIndex,
          minimumOutputAmount,
          memo
        )
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          userLpTokenAccount: userSwimUsdAtaAddr,
          tokenProgram: splToken.programId,
          memo: MEMO_PROGRAM_ID,
          twoPoolProgram: twoPoolProgram.programId,
        })
        .preInstructions(approveIxs)
        .postInstructions(revokeIxs)
        .signers([userTransferAuthority])
        .rpc(rpcCommitmentConfig);

      console.log(`removeExactBurnTxnSig: ${removeExactBurnTxnSig}`);
      await checkTxnLogsForMemo(removeExactBurnTxnSig, memoString);

      const previousDepthAfter = (await twoPoolProgram.account.twoPool.fetch(flagshipPool)).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(!previousDepthAfter.eq(previousDepthBefore));
      const userUsdcTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const userSwimUsdTokenAcctBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      const governanceFeeAcctBalanceAfter = (await splToken.account.token.fetch(governanceFeeAddr)).amount;
      console.log(`
      userUsdcTokenAcctBalance
        Before: ${userUsdcTokenAcctBalanceBefore.toString()}
        After:  ${userUsdcTokenAcctBalanceAfter.toString()}

      userUsdtTokenAcctBalance
        Before: ${userUsdtTokenAcctBalanceBefore.toString()}
        After:  ${userUsdtTokenAcctBalanceAfter.toString()}

      userSwimUsdTokenAcctBalance
        Before: ${userSwimUsdTokenAcctBalanceBefore.toString()}
        After:  ${userSwimUsdTokenAcctBalanceAfter.toString()}

      governanceFeeAcctBalance
        Before: ${governanceFeeAcctBalanceBefore.toString()}
        After:  ${governanceFeeAcctBalanceAfter.toString()}
    `);
      assert(userUsdcTokenAcctBalanceAfter.gte(userUsdcTokenAcctBalanceBefore.add(minimumOutputAmount)));
      assert(userUsdtTokenAcctBalanceAfter.eq(userUsdtTokenAcctBalanceBefore));
      assert(userSwimUsdTokenAcctBalanceAfter.eq(userSwimUsdTokenAcctBalanceBefore.sub(exactBurnAmount)));
      assert(governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore));
    });


    it("Propeller RemoveExactOutput", async() => {
      const previousDepthBefore = (await twoPoolProgram.account.twoPool.fetch(flagshipPool)).previousDepth;
      const userUsdcTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceBefore = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const userSwimUsdTokenAcctBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      const governanceFeeAcctBalanceBefore = (await splToken.account.token.fetch(governanceFeeAddr)).amount;
      const maximumBurnAmount = new anchor.BN(3_000_000)

      //TODO: investigate this:
      //    if the output amounts were within 20_000 of each other then no goverance fee
      //    would be minted. is this due to approximation/values used?
      //    with decimals of 6 this is < 1 USDC. is the governance fee just too small in those cases?
      const exactOutputAmounts = [new anchor.BN(1_000_000), new anchor.BN(1_200_000)];
      const removeExactOutputParams = {
        maximumBurnAmount,
        exactOutputAmounts,
      }
      let userTransferAuthority = web3.Keypair.generate();
      const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
        splToken,
        [userSwimUsdAtaAddr],
        [maximumBurnAmount],
        userTransferAuthority.publicKey,
        payer
      )

      const memoString = "propeller RemoveExactOutput";
      const memo = Buffer.from(memoString, "utf-8");

      const removeExactOutputTxnSig = await propellerProgram
        .methods
        .removeExactOutput(
          maximumBurnAmount,
          exactOutputAmounts,
          memo
        )
        .accounts({
          poolTokenAccount0: poolUsdcAtaAddr,
          poolTokenAccount1: poolUsdtAtaAddr,
          lpMint: swimUsdKeypair.publicKey,
          governanceFee: governanceFeeAddr,
          userTransferAuthority: userTransferAuthority.publicKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          userLpTokenAccount: userSwimUsdAtaAddr,
          tokenProgram: splToken.programId,
          memo: MEMO_PROGRAM_ID,
          twoPoolProgram: twoPoolProgram.programId,
        })
        .preInstructions(approveIxs)
        .postInstructions(revokeIxs)
        .signers([userTransferAuthority])
        .rpc(rpcCommitmentConfig);

      console.log(`removeExactOutputTxnSig: ${removeExactOutputTxnSig}`);
      await checkTxnLogsForMemo(removeExactOutputTxnSig, memoString);

      const previousDepthAfter = (await twoPoolProgram.account.twoPool.fetch(flagshipPool)).previousDepth;
      console.log(`
      previousDepth
        Before: ${previousDepthBefore.toString()}
        After:  ${previousDepthAfter.toString()}
    `);
      assert(!previousDepthAfter.eq(previousDepthBefore));
      const userUsdcTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
      const userUsdtTokenAcctBalanceAfter = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
      const userSwimUsdTokenAcctBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      const governanceFeeAcctBalanceAfter = (await splToken.account.token.fetch(governanceFeeAddr)).amount;
      console.log(`
      userUsdcTokenAcctBalance
        Before: ${userUsdcTokenAcctBalanceBefore.toString()}
        After:  ${userUsdcTokenAcctBalanceAfter.toString()}

      userUsdtTokenAcctBalance
        Before: ${userUsdtTokenAcctBalanceBefore.toString()}
        After:  ${userUsdtTokenAcctBalanceAfter.toString()}

      userSwimUsdTokenAcctBalance
        Before: ${userSwimUsdTokenAcctBalanceBefore.toString()}
        After:  ${userSwimUsdTokenAcctBalanceAfter.toString()}

      governanceFeeAcctBalance
        Before: ${governanceFeeAcctBalanceBefore.toString()}
        After:  ${governanceFeeAcctBalanceAfter.toString()}
    `);
      assert(userUsdcTokenAcctBalanceAfter.eq(userUsdcTokenAcctBalanceBefore.add(exactOutputAmounts[0])));
      assert(userUsdtTokenAcctBalanceAfter.eq(userUsdtTokenAcctBalanceBefore.add(exactOutputAmounts[1])));
      assert(userSwimUsdTokenAcctBalanceAfter.gte(userSwimUsdTokenAcctBalanceBefore.sub(maximumBurnAmount)));
      assert(governanceFeeAcctBalanceAfter.gt(governanceFeeAcctBalanceBefore));
    });
  });

  describe("propeller wormhole ixs", () => {

    it("Does token bridge transfer", async() => {

      // const inputAmounts = [new anchor.BN(100_000_000_000), new anchor.BN(100_000_000_000)];
      //
      // const minimumMintAmount = new anchor.BN(0);

      // const custodyAmountBefore: anchor.BN = (await splToken.account.token.fetch(custodyOrWrappedMeta)).amount;
      // const poolAddParams = {
      //   inputAmounts,
      //   minimumMintAmount
      // };

      const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
        units: 900000,
        additionalFee: 0,
      });


      const userLpTokenBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      // console.log(`userLpTokenBalanceBefore: ${userLpTokenBalanceBefore.toString()}`);
      //
      // const propellerPoolAddTxn = await propellerProgram
      //   .methods
      //   .addV2(
      //     poolAddParams
      //   )
      //   .accounts({
      //     // propeller,
      //     poolState: flagshipPool,
      //     poolAuth,
      //     poolTokenAccount0: flagshipPoolData.tokenKeys[0]!,
      //     poolTokenAccount1: flagshipPoolData.tokenKeys[1]!,
      //     lpMint: flagshipPoolData.lpMintKey,
      //     governanceFee: flagshipPoolData.governanceFeeKey,
      //     userTokenAccount0: userUsdcAtaAddr,
      //     userTokenAccount1: userUsdtAtaAddr,
      //     poolProgram: TWO_POOL_PROGRAM_ID,
      //     tokenProgram: splToken.programId,
      //     userLpTokenAccount: userSwimUsdAtaAddr,
      //     payer: payer.publicKey,
      //   })
      //   // .signers([wormholeMessage])
      //   // .preInstructions([
      //   // 	requestUnitsIx,
      //   // ])
      //   .transaction();
      // const addLiqTxnSig = await provider.sendAndConfirm(
      //   propellerPoolAddTxn,
      //   [payer],
      //   {
      //     skipPreflight: true,
      //   }
      // );
      // const txnSize = propellerPoolAddTxn.serialize().length;
      // console.log(`addAndWormholeTransfer txnSize: ${txnSize}`)
      // await connection.confirmTransaction({
      //   signature: addLiqTxnSig,
      //   ...(await connection.getLatestBlockhash())
      // });
      // const userLpTokenBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      // console.log(`userLpTokenBalanceAfter: ${userLpTokenBalanceAfter.toString()}`);
      // const transferAmount = userLpTokenBalanceAfter.sub(userLpTokenBalanceBefore);

      try{
        await splToken.account.token.fetch(custody);
        assert(false, "custody account should not exist until first transfer");
      } catch (e) {
        console.log(`expected err from fetching custody account: ${e}`);
      }
      const custodyAmountBefore = new anchor.BN(0);
      const transferAmount = new anchor.BN(100_000_000);
      const nonce = createNonce().readUInt32LE(0);
      const payload = Buffer.from([
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27, 190, 63, 68,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27,
        // 190,63,68,
        // 1242
        // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
        // 1275
        // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
      ]);
      const memo = "e45794d6c5a2750a";
      const memoBuffer = Buffer.alloc(16);
      memoBuffer.write(memo);
      const wormholeMessage = web3.Keypair.generate();
      const gasKickstart = false;
      const propellerEnabled = true;
      const transferNativeTxn = await propellerProgram
        .methods
        .transferNativeWithPayload(
          nonce,
          CHAIN_ID_ETH,
          transferAmount,
          evmTargetTokenId,
          evmTargetTokenAddr,
          evmOwner,
          gasKickstart,
          propellerEnabled,
          memoBuffer
        )
        .accounts({
          propeller,
          payer: payer.publicKey,
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
          memo: MEMO_PROGRAM_ID
        })
        .preInstructions([
          requestUnitsIx,
        ])
        .transaction();

      const transferNativeTxnSig = await provider.sendAndConfirm(
        transferNativeTxn,
        [payer, wormholeMessage],
        rpcCommitmentConfig
      );

      const transferNativeTxnSize = transferNativeTxn.serialize().length;
      console.log(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`)
      await connection.confirmTransaction({
        signature: transferNativeTxnSig,
        ...(await connection.getLatestBlockhash())
      });

      const userLpTokenBalanceAfter2 = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      console.log(`userLpTokenBalanceAfter2: ${userLpTokenBalanceAfter2.toString()}`);
      assert.isTrue(userLpTokenBalanceAfter2.eq(userLpTokenBalanceBefore.sub(transferAmount)));

      const custodyAmountAfter = (await splToken.account.token.fetch(custody)).amount;
      console.log(`custodyAmountAfter: ${custodyAmountAfter.toString()}`);
      assert.isTrue(custodyAmountAfter.eq(custodyAmountBefore.add(transferAmount)));

      const messageAccountInfo = (await connection.getAccountInfo(wormholeMessage.publicKey))!;
      console.log(`messageAccountInfo: ${JSON.stringify(messageAccountInfo.data)}`);
      /*
        vaa: 118,97,97
        msg: 109,115,103
        msu: 109,115,117
        let discriminators = ["vaa", "msg", "msu"];
        let txtEncoder = new TextEncoder();
        discriminators.forEach(discriminator => { console.log(`${discriminator}: ${txtEncoder.encode(discriminator)}`) });
       */
      // program.methods.Message.deserialize(messageAccountInfo.data);




      // const parsed2 = await parseTokenTransferWithPayloadPostedMessage(messageAccountInfo.data);
      // const {
      // 	payload: postedMessagePayload2,
      // } = parsed2;
      // console.log(`parsed2: ${JSON.stringify(parsed2, null ,2)}`);
      // const {
      //   payload: postedMessagePayload,
      //   ...postedMessage
      // }  = await parseTokenTransferWithSwimPayloadPostedMessage(messageAccountInfo.data);
      const parsedTokenTransferWithSwimPayloadPostedMessage  = await parseTokenTransferWithSwimPayloadPostedMessage(messageAccountInfo.data);
      console.log(`
      parsedTokenTransferWithSwimPayloadPostedMessage:
        ${JSON.stringify(formatParsedTokenTransferWithSwimPayloadPostedMessage(parsedTokenTransferWithSwimPayloadPostedMessage), null, 2)}
      `);

      const {
        tokenTransferMessage,
        swimPayload
      } = parsedTokenTransferWithSwimPayloadPostedMessage;
      // console.log(`
      //   tokenTransferMessage: ${JSON.stringify(tokenTransferMessage, null ,2)}
      // `)
      // console.log(`postedMessage:\n${JSON.stringify(postedMessage)}`);
      // console.log(`postedMessagePayload:\n${JSON.stringify(postedMessagePayload)}`);
      // const {
      //   payload: swimPayload
      // } = postedMessagePayload;
      // console.log(`
      //   evmOwnerEthHexStr: ${evmOwnerEthHexStr}
      //   evmOwner(Buffer.toString('hex')): ${evmOwner.toString('hex')}
      //   evmTargetTokenAddrEthHexStr: ${evmTargetTokenAddrEthHexStr}
      //   evmTargetTokenAddr(Buffer.toString('hex')): ${evmTargetTokenAddr.toString('hex')}
      // `);
      // console.log(`swimPayload:\n${JSON.stringify(swimPayload)}`);
      // const transferAmountBuffer = transferAmount.toBuffer('be');
      // console.log(`transferAmountBufferHexStr: ${transferAmountBuffer.toString('hex')}`);

      /**
       * {"version":0,"targetTokenId":2,"targetToken":{"type":"Buffer","data":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3]},"owner":{"type":"Buffer","data":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4]},"minOutputAmount":"0","propellerEnabled":true,"propellerFee":"0","gasKickstart":false,"targetTokenStr":"\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0003","targetTokenHexStr":"0000000000000000000000000000000000000000000000000000000000000003","ownerStr":"\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0004","ownerHexStr":"0000000000000000000000000000000000000000000000000000000000000004"}
       * transferAmountBufferHexStr: 0186a0
       */
    });


    it("mocks token transfer with payload then verifySig & postVaa then complete with payload", async () => {
      const payload = Buffer.from([1,2,3]);
      const memo = "e45794d6c5a2750b";
      const memoBuffer = Buffer.alloc(16);
      memoBuffer.write(memo);
      const swimPayload = {
        version: 0,
        // owner: tryNativeToUint8Array(provider.publicKey.toBase58(), CHAIN_ID_SOLANA),
        // owner: Buffer.from(tryNativeToHexString(provider.publicKey.toBase58(), CHAIN_ID_SOLANA), 'hex'),
        owner: provider.publicKey.toBuffer(),
        //for targetTokenId, how do i know which pool to go to for the token?
        // e.g. 0 probably reserved for swimUSD
        // 1 usdc
        // 2 usdt
        // 3 some other solana stablecoin
        targetTokenId: 0,
        minOutputAmount: 0n,
        memo: memoBuffer,
        propellerEnabled: true,
        propellerMinThreshold: 0n,
        gasKickstart: false,
      };
      let amount = parseUnits("1", mintDecimal);
      console.log(`amount: ${amount.toString()}`);
      /**
       * this is encoding a token transfer from eth routing contract
       * with a swimUSD token address that originated on solana
       * the same as initializing a `TransferWrappedWithPayload` from eth
       */
      const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
        0,
        0,
        CHAIN_ID_ETH as number,
        ethTokenBridge,
        ++ethTokenBridgeSequence,
        encodeTokenTransferWithPayload(
          amount.toString(),
          swimUsdKeypair.publicKey.toBuffer(),
          CHAIN_ID_SOLANA,
          // propellerRedeemer,
          //"to" - if vaa.to != `Redeemer` account then it is assumed that this transfer was targeting
          // a contract(the programId of the vaa.to field) and token bridge will verify that redeemer is a pda
          //  owned by the `vaa.to` and derived the seed "redeemer".
          // note - technically you can specify an arbitrary PDA account as the `to` field
          // as long as the redeemer account is set to the same address but then we (propeller contract)
          // would need to do the validations ourselves.
          propellerProgram.programId,
          ethRoutingContract,
          encodeSwimPayload(swimPayload),
        )
      );
      const propellerRedeemerEscrowAccountBefore = (await splToken.account.token.fetch(propellerRedeemerEscrowAccount.address)).amount;

      // const parsedTokenTransferVaa = await parseTokenTransferVaa(tokenTransferWithPayloadSignedVaa);
      // console.log(`parsedTokenTransferVaa:\n${JSON.stringify(parsedTokenTransferVaa, null, 2)}`);

      // const parsedVaa = await parseVaa(tokenTransferWithPayloadSignedVaa);
      // const formattedParsedVaa = formatParsedVaa(parsedVaa);
      // console.log(`
      //   formattedParsedVaa: ${JSON.stringify(formattedParsedVaa, null, 2)}
      // `)
      const parsedTokenTransferWithSwimPayloadVaa = await parseTokenTransferWithSwimPayloadSignedVaa(tokenTransferWithPayloadSignedVaa);
      console.log(`
        parsedTokenTransferWithSwimPayloadVaa: ${JSON.stringify(formatParsedTokenTransferWithSwimPayloadVaa(parsedTokenTransferWithSwimPayloadVaa), null, 2)}
      `)

      const {
        tokenTransferVaa: {
          core: parsedVaa,
          tokenTransfer: parsedTokenTransferFromVaa
        },
        swimPayload: swimPayloadFromVaa
      } = parsedTokenTransferWithSwimPayloadVaa;

      // const guardianSetIndex: number = parsedTokenTransferVaa.guardianSetIndex;
      // const signatureSet = web3.Keypair.generate();
      // const verifySigIxs = await createVerifySignaturesInstructionsSolana(
      // 	provider.connection,
      // 	WORMHOLE_CORE_BRIDGE.toBase58(),
      // 	payer.publicKey.toBase58(),
      // 	tokenTransferWithPayloadSignedVaa,
      // 	signatureSet
      // );
      // // const verifyTxns: web3.Transaction[] = [];
      // const verifyTxnSigs: string[] = [];
      // const batchableChunks = chunks(verifySigIxs, 2);
      //
      // await Promise.all(batchableChunks.map(async (chunk) => {
      // 	let txn = new web3.Transaction();
      //   // const secp256k1Ix: TransactionInstruction = chunk[0];
      //   // const secp256k1IxData = secp256k1Ix.data;
      //   // const verifySigIx: TransactionInstruction = chunk[1];
      //   // const [
      //   //   _payer,
      //   //   guardianSet,
      //   //   signatureSet,
      //   //   sysvarIxs,
      //   //   sysvarsRent,
      //   //   sysProg
      //   // ] = verifySigIx.keys.map(k => k.pubkey);
      //   // const verifySigIxData = verifySigIx.data;
      //   // const verifySigData = verifySigIxData.slice(1); //first byte if verifySig ix enum
      //   // const secpAndVerifyTxn = propellerProgram
      //   //   .methods
      //   //   .secp256k1AndVerify(
      //   // secp256k1IxData,
      //   //     guardianSetIndex,
      //   //     verifySigData,
      //   //   )
      //   //   .accounts({
      //   //     secp256k1Program:  Secp256k1Program.programId,
      //   //     payer: payer.publicKey,
      //   //     guardianSet: guardianSet,
      //   //     signatureSet: signatureSet,
      //   //     instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      //   //     rent: web3.SYSVAR_RENT_PUBKEY,
      //   //     systemProgram: web3.SystemProgram.programId,
      //   //     wormhole,
      //   //   })
      //
      //
      // 	for (const chunkIx of chunk) {
      // 		txn.add(chunkIx);
      // 	}
      // 	// txn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      // 	// txn.partialSign(signatureSet);
      // 	const txnSig = await provider.sendAndConfirm(txn, [signatureSet], confirmedCommitment);
      // 	console.log(`txnSig: ${txnSig} had ${chunk.length} instructions`);
      // 	verifyTxnSigs.push(txnSig);
      // }));
      // console.log(`verifyTxnSigs: ${JSON.stringify(verifyTxnSigs)}`);
      // await Promise.all(verifyTxnSigs.map(async (txnSig) => {
      // 	const info = await connection.getTransaction(txnSig, confirmedCommitment);
      // 	if (!info) {
      // 		throw new Error(
      // 			`An error occurred while fetching the transaction info for ${txnSig}`
      // 		);
      // 	}
      // 	// get the sequence from the logs (needed to fetch the vaa)
      // 	const logs = info.meta?.logMessages;
      // 	console.log(`${txnSig} logs: ${JSON.stringify(logs)}`);
      // }));
      //
      //
      // const postVaaIx = await createPostVaaInstructionSolana(
      // 	WORMHOLE_CORE_BRIDGE.toBase58(),
      // 	payer.publicKey.toBase58(),
      // 	tokenTransferWithPayloadSignedVaa,
      // 	signatureSet
      // );
      // const postVaaTxn = new web3.Transaction().add(postVaaIx);
      // const postVaaTxnSig = await provider.sendAndConfirm(postVaaTxn, [], confirmedCommitment);
      // console.log(`postVaaTxnSig: ${postVaaTxnSig}`);
      // const postVaaTxnSigInfo = await connection.getTransaction(postVaaTxnSig, confirmedCommitment);
      // if (!postVaaTxnSigInfo) {
      // 	throw new Error(
      // 		`An error occurred while fetching the transaction info for ${postVaaTxnSig}`
      // 	);
      // }
      //
      // const postVaaIxMessageAcct = postVaaIx.keys[3].pubkey;

      await postVaaSolanaWithRetry(
        connection,
        async (tx) => {
          tx.partialSign(payer);
          return tx;
        },
        WORMHOLE_CORE_BRIDGE.toBase58(),
        payer.publicKey.toBase58(),
        tokenTransferWithPayloadSignedVaa,
        10
      );





      // const wormholeMessage = web3.Keypair.generate();

      // TODO: this wasn't working for some reason. kept getting some wasm related error.
      // const { complete_transfer_native_ix } = await importTokenWasm();
      /*
       accounts: vec![
              AccountMeta::new(payer, true),
              AccountMeta::new_readonly(config_key, false),
              message_acc,
              claim_acc,
              AccountMeta::new_readonly(endpoint, false),
              AccountMeta::new(to, false),
              if let Some(fee_r) = fee_recipient {
                  AccountMeta::new(fee_r, false)
              } else {
                  AccountMeta::new(to, false)
              },
              AccountMeta::new(custody_key, false),
              AccountMeta::new_readonly(mint, false),
              AccountMeta::new_readonly(custody_signer_key, false),
              // Dependencies
              AccountMeta::new_readonly(solana_program::sysvar::rent::id(), false),
              AccountMeta::new_readonly(solana_program::system_program::id(), false),
              // Program
              AccountMeta::new_readonly(bridge_id, false),
              AccountMeta::new_readonly(spl_token::id(), false),
          ],
       */
      // const complete_wrapped_accounts = ixFromRust(
      // 	complete_transfer_native_ix(
      // 		WORMHOLE_TOKEN_BRIDGE.toBase58(),
      // 		WORMHOLE_CORE_BRIDGE.toBase58(),
      // 		payer.publicKey.toBase58(),
      // 		tokenTransferWithPayloadSignedVaa
      // 	)
      // ).keys;
      const [messageAccount] = await deriveMessagePda(
        tokenTransferWithPayloadSignedVaa,
        WORMHOLE_CORE_BRIDGE
      );

      // console.log(`
      // 	postVaaIxMessageAcct: ${postVaaIxMessageAcct.toBase58()}
      // 	messageAccount: ${messageAccount.toBase58()}
      // `)

      const messageAccountInfo = (await connection.getAccountInfo(messageAccount))!;
      // console.log(`messageAccountInfo: ${JSON.stringify(messageAccountInfo.data)}`);
      /*
        vaa: 118,97,97
        msg: 109,115,103
        msu: 109,115,117
        let discriminators = ["vaa", "msg", "msu"];
        let txtEncoder = new TextEncoder();
        discriminators.forEach(discriminator => { console.log(`${discriminator}: ${txtEncoder.encode(discriminator)}`) });
       */
      // program.methods.Message.deserialize(messageAccountInfo.data);




      // const parsed2 = await parseTokenTransferWithPayloadPostedMessage(messageAccountInfo.data);
      // const {
      // 	payload: postedMessagePayload2,
      // } = parsed2;
      // console.log(`parsed2: ${JSON.stringify(parsed2, null ,2)}`);
      // const {
      //   payload: postedVaaPayload,
      //   ...postedMessage
      // }  = await parseTokenTransferWithSwimPayloadPostedMessage(messageAccountInfo.data);
      // console.log(`postedMessage:\n${JSON.stringify(postedMessage)}`);
      // console.log(`postedMessagePayload:\n${JSON.stringify(postedVaaPayload)}`);
      // const {
      //   payload: postedSwimPayload
      // } = postedVaaPayload;
      //
      // console.log(`postedSwimPayload:\n${JSON.stringify(postedSwimPayload)}`);
      const parsedTokenTransferWithSwimPayloadPostedMessage  = await parseTokenTransferWithSwimPayloadPostedMessage(messageAccountInfo.data);
      console.log(`
        parsedTokenTransferWithSwimPayloadPostedMessage:
          ${JSON.stringify(formatParsedTokenTransferWithSwimPayloadPostedMessage(parsedTokenTransferWithSwimPayloadPostedMessage), null, 2)}
    `);
      const {
        tokenTransferMessage: {
          core: parsedMessage,
          tokenTransfer: parsedTokenTransferFromMessage
        },
        swimPayload: swimPayloadFromMessage
      } = parsedTokenTransferWithSwimPayloadPostedMessage;

    //   const messsageAccountInfo = await connection.getAccountInfo(messageAccount);
    //   const parsedTokenTransferSignedVaaFromAccount = await parseTokenTransferWithSwimPayloadPostedMessage(
    //     messsageAccountInfo!.data
    //   );
    //
    //   console.log(`parsedTokenTransferSignedVaaFromAccount:\n
    // 	${JSON.stringify(parsedTokenTransferSignedVaaFromAccount, null, 2)}
    // `);
    //   const emitterAddrUint8Arr = tryNativeToUint8Array(
    //     parsedTokenTransferSignedVaaFromAccount.emitter_address2,
    //     parsedTokenTransferSignedVaaFromAccount.emitter_chain
    //   );
    //   console.log(`
    // 	emitter_address2Pub: ${new web3.PublicKey(emitterAddrUint8Arr).toBase58()}
    // `);
      const [endpointAccount] = await deriveEndpointPda(
        parsedVaa.emitterChain,
        parsedVaa.emitterAddress,
        // Buffer.from(new web3.PublicKey(parsedTokenTransferVaa.emitter_address).toBase58()),
        WORMHOLE_TOKEN_BRIDGE
      );
      console.log(`endpointAccount: ${endpointAccount.toBase58()}`);
      const claimAddressPubkey = await getClaimAddressSolana(
        WORMHOLE_TOKEN_BRIDGE.toBase58(), tokenTransferWithPayloadSignedVaa);
      // const messageAccount = complete_wrapped_accounts[2]!.pubkey;
      // const claimAccount = complete_wrapped_accounts[3]!.pubkey;
      // const { claim_address } = await importCoreWasm();
      // const claimAddressWasm = claim_address(
      //   WORMHOLE_TOKEN_BRIDGE.toBase58(), tokenTransferWithPayloadSignedVaa
      // );
      // const claimAddressPubkey2 = new web3.PublicKey(claimAddressWasm);
      // const claimAddressPubkey3 = new web3.PublicKey(
      //   tryUint8ArrayToNative(
      //     claimAddressWasm,
      //     CHAIN_ID_SOLANA
      //   )
      // );
      // // expect(claimAccount).to.deep.equal(claimAddressPubkey);
      //
      // // const signedVaaHash = await getSignedVAAHash(tokenTransferWithPayloadSignedVaa);
      // // const [claimAddressPubkey3] = await web3.PublicKey.findProgramAddress(
      // //   [Buffer.from(signedVaaHash)], WORMHOLE_TOKEN_BRIDGE
      // // )
      // console.log(`
      //   claimAddressPubkey: ${claimAddressPubkey.toBase58()}
      //   claimAddressPubkey2: ${claimAddressPubkey2.toBase58()}
      //   claimAddressPubkey3: ${claimAddressPubkey3.toBase58()}
      // `);
      // expect(claimAddressPubkey).to.deep.equal(claimAddressPubkey2);
      // expect(claimAddressPubkey).to.deep.equal(claimAddressPubkey3);


      const propellerCompleteNativeWithPayloadTxn = await propellerProgram
        .methods
        .completeNativeWithPayload()
        .accounts({
          propeller,
          payer: payer.publicKey,
          tokenBridgeConfig,
          // userTokenBridgeAccount: userLpTokenAccount.address,
          message: messageAccount,
          claim: claimAddressPubkey,
          endpoint: endpointAccount,
          to: propellerRedeemerEscrowAccount.address,
          redeemer: propellerRedeemer,
          feeRecipient: propellerRedeemerEscrowAccount.address,
          // tokenBridgeMint,
          custody: custody,
          mint: tokenBridgeMint,
          custodySigner,
          rent: web3.SYSVAR_RENT_PUBKEY,
          systemProgram: web3.SystemProgram.programId,
          wormhole,
          tokenProgram: splToken.programId,
          tokenBridge,
        })
        .preInstructions([
          requestUnitsIx,
        ])
        .transaction();

      const transferNativeTxnSig = await provider.sendAndConfirm(
        propellerCompleteNativeWithPayloadTxn,
        [payer],
        {
          skipPreflight: true,
        }
      );

      const transferNativeTxnSize = propellerCompleteNativeWithPayloadTxn.serialize().length;
      console.log(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`)
      await connection.confirmTransaction({
        signature: transferNativeTxnSig,
        ...(await connection.getLatestBlockhash())
      });

      const propellerRedeemerEscrowAccountAfter = (await splToken.account.token.fetch(propellerRedeemerEscrowAccount.address)).amount;
      console.log(`
      propellerRedeemerEscrowAccountBefore: ${propellerRedeemerEscrowAccountBefore}
      propellerRedeemerEscrowAccountAfter: ${propellerRedeemerEscrowAccountAfter}
    `);
      assert.isTrue(propellerRedeemerEscrowAccountAfter.gt(propellerRedeemerEscrowAccountBefore));

      // const propellerCompleteToUserTxn = await propellerProgram
      //   .methods
      //   .completeToUser()
      //   .accounts({
      //     propeller,
      //     payer: payer.publicKey,
      //     message: messageAccount,
      //     // redeemer: propellerRedeemer,
      //     feeRecipient: propellerRedeemerEscrowAccount.address,
      //     pool: flagshipPool,
      //     poolTokenAccount0: flagshipPoolData.tokenKeys[0]!,
      //     poolTokenAccount1: flagshipPoolData.tokenKeys[1]!,
      //     poolProgram: TWO_POOL_PROGRAM_ID,
      //     // tokenBridgeMint,
      //     // custody: custody,
      //     // mint: tokenBridgeMint,
      //     // custodySigner,
      //     // rent: web3.SYSVAR_RENT_PUBKEY,
      //     // systemProgram: web3.SystemProgram.programId,
      //     // wormhole,
      //     // tokenProgram: splToken.programId,
      //     // tokenBridge,
      //     aggregator: aggregatorKey,
      //   }).rpc();
      // expect(propellerRedeemerEscrowAccountAfter).to.equal(propellerRedeemerEscrowAccountBefore - transferNativeTxnSize);


      //
      // const redeemTxn = await redeemOnSolana(
      // 	connection,
      // 	WORMHOLE_CORE_BRIDGE.toBase58(),
      // 	WORMHOLE_TOKEN_BRIDGE.toBase58(),
      // 	payer.publicKey.toBase58(),
      // 	Uint8Array.from(tokenTransferWithPayloadSignedVaa)
      // );
      // const redeemSig = await provider.sendAndConfirm(redeemTxn, [], {
      // 	skipPreflight: true
      // });
      // console.log(`redeemSig: ${redeemSig}`);
      //
      // const userLpTokenAccountBalanceAfter = (await splToken.account.token.fetch(userLpTokenAccount.address)).amount;
      //
      // // amount: 100_000_000
      // // userLpTokenAccountBalanceBefore: 100
      // // userLpTokenAccountBalanceAfter: 100_000_100
      //
      // console.log(`
      // 	amount: ${amount.toString()}
      // 	userLpTokenAccountBalanceBefore: ${userLpTokenAccountBalanceBefore.toString()}
      // 	userLpTokenAccountBalanceAfter: ${userLpTokenAccountBalanceAfter.toString()}
      // `);
      // const expectedAmount = userLpTokenAccountBalanceBefore.add(new anchor.BN(amount.toString()));
      // assert(userLpTokenAccountBalanceAfter.eq(expectedAmount));
    })
  })


  // describe.skip("Old tests", () => {
  //   it("Can do pool add.rs & wormhole token bridge transfer (2 transactions)", async () => {
  //     const inputAmounts = [new anchor.BN(100_000_000_000), new anchor.BN(100_000_000_000)];
  //
  //     const minimumMintAmount = new anchor.BN(0);
  //
  //     // const custodyAmountg: anchor.BN = (await splToken.account.token.fetch(custodyOrWrappedMeta)).amount;
  //
  //
  //     const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
  //       units: 900000,
  //       additionalFee: 0,
  //     });
  //     const poolAddParams = {
  //       inputAmounts,
  //       minimumMintAmount
  //     };
  //
  //     const userLpTokenBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
  //     console.log(`userLpTokenBalanceBefore: ${userLpTokenBalanceBefore.toString()}`);
  //
  //     const propellerPoolAddTxn = await propellerProgram
  //       .methods
  //       .addV2(
  //         poolAddParams
  //       )
  //       .accounts({
  //         // propeller,
  //         poolState: flagshipPool,
  //         poolAuth,
  //         poolTokenAccount0: flagshipPoolData.tokenKeys[0]!,
  //         poolTokenAccount1: flagshipPoolData.tokenKeys[1]!,
  //         lpMint: flagshipPoolData.lpMintKey,
  //         governanceFee: flagshipPoolData.governanceFeeKey,
  //         userTokenAccount0: userUsdcAtaAddr,
  //         userTokenAccount1: userUsdtAtaAddr,
  //         poolProgram: TWO_POOL_PROGRAM_ID,
  //         tokenProgram: splToken.programId,
  //         userLpTokenAccount: userSwimUsdAtaAddr,
  //         payer: payer.publicKey,
  //       })
  //       // .signers([wormholeMessage])
  //       // .preInstructions([
  //       // 	requestUnitsIx,
  //       // ])
  //       .transaction();
  //     const addLiqTxnSig = await provider.sendAndConfirm(
  //       propellerPoolAddTxn,
  //       [payer],
  //       {
  //         skipPreflight: true,
  //       }
  //     );
  //     const txnSize = propellerPoolAddTxn.serialize().length;
  //     console.log(`addAndWormholeTransfer txnSize: ${txnSize}`)
  //     await connection.confirmTransaction({
  //       signature: addLiqTxnSig,
  //       ...(await connection.getLatestBlockhash())
  //     });
  //     const userLpTokenBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
  //     console.log(`userLpTokenBalanceAfter: ${userLpTokenBalanceAfter.toString()}`);
  //     const transferAmount = userLpTokenBalanceAfter.sub(userLpTokenBalanceBefore);
  //
  //     const nonce = createNonce().readUInt32LE(0);
  //     const payload = Buffer.from([
  //       0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27, 190, 63, 68,
  //       0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27,
  //       // 190,63,68,
  //       // 1242
  //       // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
  //       // 1275
  //       // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
  //     ]);
  //     const wormholeMessage = web3.Keypair.generate();
  //     const gasKickstart = false;
  //     const propellerEnabled = false;
  //     const transferNativeTxn = await propellerProgram
  //       .methods
  //       .transferNativeWithPayload(
  //         nonce,
  //         CHAIN_ID_ETH,
  //         transferAmount,
  //         evmTargetTokenId,
  //         evmTargetTokenAddr,
  //         evmOwner,
  //         gasKickstart,
  //         propellerEnabled,
  //       )
  //       .accounts({
  //         propeller,
  //         payer: payer.publicKey,
  //         tokenBridgeConfig,
  //         userTokenBridgeAccount: userSwimUsdAtaAddr,
  //         tokenBridgeMint,
  //         custody,
  //         tokenBridge,
  //         custodySigner,
  //         authoritySigner,
  //         wormholeConfig,
  //         wormholeMessage: wormholeMessage.publicKey,
  //         wormholeEmitter,
  //         wormholeSequence,
  //         wormholeFeeCollector,
  //         clock: web3.SYSVAR_CLOCK_PUBKEY,
  //         // autoderived
  //         // sender
  //         rent: web3.SYSVAR_RENT_PUBKEY,
  //         // autoderived
  //         // systemProgram,
  //         wormhole,
  //         tokenProgram: splToken.programId,
  //       })
  //       .preInstructions([
  //         requestUnitsIx,
  //       ])
  //       .transaction();
  //
  //     const transferNativeTxnSig = await provider.sendAndConfirm(
  //       transferNativeTxn,
  //       [payer, wormholeMessage],
  //       {
  //         skipPreflight: true,
  //       }
  //     );
  //
  //     const transferNativeTxnSize = transferNativeTxn.serialize().length;
  //     console.log(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`)
  //     await connection.confirmTransaction({
  //       signature: transferNativeTxnSig,
  //       ...(await connection.getLatestBlockhash())
  //     });
  //
  //     const userLpTokenBalanceAfter2 = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
  //     console.log(`userLpTokenBalanceAfter2: ${userLpTokenBalanceAfter2.toString()}`);
  //     assert.isTrue(userLpTokenBalanceAfter2.eq(userLpTokenBalanceAfter.sub(transferAmount)));
  //   });
  //
  //   it("Can do pool add.rs ix & wh token bridge transfer in one IX with approves & revokes in contract", async () => {
  //     // const inputAmounts = [new anchor.BN(100), new anchor.BN(100)];
  //     const inputAmounts = [new anchor.BN(100_000_000_000), new anchor.BN(100_000_000_000)];
  //
  //     const minimumMintAmount = new anchor.BN(0);
  //
  //
  //     const wormholeMessage = web3.Keypair.generate();
  //     // const custodyAmountBefore: anchor.BN = (await splToken.account.token.fetch(custodyOrWrappedMeta)).amount;
  //
  //
  //     const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
  //       units: 900000,
  //       additionalFee: 0,
  //     });
  //     const poolAddParams = {
  //       inputAmounts,
  //       minimumMintAmount
  //     };
  //     // const targetAddrStr = "0xd791AAfc9a0bb703A22Aebc0c5d2a9601Bbe3F44";
  //     // // alternatively call Array.prototype.slice.call(tryNativeToUint8Array());
  //     // const targetAddrUint8Arr = tryNativeToUint8Array(
  //     //     targetAddrStr,
  //     //     CHAIN_ID_ETH
  //     // );
  //     // const targetAddress = Array.from(targetAddrUint8Arr);
  //     // //        targetAddrUint8Arr: 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68
  //     // //         targetAddrUint8Arr.length: 32
  //     // //         targetAddrUint8Arr.byteLength: 32
  //     // //         targetAddr: [0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68]
  //     // //         targetAddr.length :32
  //     // console.log(`
  //     //   targetAddrUint8Arr: ${targetAddrUint8Arr.toString()}
  //     //   targetAddrUint8Arr.length: ${targetAddrUint8Arr.length}
  //     //   targetAddrUint8Arr.byteLength: ${targetAddrUint8Arr.byteLength}
  //     //   targetAddr: ${JSON.stringify(targetAddress)}
  //     //   targetAddr.length :${targetAddress.length}
  //     // `);
  //     //
  //     //
  //     // const targetAddrStrHex = tryNativeToHexString(targetAddrStr, CHAIN_ID_ETH);
  //     // const targetAddrHexUint8Arr = hexToUint8Array(targetAddrStrHex);
  //     // const targetAddr2 = Array.from(targetAddrHexUint8Arr);
  //     //        targetAddrStrHex: 000000000000000000000000d791aafc9a0bb703a22aebc0c5d2a9601bbe3f44
  //     //         targetAddrStrHex.length: 64
  //     //         targetAddrHexUint8Arr: 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68
  //     //         targetAddrHexUint8Arr.length: 32
  //     //         targetAddrHexUint8Arr.byteLength: 32
  //     //         targetAddr2: [0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68]
  //     //         targetAddr2.length :32
  //     // console.log(`
  //     //   targetAddrStrHex: ${targetAddrStrHex}
  //     //   targetAddrStrHex.length: ${targetAddrStrHex.length}
  //     //   targetAddrHexUint8Arr: ${targetAddrHexUint8Arr.toString()}
  //     //   targetAddrHexUint8Arr.length: ${targetAddrHexUint8Arr.length}
  //     //   targetAddrHexUint8Arr.byteLength: ${targetAddrHexUint8Arr.byteLength}
  //     //   targetAddr2: ${JSON.stringify(targetAddr2)}
  //     //   targetAddr2.length :${targetAddr2.length}
  //     // `);
  //     // const transferData = {
  //     //     nonce: 10,
  //     //     amount: new anchor.BN(0),
  //     //     fee: new anchor.BN(0),
  //     //     targetAddress,
  //     //     targetChain: CHAIN_ID_ETH
  //     // };
  //     // Note: if payload type is Vec<u8> this needs to be Buffer.from([0,1,2,...])
  //     //        JS anchor types reference is wrong for this:
  //     //        https://book.anchor-lang.com/anchor_references/javascript_anchor_types_reference.html
  //     // max_size of payload is 21 if including dummy account (eventually some type of mapping PDA of chainId -> routing contract address)
  //     const nonce = createNonce().readUInt32LE(0);
  //     const payload = Buffer.from([]);
  //     console.log(`
  //       payload.length: ${payload.length}
  //       payload.byteLength: ${payload.byteLength}
  //     `)
  //
  //     const propellerAddLiquidityTx = await propellerProgram
  //       .methods
  //       .addAndWormholeTransfer(
  //         inputAmounts,
  //         minimumMintAmount,
  //         nonce,
  //         CHAIN_ID_ETH,
  //         // payload
  //       )
  //       .accounts({
  //         propeller,
  //         poolState: flagshipPool,
  //         poolAuth,
  //         poolTokenAccount0: flagshipPoolData.tokenKeys[0]!,
  //         poolTokenAccount1: flagshipPoolData.tokenKeys[1]!,
  //         lpMint: flagshipPoolData.lpMintKey,
  //         governanceFee: flagshipPoolData.governanceFeeKey,
  //         userTokenAccount0: userUsdcAtaAddr,
  //         userTokenAccount1: userUsdtAtaAddr,
  //         poolProgram: TWO_POOL_PROGRAM_ID,
  //         tokenProgram: splToken.programId,
  //         userLpTokenAccount: userSwimUsdAtaAddr,
  //         payer: payer.publicKey,
  //         tokenBridge,
  //         custody,
  //         custodySigner,
  //         authoritySigner,
  //         tokenBridgeConfig,
  //         wormhole,
  //         wormholeConfig,
  //         wormholeFeeCollector,
  //         wormholeEmitter,
  //         wormholeSequence,
  //         wormholeMessage: wormholeMessage.publicKey,
  //         clock: web3.SYSVAR_CLOCK_PUBKEY,
  //         rent: web3.SYSVAR_RENT_PUBKEY,
  //         // dummy: web3.Keypair.generate().publicKey
  //       })
  //       // .signers([wormholeMessage])
  //       .preInstructions([
  //         requestUnitsIx,
  //       ])
  //       .transaction();
  //
  //     const addLiqTxnSig = await provider.sendAndConfirm(
  //       propellerAddLiquidityTx,
  //       [payer, wormholeMessage],
  //       {
  //         skipPreflight: true,
  //       }
  //     );
  //     const txnSize = propellerAddLiquidityTx.serialize().length;
  //     console.log(`addAndWormholeTransfer txnSize: ${txnSize}`)
  //     await connection.confirmTransaction({
  //       signature: addLiqTxnSig,
  //       ...(await connection.getLatestBlockhash())
  //     });
  //
  //     const custodyAmountAfter: anchor.BN = (await splToken.account.token.fetch(custody)).amount;
  //     assert.isTrue(custodyAmountAfter.gt(new anchor.BN(0)));
  //     // console.log(`
  //     //   custodyAmountBefore: ${custodyAmountBefore.toString()}
  //     //   custodyAmountAfter: ${custodyAmountAfter.toString()}
  //     //  `);
  //     // expect(custodyAmountBefore).to.be.lt(custodyAmountAfter, );
  //     // assert.isTrue(custodyAmountBefore.lt(custodyAmountAfter), `custodyAmountBefore: ${custodyAmountBefore.toString()}. custodyAmountAfter: ${custodyAmountAfter.toString()}`)
  //   });
  //
  //   it("Can do pool swap exact input & wh token bridge transfer (2 transactions)", async () => {
  //     let inputAmounts = [new anchor.BN(100_000), new anchor.BN(100_000)];
  //     let minimumMintAmount = new anchor.BN(0);
  //     console.log(`add to flagship pool`)
  //     const addToFlagshipPoolTxn = await addToPool(
  //       provider,
  //       flagshipPool,
  //       flagshipPoolData,
  //       [
  //         userUsdcAtaAddr,
  //         userUsdtAtaAddr,
  //       ],
  //       userSwimUsdAtaAddr,
  //       inputAmounts,
  //       minimumMintAmount,
  //       dummyUser,
  //       flagshipPool
  //     );
  //     console.log(`sendAndConfirmed addToFlagshipPoolTxn: ${addToFlagshipPoolTxn}`);
  //     console.log(`seeding metapool`);
  //     const seedMetapoolTxnSig = await addToPool(
  //       provider,
  //       metapool,
  //       metapoolData,
  //       [
  //         userMetapoolTokenAccount0.address,
  //         userMetapoolTokenAccount1.address,
  //       ],
  //       userMetapoolLpTokenAccount.address,
  //       inputAmounts,
  //       minimumMintAmount,
  //       dummyUser,
  //       metapool
  //     );
  //     console.log(`sendAndConfirmed seedMetapoolTxn: ${seedMetapoolTxnSig}`);
  //
  //     const userLpTokenBalanceBefore = (await splToken.account.token.fetch(userMetapoolTokenAccount0.address)).amount;
  //     console.log(`userLpTokenBalanceBefore: ${userLpTokenBalanceBefore.toString()}`);
  //
  //
  //
  //     const exactInputAmounts: anchor.BN[] = [new anchor.BN(0), new anchor.BN(100)];
  //     // const exactInputAmounts: anchor.BN = new anchor.BN(100);
  //
  //     // const exactInputAmounts: anchor.BN[] = inputAmounts.map(amount => amount.div(new anchor.BN(2)));
  //     const minimumOutputAmount: anchor.BN = new anchor.BN(0);
  //     const outputTokenIndex = 0;
  //     const poolSwapExactInputParams = {
  //       exactInputAmounts,
  //       outputTokenIndex,
  //       minimumOutputAmount
  //     };
  //     const propellerSwapExactInputTx = await propellerProgram
  //       .methods
  //       .swapExactInputV2(
  //         poolSwapExactInputParams,
  //       )
  //       .accounts({
  //         poolState: metapool,
  //         poolAuth: metapoolAuth,
  //         poolTokenAccount0: metapoolData.tokenKeys[0]!,
  //         poolTokenAccount1: metapoolData.tokenKeys[1]!,
  //         lpMint: metapoolData.lpMintKey,
  //         governanceFee: metapoolData.governanceFeeKey,
  //         userTokenAccount0: userMetapoolTokenAccount0.address,
  //         userTokenAccount1: userMetapoolTokenAccount1.address,
  //         poolProgram: TWO_POOL_PROGRAM_ID,
  //         tokenProgram: splToken.programId,
  //         payer: payer.publicKey,
  //       })
  //       .preInstructions([requestUnitsIx])
  //       // .signers([payer, wormholeMessage])
  //       // .rpc();
  //       .transaction();
  //     // ~1179 with empty payload
  //     const swapTxnSig = await provider.sendAndConfirm(
  //       propellerSwapExactInputTx,
  //       [payer],
  //       {
  //         skipPreflight: true
  //       }
  //     );
  //     const txnSize = propellerSwapExactInputTx.serialize().length;
  //     console.log(`swapExactInputAndTransfer txnSize: ${txnSize}`)
  //     await connection.confirmTransaction({
  //       signature: swapTxnSig,
  //       ...(await connection.getLatestBlockhash())
  //     });
  //
  //     const userLpTokenBalanceAfter = (await splToken.account.token.fetch(userMetapoolTokenAccount0.address)).amount;
  //     console.log(`userLpTokenBalanceAfter: ${userLpTokenBalanceAfter.toString()}`);
  //     const transferAmount = userLpTokenBalanceAfter.sub(userLpTokenBalanceBefore);
  //
  //     const nonce = createNonce().readUInt32LE(0);
  //     const payload = Buffer.from([
  //       0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27, 190, 63, 68,
  //       0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27,
  //       // 190,63,68,
  //       // 1242
  //       // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
  //       // 1275
  //       // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
  //     ]);
  //     const wormholeMessage = web3.Keypair.generate();
  //     const transferNativeTxn = await propellerProgram
  //       .methods
  //       .transferNativeWithPayload(
  //         nonce,
  //         CHAIN_ID_ETH,
  //         transferAmount,
  //         evmTargetTokenId,
  //         evmTargetTokenAddr,
  //         evmOwner,
  //         false,
  //       )
  //       .accounts({
  //         propeller,
  //         payer: payer.publicKey,
  //         tokenBridgeConfig,
  //         userTokenBridgeAccount: userSwimUsdAtaAddr,
  //         tokenBridgeMint,
  //         custody,
  //         tokenBridge,
  //         custodySigner,
  //         authoritySigner,
  //         wormholeConfig,
  //         wormholeMessage: wormholeMessage.publicKey,
  //         wormholeEmitter,
  //         wormholeSequence,
  //         wormholeFeeCollector,
  //         clock: web3.SYSVAR_CLOCK_PUBKEY,
  //         // autoderived
  //         // sender
  //         rent: web3.SYSVAR_RENT_PUBKEY,
  //         // autoderived
  //         // systemProgram,
  //         wormhole,
  //         tokenProgram: splToken.programId,
  //       })
  //       .preInstructions([
  //         requestUnitsIx,
  //       ])
  //       .transaction();
  //
  //     const transferNativeTxnSig = await provider.sendAndConfirm(
  //       transferNativeTxn,
  //       [payer, wormholeMessage],
  //       {
  //         skipPreflight: true,
  //       }
  //     );
  //
  //     const transferNativeTxnSize = transferNativeTxn.serialize().length;
  //     console.log(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`)
  //     await connection.confirmTransaction({
  //       signature: transferNativeTxnSig,
  //       ...(await connection.getLatestBlockhash())
  //     });
  //
  //     const userLpTokenBalanceAfter2 = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
  //     console.log(`userLpTokenBalanceAfter2: ${userLpTokenBalanceAfter2.toString()}`);
  //     assert.isTrue(userLpTokenBalanceAfter2.eq(userLpTokenBalanceAfter.sub(transferAmount)));
  //   });
  //
  //
  //   it("Can do SwapExactInputAndTransfer", async () => {
  //     let inputAmounts = [new anchor.BN(100), new anchor.BN(100)];
  //     let minimumMintAmount = new anchor.BN(0);
  //     console.log(`add to flagship pool`)
  //     const addToFlagshipPoolTxn = await addToPool(
  //       provider,
  //       flagshipPool,
  //       flagshipPoolData,
  //       [
  //         userUsdcAtaAddr,
  //         userUsdtAtaAddr,
  //       ],
  //       userSwimUsdAtaAddr,
  //       inputAmounts,
  //       minimumMintAmount,
  //       dummyUser,
  //       flagshipPool
  //     );
  //     console.log(`sendAndConfirmed addToFlagshipPoolTxn: ${addToFlagshipPoolTxn}`);
  //     console.log(`seeding metapool`);
  //     const seedMetapoolTxnSig = await addToPool(
  //       provider,
  //       metapool,
  //       metapoolData,
  //       [
  //         userMetapoolTokenAccount0.address,
  //         userMetapoolTokenAccount1.address,
  //       ],
  //       userMetapoolLpTokenAccount.address,
  //       inputAmounts,
  //       minimumMintAmount,
  //       dummyUser,
  //       metapool
  //     );
  //     console.log(`sendAndConfirmed seedMetapoolTxn: ${seedMetapoolTxnSig}`);
  //
  //
  //     const wormholeMessage = web3.Keypair.generate();
  //     // const custodyAmountBefore: anchor.BN = (await splToken.account.token.fetch(custodyOrWrappedMeta)).amount;
  //
  //     const custodyAmountBefore: anchor.BN = (await splToken.account.token.fetch(custody)).amount;
  //
  //     const userBridgeTokenAccountAmountBefore = (await splToken.account.token.fetch(userMetapoolTokenAccount0.address)).amount;
  //     // const exactInputAmounts: anchor.BN[] = [new anchor.BN(0), new anchor.BN(100)];
  //     const exactInputAmount: anchor.BN = new anchor.BN(100);
  //
  //     // const exactInputAmounts: anchor.BN[] = inputAmounts.map(amount => amount.div(new anchor.BN(2)));
  //     const minimumOutputAmount: anchor.BN = new anchor.BN(0);
  //     const poolSwapExactInputParams = {
  //       exactInputAmount,
  //       minimumOutputAmount
  //     };
  //     const nonce = createNonce().readUInt32LE(0);
  //     const nonceUint8Arr = byteify.serializeUint32(nonce);
  //     console.log(`nonce: ${nonce}, nonce Uint8Array: ${nonceUint8Arr}`);
  //     const payload = Buffer.from([
  //       0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27, 190, 63, 68,
  //       0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27,
  //       // 190,63,68,
  //       // 1242
  //       // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
  //       // 1275
  //       // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
  //     ]);
  //     const propellerSwapExactInputAndTransferTx = await propellerProgram
  //       .methods
  //       .swapExactInputAndTransfer(
  //         poolSwapExactInputParams,
  //         nonce,
  //         CHAIN_ID_ETH,
  //         // payload
  //       )
  //       .accounts({
  //         propeller,
  //         poolState: metapool,
  //         poolAuth: metapoolAuth,
  //         poolTokenAccount0: metapoolData.tokenKeys[0]!,
  //         poolTokenAccount1: metapoolData.tokenKeys[1]!,
  //         lpMint: metapoolData.lpMintKey,
  //         governanceFee: metapoolData.governanceFeeKey,
  //         userTokenAccount0: userMetapoolTokenAccount0.address,
  //         userTokenAccount1: userMetapoolTokenAccount1.address,
  //         poolProgram: TWO_POOL_PROGRAM_ID,
  //         tokenProgram: splToken.programId,
  //         tokenBridgeMint,
  //         payer: payer.publicKey,
  //         tokenBridge,
  //         custody,
  //         custodySigner,
  //         authoritySigner,
  //         tokenBridgeConfig,
  //         wormhole,
  //         wormholeConfig,
  //         wormholeFeeCollector,
  //         wormholeEmitter,
  //         wormholeSequence,
  //         wormholeMessage: wormholeMessage.publicKey,
  //         clock: web3.SYSVAR_CLOCK_PUBKEY,
  //         rent: web3.SYSVAR_RENT_PUBKEY,
  //       })
  //       // .signers([payer, wormholeMessage])
  //       .preInstructions([
  //         requestUnitsIx,
  //       ])
  //       // .rpc();
  //       .transaction();
  //     // ~1179 with empty payload
  //     const swapTxnSig = await provider.sendAndConfirm(
  //       propellerSwapExactInputAndTransferTx,
  //       [payer, wormholeMessage],
  //       {
  //         skipPreflight: true
  //       }
  //     );
  //     const txnSize = propellerSwapExactInputAndTransferTx.serialize().length;
  //     console.log(`swapExactInputAndTransfer txnSize: ${txnSize}`)
  //     await connection.confirmTransaction({
  //       signature: swapTxnSig,
  //       ...(await connection.getLatestBlockhash())
  //     });
  //
  //
  //     const userBridgeTokenAccountAmountAfter = (await splToken.account.token.fetch(userMetapoolTokenAccount0.address)).amount;
  //     console.log(`
  //           userBridgeTokenAccountAmountBefore: ${userBridgeTokenAccountAmountBefore}
  //           userBridgeTokenAccountAmountAfter: ${userBridgeTokenAccountAmountAfter}
  //       `);
  //
  //     const custodyAmountAfter: anchor.BN = (await splToken.account.token.fetch(custody)).amount;
  //     console.log(`
  //           custodyAmountBefore: ${custodyAmountBefore}
  //           custodyAmountAfter: ${custodyAmountAfter}
  //       `)
  //     assert.isTrue(custodyAmountAfter.gt(custodyAmountBefore));
  //
  //     const messageAccountInfo = (await connection.getAccountInfo(wormholeMessage.publicKey))!;
  //
  //
  //     console.log(`messageAccountInfo: ${JSON.stringify(messageAccountInfo.data)}`);
  //
  //     // vaa: 118,97,97
  //     // msg: 109,115,103
  //     // msu: 109,115,117
  //     // let discriminators = ["vaa", "msg", "msu"];
  //     // let txtEncoder = new TextEncoder();
  //     // discriminators.forEach(discriminator => { console.log(`${discriminator}: ${txtEncoder.encode(discriminator)}`) });
  //
  //     // program.methods.Message.deserialize(messageAccountInfo.data);
  //
  //
  //
  //
  //     // const parsed2 = await parseTokenTransferWithPayloadPostedMessage(messageAccountInfo.data);
  //     // const {
  //     // 	payload: postedMessagePayload2,
  //     // } = parsed2;
  //     // console.log(`parsed2: ${JSON.stringify(parsed2, null ,2)}`);
  //     const {
  //       payload: postedMessagePayload,
  //       ...postedMessage
  //     }  = await parseTokenTransferWithSwimPayloadPostedMessage(messageAccountInfo.data);
  //     console.log(`postedMessage:\n${JSON.stringify(postedMessage)}`);
  //
  //
  //
  //
  //     expect(postedMessagePayload.originAddress).to.equal(tokenBridgeMint.toBase58());
  //     expect(postedMessagePayload.originChain).to.equal(toChainName(CHAIN_ID_SOLANA));
  //     // still a dummy default address for now
  //     // expect(tryHexToNativeAssetString(parsedMessagePayload.targetAddress, CHAIN_ID_ETH)).to.equal(userMetapoolTokenAccount0.toBase58());
  //     expect(postedMessagePayload.targetChain).to.equal(toChainName(CHAIN_ID_ETH));
  //     expect(postedMessagePayload.fromAddress).to.equal(propellerProgram.programId.toBase58());
  //
  //
  //     // const {parse_posted_message} = await importCoreWasm();
  //     // const postedMessage = parse_posted_message(messageAccountInfo.data);
  //     // console.log(`postedMessage: ${JSON.stringify(postedMessage)}`);
  //     // const postedMessageEmitterAddr = tryHexToNativeAssetString(
  //     // 	Buffer.from(postedMessage.emitter_address).toString('hex'), CHAIN_ID_SOLANA
  //     // );
  //     // console.log(`postedMessageEmitterAddr: ${postedMessageEmitterAddr}`);
  //     // const postedMessagePayload = postedMessage.payload;
  //     // const parsedMessagePayload = parseTransferWithPayload(Buffer.from(postedMessagePayload));
  //     // console.log(`
  //     //     parsedMessagePayload: {
  //     //         amount: ${parsedMessagePayload.amount.toString()}
  //     //         originAddress: ${tryHexToNativeAssetString(parsedMessagePayload.originAddress, CHAIN_ID_SOLANA)}
  //     //         originChain: ${toChainName(parsedMessagePayload.originChain)}
  //     //         targetAddress: ${tryHexToNativeAssetString(parsedMessagePayload.targetAddress, CHAIN_ID_ETH)}
  //     //         targetChain: ${(toChainName(parsedMessagePayload.targetChain))}
  //     //         fromAddress: ${tryHexToNativeAssetString(parsedMessagePayload.fromAddress, CHAIN_ID_SOLANA)}
  //     //         payload: ${parsedMessagePayload.payload}
  //     //     }
  //     // `);
  //     // expect(tryHexToNativeAssetString(parsedMessagePayload.originAddress, CHAIN_ID_SOLANA)).to.equal(tokenBridgeMint.toBase58());
  //     // expect(parsedMessagePayload.originChain).to.equal(CHAIN_ID_SOLANA);
  //     // // still a dummy default address for now
  //     // // expect(tryHexToNativeAssetString(parsedMessagePayload.targetAddress, CHAIN_ID_ETH)).to.equal(userMetapoolTokenAccount0.toBase58());
  //     // expect(parsedMessagePayload.targetChain).to.equal(CHAIN_ID_ETH);
  //     // expect(tryHexToNativeAssetString(parsedMessagePayload.fromAddress, CHAIN_ID_SOLANA)).to.equal(program.programId.toBase58());
  //     let emitterSequenceAcctInfo = await connection.getAccountInfo(wormholeSequence);
  //     if (!emitterSequenceAcctInfo) {
  //       throw new Error("emitter account not found");
  //     }
  //     // let emitterSequence = emitterSequenceAcctInfo!.data.readBigUint64BE()
  //     let emitterSequence = emitterSequenceAcctInfo!.data.readBigUint64LE()
  //     console.log(`emitterSequence after: ${emitterSequence}`);
  //
  //     // #[derive(Debug, Default, BorshSerialize, BorshDeserialize, Clone, Serialize, Deserialize)]
  //     // pub struct MessageData {
  //     //   /// Header of the posted VAA
  //     //   pub vaa_version: u8,
  //     //
  //     //   /// Level of consistency requested by the emitter
  //     //   pub consistency_level: u8,
  //     //
  //     //   /// Time the vaa was submitted
  //     //   pub vaa_time: u32,
  //     //
  //     //   /// Account where signatures are stored
  //     //   pub vaa_signature_account: Pubkey,
  //     //
  //     //   /// Time the posted message was created
  //     //   pub submission_time: u32,
  //     //
  //     //   /// Unique nonce for this message
  //     //   pub nonce: u32,
  //     //
  //     //   /// Sequence number of this message
  //     //   pub sequence: u64,
  //     //
  //     //   /// Emitter of the message
  //     //   pub emitter_chain: u16,
  //     //
  //     //   /// Emitter of the message
  //     //   pub emitter_address: [u8; 32],
  //     //
  //     //   /// Message payload
  //     //   pub payload: Vec<u8>,
  //     // }
  //     //
  //     // PayloadTransferWithPayload {
  //     //   amount: U256::from(amount), -> 32 bytes
  //     //   token_address: accs.mint.info().key.to_bytes(),
  //     //   token_chain: CHAIN_ID_SOLANA,
  //     //   to: data.target_address,
  //     //   to_chain: data.target_chain,
  //     //   from_address: accs.sender.derive_sender_address(&data.cpi_program_id)?,
  //     //   payload: data.payload,
  //     // };
  //     //
  //   });
  //
  //   it("Can do pool swap exact output & wh token bridge transfer (2 transactions)", async () => {
  //
  //     const userLpTokenBalanceBefore = (await splToken.account.token.fetch(userMetapoolTokenAccount0.address)).amount;
  //     console.log(`userLpTokenBalanceBefore: ${userLpTokenBalanceBefore.toString()}`);
  //     const maximumInputAmount: anchor.BN = new anchor.BN(100_000_000);
  //     const inputTokenIndex = 1;
  //     const exactOutputAmounts: anchor.BN[] = [new anchor.BN(100), new anchor.BN(0)];
  //     const poolSwapExactOutputParams = {
  //       maximumInputAmount,
  //       inputTokenIndex,
  //       exactOutputAmounts
  //     };
  //     const propellerSwapExactInputTx = await propellerProgram
  //       .methods
  //       .swapExactOutputV2(
  //         poolSwapExactOutputParams,
  //       )
  //       .accounts({
  //         poolState: metapool,
  //         poolAuth: metapoolAuth,
  //         poolTokenAccount0: metapoolData.tokenKeys[0]!,
  //         poolTokenAccount1: metapoolData.tokenKeys[1]!,
  //         lpMint: metapoolData.lpMintKey,
  //         governanceFee: metapoolData.governanceFeeKey,
  //         userTokenAccount0: userMetapoolTokenAccount0.address,
  //         userTokenAccount1: userMetapoolTokenAccount1.address,
  //         poolProgram: TWO_POOL_PROGRAM_ID,
  //         tokenProgram: splToken.programId,
  //         payer: payer.publicKey,
  //       })
  //       .preInstructions([requestUnitsIx])
  //       // .signers([payer, wormholeMessage])
  //       // .rpc();
  //       .transaction();
  //     // ~1179 with empty payload
  //     const swapTxnSig = await provider.sendAndConfirm(
  //       propellerSwapExactInputTx,
  //       [payer],
  //       {
  //         skipPreflight: true
  //       }
  //     );
  //     const txnSize = propellerSwapExactInputTx.serialize().length;
  //     console.log(`swapExactInputAndTransfer txnSize: ${txnSize}`)
  //     await connection.confirmTransaction({
  //       signature: swapTxnSig,
  //       ...(await connection.getLatestBlockhash())
  //     });
  //
  //     const userLpTokenBalanceAfter = (await splToken.account.token.fetch(userMetapoolTokenAccount0.address)).amount;
  //     console.log(`userLpTokenBalanceAfter: ${userLpTokenBalanceAfter.toString()}`);
  //     const transferAmount = userLpTokenBalanceAfter.sub(userLpTokenBalanceBefore);
  //
  //     const nonce = createNonce().readUInt32LE(0);
  //     const payload = Buffer.from([
  //       0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27, 190, 63, 68,
  //       0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27,
  //       // 190,63,68,
  //       // 1242
  //       // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
  //       // 1275
  //       // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
  //     ]);
  //     const wormholeMessage = web3.Keypair.generate();
  //     const transferNativeTxn = await propellerProgram
  //       .methods
  //       .transferNativeWithPayload(
  //         nonce,
  //         CHAIN_ID_ETH,
  //         transferAmount,
  //         evmTargetTokenId,
  //         evmTargetTokenAddr,
  //         evmOwner,
  //         false,
  //       )
  //       .accounts({
  //         propeller,
  //         payer: payer.publicKey,
  //         tokenBridgeConfig,
  //         userTokenBridgeAccount: userSwimUsdAtaAddr,
  //         tokenBridgeMint,
  //         custody,
  //         tokenBridge,
  //         custodySigner,
  //         authoritySigner,
  //         wormholeConfig,
  //         wormholeMessage: wormholeMessage.publicKey,
  //         wormholeEmitter,
  //         wormholeSequence,
  //         wormholeFeeCollector,
  //         clock: web3.SYSVAR_CLOCK_PUBKEY,
  //         // autoderived
  //         // sender
  //         rent: web3.SYSVAR_RENT_PUBKEY,
  //         // autoderived
  //         // systemProgram,
  //         wormhole,
  //         tokenProgram: splToken.programId,
  //       })
  //       .preInstructions([
  //         requestUnitsIx,
  //       ])
  //       .transaction();
  //
  //     const transferNativeTxnSig = await provider.sendAndConfirm(
  //       transferNativeTxn,
  //       [payer, wormholeMessage],
  //       {
  //         skipPreflight: true,
  //       }
  //     );
  //
  //     const transferNativeTxnSize = transferNativeTxn.serialize().length;
  //     console.log(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`)
  //     await connection.confirmTransaction({
  //       signature: transferNativeTxnSig,
  //       ...(await connection.getLatestBlockhash())
  //     });
  //
  //     const userLpTokenBalanceAfter2 = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
  //     console.log(`userLpTokenBalanceAfter2: ${userLpTokenBalanceAfter2.toString()}`);
  //     assert.isTrue(userLpTokenBalanceAfter2.eq(userLpTokenBalanceAfter.sub(transferAmount)));
  //   });
  //   it("mock token transfer VAA then complete (w/o payload) ", async() => {
  //     // let emitterSequenceAcctInfo = await connection.getAccountInfo(wormholeSequence);
  //     // if (!emitterSequenceAcctInfo) {
  //     // 	throw new Error("emitter account not found");
  //     // }
  //     // // let emitterSequence = emitterSequenceAcctInfo!.data.readBigUint64BE()
  //     // let emitterSequence = emitterSequenceAcctInfo!.data.readBigUint64LE()
  //     //
  //     // const attestMetaSignedVaa = signAndEncodeVaa(
  //     // 	0,
  //     // 	0,
  //     // 	CHAIN_ID_SOLANA as number,
  //     // 	Buffer.from(
  //     // 		tryNativeToHexString(wormholeEmitter.toBase58(), CHAIN_ID_SOLANA),
  //     // 		"hex"
  //     // 	),
  //     // 	++emitterSequence,
  //     // 	encodeAttestMeta(
  //     // 		Buffer.from(
  //     // 			tryNativeToHexString(tokenBridgeMint.toBase58(), CHAIN_ID_SOLANA),
  //     // 			"hex"
  //     // 		),
  //     // 		CHAIN_ID_SOLANA,
  //     // 		swimUSDMintInfo.decimals,
  //     // 		"swimUSD",
  //     // 		"swimUSD$"
  //     // 	)
  //     // );
  //     //
  //     // await postVaaSolanaWithRetry(
  //     // 	connection,
  //     // 	async (tx) => {
  //     // 		tx.partialSign(payer);
  //     // 		return tx;
  //     // 	},
  //     // 	WORMHOLE_CORE_BRIDGE.toString(),
  //     // 	payer.publicKey.toString(),
  //     // 	attestMetaSignedVaa,
  //     // 	10
  //     // );
  //     //
  //     // emitterSequenceAcctInfo = await connection.getAccountInfo(wormholeSequence);
  //     // let emitterSequenceAfter = emitterSequenceAcctInfo!.data.readBigUint64LE()
  //     // console.log(`emitterSequenceAfter: ${emitterSequenceAfter.toString()}`);
  //     // const transaction = await attestFromSolana(
  //     // 	connection,
  //     // 	WORMHOLE_CORE_BRIDGE.toBase58(),
  //     // 	WORMHOLE_TOKEN_BRIDGE.toBase58(),
  //     // 	payer.publicKey.toBase58(),
  //     // 	swimUSDMint.publicKey.toBase58(),
  //     // );
  //     //
  //     // const attestSig = await provider.sendAndConfirm(
  //     // 	transaction, [], confirmedCommitment
  //     // );
  //     // console.log(`attestSig: ${attestSig}`);
  //     // const info = await connection.getTransaction(attestSig, confirmedCommitment);
  //     // if (!info) {
  //     // 	throw new Error(
  //     // 		"An error occurred while fetching the transaction info"
  //     // 	);
  //     // }
  //     // // get the sequence from the logs (needed to fetch the vaa)
  //     // const logs = info.meta?.logMessages;
  //     // console.log(`logs: ${JSON.stringify(logs)}`);
  //     // let sequence = BigInt(parseSequenceFromLogSolana(info));
  //     // console.log(`sequence: ${sequence.toString()}`);
  //     //    wrapped_meta_address(program_id: string, mint_address: Uint8Array): Uint8Array;
  //     //     parse_wrapped_meta(data: Uint8Array): any;
  //     // const {
  //     // 	wrapped_meta_address,
  //     // 	parse_wrapped_meta
  //     // } = await importTokenWasm();
  //     // const [splMeta, mintMeta] = await getMintMetaPdas(swimUSDMint.publicKey);
  //     // const expectedMintMeta = new web3.PublicKey(
  //     // 	wrapped_meta_address(WORMHOLE_TOKEN_BRIDGE.toBase58(),
  //     // 		swimUSDMint.publicKey.toBytes())
  //     // );
  //     // console.log(`mintMeta: ${mintMeta!.toString()}, expectedMintMeta: ${expectedMintMeta.toString()}`);
  //
  //     // dummy eth source wrapped swimUSD account
  //     // const ethWrappedSwimUsdAddr = Buffer.alloc(32);
  //     // ethWrappedSwimUsdAddr.fill(105, 12);
  //
  //     // const swimUsdHexAddr = tryNativeToHexString(swimUSDMint.publicKey.toBase58(), CHAIN_ID_SOLANA);
  //     // console.log(`swimUSD: ${swimUsdHexAddr}`)
  //     // let amount = new anchor.BN("200000000000");
  //     let amount = parseUnits("1", swimUSDMintInfo.decimals);
  //     console.log(`amount: ${amount.toString()}`);
  //     const tokenTransferSignedVaa = signAndEncodeVaa(
  //       0,
  //       0,
  //       CHAIN_ID_ETH as number,
  //       ethTokenBridge,
  //       ++ethTokenBridgeSequence,
  //       encodeTokenTransfer(
  //         amount.toString(),
  //         swimUsdKeypair.publicKey.toBuffer(),
  //         // Buffer.from(swimUsdHexAddr),
  //         CHAIN_ID_SOLANA,
  //         // ethWrappedSwimUsdAddr,
  //         // CHAIN_ID_ETH,
  //         userSwimUsdAtaAddr
  //       )
  //     );
  //     const userLpTokenAccountBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
  //
  //
  //     // const signatureSet = web3.Keypair.generate();
  //     // const verifySigIxs = await createVerifySignaturesInstructionsSolana(
  //     // 	provider.connection,
  //     // 	WORMHOLE_CORE_BRIDGE.toBase58(),
  //     // 	payer.publicKey.toBase58(),
  //     // 	tokenTransferSignedVaa,
  //     // 	signatureSet
  //     // );
  //     // // const verifyTxns: web3.Transaction[] = [];
  //     // const verifyTxnSigs: string[] = [];
  //     // const batchableChunks = chunks(verifySigIxs, 2);
  //     // await Promise.all(batchableChunks.map(async (chunk) => {
  //     // 	let txn = new web3.Transaction();
  //     // 	for (const chunkIx of chunk) {
  //     // 		txn.add(chunkIx);
  //     // 	}
  //     // 	// txn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  //     // 	// txn.partialSign(signatureSet);
  //     // 	const txnSig = await provider.sendAndConfirm(txn, [signatureSet], confirmedCommitment);
  //     // 	console.log(`txnSig: ${txnSig} had ${chunk.length} instructions`);
  //     // 	verifyTxnSigs.push(txnSig);
  //     // }));
  //     // console.log(`verifyTxnSigs: ${JSON.stringify(verifyTxnSigs)}`);
  //     // await Promise.all(verifyTxnSigs.map(async (txnSig) => {
  //     // 	const info = await connection.getTransaction(txnSig, confirmedCommitment);
  //     // 	if (!info) {
  //     // 		throw new Error(
  //     // 			`An error occurred while fetching the transaction info for ${txnSig}`
  //     // 		);
  //     // 	}
  //     // 	// get the sequence from the logs (needed to fetch the vaa)
  //     // 	const logs = info.meta?.logMessages;
  //     // 	console.log(`${txnSig} logs: ${JSON.stringify(logs)}`);
  //     // }));
  //     //
  //     //
  //     // const postVaaIx = await createPostVaaInstructionSolana(
  //     // 	WORMHOLE_CORE_BRIDGE.toBase58(),
  //     // 	payer.publicKey.toBase58(),
  //     // 	tokenTransferSignedVaa,
  //     // 	signatureSet
  //     // );
  //     // const postVaaTxn = new web3.Transaction().add(postVaaIx);
  //     // const postVaaTxnSig = await provider.sendAndConfirm(postVaaTxn, [], confirmedCommitment);
  //     // console.log(`postVaaTxnSig: ${postVaaTxnSig}`);
  //     // const postVaaTxnSigInfo = await connection.getTransaction(postVaaTxnSig, confirmedCommitment);
  //     // if (!postVaaTxnSigInfo) {
  //     // 	throw new Error(
  //     // 		`An error occurred while fetching the transaction info for ${postVaaTxnSig}`
  //     // 	);
  //     // }
  //
  //     await postVaaSolanaWithRetry(
  //       connection,
  //       async (tx) => {
  //         tx.partialSign(payer);
  //         return tx;
  //       },
  //       WORMHOLE_CORE_BRIDGE.toBase58(),
  //       payer.publicKey.toBase58(),
  //       tokenTransferSignedVaa,
  //       10
  //     );
  //
  //
  //     const parsedTokenTransferVaa = await parseTokenTransferVaa(tokenTransferSignedVaa);
  //     console.log(`parsedTokenTransferVaa:\n${JSON.stringify(parsedTokenTransferVaa, null, 2)}`);
  //     // const {
  //     // 	parse_vaa
  //     // } = await importCoreWasm();
  //     // const parsedTokenTransferVaa = parse_vaa(tokenTransferSignedVaa);
  //     // console.log(`parsedTokenTransferVaa: ${JSON.stringify(parsedTokenTransferVaa)}`)
  //     // const isSolanaNative =
  //     // 	Buffer.from(new Uint8Array(parsedTokenTransferVaa.payload)).readUInt16BE(65) ===
  //     // 	CHAIN_ID_SOLANA;
  //     // console.log(`isSolanaNative: ${isSolanaNative}`);
  //     //
  //     // const parsedTokenTransferPayload = parseTransferPayload(
  //     // 	Buffer.from(parsedTokenTransferVaa.payload)
  //     // );
  //     // console.log(`
  //     // 	parsedTokenTransferPayload: {
  //     // 		amount: ${parsedTokenTransferPayload.amount.toString()}
  //     //         originAddress: ${tryHexToNativeAssetString(parsedTokenTransferPayload.originAddress, CHAIN_ID_SOLANA)}
  //     //         originChain: ${toChainName(parsedTokenTransferPayload.originChain)}
  //     //         targetAddress: ${tryHexToNativeAssetString(parsedTokenTransferPayload.targetAddress, CHAIN_ID_SOLANA)}
  //     //         targetChain: ${(toChainName(parsedTokenTransferPayload.targetChain))}
  //     //         fee: ${parsedTokenTransferPayload.fee.toString()}
  //     // 	}
  //     // `);
  //     // get the sequence from the logs (needed to fetch the vaa)
  //     // const postVaaTxnLogs = postVaaTxnSigInfo.meta?.logMessages;
  //     // console.log(`${postVaaTxnSig} logs: ${JSON.stringify(postVaaTxnLogs)}`);
  //
  //
  //     const redeemTxn = await redeemOnSolana(
  //       connection,
  //       WORMHOLE_CORE_BRIDGE.toBase58(),
  //       WORMHOLE_TOKEN_BRIDGE.toBase58(),
  //       payer.publicKey.toBase58(),
  //       Uint8Array.from(tokenTransferSignedVaa)
  //     );
  //     const redeemSig = await provider.sendAndConfirm(redeemTxn, [], {
  //       skipPreflight: true
  //     });
  //     console.log(`redeemSig: ${redeemSig}`);
  //
  //     const userLpTokenAccountBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
  //
  //     // amount: 100_000_000
  //     // userLpTokenAccountBalanceBefore: 100
  //     // userLpTokenAccountBalanceAfter: 100_000_100
  //
  //     console.log(`
	// 		amount: ${amount.toString()}
	// 		userLpTokenAccountBalanceBefore: ${userLpTokenAccountBalanceBefore.toString()}
	// 		userLpTokenAccountBalanceAfter: ${userLpTokenAccountBalanceAfter.toString()}
	// 	`);
  //     const expectedAmount = userLpTokenAccountBalanceBefore.add(new anchor.BN(amount.toString()));
  //     assert(userLpTokenAccountBalanceAfter.eq(expectedAmount));
  //     // expect(userLpTokenAccountBalanceAfter).to.deep.equal(
  //     // 	userLpTokenAccountBalanceBefore.add.rs(new anchor.BN(amount.toString()))
  //     // );
  //
  //     // {
  //     // 	const response = await redeemOnSolana(
  //     // 		connection,
  //     // 		CORE_BRIDGE_ADDRESS.toString(),
  //     // 		TOKEN_BRIDGE_ADDRESS.toString(),
  //     // 		buyer.publicKey.toString(),
  //     // 		Uint8Array.from(tokenTransferSignedVaa)
  //     // 	)
  //     // 		.then((transaction) => {
  //     // 			transaction.partialSign(buyer);
  //     // 			return connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true });
  //     // 		})
  //     // 		.then((tx) => connection.confirmTransaction(tx));
  //     // }
  //     //
  //     // const balance = await getSplBalance(connection, mint, buyer.publicKey);
  //     // expect(balance.toString()).to.equal(amount.toString());
  //
  //     // const parsedWrappedMeta = parse_wrapped_meta(
  //     // 	(await connection.getAccountInfo(mintMeta!, "confirmed"))!.data
  //     // );
  //     // console.log(`parsedWrappedMeta: ${JSON.stringify(parsedWrappedMeta)}`);
  //   });
  //
  //   it("mocks token transfer with payload then calls propeller complete with payload", async () => {
  //     const payload = Buffer.from([1,2,3]);
  //     let amount = parseUnits("1", swimUSDMintInfo.decimals);
  //     console.log(`amount: ${amount.toString()}`);
  //     const tokenTransferWithPayloadSignedVaa = signAndEncodeVaa(
  //       0,
  //       0,
  //       CHAIN_ID_ETH as number,
  //       ethTokenBridge,
  //       ++ethTokenBridgeSequence,
  //       encodeTokenTransferWithPayload(
  //         amount.toString(),
  //         swimUsdKeypair.publicKey.toBuffer(),
  //         CHAIN_ID_SOLANA,
  //         // propellerRedeemer,
  //         //"to" - if vaa.to != `Redeemer` account then it is assumed that this transfer was targeting
  //         // a contract(the programId of the vaa.to field) and token bridge will verify that redeemer is a pda
  //         //  owned by the `vaa.to` and derived the seed "redeemer".
  //         // note - technically you can specify an arbitrary PDA account as the `to` field
  //         // as long as the redeemer account is set to the same address but then we (propeller contract)
  //         // would need to do the validations ourselves.
  //         propellerProgram.programId,
  //         ethRoutingContract,
  //         payload
  //       )
  //     );
  //     const propellerRedeemerEscrowAccountBefore = (await splToken.account.token.fetch(propellerRedeemerEscrowAccount.address)).amount;
  //
  //     // const signatureSet = web3.Keypair.generate();
  //     // const verifySigIxs = await createVerifySignaturesInstructionsSolana(
  //     // 	provider.connection,
  //     // 	WORMHOLE_CORE_BRIDGE.toBase58(),
  //     // 	payer.publicKey.toBase58(),
  //     // 	tokenTransferWithPayloadSignedVaa,
  //     // 	signatureSet
  //     // );
  //     // // const verifyTxns: web3.Transaction[] = [];
  //     // const verifyTxnSigs: string[] = [];
  //     // const batchableChunks = chunks(verifySigIxs, 2);
  //     // await Promise.all(batchableChunks.map(async (chunk) => {
  //     // 	let txn = new web3.Transaction();
  //     // 	for (const chunkIx of chunk) {
  //     // 		txn.add(chunkIx);
  //     // 	}
  //     // 	// txn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  //     // 	// txn.partialSign(signatureSet);
  //     // 	const txnSig = await provider.sendAndConfirm(txn, [signatureSet], confirmedCommitment);
  //     // 	console.log(`txnSig: ${txnSig} had ${chunk.length} instructions`);
  //     // 	verifyTxnSigs.push(txnSig);
  //     // }));
  //     // console.log(`verifyTxnSigs: ${JSON.stringify(verifyTxnSigs)}`);
  //     // await Promise.all(verifyTxnSigs.map(async (txnSig) => {
  //     // 	const info = await connection.getTransaction(txnSig, confirmedCommitment);
  //     // 	if (!info) {
  //     // 		throw new Error(
  //     // 			`An error occurred while fetching the transaction info for ${txnSig}`
  //     // 		);
  //     // 	}
  //     // 	// get the sequence from the logs (needed to fetch the vaa)
  //     // 	const logs = info.meta?.logMessages;
  //     // 	console.log(`${txnSig} logs: ${JSON.stringify(logs)}`);
  //     // }));
  //     //
  //     //
  //     // const postVaaIx = await createPostVaaInstructionSolana(
  //     // 	WORMHOLE_CORE_BRIDGE.toBase58(),
  //     // 	payer.publicKey.toBase58(),
  //     // 	tokenTransferWithPayloadSignedVaa,
  //     // 	signatureSet
  //     // );
  //     // const postVaaTxn = new web3.Transaction().add(postVaaIx);
  //     // const postVaaTxnSig = await provider.sendAndConfirm(postVaaTxn, [], confirmedCommitment);
  //     // console.log(`postVaaTxnSig: ${postVaaTxnSig}`);
  //     // const postVaaTxnSigInfo = await connection.getTransaction(postVaaTxnSig, confirmedCommitment);
  //     // if (!postVaaTxnSigInfo) {
  //     // 	throw new Error(
  //     // 		`An error occurred while fetching the transaction info for ${postVaaTxnSig}`
  //     // 	);
  //     // }
  //     //
  //     // const postVaaIxMessageAcct = postVaaIx.keys[3].pubkey;
  //
  //     await postVaaSolanaWithRetry(
  //       connection,
  //       async (tx) => {
  //         tx.partialSign(payer);
  //         return tx;
  //       },
  //       WORMHOLE_CORE_BRIDGE.toBase58(),
  //       payer.publicKey.toBase58(),
  //       tokenTransferWithPayloadSignedVaa,
  //       10
  //     );
  //
  //
  //     const parsedTokenTransferVaa = await parseTokenTransferVaa(tokenTransferWithPayloadSignedVaa);
  //     console.log(`parsedTokenTransferVaa:\n${JSON.stringify(parsedTokenTransferVaa, null, 2)}`);
  //     const { claim_address } = await importCoreWasm();
  //     // const wormholeMessage = web3.Keypair.generate();
  //
  //     // TODO: this wasn't working for some reason. kept getting some wasm related error.
  //     // const { complete_transfer_native_ix } = await importTokenWasm();
  //     /*
  //      accounts: vec![
  //             AccountMeta::new(payer, true),
  //             AccountMeta::new_readonly(config_key, false),
  //             message_acc,
  //             claim_acc,
  //             AccountMeta::new_readonly(endpoint, false),
  //             AccountMeta::new(to, false),
  //             if let Some(fee_r) = fee_recipient {
  //                 AccountMeta::new(fee_r, false)
  //             } else {
  //                 AccountMeta::new(to, false)
  //             },
  //             AccountMeta::new(custody_key, false),
  //             AccountMeta::new_readonly(mint, false),
  //             AccountMeta::new_readonly(custody_signer_key, false),
  //             // Dependencies
  //             AccountMeta::new_readonly(solana_program::sysvar::rent::id(), false),
  //             AccountMeta::new_readonly(solana_program::system_program::id(), false),
  //             // Program
  //             AccountMeta::new_readonly(bridge_id, false),
  //             AccountMeta::new_readonly(spl_token::id(), false),
  //         ],
  //      */
  //     // const complete_wrapped_accounts = ixFromRust(
  //     // 	complete_transfer_native_ix(
  //     // 		WORMHOLE_TOKEN_BRIDGE.toBase58(),
  //     // 		WORMHOLE_CORE_BRIDGE.toBase58(),
  //     // 		payer.publicKey.toBase58(),
  //     // 		tokenTransferWithPayloadSignedVaa
  //     // 	)
  //     // ).keys;
  //     const [messageAccount] = await deriveMessagePda(
  //       tokenTransferWithPayloadSignedVaa,
  //       WORMHOLE_CORE_BRIDGE
  //     );
  //
  //     // console.log(`
  //     // 	postVaaIxMessageAcct: ${postVaaIxMessageAcct.toBase58()}
  //     // 	messageAccount: ${messageAccount.toBase58()}
  //     // `)
  //
  //     const messsageAccountInfo = await connection.getAccountInfo(messageAccount);
  //     const parsedTokenTransferSignedVaaFromAccount = await parseTokenTransferWithSwimPayloadPostedMessage(
  //       messsageAccountInfo!.data
  //     );
  //
  //     console.log(`parsedTokenTransferSignedVaaFromAccount:\n
	// 		${JSON.stringify(parsedTokenTransferSignedVaaFromAccount, null, 2)}
	// 	`);
  //     const emitterAddrUint8Arr = tryNativeToUint8Array(
  //       parsedTokenTransferSignedVaaFromAccount.emitter_address2,
  //       parsedTokenTransferSignedVaaFromAccount.emitter_chain
  //     );
  //     console.log(`
	// 		emitter_address2Pub: ${new web3.PublicKey(emitterAddrUint8Arr).toBase58()}
	// 	`);
  //     const [endpointAccount] = await deriveEndpointPda(
  //       parsedTokenTransferVaa.emitter_chain,
  //       parsedTokenTransferVaa.emitter_address,
  //       // Buffer.from(new web3.PublicKey(parsedTokenTransferVaa.emitter_address).toBase58()),
  //       WORMHOLE_TOKEN_BRIDGE
  //     );
  //     console.log(`endpointAccount: ${endpointAccount.toBase58()}`);
  //     // const messageAccount = complete_wrapped_accounts[2]!.pubkey;
  //     // const claimAccount = complete_wrapped_accounts[3]!.pubkey;
  //     const claimAddressWasm = claim_address(
  //       WORMHOLE_TOKEN_BRIDGE.toBase58(), tokenTransferWithPayloadSignedVaa
  //     );
  //     const claimAddressPubkey = new web3.PublicKey(claimAddressWasm);
  //     const claimAddressPubkey2 = new web3.PublicKey(
  //       tryUint8ArrayToNative(
  //         claimAddressWasm,
  //         CHAIN_ID_SOLANA
  //       )
  //     );
  //     // expect(claimAccount).to.deep.equal(claimAddressPubkey);
  //     expect(claimAddressPubkey).to.deep.equal(claimAddressPubkey2);
  //     console.log(`claimAddressPubkey: ${claimAddressPubkey.toBase58()}`);
  //
  //     const propellerCompleteNativeWithPayloadTxn = await propellerProgram
  //       .methods
  //       .completeNativeWithPayload()
  //       .accounts({
  //         propeller,
  //         payer: payer.publicKey,
  //         tokenBridgeConfig,
  //         // userTokenBridgeAccount: userLpTokenAccount.address,
  //         message: messageAccount,
  //         claim: claimAddressPubkey,
  //         endpoint: endpointAccount,
  //         to: propellerRedeemerEscrowAccount.address,
  //         redeemer: propellerRedeemer,
  //         feeRecipient: propellerRedeemerEscrowAccount.address,
  //         // tokenBridgeMint,
  //         custody: custody,
  //         mint: tokenBridgeMint,
  //         custodySigner,
  //         rent: web3.SYSVAR_RENT_PUBKEY,
  //         systemProgram: web3.SystemProgram.programId,
  //         wormhole,
  //         tokenProgram: splToken.programId,
  //         tokenBridge,
  //       })
  //       .preInstructions([
  //         requestUnitsIx,
  //       ])
  //       .transaction();
  //
  //     const transferNativeTxnSig = await provider.sendAndConfirm(
  //       propellerCompleteNativeWithPayloadTxn,
  //       [payer],
  //       {
  //         skipPreflight: true,
  //       }
  //     );
  //
  //     const transferNativeTxnSize = propellerCompleteNativeWithPayloadTxn.serialize().length;
  //     console.log(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`)
  //     await connection.confirmTransaction({
  //       signature: transferNativeTxnSig,
  //       ...(await connection.getLatestBlockhash())
  //     });
  //
  //     const propellerRedeemerEscrowAccountAfter = (await splToken.account.token.fetch(propellerRedeemerEscrowAccount.address)).amount;
  //     console.log(`
	// 		propellerRedeemerEscrowAccountBefore: ${propellerRedeemerEscrowAccountBefore}
	// 		propellerRedeemerEscrowAccountAfter: ${propellerRedeemerEscrowAccountAfter}
	// 	`);
  //     assert.isTrue(propellerRedeemerEscrowAccountAfter.gt(propellerRedeemerEscrowAccountBefore));
  //
  //     const propellerCompleteToUserTxn = await propellerProgram
  //       .methods
  //       .completeToUser()
  //       .accounts({
  //         propeller,
  //         payer: payer.publicKey,
  //         message: messageAccount,
  //         // redeemer: propellerRedeemer,
  //         feeRecipient: propellerRedeemerEscrowAccount.address,
  //         pool: flagshipPool,
  //         poolTokenAccount0: flagshipPoolData.tokenKeys[0]!,
  //         poolTokenAccount1: flagshipPoolData.tokenKeys[1]!,
  //         poolProgram: TWO_POOL_PROGRAM_ID,
  //         // tokenBridgeMint,
  //         // custody: custody,
  //         // mint: tokenBridgeMint,
  //         // custodySigner,
  //         // rent: web3.SYSVAR_RENT_PUBKEY,
  //         // systemProgram: web3.SystemProgram.programId,
  //         // wormhole,
  //         // tokenProgram: splToken.programId,
  //         // tokenBridge,
  //         aggregator: aggregatorKey,
  //       }).rpc();
  //     // expect(propellerRedeemerEscrowAccountAfter).to.equal(propellerRedeemerEscrowAccountBefore - transferNativeTxnSize);
  //
  //
  //     //
  //     // const redeemTxn = await redeemOnSolana(
  //     // 	connection,
  //     // 	WORMHOLE_CORE_BRIDGE.toBase58(),
  //     // 	WORMHOLE_TOKEN_BRIDGE.toBase58(),
  //     // 	payer.publicKey.toBase58(),
  //     // 	Uint8Array.from(tokenTransferWithPayloadSignedVaa)
  //     // );
  //     // const redeemSig = await provider.sendAndConfirm(redeemTxn, [], {
  //     // 	skipPreflight: true
  //     // });
  //     // console.log(`redeemSig: ${redeemSig}`);
  //     //
  //     // const userLpTokenAccountBalanceAfter = (await splToken.account.token.fetch(userLpTokenAccount.address)).amount;
  //     //
  //     // // amount: 100_000_000
  //     // // userLpTokenAccountBalanceBefore: 100
  //     // // userLpTokenAccountBalanceAfter: 100_000_100
  //     //
  //     // console.log(`
  //     // 	amount: ${amount.toString()}
  //     // 	userLpTokenAccountBalanceBefore: ${userLpTokenAccountBalanceBefore.toString()}
  //     // 	userLpTokenAccountBalanceAfter: ${userLpTokenAccountBalanceAfter.toString()}
  //     // `);
  //     // const expectedAmount = userLpTokenAccountBalanceBefore.add(new anchor.BN(amount.toString()));
  //     // assert(userLpTokenAccountBalanceAfter.eq(expectedAmount));
  //   })
  // });


  //TODO: this is so ugly. if someone knows a better way to check nested undefined please fix/let me know.
  async function checkTxnLogsForMemo(
    txSig: string,
    memoString: string
  ) {
    console.log(`txSig: ${txSig}`);
    const txnInfo = await connection.getTransaction(txSig, {commitment: "confirmed"});
    expect(txnInfo).to.exist;
    // console.log(`txnInfo: ${JSON.stringify(txnInfo, null, 2)}`);
    expect(txnInfo!.meta).to.exist;
    const txnLogs = txnInfo!.meta!.logMessages!;
    expect(txnLogs).to.exist;
    const memoLog = txnLogs.find( log => log.startsWith("Program log: Memo"));
    expect(memoLog).to.exist;

    expect(memoLog!.includes(memoString)).to.be.true;
  }

});

type PoolUserBalances = {
  poolTokenBalances: Array<anchor.BN>,
  userTokenBalances: Array<anchor.BN>,
  governanceFeeBalance: anchor.BN,
  userLpTokenBalance: anchor.BN,
  previousDepth: anchor.BN,
}
async function getFlagshipTokenAccountBalances(): Promise<PoolUserBalances> {
  const poolUsdcAtaBalance = (await splToken.account.token.fetch(poolUsdcAtaAddr)).amount;
  const poolUsdtAtaBalance = (await splToken.account.token.fetch(poolUsdtAtaAddr)).amount;
  const governanceFeeBalance = (await splToken.account.token.fetch(governanceFeeAddr)).amount;
  const userUsdcAtaBalance = (await splToken.account.token.fetch(userUsdcAtaAddr)).amount;
  const userUsdtAtaBalance = (await splToken.account.token.fetch(userUsdtAtaAddr)).amount;
  const userLpTokenBalance = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
  const previousDepth = (await twoPoolProgram.account.twoPool.fetch(flagshipPool)).previousDepth;
  return {
    poolTokenBalances: [poolUsdcAtaBalance, poolUsdtAtaBalance],
    governanceFeeBalance,
    userTokenBalances: [userUsdcAtaBalance, userUsdtAtaBalance],
    userLpTokenBalance,
    previousDepth
  }
}

function printBeforeAndAfterPoolUserBalances(poolUserBalances: Array<PoolUserBalances>) {
  const {
    poolTokenBalances: [poolUsdcAtaBalanceBefore, poolUsdtAtaBalanceBefore],
    governanceFeeBalance: governanceFeeBalanceBefore,
    userTokenBalances: [userUsdcAtaBalanceBefore, userUsdtAtaBalanceBefore],
    userLpTokenBalance: userLpTokenBalanceBefore,
    previousDepth: previousDepthBefore
  } = poolUserBalances[0];
  const {
    poolTokenBalances: [poolUsdcAtaBalanceAfter, poolUsdtAtaBalanceAfter],
    governanceFeeBalance: governanceFeeBalanceAfter,
    userTokenBalances: [userUsdcAtaBalanceAfter, userUsdtAtaBalanceAfter],
    userLpTokenBalance: userLpTokenBalanceAfter,
    previousDepth: previousDepthAfter
  } =  poolUserBalances[1];
  console.log(`
    poolUsdcAtaBalance:
      before: ${poolUsdcAtaBalanceBefore.toString()},
      after: ${poolUsdcAtaBalanceAfter.toString()}
    poolUsdtAtaBalance:
      before: ${poolUsdtAtaBalanceBefore.toString()},
      after: ${poolUsdtAtaBalanceAfter.toString()}
    governanceFeeBalance:
      before: ${governanceFeeBalanceBefore.toString()},
      after: ${governanceFeeBalanceAfter.toString()}
    userUsdcAtaBalance:
      before: ${userUsdcAtaBalanceBefore.toString()},
      after: ${userUsdcAtaBalanceAfter.toString()}
    userUsdtAtaBalance:
      before: ${userUsdtAtaBalanceBefore.toString()},
      after: ${userUsdtAtaBalanceAfter.toString()}
    userLpTokenBalance:
      before: ${userLpTokenBalanceBefore.toString()},
      after: ${userLpTokenBalanceAfter.toString()}
    previousDepth:
      before: ${previousDepthBefore.toString()},
      after: ${previousDepthAfter.toString()}
  `);
}
async function getPropellerPda(mint: web3.PublicKey): Promise<web3.PublicKey> {
	return (await web3.PublicKey.findProgramAddress(
		[Buffer.from("propeller"), mint.toBytes()],
		propellerProgram.programId
	))[0];
}

async function getPropellerRedeemerPda(): Promise<web3.PublicKey> {
	return (await web3.PublicKey.findProgramAddress(
		[Buffer.from("redeemer")],
		propellerProgram.programId
	))[0];
}

async function getPropellerSenderPda(): Promise<web3.PublicKey> {
	return (await web3.PublicKey.findProgramAddress([Buffer.from("sender")], propellerProgram.programId))[0];
}
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
  version: number;
  owner: Buffer;
  targetTokenId: number;
  minOutputAmount: bigint; //this will always be 0 in v1
  memo: Buffer;
  // targetToken: Buffer; //mint of expected final output token
  // gas: string;
  // keeping this as string for now since JSON.stringify poos on bigints
  // minOutputAmount: string; //this will always be 0 in v1
  propellerEnabled: boolean;
  propellerMinThreshold: bigint;
  // propellerFee: bigint;
  // propellerFee: string;
  gasKickstart: boolean;
}

export function encodeSwimPayload(
  swimPayload: ParsedSwimPayload
): Buffer {
  const encoded = Buffer.alloc(
    1 + //version
    2 + //targetTokenId (u16)
    // 32 + //targetToken
    32 + //owner
    // 32 + //gas
    32 + //minOutputAmount
    16 + //memo
    1 + //propellerEnabled
    32 + //propellerMinThreshold
    // 32 + //propellerFee
    1 //gasKickstart
  );
  let offset = 0;
  encoded.writeUint8(swimPayload.version, offset);
  offset++;
  encoded.writeUint16BE(swimPayload.targetTokenId, offset);
  offset += 2;
  // encoded.write(swimPayload.targetToken.toString("hex"), 3, "hex");
  encoded.write(swimPayload.owner.toString("hex"), offset, "hex");
  offset += 32;
  // encoded.write(toBigNumberHex(swimPayload.gas, 32), 67, "hex");
  encoded.write(toBigNumberHex(swimPayload.minOutputAmount, 32), offset, "hex");
  offset += 32;
  encoded.write(swimPayload.memo.toString("hex"), offset, "hex");
  offset += 16;
  encoded.writeUint8(Number(swimPayload.propellerEnabled), offset);
  offset++
  encoded.write(toBigNumberHex(swimPayload.propellerMinThreshold, 32), offset, "hex");
  offset += 32;
  // encoded.write(toBigNumberHex(swimPayload.propellerFee, 32), 100, "hex");
  encoded.writeUint8(Number(swimPayload.gasKickstart), offset);
  return encoded;
}

export function parseSwimPayload(arr: Buffer): ParsedSwimPayload {
  //BigNumber.from(arr.subarray(1, 1 + 32)).toBigInt()
  let offset = 0;
  const version = arr.readUint8(offset);
  offset++;
  const targetTokenId = arr.readUint16BE(offset);
  offset += 2;
  // const targetToken = arr.subarray(offset, offset + 32);
  // offset += 32;
  const owner = arr.subarray(offset, offset + 32);
  offset += 32;
  const minOutputAmount = parseU256(arr.subarray(offset, offset + 32));
  offset += 32;
  const memo = arr.subarray(offset, offset + 16);
  offset += 16;
  const propellerEnabled = arr.readUint8(offset) === 1;
  offset++;
  const propellerMinThreshold = parseU256(arr.subarray(offset, offset + 32));
  offset += 32;
  // const propellerFee = parseU256(arr.subarray(offset, offset + 32));
  // offset += 32;
  const gasKickstart = arr.readUint8(offset) === 1;
  offset++;
  return {
    version,
    targetTokenId,
    // targetToken,
    owner,
    minOutputAmount,
    memo,
    propellerEnabled,
    propellerMinThreshold,
    gasKickstart,
  }
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

export function parseU256(arr: Buffer): bigint {
  return BigNumber.from(arr.subarray(0, 32)).toBigInt();
}

export interface ParsedTokenTransferWithSwimPayloadVaa {
  // core: ParsedVaa,
  // tokenTransfer: ParsedTokenTransfer;
  tokenTransferVaa: ParsedTokenTransferSignedVaa;
  swimPayload: ParsedSwimPayload;
}
const parseTokenTransferWithSwimPayloadSignedVaa = (signedVaa: Buffer): ParsedTokenTransferWithSwimPayloadVaa => {
  const parsedTokenTransfer = parseTokenTransferSignedVaa(signedVaa);
  const payload = parsedTokenTransfer.tokenTransfer.payload;
  const swimPayload = parseSwimPayload(payload);
  return {
    tokenTransferVaa: parsedTokenTransfer,
    swimPayload,
  }
}

const formatParsedTokenTransferWithSwimPayloadVaa = (parsed: ParsedTokenTransferWithSwimPayloadVaa) => {
  const formattedTokenTransfer = formatParsedTokenTransferSignedVaa(parsed.tokenTransferVaa);
  const swimPayload = parsed.swimPayload;
  const formattedSwimPayload = formatSwimPayload(swimPayload, parsed.tokenTransferVaa.tokenTransfer.toChain);
  return {
    ...formattedTokenTransfer,
    ...formattedSwimPayload,
  };
}

const formatSwimPayload = (swimPayload: ParsedSwimPayload, chain: ChainId | ChainName) => {
  return {
    ...swimPayload,
    minOutputAmount: swimPayload.minOutputAmount.toString(),
    memo: swimPayload.memo.toString(),
    propellerMinThreshold: swimPayload.propellerMinThreshold.toString(),
    owner: tryUint8ArrayToNative(swimPayload.owner, chain)
  }
}

export interface ParsedTokenTransferWithSwimPayloadPostedMessage {
  tokenTransferMessage: ParsedTokenTransferPostedMessage;
  swimPayload: ParsedSwimPayload;
}

const parseTokenTransferWithSwimPayloadPostedMessage = async (message: Buffer): Promise<ParsedTokenTransferWithSwimPayloadPostedMessage> => {
  const parsedTokenTransferMsg = await parseTokenTransferPostedMessage(message);
  const payload = parsedTokenTransferMsg.tokenTransfer.payload;
  const swimPayload = parseSwimPayload(payload);
  return {
    tokenTransferMessage: parsedTokenTransferMsg,
    swimPayload,
  }
}

const formatParsedTokenTransferWithSwimPayloadPostedMessage = (parsed: ParsedTokenTransferWithSwimPayloadPostedMessage) => {
  const formattedTokenTransfer = formatParsedTokenTransferPostedMessage(parsed.tokenTransferMessage);
  const swimPayload = parsed.swimPayload;
  const formattedSwimPayload = formatSwimPayload(swimPayload, parsed.tokenTransferMessage.tokenTransfer.toChain);
  return {
    ...formattedTokenTransfer,
    ...formattedSwimPayload,
  };

}


// const parseTransferWithPayload = (arr: Buffer) => (
//   {
//     amount: BigNumber.from(arr.subarray(1, 1 + 32)).toBigInt(),
//     originAddress: arr.subarray(33, 33 + 32).toString("hex"),
//     originChain: arr.readUInt16BE(65) as ChainId,
//     targetAddress: arr.subarray(67, 67 + 32).toString("hex"),
//     targetChain: arr.readUInt16BE(99) as ChainId,
//     fromAddress: arr.subarray(101, 101 + 32).toString("hex"),
//     payload: arr.subarray(133),
//   }
// );
//
// const parseTokenTransferVaa = async (arr: Buffer) => {
// 	const {parse_vaa} = await importCoreWasm();
// 	const parsedVaa = parse_vaa(arr);
// 	const tokenTransfer = parseTransferWithPayload(Buffer.from(parsedVaa.payload));
// 	return {
// 		...parsedVaa,
// 		// signatures: parsedVaa.signatures.map(sig => sig.toString("hex")),
// 		// vaa_signature_account: new web3.PublicKey(parsedVaa.vaa_signature_account).toBase58(),
// 		// emitter_address: new web3.PublicKey(parsedVaa.emitter_address).toBase58(),
// 		// emitter_address_str: tryHexToNativeAssetString(parsedVaa.emitter_address, CHAIN_ID_ETH),
// 		emitter_address_str: tryHexToNativeAssetString(parsedVaa.emitter_address, parsedVaa.emitter_chain),
// 		// signatures: parsedVaa.signatures.map(sig => {
// 		// 	return {
// 		// 		sig.signature.toString("hex")
// 		// 	}
// 		// }),
// 		payload: {
// 			...tokenTransfer,
// 			amount: tokenTransfer.amount.toString(),
// 			originAddress: tryHexToNativeAssetString(tokenTransfer.originAddress, tokenTransfer.originChain),
// 			originChain: toChainName(tokenTransfer.originChain),
// 			targetAddress: tryHexToNativeAssetString(tokenTransfer.targetAddress, tokenTransfer.targetChain),
// 			targetChain: toChainName(tokenTransfer.targetChain),
// 			// fromAddress: tryHexToNativeAssetString(tokenTransfer.fromAddress, CHAIN_ID_ETH),
// 		}
// 	}
// }



/*

   when calling TokenBridge::TransferWithPayload, amount is in u64. TokenBridge handles
   decimal conversion /truncation

      const amount = parseUnits("1", 9).toBigInt();
       const transaction = await transferFromSolana(
		connection,
         SOLANA_CORE_BRIDGE_ADDRESS,
         SOLANA_TOKEN_BRIDGE_ADDRESS,
         payerAddress,
         fromAddress,
        TEST_SOLANA_TOKEN,
         amount,
         tryNativeToUint8Array(targetAddress, CHAIN_ID_ETH),
         CHAIN_ID_ETH
       );
*/
 // Notes





// function uint8arrayEqualityCheck(a: Uint8Array, b: Uint8Array): boolean {
//   if (a.constructor.name !== 'Uint8Array' || b.constructor.name !== 'Uint8Array') {
//     return false;
//   }
//
//   if (a.length !== b.length) {
//     return false;
//   }
//
//   for (let i = 0; i < a.length; i++) {
//     if (a[i] !== b[i]) {
//       return false;
//     }
//   }
//
//   return true;
// };
