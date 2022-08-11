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
	tryNativeToUint8Array,
} from "@certusone/wormhole-sdk"
import {BigNumber} from "ethers";
import {
	deriveEndpointPda,
	deriveMessagePda,
	encodeAttestMeta,
	encodeTokenTransfer,
	encodeTokenTransferWithPayload,
	getMintMetaPdas, toBigNumberHex
} from "./token-bridge-utils";
import { parseUnits } from "ethers/lib/utils";
import {tryUint8ArrayToNative} from "@certusone/wormhole-sdk/lib/cjs/utils/array";
import {LAMPORTS_PER_SOL, PublicKey} from "@solana/web3.js";
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
const provider = anchor.AnchorProvider.env();
const connection = provider.connection;
const confirmedCommitment = {commitment: "confirmed" as web3.Finality};
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


const ethTokenBridge = Buffer.from(
	tryNativeToHexString("0x0290FB167208Af455bB137780163b7B7a9a10C16", CHAIN_ID_ETH),
	"hex"
);

const ethRoutingContract = Buffer.from(
	tryNativeToHexString("0x0290FB167208Af455bB137780163b7B7a9a10C17", CHAIN_ID_ETH),
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
const evmTargetTokenAddr = Buffer.from(
	tryNativeToHexString("0x0000000000000000000000000000000000000003", CHAIN_ID_ETH),
	"hex"
);
const evmOwner = Buffer.from(
	tryNativeToHexString("0x0000000000000000000000000000000000000004", CHAIN_ID_ETH),
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
    const tx = await twoPoolProgram
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

    const pubkeys = (await tx.pubkeys());
    console.log(`pubkeys: ${JSON.stringify(pubkeys)}`);
    const pool = pubkeys.pool!;
    console.log(`poolKey: ${pool.toBase58()}, expected: ${flagshipPool.toBase58()}`);

    expect(pool.toBase58()).to.equal(flagshipPool.toBase58());
    const txSig = await tx.rpc({skipPreflight: true});

    console.log("Your transaction signature", txSig);

    const poolData = await twoPoolProgram.account.twoPool.fetch(pool);
    console.log(`poolData: ${JSON.stringify(poolData, null, 2)}`);

    const calculatedSwimPoolPda = await web3.PublicKey.createProgramAddress(
      [
        Buffer.from("two_pool"),
        ...poolMintKeypairs.map(
          (keypair) => keypair.publicKey.toBytes()
        ),
        swimUsdKeypair.publicKey.toBytes(),
        Buffer.from([poolData.bump]),
      ],
      twoPoolProgram.programId
    );
    expect(flagshipPool.toBase58()).to.equal(calculatedSwimPoolPda.toBase58());

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
      payer
    ));

    console.log(`done setting up flagship pool and relevant user token accounts`);
    console.log(`
      flagshipPool: ${JSON.stringify(poolData, null, 2)}
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

    // metapool = metapoolPda;
    //
    // metapoolPoolTokenAta0 = await getAssociatedTokenAddress(
    //   metapoolMintKeypair0.publicKey,
    //   metapool,
    //   true
    // );

    // await splToken
    //   .methods
    //   .initializeMint(mintDecimal, propellerProgram.provider.publicKey!, null)
    //   .accounts({
    //     mint: metapoolMintKeypair1.publicKey,
    //   })
    //   .preInstructions([
    //     await splToken.account.mint.createInstruction(metapoolMintKeypair1),
    //   ])
    //   .signers([metapoolMintKeypair1])
    //   .rpc();
    //
    // metapoolPoolTokenAta1 = await getAssociatedTokenAddress(
    //   metapoolMintKeypair1.publicKey,
    //   metapool,
    //   true
    // );

    // metapoolGovernanceFeeAta = await getAssociatedTokenAddress(
    //   metapoolLpMintKeypair.publicKey,
    // governanceKeypair.publicKey
    // );

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
    console.log(`pubkeys: ${JSON.stringify(initMetapoolTxnPubkeys)}`);


    const derivedMetapool = initMetapoolTxnPubkeys.pool!;
    console.log(`derivedMetapool: ${derivedMetapool.toBase58()}, expected: ${metapool.toBase58()}`);
    expect(metapoolPda.toBase58()).to.equal(derivedMetapool.toBase58());
    expect(derivedMetapool.toBase58()).to.equal(metapool.toBase58());


    const initMetapoolTxnSig = await initMetapoolTxn.rpc({skipPreflight: true});

    console.log("Your transaction signature", initMetapoolTxnSig);

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

    // pubkeys: {"payer":"GPy3FiGpEyMFCTsYgcw9i6rSWsvJpgzA39QDXv8zquW","poolMint0":"B82ZcjGgDEro5jGfLJi2Js11c2qn3cCMRuN55zfx4f3R","poolMint1":"6gd1sfpAGbuM9NSiUe4aWSbVbRV3uFGEQqK1hj4KELfc","lpMint":"DJgziuZ2GRqGdTVhnFoab35LVLFRWECZc3f6dNgZSFW4","poolTokenAccount0":"ESYdXPbGNZdBdXFvgdfm9RGHbFVR6FDm1rKT7DvJW5Vk","poolTokenAccount1":"EVj3UbyU4S47BunvczMWexdnJ7hfhE3rg3hNdVyoJRGX","pauseKey":"8gxYK89D1qZqdJmTBbUBHt4Yw3A81nKfLPds1WQqDy1h","governanceAccount":"4hLsLmZgWXNTnyEprdRfn4NygPusA49WmQoiUZAzEGkx","governanceFeeAccount":"4B9HP11k8wWC56uPkkchcNizb1SWEjNWR3q9rwfdX2HB","tokenProgram":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","associatedTokenProgram":"ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL","systemProgram":"11111111111111111111111111111111","rent":"SysvarRent111111111111111111111111111111111","pool":"BFxjMVtXaSUvCh82s6rdidhtjWzp6zGR667xw2sjvyYF"}
    // {"payer":"GPy3FiGpEyMFCTsYgcw9i6rSWsvJpgzA39QDXv8zquW","poolMint0":"DJgziuZ2GRqGdTVhnFoab35LVLFRWECZc3f6dNgZSFW4","poolMint1":"4CxZDzQxiGnvPXhLxKRRCh9qjY887RsLpU5AiD6wzxnF","lpMint":"BfqdrNcPvmYCAkwFDxGAHUAViU6x9q8mCJKkquBsM2eb","poolTokenAccount0":"C4KMxDvbA5sY6JUiu5K3Aa2DY6w9Biw15fejSzpuzxBc","poolTokenAccount1":"H5HQ5beF6mZhoTdPyZCFgnmnNH9z4LqexadnkDuZdGLM","pauseKey":"8gxYK89D1qZqdJmTBbUBHt4Yw3A81nKfLPds1WQqDy1h","governanceAccount":"4hLsLmZgWXNTnyEprdRfn4NygPusA49WmQoiUZAzEGkx","governanceFeeAccount":"J46LckHu3oxSrbRMrhEzRMmFuAmnLWnTe4LMFJg3QR1A","tokenProgram":"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA","associatedTokenProgram":"ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL","systemProgram":"11111111111111111111111111111111","rent":"SysvarRent111111111111111111111111111111111","pool":"8oVScw459FNMoEtYSZen4gy57moDNHkRCUckx2RtSMgg"}


    userMetapoolTokenAccount0 = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      payer,
      metapoolLpMintKeypair.publicKey,
      dummyUser.publicKey,
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
      payer
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

		// metapoolAuth = metapool;
		// userMetapoolTokenAccount0 = userSwimUsdAtaAddr;
		// // userMetapoolTokenAccount0 =  await getOrCreateAssociatedTokenAccount(
		// //     connection,
		// //     payer,
		// //     metapoolData.tokenMintKeys[0]!,
		// //     dummyUser.publicKey,
		// //     false
		// // );
		// expect(userMetapoolTokenAccount0.address.toBase58()).to.equal(userSwimUsdAtaAddr.toBase58());
    //
		// userMetapoolTokenAccount1 = await createAtaAndMint(metapoolData.tokenMintKeys[1]!);
    //
		// userMetapoolLpTokenAccount = await getOrCreateAssociatedTokenAccount(
		// 	connection,
		// 	payer,
		// 	metapoolData.lpMintKey!,
		// 	dummyUser.publicKey,
		// 	false
		// );

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

		console.log(`setting up switchboard`);
		// If fails, fallback to looking for a local env file
		try {
			switchboard = await SwitchboardTestContext.loadFromEnv(provider);
			const aggregatorAccount = await switchboard.createStaticFeed(100);
			aggregatorKey = aggregatorAccount.publicKey ?? PublicKey.default;
			console.log("local env detected");
			return;
		} catch (error: any) {
			console.log(`Error: SBV2 Localnet - ${error.message}`);
			throw new Error(`Failed to load localenv SwitchboardTestContext: ${error.message}`);
		}
	});

	it("Initializes propeller PDA", async () => {
		const expectedPropellerRedeemerAddr = await getPropellerRedeemerPda();
		const propellerRedeemerEscrowAddr = await getAssociatedTokenAddress(
			tokenBridgeMint,
			expectedPropellerRedeemerAddr,
			true
		);
		const initializeParams =  {
			gasKickstartAmount: new anchor.BN(0.75 * LAMPORTS_PER_SOL),
			relayerFee: new anchor.BN(0.25 * LAMPORTS_PER_SOL),
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

		console.log(`
			propeller: ${propeller.toBase58()}
			propellerSender: ${propellerSender.toBase58()}
			propellerRedeemer: ${propellerRedeemer.toBase58()}
			propellerRedeemerEscrowAccount: ${propellerRedeemerEscrowAccount.address.toBase58()}
		`);
	});

  it("Does add through propeller", async() => {
    const userLpTokenBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
    console.log(`userLpTokenBalanceBefore: ${userLpTokenBalanceBefore.toString()}`);

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
    const memo = Buffer.from("hahahallala", "utf-8");
    const tx = await propellerProgram
      .methods
      // .add(addParams)
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
      .signers([userTransferAuthority])
      .rpc({skipPreflight: true});

    await connection.confirmTransaction(
      {
        signature: tx,
        ...(await connection.getLatestBlockhash())
      },
      "confirmed"
    );
    const userLpTokenBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
    console.log(`userLpTokenBalanceAfter: ${userLpTokenBalanceAfter.toString()}`);

    const txnInfo = await connection.getTransaction(tx, {commitment: "confirmed"});
    console.log(`txnInfo: ${JSON.stringify(txnInfo, null, 2)}`);
  });

  describe.skip("Old tests", () => {
    it("Can do pool add.rs & wormhole token bridge transfer (2 transactions)", async () => {
      const inputAmounts = [new anchor.BN(100_000_000_000), new anchor.BN(100_000_000_000)];

      const minimumMintAmount = new anchor.BN(0);

      // const custodyAmountBefore: anchor.BN = (await splToken.account.token.fetch(custodyOrWrappedMeta)).amount;


      const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
        units: 900000,
        additionalFee: 0,
      });
      const poolAddParams = {
        inputAmounts,
        minimumMintAmount
      };

      const userLpTokenBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      console.log(`userLpTokenBalanceBefore: ${userLpTokenBalanceBefore.toString()}`);

      const propellerPoolAddTxn = await propellerProgram
        .methods
        .addV2(
          poolAddParams
        )
        .accounts({
          // propeller,
          poolState: flagshipPool,
          poolAuth,
          poolTokenAccount0: flagshipPoolData.tokenKeys[0]!,
          poolTokenAccount1: flagshipPoolData.tokenKeys[1]!,
          lpMint: flagshipPoolData.lpMintKey,
          governanceFee: flagshipPoolData.governanceFeeKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          poolProgram: TWO_POOL_PROGRAM_ID,
          tokenProgram: splToken.programId,
          userLpTokenAccount: userSwimUsdAtaAddr,
          payer: payer.publicKey,
        })
        // .signers([wormholeMessage])
        // .preInstructions([
        // 	requestUnitsIx,
        // ])
        .transaction();
      const addLiqTxnSig = await provider.sendAndConfirm(
        propellerPoolAddTxn,
        [payer],
        {
          skipPreflight: true,
        }
      );
      const txnSize = propellerPoolAddTxn.serialize().length;
      console.log(`addAndWormholeTransfer txnSize: ${txnSize}`)
      await connection.confirmTransaction({
        signature: addLiqTxnSig,
        ...(await connection.getLatestBlockhash())
      });
      const userLpTokenBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      console.log(`userLpTokenBalanceAfter: ${userLpTokenBalanceAfter.toString()}`);
      const transferAmount = userLpTokenBalanceAfter.sub(userLpTokenBalanceBefore);

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
      const wormholeMessage = web3.Keypair.generate();
      const transferNativeTxn = await propellerProgram
        .methods
        .transferNativeWithPayload(
          nonce,
          CHAIN_ID_ETH,
          transferAmount,
          evmTargetTokenId,
          evmTargetTokenAddr,
          evmOwner,
          false,
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
        })
        .preInstructions([
          requestUnitsIx,
        ])
        .transaction();

      const transferNativeTxnSig = await provider.sendAndConfirm(
        transferNativeTxn,
        [payer, wormholeMessage],
        {
          skipPreflight: true,
        }
      );

      const transferNativeTxnSize = transferNativeTxn.serialize().length;
      console.log(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`)
      await connection.confirmTransaction({
        signature: transferNativeTxnSig,
        ...(await connection.getLatestBlockhash())
      });

      const userLpTokenBalanceAfter2 = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      console.log(`userLpTokenBalanceAfter2: ${userLpTokenBalanceAfter2.toString()}`);
      assert.isTrue(userLpTokenBalanceAfter2.eq(userLpTokenBalanceAfter.sub(transferAmount)));
    });

    it("Can do pool add.rs ix & wh token bridge transfer in one IX with approves & revokes in contract", async () => {
      // const inputAmounts = [new anchor.BN(100), new anchor.BN(100)];
      const inputAmounts = [new anchor.BN(100_000_000_000), new anchor.BN(100_000_000_000)];

      const minimumMintAmount = new anchor.BN(0);


      const wormholeMessage = web3.Keypair.generate();
      // const custodyAmountBefore: anchor.BN = (await splToken.account.token.fetch(custodyOrWrappedMeta)).amount;


      const requestUnitsIx = web3.ComputeBudgetProgram.requestUnits({
        units: 900000,
        additionalFee: 0,
      });
      const poolAddParams = {
        inputAmounts,
        minimumMintAmount
      };
      // const targetAddrStr = "0xd791AAfc9a0bb703A22Aebc0c5d2a9601Bbe3F44";
      // // alternatively call Array.prototype.slice.call(tryNativeToUint8Array());
      // const targetAddrUint8Arr = tryNativeToUint8Array(
      //     targetAddrStr,
      //     CHAIN_ID_ETH
      // );
      // const targetAddress = Array.from(targetAddrUint8Arr);
      // //        targetAddrUint8Arr: 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68
      // //         targetAddrUint8Arr.length: 32
      // //         targetAddrUint8Arr.byteLength: 32
      // //         targetAddr: [0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68]
      // //         targetAddr.length :32
      // console.log(`
      //   targetAddrUint8Arr: ${targetAddrUint8Arr.toString()}
      //   targetAddrUint8Arr.length: ${targetAddrUint8Arr.length}
      //   targetAddrUint8Arr.byteLength: ${targetAddrUint8Arr.byteLength}
      //   targetAddr: ${JSON.stringify(targetAddress)}
      //   targetAddr.length :${targetAddress.length}
      // `);
      //
      //
      // const targetAddrStrHex = tryNativeToHexString(targetAddrStr, CHAIN_ID_ETH);
      // const targetAddrHexUint8Arr = hexToUint8Array(targetAddrStrHex);
      // const targetAddr2 = Array.from(targetAddrHexUint8Arr);
      //        targetAddrStrHex: 000000000000000000000000d791aafc9a0bb703a22aebc0c5d2a9601bbe3f44
      //         targetAddrStrHex.length: 64
      //         targetAddrHexUint8Arr: 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68
      //         targetAddrHexUint8Arr.length: 32
      //         targetAddrHexUint8Arr.byteLength: 32
      //         targetAddr2: [0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68]
      //         targetAddr2.length :32
      // console.log(`
      //   targetAddrStrHex: ${targetAddrStrHex}
      //   targetAddrStrHex.length: ${targetAddrStrHex.length}
      //   targetAddrHexUint8Arr: ${targetAddrHexUint8Arr.toString()}
      //   targetAddrHexUint8Arr.length: ${targetAddrHexUint8Arr.length}
      //   targetAddrHexUint8Arr.byteLength: ${targetAddrHexUint8Arr.byteLength}
      //   targetAddr2: ${JSON.stringify(targetAddr2)}
      //   targetAddr2.length :${targetAddr2.length}
      // `);
      // const transferData = {
      //     nonce: 10,
      //     amount: new anchor.BN(0),
      //     fee: new anchor.BN(0),
      //     targetAddress,
      //     targetChain: CHAIN_ID_ETH
      // };
      // Note: if payload type is Vec<u8> this needs to be Buffer.from([0,1,2,...])
      //        JS anchor types reference is wrong for this:
      //        https://book.anchor-lang.com/anchor_references/javascript_anchor_types_reference.html
      // max_size of payload is 21 if including dummy account (eventually some type of mapping PDA of chainId -> routing contract address)
      const nonce = createNonce().readUInt32LE(0);
      const payload = Buffer.from([]);
      console.log(`
        payload.length: ${payload.length}
        payload.byteLength: ${payload.byteLength}
      `)

      const propellerAddLiquidityTx = await propellerProgram
        .methods
        .addAndWormholeTransfer(
          inputAmounts,
          minimumMintAmount,
          nonce,
          CHAIN_ID_ETH,
          // payload
        )
        .accounts({
          propeller,
          poolState: flagshipPool,
          poolAuth,
          poolTokenAccount0: flagshipPoolData.tokenKeys[0]!,
          poolTokenAccount1: flagshipPoolData.tokenKeys[1]!,
          lpMint: flagshipPoolData.lpMintKey,
          governanceFee: flagshipPoolData.governanceFeeKey,
          userTokenAccount0: userUsdcAtaAddr,
          userTokenAccount1: userUsdtAtaAddr,
          poolProgram: TWO_POOL_PROGRAM_ID,
          tokenProgram: splToken.programId,
          userLpTokenAccount: userSwimUsdAtaAddr,
          payer: payer.publicKey,
          tokenBridge,
          custody,
          custodySigner,
          authoritySigner,
          tokenBridgeConfig,
          wormhole,
          wormholeConfig,
          wormholeFeeCollector,
          wormholeEmitter,
          wormholeSequence,
          wormholeMessage: wormholeMessage.publicKey,
          clock: web3.SYSVAR_CLOCK_PUBKEY,
          rent: web3.SYSVAR_RENT_PUBKEY,
          // dummy: web3.Keypair.generate().publicKey
        })
        // .signers([wormholeMessage])
        .preInstructions([
          requestUnitsIx,
        ])
        .transaction();

      const addLiqTxnSig = await provider.sendAndConfirm(
        propellerAddLiquidityTx,
        [payer, wormholeMessage],
        {
          skipPreflight: true,
        }
      );
      const txnSize = propellerAddLiquidityTx.serialize().length;
      console.log(`addAndWormholeTransfer txnSize: ${txnSize}`)
      await connection.confirmTransaction({
        signature: addLiqTxnSig,
        ...(await connection.getLatestBlockhash())
      });

      const custodyAmountAfter: anchor.BN = (await splToken.account.token.fetch(custody)).amount;
      assert.isTrue(custodyAmountAfter.gt(new anchor.BN(0)));
      // console.log(`
      //   custodyAmountBefore: ${custodyAmountBefore.toString()}
      //   custodyAmountAfter: ${custodyAmountAfter.toString()}
      //  `);
      // expect(custodyAmountBefore).to.be.lt(custodyAmountAfter, );
      // assert.isTrue(custodyAmountBefore.lt(custodyAmountAfter), `custodyAmountBefore: ${custodyAmountBefore.toString()}. custodyAmountAfter: ${custodyAmountAfter.toString()}`)
    });

    it("Can do pool swap exact input & wh token bridge transfer (2 transactions)", async () => {
      let inputAmounts = [new anchor.BN(100_000), new anchor.BN(100_000)];
      let minimumMintAmount = new anchor.BN(0);
      console.log(`add to flagship pool`)
      const addToFlagshipPoolTxn = await addToPool(
        provider,
        flagshipPool,
        flagshipPoolData,
        [
          userUsdcAtaAddr,
          userUsdtAtaAddr,
        ],
        userSwimUsdAtaAddr,
        inputAmounts,
        minimumMintAmount,
        dummyUser,
        flagshipPool
      );
      console.log(`sendAndConfirmed addToFlagshipPoolTxn: ${addToFlagshipPoolTxn}`);
      console.log(`seeding metapool`);
      const seedMetapoolTxnSig = await addToPool(
        provider,
        metapool,
        metapoolData,
        [
          userMetapoolTokenAccount0.address,
          userMetapoolTokenAccount1.address,
        ],
        userMetapoolLpTokenAccount.address,
        inputAmounts,
        minimumMintAmount,
        dummyUser,
        metapool
      );
      console.log(`sendAndConfirmed seedMetapoolTxn: ${seedMetapoolTxnSig}`);

      const userLpTokenBalanceBefore = (await splToken.account.token.fetch(userMetapoolTokenAccount0.address)).amount;
      console.log(`userLpTokenBalanceBefore: ${userLpTokenBalanceBefore.toString()}`);



      const exactInputAmounts: anchor.BN[] = [new anchor.BN(0), new anchor.BN(100)];
      // const exactInputAmounts: anchor.BN = new anchor.BN(100);

      // const exactInputAmounts: anchor.BN[] = inputAmounts.map(amount => amount.div(new anchor.BN(2)));
      const minimumOutputAmount: anchor.BN = new anchor.BN(0);
      const outputTokenIndex = 0;
      const poolSwapExactInputParams = {
        exactInputAmounts,
        outputTokenIndex,
        minimumOutputAmount
      };
      const propellerSwapExactInputTx = await propellerProgram
        .methods
        .swapExactInputV2(
          poolSwapExactInputParams,
        )
        .accounts({
          poolState: metapool,
          poolAuth: metapoolAuth,
          poolTokenAccount0: metapoolData.tokenKeys[0]!,
          poolTokenAccount1: metapoolData.tokenKeys[1]!,
          lpMint: metapoolData.lpMintKey,
          governanceFee: metapoolData.governanceFeeKey,
          userTokenAccount0: userMetapoolTokenAccount0.address,
          userTokenAccount1: userMetapoolTokenAccount1.address,
          poolProgram: TWO_POOL_PROGRAM_ID,
          tokenProgram: splToken.programId,
          payer: payer.publicKey,
        })
        .preInstructions([requestUnitsIx])
        // .signers([payer, wormholeMessage])
        // .rpc();
        .transaction();
      // ~1179 with empty payload
      const swapTxnSig = await provider.sendAndConfirm(
        propellerSwapExactInputTx,
        [payer],
        {
          skipPreflight: true
        }
      );
      const txnSize = propellerSwapExactInputTx.serialize().length;
      console.log(`swapExactInputAndTransfer txnSize: ${txnSize}`)
      await connection.confirmTransaction({
        signature: swapTxnSig,
        ...(await connection.getLatestBlockhash())
      });

      const userLpTokenBalanceAfter = (await splToken.account.token.fetch(userMetapoolTokenAccount0.address)).amount;
      console.log(`userLpTokenBalanceAfter: ${userLpTokenBalanceAfter.toString()}`);
      const transferAmount = userLpTokenBalanceAfter.sub(userLpTokenBalanceBefore);

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
      const wormholeMessage = web3.Keypair.generate();
      const transferNativeTxn = await propellerProgram
        .methods
        .transferNativeWithPayload(
          nonce,
          CHAIN_ID_ETH,
          transferAmount,
          evmTargetTokenId,
          evmTargetTokenAddr,
          evmOwner,
          false,
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
        })
        .preInstructions([
          requestUnitsIx,
        ])
        .transaction();

      const transferNativeTxnSig = await provider.sendAndConfirm(
        transferNativeTxn,
        [payer, wormholeMessage],
        {
          skipPreflight: true,
        }
      );

      const transferNativeTxnSize = transferNativeTxn.serialize().length;
      console.log(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`)
      await connection.confirmTransaction({
        signature: transferNativeTxnSig,
        ...(await connection.getLatestBlockhash())
      });

      const userLpTokenBalanceAfter2 = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      console.log(`userLpTokenBalanceAfter2: ${userLpTokenBalanceAfter2.toString()}`);
      assert.isTrue(userLpTokenBalanceAfter2.eq(userLpTokenBalanceAfter.sub(transferAmount)));
    });


    it("Can do SwapExactInputAndTransfer", async () => {
      let inputAmounts = [new anchor.BN(100), new anchor.BN(100)];
      let minimumMintAmount = new anchor.BN(0);
      console.log(`add to flagship pool`)
      const addToFlagshipPoolTxn = await addToPool(
        provider,
        flagshipPool,
        flagshipPoolData,
        [
          userUsdcAtaAddr,
          userUsdtAtaAddr,
        ],
        userSwimUsdAtaAddr,
        inputAmounts,
        minimumMintAmount,
        dummyUser,
        flagshipPool
      );
      console.log(`sendAndConfirmed addToFlagshipPoolTxn: ${addToFlagshipPoolTxn}`);
      console.log(`seeding metapool`);
      const seedMetapoolTxnSig = await addToPool(
        provider,
        metapool,
        metapoolData,
        [
          userMetapoolTokenAccount0.address,
          userMetapoolTokenAccount1.address,
        ],
        userMetapoolLpTokenAccount.address,
        inputAmounts,
        minimumMintAmount,
        dummyUser,
        metapool
      );
      console.log(`sendAndConfirmed seedMetapoolTxn: ${seedMetapoolTxnSig}`);


      const wormholeMessage = web3.Keypair.generate();
      // const custodyAmountBefore: anchor.BN = (await splToken.account.token.fetch(custodyOrWrappedMeta)).amount;

      const custodyAmountBefore: anchor.BN = (await splToken.account.token.fetch(custody)).amount;

      const userBridgeTokenAccountAmountBefore = (await splToken.account.token.fetch(userMetapoolTokenAccount0.address)).amount;
      // const exactInputAmounts: anchor.BN[] = [new anchor.BN(0), new anchor.BN(100)];
      const exactInputAmount: anchor.BN = new anchor.BN(100);

      // const exactInputAmounts: anchor.BN[] = inputAmounts.map(amount => amount.div(new anchor.BN(2)));
      const minimumOutputAmount: anchor.BN = new anchor.BN(0);
      const poolSwapExactInputParams = {
        exactInputAmount,
        minimumOutputAmount
      };
      const nonce = createNonce().readUInt32LE(0);
      const nonceUint8Arr = byteify.serializeUint32(nonce);
      console.log(`nonce: ${nonce}, nonce Uint8Array: ${nonceUint8Arr}`);
      const payload = Buffer.from([
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27, 190, 63, 68,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 215, 145, 170, 252, 154, 11, 183, 3, 162, 42, 235, 192, 197, 210, 169, 96, 27,
        // 190,63,68,
        // 1242
        // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
        // 1275
        // 0,0,0,0,0,0,0,0,0,0,0,0,215,145,170,252,154,11,183,3,162,42,235,192,197,210,169,96,27,190,63,68,
      ]);
      const propellerSwapExactInputAndTransferTx = await propellerProgram
        .methods
        .swapExactInputAndTransfer(
          poolSwapExactInputParams,
          nonce,
          CHAIN_ID_ETH,
          // payload
        )
        .accounts({
          propeller,
          poolState: metapool,
          poolAuth: metapoolAuth,
          poolTokenAccount0: metapoolData.tokenKeys[0]!,
          poolTokenAccount1: metapoolData.tokenKeys[1]!,
          lpMint: metapoolData.lpMintKey,
          governanceFee: metapoolData.governanceFeeKey,
          userTokenAccount0: userMetapoolTokenAccount0.address,
          userTokenAccount1: userMetapoolTokenAccount1.address,
          poolProgram: TWO_POOL_PROGRAM_ID,
          tokenProgram: splToken.programId,
          tokenBridgeMint,
          payer: payer.publicKey,
          tokenBridge,
          custody,
          custodySigner,
          authoritySigner,
          tokenBridgeConfig,
          wormhole,
          wormholeConfig,
          wormholeFeeCollector,
          wormholeEmitter,
          wormholeSequence,
          wormholeMessage: wormholeMessage.publicKey,
          clock: web3.SYSVAR_CLOCK_PUBKEY,
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        // .signers([payer, wormholeMessage])
        .preInstructions([
          requestUnitsIx,
        ])
        // .rpc();
        .transaction();
      // ~1179 with empty payload
      const swapTxnSig = await provider.sendAndConfirm(
        propellerSwapExactInputAndTransferTx,
        [payer, wormholeMessage],
        {
          skipPreflight: true
        }
      );
      const txnSize = propellerSwapExactInputAndTransferTx.serialize().length;
      console.log(`swapExactInputAndTransfer txnSize: ${txnSize}`)
      await connection.confirmTransaction({
        signature: swapTxnSig,
        ...(await connection.getLatestBlockhash())
      });


      const userBridgeTokenAccountAmountAfter = (await splToken.account.token.fetch(userMetapoolTokenAccount0.address)).amount;
      console.log(`
            userBridgeTokenAccountAmountBefore: ${userBridgeTokenAccountAmountBefore}
            userBridgeTokenAccountAmountAfter: ${userBridgeTokenAccountAmountAfter}
        `);

      const custodyAmountAfter: anchor.BN = (await splToken.account.token.fetch(custody)).amount;
      console.log(`
            custodyAmountBefore: ${custodyAmountBefore}
            custodyAmountAfter: ${custodyAmountAfter}
        `)
      assert.isTrue(custodyAmountAfter.gt(custodyAmountBefore));

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
      const {
        payload: postedMessagePayload,
        ...postedMessage
      }  = await parseTokenTransferWithPayloadPostedMessage(messageAccountInfo.data);
      console.log(`postedMessage:\n${JSON.stringify(postedMessage)}`);




      expect(postedMessagePayload.originAddress).to.equal(tokenBridgeMint.toBase58());
      expect(postedMessagePayload.originChain).to.equal(toChainName(CHAIN_ID_SOLANA));
      // still a dummy default address for now
      // expect(tryHexToNativeAssetString(parsedMessagePayload.targetAddress, CHAIN_ID_ETH)).to.equal(userMetapoolTokenAccount0.toBase58());
      expect(postedMessagePayload.targetChain).to.equal(toChainName(CHAIN_ID_ETH));
      expect(postedMessagePayload.fromAddress).to.equal(propellerProgram.programId.toBase58());


      // const {parse_posted_message} = await importCoreWasm();
      // const postedMessage = parse_posted_message(messageAccountInfo.data);
      // console.log(`postedMessage: ${JSON.stringify(postedMessage)}`);
      // const postedMessageEmitterAddr = tryHexToNativeAssetString(
      // 	Buffer.from(postedMessage.emitter_address).toString('hex'), CHAIN_ID_SOLANA
      // );
      // console.log(`postedMessageEmitterAddr: ${postedMessageEmitterAddr}`);
      // const postedMessagePayload = postedMessage.payload;
      // const parsedMessagePayload = parseTransferWithPayload(Buffer.from(postedMessagePayload));
      // console.log(`
      //     parsedMessagePayload: {
      //         amount: ${parsedMessagePayload.amount.toString()}
      //         originAddress: ${tryHexToNativeAssetString(parsedMessagePayload.originAddress, CHAIN_ID_SOLANA)}
      //         originChain: ${toChainName(parsedMessagePayload.originChain)}
      //         targetAddress: ${tryHexToNativeAssetString(parsedMessagePayload.targetAddress, CHAIN_ID_ETH)}
      //         targetChain: ${(toChainName(parsedMessagePayload.targetChain))}
      //         fromAddress: ${tryHexToNativeAssetString(parsedMessagePayload.fromAddress, CHAIN_ID_SOLANA)}
      //         payload: ${parsedMessagePayload.payload}
      //     }
      // `);
      // expect(tryHexToNativeAssetString(parsedMessagePayload.originAddress, CHAIN_ID_SOLANA)).to.equal(tokenBridgeMint.toBase58());
      // expect(parsedMessagePayload.originChain).to.equal(CHAIN_ID_SOLANA);
      // // still a dummy default address for now
      // // expect(tryHexToNativeAssetString(parsedMessagePayload.targetAddress, CHAIN_ID_ETH)).to.equal(userMetapoolTokenAccount0.toBase58());
      // expect(parsedMessagePayload.targetChain).to.equal(CHAIN_ID_ETH);
      // expect(tryHexToNativeAssetString(parsedMessagePayload.fromAddress, CHAIN_ID_SOLANA)).to.equal(program.programId.toBase58());
      let emitterSequenceAcctInfo = await connection.getAccountInfo(wormholeSequence);
      if (!emitterSequenceAcctInfo) {
        throw new Error("emitter account not found");
      }
      // let emitterSequence = emitterSequenceAcctInfo!.data.readBigUint64BE()
      let emitterSequence = emitterSequenceAcctInfo!.data.readBigUint64LE()
      console.log(`emitterSequence after: ${emitterSequence}`);
      /*
      #[derive(Debug, Default, BorshSerialize, BorshDeserialize, Clone, Serialize, Deserialize)]
      pub struct MessageData {
        /// Header of the posted VAA
        pub vaa_version: u8,

        /// Level of consistency requested by the emitter
        pub consistency_level: u8,

        /// Time the vaa was submitted
        pub vaa_time: u32,

        /// Account where signatures are stored
        pub vaa_signature_account: Pubkey,

        /// Time the posted message was created
        pub submission_time: u32,

        /// Unique nonce for this message
        pub nonce: u32,

        /// Sequence number of this message
        pub sequence: u64,

        /// Emitter of the message
        pub emitter_chain: u16,

        /// Emitter of the message
        pub emitter_address: [u8; 32],

        /// Message payload
        pub payload: Vec<u8>,
      }

      PayloadTransferWithPayload {
        amount: U256::from(amount), -> 32 bytes
        token_address: accs.mint.info().key.to_bytes(),
        token_chain: CHAIN_ID_SOLANA,
        to: data.target_address,
        to_chain: data.target_chain,
        from_address: accs.sender.derive_sender_address(&data.cpi_program_id)?,
        payload: data.payload,
      };
       */
    });

    it("Can do pool swap exact output & wh token bridge transfer (2 transactions)", async () => {

      const userLpTokenBalanceBefore = (await splToken.account.token.fetch(userMetapoolTokenAccount0.address)).amount;
      console.log(`userLpTokenBalanceBefore: ${userLpTokenBalanceBefore.toString()}`);
      const maximumInputAmount: anchor.BN = new anchor.BN(100_000_000);
      const inputTokenIndex = 1;
      const exactOutputAmounts: anchor.BN[] = [new anchor.BN(100), new anchor.BN(0)];
      const poolSwapExactOutputParams = {
        maximumInputAmount,
        inputTokenIndex,
        exactOutputAmounts
      };
      const propellerSwapExactInputTx = await propellerProgram
        .methods
        .swapExactOutputV2(
          poolSwapExactOutputParams,
        )
        .accounts({
          poolState: metapool,
          poolAuth: metapoolAuth,
          poolTokenAccount0: metapoolData.tokenKeys[0]!,
          poolTokenAccount1: metapoolData.tokenKeys[1]!,
          lpMint: metapoolData.lpMintKey,
          governanceFee: metapoolData.governanceFeeKey,
          userTokenAccount0: userMetapoolTokenAccount0.address,
          userTokenAccount1: userMetapoolTokenAccount1.address,
          poolProgram: TWO_POOL_PROGRAM_ID,
          tokenProgram: splToken.programId,
          payer: payer.publicKey,
        })
        .preInstructions([requestUnitsIx])
        // .signers([payer, wormholeMessage])
        // .rpc();
        .transaction();
      // ~1179 with empty payload
      const swapTxnSig = await provider.sendAndConfirm(
        propellerSwapExactInputTx,
        [payer],
        {
          skipPreflight: true
        }
      );
      const txnSize = propellerSwapExactInputTx.serialize().length;
      console.log(`swapExactInputAndTransfer txnSize: ${txnSize}`)
      await connection.confirmTransaction({
        signature: swapTxnSig,
        ...(await connection.getLatestBlockhash())
      });

      const userLpTokenBalanceAfter = (await splToken.account.token.fetch(userMetapoolTokenAccount0.address)).amount;
      console.log(`userLpTokenBalanceAfter: ${userLpTokenBalanceAfter.toString()}`);
      const transferAmount = userLpTokenBalanceAfter.sub(userLpTokenBalanceBefore);

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
      const wormholeMessage = web3.Keypair.generate();
      const transferNativeTxn = await propellerProgram
        .methods
        .transferNativeWithPayload(
          nonce,
          CHAIN_ID_ETH,
          transferAmount,
          evmTargetTokenId,
          evmTargetTokenAddr,
          evmOwner,
          false,
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
        })
        .preInstructions([
          requestUnitsIx,
        ])
        .transaction();

      const transferNativeTxnSig = await provider.sendAndConfirm(
        transferNativeTxn,
        [payer, wormholeMessage],
        {
          skipPreflight: true,
        }
      );

      const transferNativeTxnSize = transferNativeTxn.serialize().length;
      console.log(`transferNativeTxnSize txnSize: ${transferNativeTxnSize}`)
      await connection.confirmTransaction({
        signature: transferNativeTxnSig,
        ...(await connection.getLatestBlockhash())
      });

      const userLpTokenBalanceAfter2 = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;
      console.log(`userLpTokenBalanceAfter2: ${userLpTokenBalanceAfter2.toString()}`);
      assert.isTrue(userLpTokenBalanceAfter2.eq(userLpTokenBalanceAfter.sub(transferAmount)));
    });
    it("mock token transfer VAA then complete (w/o payload) ", async() => {
      // let emitterSequenceAcctInfo = await connection.getAccountInfo(wormholeSequence);
      // if (!emitterSequenceAcctInfo) {
      // 	throw new Error("emitter account not found");
      // }
      // // let emitterSequence = emitterSequenceAcctInfo!.data.readBigUint64BE()
      // let emitterSequence = emitterSequenceAcctInfo!.data.readBigUint64LE()
      //
      // const attestMetaSignedVaa = signAndEncodeVaa(
      // 	0,
      // 	0,
      // 	CHAIN_ID_SOLANA as number,
      // 	Buffer.from(
      // 		tryNativeToHexString(wormholeEmitter.toBase58(), CHAIN_ID_SOLANA),
      // 		"hex"
      // 	),
      // 	++emitterSequence,
      // 	encodeAttestMeta(
      // 		Buffer.from(
      // 			tryNativeToHexString(tokenBridgeMint.toBase58(), CHAIN_ID_SOLANA),
      // 			"hex"
      // 		),
      // 		CHAIN_ID_SOLANA,
      // 		swimUSDMintInfo.decimals,
      // 		"swimUSD",
      // 		"swimUSD$"
      // 	)
      // );
      //
      // await postVaaSolanaWithRetry(
      // 	connection,
      // 	async (tx) => {
      // 		tx.partialSign(payer);
      // 		return tx;
      // 	},
      // 	WORMHOLE_CORE_BRIDGE.toString(),
      // 	payer.publicKey.toString(),
      // 	attestMetaSignedVaa,
      // 	10
      // );
      //
      // emitterSequenceAcctInfo = await connection.getAccountInfo(wormholeSequence);
      // let emitterSequenceAfter = emitterSequenceAcctInfo!.data.readBigUint64LE()
      // console.log(`emitterSequenceAfter: ${emitterSequenceAfter.toString()}`);
      // const transaction = await attestFromSolana(
      // 	connection,
      // 	WORMHOLE_CORE_BRIDGE.toBase58(),
      // 	WORMHOLE_TOKEN_BRIDGE.toBase58(),
      // 	payer.publicKey.toBase58(),
      // 	swimUSDMint.publicKey.toBase58(),
      // );
      //
      // const attestSig = await provider.sendAndConfirm(
      // 	transaction, [], confirmedCommitment
      // );
      // console.log(`attestSig: ${attestSig}`);
      // const info = await connection.getTransaction(attestSig, confirmedCommitment);
      // if (!info) {
      // 	throw new Error(
      // 		"An error occurred while fetching the transaction info"
      // 	);
      // }
      // // get the sequence from the logs (needed to fetch the vaa)
      // const logs = info.meta?.logMessages;
      // console.log(`logs: ${JSON.stringify(logs)}`);
      // let sequence = BigInt(parseSequenceFromLogSolana(info));
      // console.log(`sequence: ${sequence.toString()}`);
      //    wrapped_meta_address(program_id: string, mint_address: Uint8Array): Uint8Array;
      //     parse_wrapped_meta(data: Uint8Array): any;
      // const {
      // 	wrapped_meta_address,
      // 	parse_wrapped_meta
      // } = await importTokenWasm();
      // const [splMeta, mintMeta] = await getMintMetaPdas(swimUSDMint.publicKey);
      // const expectedMintMeta = new web3.PublicKey(
      // 	wrapped_meta_address(WORMHOLE_TOKEN_BRIDGE.toBase58(),
      // 		swimUSDMint.publicKey.toBytes())
      // );
      // console.log(`mintMeta: ${mintMeta!.toString()}, expectedMintMeta: ${expectedMintMeta.toString()}`);

      // dummy eth source wrapped swimUSD account
      // const ethWrappedSwimUsdAddr = Buffer.alloc(32);
      // ethWrappedSwimUsdAddr.fill(105, 12);

      // const swimUsdHexAddr = tryNativeToHexString(swimUSDMint.publicKey.toBase58(), CHAIN_ID_SOLANA);
      // console.log(`swimUSD: ${swimUsdHexAddr}`)
      // let amount = new anchor.BN("200000000000");
      let amount = parseUnits("1", swimUSDMintInfo.decimals);
      console.log(`amount: ${amount.toString()}`);
      const tokenTransferSignedVaa = signAndEncodeVaa(
        0,
        0,
        CHAIN_ID_ETH as number,
        ethTokenBridge,
        ++ethTokenBridgeSequence,
        encodeTokenTransfer(
          amount.toString(),
          swimUsdKeypair.publicKey.toBuffer(),
          // Buffer.from(swimUsdHexAddr),
          CHAIN_ID_SOLANA,
          // ethWrappedSwimUsdAddr,
          // CHAIN_ID_ETH,
          userSwimUsdAtaAddr
        )
      );
      const userLpTokenAccountBalanceBefore = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;


      // const signatureSet = web3.Keypair.generate();
      // const verifySigIxs = await createVerifySignaturesInstructionsSolana(
      // 	provider.connection,
      // 	WORMHOLE_CORE_BRIDGE.toBase58(),
      // 	payer.publicKey.toBase58(),
      // 	tokenTransferSignedVaa,
      // 	signatureSet
      // );
      // // const verifyTxns: web3.Transaction[] = [];
      // const verifyTxnSigs: string[] = [];
      // const batchableChunks = chunks(verifySigIxs, 2);
      // await Promise.all(batchableChunks.map(async (chunk) => {
      // 	let txn = new web3.Transaction();
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
      // 	tokenTransferSignedVaa,
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

      await postVaaSolanaWithRetry(
        connection,
        async (tx) => {
          tx.partialSign(payer);
          return tx;
        },
        WORMHOLE_CORE_BRIDGE.toBase58(),
        payer.publicKey.toBase58(),
        tokenTransferSignedVaa,
        10
      );


      const parsedTokenTransferVaa = await parseTokenTransferVaa(tokenTransferSignedVaa);
      console.log(`parsedTokenTransferVaa:\n${JSON.stringify(parsedTokenTransferVaa, null, 2)}`);
      // const {
      // 	parse_vaa
      // } = await importCoreWasm();
      // const parsedTokenTransferVaa = parse_vaa(tokenTransferSignedVaa);
      // console.log(`parsedTokenTransferVaa: ${JSON.stringify(parsedTokenTransferVaa)}`)
      // const isSolanaNative =
      // 	Buffer.from(new Uint8Array(parsedTokenTransferVaa.payload)).readUInt16BE(65) ===
      // 	CHAIN_ID_SOLANA;
      // console.log(`isSolanaNative: ${isSolanaNative}`);
      //
      // const parsedTokenTransferPayload = parseTransferPayload(
      // 	Buffer.from(parsedTokenTransferVaa.payload)
      // );
      // console.log(`
      // 	parsedTokenTransferPayload: {
      // 		amount: ${parsedTokenTransferPayload.amount.toString()}
      //         originAddress: ${tryHexToNativeAssetString(parsedTokenTransferPayload.originAddress, CHAIN_ID_SOLANA)}
      //         originChain: ${toChainName(parsedTokenTransferPayload.originChain)}
      //         targetAddress: ${tryHexToNativeAssetString(parsedTokenTransferPayload.targetAddress, CHAIN_ID_SOLANA)}
      //         targetChain: ${(toChainName(parsedTokenTransferPayload.targetChain))}
      //         fee: ${parsedTokenTransferPayload.fee.toString()}
      // 	}
      // `);
      // get the sequence from the logs (needed to fetch the vaa)
      // const postVaaTxnLogs = postVaaTxnSigInfo.meta?.logMessages;
      // console.log(`${postVaaTxnSig} logs: ${JSON.stringify(postVaaTxnLogs)}`);


      const redeemTxn = await redeemOnSolana(
        connection,
        WORMHOLE_CORE_BRIDGE.toBase58(),
        WORMHOLE_TOKEN_BRIDGE.toBase58(),
        payer.publicKey.toBase58(),
        Uint8Array.from(tokenTransferSignedVaa)
      );
      const redeemSig = await provider.sendAndConfirm(redeemTxn, [], {
        skipPreflight: true
      });
      console.log(`redeemSig: ${redeemSig}`);

      const userLpTokenAccountBalanceAfter = (await splToken.account.token.fetch(userSwimUsdAtaAddr)).amount;

      // amount: 100_000_000
      // userLpTokenAccountBalanceBefore: 100
      // userLpTokenAccountBalanceAfter: 100_000_100

      console.log(`
			amount: ${amount.toString()}
			userLpTokenAccountBalanceBefore: ${userLpTokenAccountBalanceBefore.toString()}
			userLpTokenAccountBalanceAfter: ${userLpTokenAccountBalanceAfter.toString()}
		`);
      const expectedAmount = userLpTokenAccountBalanceBefore.add(new anchor.BN(amount.toString()));
      assert(userLpTokenAccountBalanceAfter.eq(expectedAmount));
      // expect(userLpTokenAccountBalanceAfter).to.deep.equal(
      // 	userLpTokenAccountBalanceBefore.add.rs(new anchor.BN(amount.toString()))
      // );

      // {
      // 	const response = await redeemOnSolana(
      // 		connection,
      // 		CORE_BRIDGE_ADDRESS.toString(),
      // 		TOKEN_BRIDGE_ADDRESS.toString(),
      // 		buyer.publicKey.toString(),
      // 		Uint8Array.from(tokenTransferSignedVaa)
      // 	)
      // 		.then((transaction) => {
      // 			transaction.partialSign(buyer);
      // 			return connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true });
      // 		})
      // 		.then((tx) => connection.confirmTransaction(tx));
      // }
      //
      // const balance = await getSplBalance(connection, mint, buyer.publicKey);
      // expect(balance.toString()).to.equal(amount.toString());

      // const parsedWrappedMeta = parse_wrapped_meta(
      // 	(await connection.getAccountInfo(mintMeta!, "confirmed"))!.data
      // );
      // console.log(`parsedWrappedMeta: ${JSON.stringify(parsedWrappedMeta)}`);
    });

    it("mocks token transfer with payload then calls propeller complete with payload", async () => {
      const payload = Buffer.from([1,2,3]);
      let amount = parseUnits("1", swimUSDMintInfo.decimals);
      console.log(`amount: ${amount.toString()}`);
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
          payload
        )
      );
      const propellerRedeemerEscrowAccountBefore = (await splToken.account.token.fetch(propellerRedeemerEscrowAccount.address)).amount;

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
      // await Promise.all(batchableChunks.map(async (chunk) => {
      // 	let txn = new web3.Transaction();
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


      const parsedTokenTransferVaa = await parseTokenTransferVaa(tokenTransferWithPayloadSignedVaa);
      console.log(`parsedTokenTransferVaa:\n${JSON.stringify(parsedTokenTransferVaa, null, 2)}`);
      const { claim_address } = await importCoreWasm();
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

      const messsageAccountInfo = await connection.getAccountInfo(messageAccount);
      const parsedTokenTransferSignedVaaFromAccount = await parseTokenTransferWithPayloadPostedMessage(
        messsageAccountInfo!.data
      );

      console.log(`parsedTokenTransferSignedVaaFromAccount:\n
			${JSON.stringify(parsedTokenTransferSignedVaaFromAccount, null, 2)}
		`);
      const emitterAddrUint8Arr = tryNativeToUint8Array(
        parsedTokenTransferSignedVaaFromAccount.emitter_address2,
        parsedTokenTransferSignedVaaFromAccount.emitter_chain
      );
      console.log(`
			emitter_address2Pub: ${new web3.PublicKey(emitterAddrUint8Arr).toBase58()}
		`);
      const [endpointAccount] = await deriveEndpointPda(
        parsedTokenTransferVaa.emitter_chain,
        parsedTokenTransferVaa.emitter_address,
        // Buffer.from(new web3.PublicKey(parsedTokenTransferVaa.emitter_address).toBase58()),
        WORMHOLE_TOKEN_BRIDGE
      );
      console.log(`endpointAccount: ${endpointAccount.toBase58()}`);
      // const messageAccount = complete_wrapped_accounts[2]!.pubkey;
      // const claimAccount = complete_wrapped_accounts[3]!.pubkey;
      const claimAddressWasm = claim_address(
        WORMHOLE_TOKEN_BRIDGE.toBase58(), tokenTransferWithPayloadSignedVaa
      );
      const claimAddressPubkey = new web3.PublicKey(claimAddressWasm);
      const claimAddressPubkey2 = new web3.PublicKey(
        tryUint8ArrayToNative(
          claimAddressWasm,
          CHAIN_ID_SOLANA
        )
      );
      // expect(claimAccount).to.deep.equal(claimAddressPubkey);
      expect(claimAddressPubkey).to.deep.equal(claimAddressPubkey2);
      console.log(`claimAddressPubkey: ${claimAddressPubkey.toBase58()}`);

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

      const propellerCompleteToUserTxn = await propellerProgram
        .methods
        .completeToUser()
        .accounts({
          propeller,
          payer: payer.publicKey,
          message: messageAccount,
          // redeemer: propellerRedeemer,
          feeRecipient: propellerRedeemerEscrowAccount.address,
          pool: flagshipPool,
          poolTokenAccount0: flagshipPoolData.tokenKeys[0]!,
          poolTokenAccount1: flagshipPoolData.tokenKeys[1]!,
          poolProgram: TWO_POOL_PROGRAM_ID,
          // tokenBridgeMint,
          // custody: custody,
          // mint: tokenBridgeMint,
          // custodySigner,
          // rent: web3.SYSVAR_RENT_PUBKEY,
          // systemProgram: web3.SystemProgram.programId,
          // wormhole,
          // tokenProgram: splToken.programId,
          // tokenBridge,
          aggregator: aggregatorKey,
        }).rpc();
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
  });

});

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

