// yarn run ts-node scripts/initializePool.ts
import * as fs from "fs";
import * as path from "path";

import * as anchor from "@project-serum/anchor";
import { Spl, web3 } from "@project-serum/anchor";
import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import type { Keypair } from "@solana/web3.js";

import {
  TwoPoolContext,
  getApproveAndRevokeIxs,
  twoPoolToString,
  writePoolStateToFile,
} from "../src";
import {
  setupPoolPrereqs,
  setupUserAssociatedTokenAccts,
} from "../test/twoPool/poolTestUtils";

const envProvider = anchor.AnchorProvider.env();
const commitment = "confirmed" as web3.Commitment;
const rpcCommitmentConfig = {
  commitment,
  preflightCommitment: commitment,
  skipPreflight: true,
};

const provider = new anchor.AnchorProvider(
  envProvider.connection,
  envProvider.wallet,
  rpcCommitmentConfig,
);
const payer = (provider.wallet as NodeWallet).payer;
anchor.setProvider(provider);
console.log(`anchorProvider pubkey: ${provider.publicKey.toBase58()}`);

// const programId = new web3.PublicKey(
//   "8VNVtWUae4qMe535i4yL1gD3VTo8JhcfFEygaozBq8aM"
// );
//
//
// const twoPoolContext = TwoPoolContext.withProvider(
//   provider,
//   programId
// );
const twoPoolContext = TwoPoolContext.fromWorkspace(
  provider,
  anchor.workspace.TwoPool,
);

const twoPoolProgram = twoPoolContext.program;

const splToken = Spl.token(provider);
const splAssociatedToken = Spl.associatedToken(provider);
const mintDecimals = 6;
const usdcKeypair = web3.Keypair.generate();
const usdtKeypair = web3.Keypair.generate();
const poolMintKeypairs = [usdcKeypair, usdtKeypair];
const poolMintDecimals = [mintDecimals, mintDecimals];
const poolMintAuthorities = [payer, payer];
const swimUsdKeypair = web3.Keypair.generate();
const governanceKeypair = web3.Keypair.generate();
const pauseKeypair = web3.Keypair.generate();

const initialMintAmount = 1_000_000_000_000;

let poolUsdcAtaAddr: web3.PublicKey = web3.PublicKey.default;
let poolUsdtAtaAddr: web3.PublicKey = web3.PublicKey.default;
let governanceFeeAddr: web3.PublicKey = web3.PublicKey.default;

let userUsdcAtaAddr: web3.PublicKey = web3.PublicKey.default;
let userUsdtAtaAddr: web3.PublicKey = web3.PublicKey.default;
let userSwimUsdAtaAddr: web3.PublicKey = web3.PublicKey.default;

const ampFactor = { value: new anchor.BN(300), decimals: 0 };
const lpFee = { value: new anchor.BN(300), decimals: 6 }; //lp fee = .000300 = 0.0300% 3bps
const governanceFee = { value: new anchor.BN(100), decimals: 6 }; //gov fee = .000100 = (0.0100%) 1bps

let flagshipPool: web3.PublicKey = web3.PublicKey.default;
type DecimalU64Anchor = {
  readonly value: anchor.BN;
  readonly decimals: number;
};

const outDir = path.resolve(
  __dirname,
  "output",
  new Date().getTime().toString(),
);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}
const poolStatePath = path.resolve(outDir, "poolState.json");
const pauseKeyPath = path.resolve(outDir, "pauseKey.json");
const governanceKeyPath = path.resolve(outDir, "governanceKey.json");

async function initialize() {
  ({
    poolPubkey: flagshipPool,
    poolTokenAccounts: [poolUsdcAtaAddr, poolUsdtAtaAddr],
    governanceFeeAccount: governanceFeeAddr,
  } = await setupPoolPrereqs(
    twoPoolProgram,
    splToken,
    poolMintKeypairs,
    poolMintDecimals,
    poolMintAuthorities.map((keypair) => keypair.publicKey),
    swimUsdKeypair.publicKey,
    governanceKeypair.publicKey,
  ));
  const params = {
    ampFactor,
    lpFee,
    governanceFee,
  };
  const tx = await twoPoolProgram.methods
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
      governanceFeeAccount: governanceFeeAddr,
      tokenProgram: splToken.programId,
      associatedTokenProgram: splAssociatedToken.programId,
      systemProgram: web3.SystemProgram.programId,
      rent: web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([swimUsdKeypair]);
  const pool = (await tx.pubkeys()).pool;
  console.log(
    `poolKey: ${pool!.toBase58()}, expected: ${flagshipPool.toBase58()}`,
  );

  const txSig = await tx.rpc({ commitment: "confirmed" });

  console.log("Your transaction signature", txSig);
  await provider.connection.confirmTransaction({
    signature: txSig,
    ...(await provider.connection.getLatestBlockhash()),
  });
  console.log("Transaction has been confirmed");

  const twoPoolStr = await twoPoolToString(twoPoolProgram, flagshipPool);
  console.log(`twoPool: ${twoPoolStr}`);

  console.log(`writing pool state, pause & gov keys to ${outDir}`);
  writePoolStateToFile(poolStatePath, twoPoolStr);
  writeKeypairToFile(pauseKeyPath, pauseKeypair);
  writeKeypairToFile(governanceKeyPath, governanceKeypair);
}

async function add() {
  ({
    userPoolTokenAtas: [userUsdcAtaAddr, userUsdtAtaAddr],
    userLpTokenAta: userSwimUsdAtaAddr,
  } = await setupUserAssociatedTokenAccts(
    provider.connection,
    provider.publicKey,
    poolMintKeypairs.map((kp) => kp.publicKey),
    poolMintAuthorities,
    swimUsdKeypair.publicKey,
    initialMintAmount,
    payer,
  ));

  const inputAmounts = [
    new anchor.BN(500_000_000_000),
    new anchor.BN(400_000_000_000),
  ];
  const minimumMintAmount = new anchor.BN(0);

  const userTransferAuthority = web3.Keypair.generate();
  const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
    splToken,
    [userUsdcAtaAddr, userUsdtAtaAddr],
    inputAmounts,
    userTransferAuthority.publicKey,
    payer,
  );
  const tx = await twoPoolProgram.methods
    // .add(addParams)
    .add(inputAmounts, minimumMintAmount)
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
    })
    .preInstructions([...approveIxs])
    .postInstructions([...revokeIxs])
    .signers([userTransferAuthority])
    .rpc();

  const userUsdcAta = await tokenAccountToJson(userUsdcAtaAddr);
  const userUsdtAta = await tokenAccountToJson(userUsdtAtaAddr);
  const userSwimUsdAta = await tokenAccountToJson(userSwimUsdAtaAddr);

  console.log(`
    userUsdcAta: ${userUsdcAta}
    userUsdtAta: ${userUsdtAta}
    userSwimUsdAta: ${userSwimUsdAta}
  `);
}

const tokenAccountToJson = async (key: web3.PublicKey) => {
  const tokenAccount = await splToken.account.token.fetch(key);

  const tokenAccountFormatted = {
    key,
    ...tokenAccount,
    amount: tokenAccount.amount.toString(),
    delegatedAmount: tokenAccount.delegatedAmount.toString(),
  };
  return JSON.stringify(tokenAccountFormatted, null, 2);
};

const writeKeypairToFile = (keypairPath: string, keypair: Keypair) => {
  fs.writeFileSync(keypairPath, "[" + keypair.secretKey.toString() + "]");
};

async function main() {
  await initialize();
  console.log(`intitialized pool`);
  await add();
  console.log(`seeded pool and user accounts`);
}

main();
