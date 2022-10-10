import type { Idl } from "@project-serum/anchor";
import {
  AnchorProvider,
  BN,
  Program,
  Spl,
  setProvider,
  web3,
} from "@project-serum/anchor";
import type NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { getAssociatedTokenAddress } from "@solana/spl-token";

import type { TwoPool } from "../src";
import { getApproveAndRevokeIxs, idl } from "../src";
import { TWO_POOL_PID } from "../src/__tests__/consts";

// import type { Propeller } from "../src/artifacts/propeller";
// import type { TwoPool } from "../src/artifacts/two_pool";

const provider = AnchorProvider.env();
setProvider(provider);
const twoPoolProgram = new Program(
  idl.twoPool as Idl,
  TWO_POOL_PID,
  provider,
) as unknown as Program<TwoPool>;

const splToken = Spl.token(provider);

const payer = (provider.wallet as NodeWallet).payer;

async function main() {
  const poolAddr = new web3.PublicKey(
    "EGm6UfAJ6LFy8WRxE2YjjJzwUbZ1ZFiuG2rP6YudKKBB",
  );
  const poolData = await twoPoolProgram.account.twoPool.fetch(poolAddr);
  const poolTokenMints = poolData.tokenMintKeys;
  const poolAtas = await Promise.all(
    poolData.tokenKeys.map(async (ata) => {
      const ataInfo = await splToken.account.token.fetch(ata);
      return {
        ...ataInfo,
        mint: ataInfo.mint.toBase58(),
        authority: ataInfo.authority.toBase58(),
        amount: ataInfo.amount.toString(),
      };
    }),
  );
  console.info("poolAtas:");
  console.table(poolAtas);
  const uiAmount = new BN(1_000_000_000);

  const userAtas = await getUserAtas([...poolTokenMints, poolData.lpMintKey]);
  let inputAmounts: readonly BN[] = [];
  for (const mint of poolTokenMints) {
    const mintInfo = await splToken.account.mint.fetch(mint);
    const mintDecimals = mintInfo.decimals;
    const mintAuthority = mintInfo.mintAuthority;
    if (!mintAuthority) {
      throw new Error("no mint authority");
    }
    console.info(
      `mint: ${JSON.stringify(
        {
          mint: mint.toBase58(),
          mintDecimals,
          mintAuthority: mintAuthority.toBase58(),
        },
        null,
        2,
      )}`,
    );

    console.info(`mintAuthority: ${mintAuthority.toBase58()}`);
    console.info(`provider.publicKey: ${provider.publicKey.toBase58()}`);
    // expect(mintAuthority).toEqual(provider.publicKey);
    const mintAmount = uiAmount.mul(new BN(10).pow(new BN(mintDecimals)));
    const userAta = await getAssociatedTokenAddress(mint, provider.publicKey);
    if (!mintAuthority.equals(provider.publicKey)) {
      console.info("skipping mint b/c of improper mintAuthoirty for now");
      continue;
    }
    inputAmounts = [...inputAmounts, mintAmount.div(new BN(10))];
    await splToken.methods
      .mintTo(mintAmount)
      .accounts({
        mint,
        to: userAta,
        authority: mintAuthority,
      })
      .signers([payer])
      .rpc();
  }

  const minimumMintAmount: BN = new BN(0);

  const userTransferAuthority = web3.Keypair.generate();
  const [approveIxs, revokeIxs] = await getApproveAndRevokeIxs(
    splToken,
    userAtas.slice(0, 2),
    inputAmounts,
    userTransferAuthority.publicKey,
    payer,
  );
  console.info(
    `inputAmounts: ${JSON.stringify(inputAmounts.map((x) => x.toString()))}`,
  );

  await twoPoolProgram.methods
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    .add(inputAmounts, minimumMintAmount)
    .accounts({
      poolTokenAccount0: poolData.tokenKeys[0],
      poolTokenAccount1: poolData.tokenKeys[1],
      lpMint: poolData.lpMintKey,
      governanceFee: poolData.governanceFeeKey,
      userTransferAuthority: userTransferAuthority.publicKey,
      userTokenAccount0: userAtas[0],
      userTokenAccount1: userAtas[1],
      userLpTokenAccount: userAtas[2],
      tokenProgram: splToken.programId,
    })
    .preInstructions([...approveIxs])
    .postInstructions([...revokeIxs])
    .signers([userTransferAuthority])
    .rpc();

  console.info(
    `added ${JSON.stringify(inputAmounts.map((a) => a.toString()))} to pool`,
  );
  const ataInfos = await Promise.all(
    userAtas.map(async (ata) => {
      const ataInfo = await splToken.account.token.fetch(ata);
      return {
        ...ataInfo,
        mint: ataInfo.mint.toBase58(),
        authority: ataInfo.authority.toBase58(),
        amount: ataInfo.amount.toString(),
      };
    }),
  );
  console.table(ataInfos);
}

async function getUserAtas(mints: readonly web3.PublicKey[]) {
  let userAtas: readonly web3.PublicKey[] = [];
  for (const mint of mints) {
    const ata = await getAssociatedTokenAddress(mint, provider.publicKey);
    userAtas = [...userAtas, ata];
  }
  return userAtas;
}

void main();