async function addToPool(
	provider: anchor.AnchorProvider,
	pool: web3.PublicKey,
	poolState: SwimPoolState,
	userTokenAccounts: web3.PublicKey[],
	userLpTokenAccount: web3.PublicKey,
	inputAmounts: anchor.BN[],
	minimumMintAmount: anchor.BN,
	tokenAccountOwner: web3.Keypair,
	delegate: web3.PublicKey,
): Promise<string> {
	// let userMetapoolTokenAccountAmounts = await Promise.all(
	//     userMetapoolTokenAccounts.map(async (account) => {
	//     return (await splToken.account.token.fetch(account)).amount;
	// }));
	// console.log(`userMetapoolTokenAccountAmounts: ${userMetapoolTokenAccountAmounts}`)
	// let userMetapoolTokenAccounts0Amount = await splToken.account.token.fetch(userMetapoolTokenAccounts[0]);
	// let inputAmounts = [new anchor.BN(100), new anchor.BN(100)];

	const addMetapoolIx = addToPoolIx(
		{
			provider,
			pool,
			poolState,
			userTokenAccounts,
			userLpTokenAccount,
			inputAmounts,
			minimumMintAmount,
		});
	const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
		anchor.BN.max(inputAmounts[0]!, inputAmounts[1]!),
		tokenAccountOwner.publicKey,
		delegate,
		userTokenAccounts
	);
	const seedMetapoolTxn = new web3.Transaction()
		.add(...approveIxs!)
		.add(addMetapoolIx)
		.add(...revokeIxs!);
	seedMetapoolTxn.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
	return await provider.sendAndConfirm(
		seedMetapoolTxn,
		[dummyUser],
		{
			skipPreflight: true,
		}
	);
}

async function createAtaAndMint(mint: web3.PublicKey) {
	const tokenAccount = await getOrCreateAssociatedTokenAccount(
		connection,
		payer,
		mint,
		dummyUser.publicKey,
		false
	);
	const mintTxn = await mintTo(
		connection,
		payer,
		mint,
		tokenAccount.address,
		payer,
		initialMintAmount,
	);

	await connection.confirmTransaction({
		signature: mintTxn,
		...(await connection.getLatestBlockhash())
	})
	console.log(`minted to user_token_account: ${tokenAccount.address.toBase58()}`);
	return tokenAccount
}

const parseTransferWithPayload = (arr: Buffer) => (
	{
		amount: BigNumber.from(arr.subarray(1, 1 + 32)).toBigInt(),
		originAddress: arr.subarray(33, 33 + 32).toString("hex"),
		originChain: arr.readUInt16BE(65) as ChainId,
		targetAddress: arr.subarray(67, 67 + 32).toString("hex"),
		targetChain: arr.readUInt16BE(99) as ChainId,
		fromAddress: arr.subarray(101, 101 + 32).toString("hex"),
		payload: arr.subarray(133).toString("hex"),
	}
);

const parseTokenTransferWithPayloadPostedMessage = async (arr: Buffer) => {
	const {parse_posted_message} = await importCoreWasm();
	const postedMessage = parse_posted_message(arr);
	const tokenTransfer = parseTransferWithPayload(Buffer.from(postedMessage.payload));
	return {
		...postedMessage,
		vaa_signature_account: new web3.PublicKey(postedMessage.vaa_signature_account).toBase58(),
		// emitter_address: tryHexToNativeAssetString(postedMessage.emitter_address, postedMessage.emitter_chain),
		emitter_address: new web3.PublicKey(postedMessage.emitter_address).toBase58(),
		emitter_address2: tryUint8ArrayToNative(postedMessage.emitter_address, postedMessage.emitter_chain),
		payload: {
			...tokenTransfer,
			amount: tokenTransfer.amount.toString(),
			originAddress: tryHexToNativeAssetString(tokenTransfer.originAddress, tokenTransfer.originChain),
			originChain: toChainName(tokenTransfer.originChain),
			targetAddress: tryHexToNativeAssetString(tokenTransfer.targetAddress, tokenTransfer.targetChain),
			targetChain: toChainName(tokenTransfer.targetChain),
			fromAddress: tryHexToNativeAssetString(tokenTransfer.fromAddress, postedMessage.emitter_chain),
		}
	}
}

const parseTokenTransferVaa = async (arr: Buffer) => {
	const {parse_vaa} = await importCoreWasm();
	const parsedVaa = parse_vaa(arr);
	const tokenTransfer = parseTransferWithPayload(Buffer.from(parsedVaa.payload));
	return {
		...parsedVaa,
		// signatures: parsedVaa.signatures.map(sig => sig.toString("hex")),
		// vaa_signature_account: new web3.PublicKey(parsedVaa.vaa_signature_account).toBase58(),
		// emitter_address: new web3.PublicKey(parsedVaa.emitter_address).toBase58(),
		// emitter_address_str: tryHexToNativeAssetString(parsedVaa.emitter_address, CHAIN_ID_ETH),
		emitter_address_str: tryHexToNativeAssetString(parsedVaa.emitter_address, parsedVaa.emitter_chain),
		// signatures: parsedVaa.signatures.map(sig => {
		// 	return {
		// 		sig.signature.toString("hex")
		// 	}
		// }),
		payload: {
			...tokenTransfer,
			amount: tokenTransfer.amount.toString(),
			originAddress: tryHexToNativeAssetString(tokenTransfer.originAddress, tokenTransfer.originChain),
			originChain: toChainName(tokenTransfer.originChain),
			targetAddress: tryHexToNativeAssetString(tokenTransfer.targetAddress, tokenTransfer.targetChain),
			targetChain: toChainName(tokenTransfer.targetChain),
			// fromAddress: tryHexToNativeAssetString(tokenTransfer.fromAddress, CHAIN_ID_ETH),
		}
	}
}

export interface SwimPayload {
	version: number;
	targetTokenId: number;
	targetToken: Buffer; //mint of expected final output token
	owner: Buffer;
	// gas: string;
	minOutputAmount: string; //this will always be 0 in v1
	relayerFee: string;
	gasKickstart: boolean;
}

export function encodeSwimPayload(
	swimPayload: SwimPayload
): Buffer {
	const encoded = Buffer.alloc(
		1 + //version
		2 + //targetTokenId (u16)
		32 + //targetToken
		32 + //owner
		// 32 + //gas
		32 + //minOutputAmount
		32 + //relayerFee
		1 //gasKickstart
	);
	encoded.writeUint8(swimPayload.version, 0);
	encoded.writeUint16BE(swimPayload.targetTokenId, 1);
	encoded.write(swimPayload.targetToken.toString("hex"), 3, "hex");
	encoded.write(swimPayload.owner.toString("hex"), 35, "hex");
	// encoded.write(toBigNumberHex(swimPayload.gas, 32), 67, "hex");
	encoded.write(toBigNumberHex(swimPayload.minOutputAmount, 32), 67, "hex");
	encoded.write(toBigNumberHex(swimPayload.relayerFee, 32), 99, "hex");
	encoded.writeUint8(Number(swimPayload.gasKickstart), 121);
	return encoded;
}

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
