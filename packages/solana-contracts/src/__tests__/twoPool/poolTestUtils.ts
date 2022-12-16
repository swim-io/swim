import type { BN, Program, Program, SplToken } from "@project-serum/anchor";
import { web3 } from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import type { Commitment, ConfirmOptions } from "@solana/web3.js";

import type { TwoPool, TwoPool } from "../../artifacts/two_pool";

/**
 * It initializes the mints for the tokens that will be used in the pool, and then *CALCULATES* the pool token accounts and
 * the governance fee account addresses
 * @param program - The program that will be used to create the pool.
 * @param splToken - The program that implements the SPL token standard.
 * @param mintKeypairs - Array<web3.Keypair>
 * @param mintDecimals - the number of decimals for each mint
 * @param mintAuthorities - The public keys of the accounts that can mint the underlying tokens.
 * @param lpMint - the public key of the account that will receive the governance fee
 * @param governanceFeeOwner - The account that will receive the governance fee.
 */
export async function setupPoolPrereqs(
  program: Program<TwoPool>,
  splToken: Program<SplToken>,
  mintKeypairs: ReadonlyArray<web3.Keypair>,
  mintDecimals: ReadonlyArray<number>,
  mintAuthorities: ReadonlyArray<web3.PublicKey>,
  lpMint: web3.PublicKey,
  governanceFeeOwner: web3.PublicKey,
): Promise<{
  readonly poolPubkey: web3.PublicKey;
  readonly poolTokenAccounts: ReadonlyArray<web3.PublicKey>;
  readonly governanceFeeAccount: web3.PublicKey;
}> {
  for (const mintKeypair of mintKeypairs) {
    const i = mintKeypairs.indexOf(mintKeypair);
    const mintDecimal = mintDecimals[i];
    const mintAuthority = mintAuthorities[i];
    try {
      const mint = await splToken.account.mint.fetch(mintKeypair.publicKey);
      console.info(
        `existing mint info found for ${mintKeypair.publicKey.toBase58()}: ${JSON.stringify(
          mint,
        )}`,
      );
    } catch (e) {
      console.info(
        `mint not found. Initializing now. error: ${JSON.stringify(e)}`,
      );
      await splToken.methods
        .initializeMint(mintDecimal, mintAuthority, null)
        // .initializeMint(mintDecimal, program.provider.publicKey!, null)
        .accounts({
          mint: mintKeypair.publicKey,
        })
        .preInstructions([
          await splToken.account.mint.createInstruction(mintKeypair),
        ])
        .signers([mintKeypair])
        .rpc();
    }
  }
  // for await (const mintKeypair of mintKeypairs) {
  //   const i = mintKeypairs.indexOf(mintKeypair);
  //   const mintDecimal = mintDecimals[i];
  //   try {
  //     const mint = await splToken.account.mint.fetch(mintKeypair.publicKey);
  //     console.info(
  //       `existing mint info found for ${mintKeypair.publicKey.toBase58()}: ${JSON.stringify(
  //         mint,
  //       )}`,
  //     );
  //   } catch (e) {
  //     console.info(
  //       `mint not found. Initializing now. error: ${JSON.stringify(e)}`,
  //     );
  //     await splToken.methods
  //       .initializeMint(mintDecimal, program.provider.publicKey!, null)
  //       .accounts({
  //         mint: mintKeypair.publicKey,
  //       })
  //       .preInstructions([
  //         await splToken.account.mint.createInstruction(mintKeypair),
  //       ])
  //       .signers([mintKeypair])
  //       .rpc();
  //   }
  // }
  //
  // await Promise.all(
  //   mintKeypairs.forEach(async (mintKeypair, i) => {
  // )
  // for (let i = 0; i < mintKeypairs.length; i++) {
  //   const mintKeypair = mintKeypairs[i];
  //   const mintDecimal = mintDecimals[i];
  //   try {
  //     const mint = await splToken.account.mint.fetch(mintKeypair.publicKey);
  //     console.info(
  //       `existing mint info found for ${mintKeypair.publicKey.toBase58()}: ${JSON.stringify(
  //         mint,
  //       )}`,
  //     );
  //   } catch (e) {
  //     console.info(
  //       `mint not found. Initializing now. error: ${JSON.stringify(e)}`,
  //     );
  //
  //     await splToken.methods
  //       .initializeMint(mintDecimal, program.provider.publicKey!, null)
  //       .accounts({
  //         mint: mintKeypair.publicKey,
  //       })
  //       .preInstructions([
  //         await splToken.account.mint.createInstruction(mintKeypair),
  //       ])
  //       .signers([mintKeypair])
  //       .rpc();
  //   }
  // }

  const [poolPubkey] = await web3.PublicKey.findProgramAddress(
    [
      Buffer.from("two_pool"),
      ...mintKeypairs.map((keypair) => keypair.publicKey.toBytes()),
      lpMint.toBytes(),
    ],
    program.programId,
  );

  const poolTokenAccounts: readonly web3.PublicKey[] = await Promise.all(
    mintKeypairs.map(async (mintKeypair): Promise<web3.PublicKey> => {
      return await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        poolPubkey,
        true,
      );
    }),
  );

  console.info(`initialized pool token accounts`);

  const governanceFeeAccount: web3.PublicKey = await getAssociatedTokenAddress(
    lpMint,
    governanceFeeOwner,
  );

  console.info(`initialized governance fee account`);

  console.info(`
      pool token accounts: ${JSON.stringify(
        poolTokenAccounts.map((a) => a.toBase58()),
      )}
      governance fee account: ${governanceFeeAccount.toBase58()}
    `);
  return {
    poolPubkey,
    poolTokenAccounts,
    governanceFeeAccount,
  };
}

export async function setupUserAssociatedTokenAccts(
  connection: web3.Connection,
  owner: web3.PublicKey,
  mints: ReadonlyArray<web3.PublicKey>,
  mintAuthorities: ReadonlyArray<web3.Keypair>,
  lpMint: web3.PublicKey,
  amount: BN,
  payer: web3.Keypair,
  splToken: Program<SplToken>,
  // splAssociatedToken: Program<SplAssociatedToken>,
  commitment?: Commitment,
  confirmOptions?: ConfirmOptions,
): Promise<{
  readonly userPoolTokenAtas: ReadonlyArray<web3.PublicKey>;
  readonly userLpTokenAta: web3.PublicKey;
}> {
  // const userPoolTokenAtas: ReadonlyArray<web3.PublicKey> = [];
  const userPoolTokenAtas = await Promise.all(
    mints.map(async (mint, i) => {
      const mintAuthority = mintAuthorities[i];

      const userAta: web3.PublicKey = (
        await getOrCreateAssociatedTokenAccount(
          connection,
          payer,
          mint,
          owner,
          false,
          commitment,
          confirmOptions,
        )
      ).address;
      console.info(
        `mint[${i}]: ${mint.toBase58()}. created/retrieved userAta: ${userAta.toBase58()}`,
      );
      await splToken.methods
        .mintTo(amount)
        .accounts({
          mint,
          to: userAta,
          authority: mintAuthority.publicKey,
        })
        .signers([mintAuthority])
        .rpc();
      // await mintTo(connection, payer, mint, userAta, mintAuthority, amount);
      console.info(`minted ${amount.toString()} to ${userAta.toBase58()}`);
      return userAta;
    }),
  );
  // for (let i = 0; i < mints.length; i++) {
  //   const mint = mints[i];
  //   const mintAuthority = mintAuthorities[i];
  //   const userAta = (
  //     await getOrCreateAssociatedTokenAccount(
  //       connection,
  //       payer,
  //       mint,
  //       owner,
  //       false,
  //       commitment,
  //       confirmOptions,
  //     )
  //   ).address;
  //   console.info(`mint[${i}]: ${mint}. created/retrieved userAta: ${userAta}`);
  //   await mintTo(connection, payer, mint, userAta, mintAuthority, amount);
  //   console.info(`minted ${amount} to ${userAta}`);
  //   userPoolTokenAtas.push(userAta);
  // }

  const userLpTokenAta: web3.PublicKey = (
    await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      lpMint,
      owner,
      false,
      commitment,
      confirmOptions,
    )
  ).address;
  console.info(
    `lpMint: ${lpMint.toBase58()}. created/retrieved userLpTokenAta: ${userLpTokenAta.toBase58()}`,
  );
  return {
    userPoolTokenAtas,
    userLpTokenAta,
  };
}

type PoolUserBalances = {
  readonly poolTokenBalances: ReadonlyArray<BN>;
  readonly userTokenBalances: ReadonlyArray<BN>;
  readonly governanceFeeBalance: BN;
  readonly userLpTokenBalance: BN;
  readonly lpTokenSupply: BN;
  readonly previousDepth: BN;
};
export async function getPoolUserBalances(
  splToken: Program<SplToken>,
  twoPoolProgram: Program<TwoPool>,
  poolToken0Ata: web3.PublicKey,
  poolToken1Ata: web3.PublicKey,
  governanceFeeAddr: web3.PublicKey,
  userToken0Ata: web3.PublicKey,
  userToken1Ata: web3.PublicKey,
  userLpTokenAta: web3.PublicKey,
  flagshipPool: web3.PublicKey,
  lpTokenMint: web3.PublicKey,
): Promise<PoolUserBalances> {
  const poolToken0AtaBalance = (
    await splToken.account.token.fetch(poolToken0Ata)
  ).amount;
  const poolToken1AtaBalance = (
    await splToken.account.token.fetch(poolToken1Ata)
  ).amount;
  const governanceFeeBalance = (
    await splToken.account.token.fetch(governanceFeeAddr)
  ).amount;
  const userToken0AtaBalance = (
    await splToken.account.token.fetch(userToken0Ata)
  ).amount;
  const userToken1AtaBalance = (
    await splToken.account.token.fetch(userToken1Ata)
  ).amount;
  const userLpTokenAtaBalance = (
    await splToken.account.token.fetch(userLpTokenAta)
  ).amount;
  const lpTokenSupply = (await splToken.account.mint.fetch(lpTokenMint)).supply;

  const previousDepth = (
    await twoPoolProgram.account.twoPool.fetch(flagshipPool)
  ).previousDepth;
  return {
    poolTokenBalances: [poolToken0AtaBalance, poolToken1AtaBalance],
    governanceFeeBalance,
    userTokenBalances: [userToken0AtaBalance, userToken1AtaBalance],
    userLpTokenBalance: userLpTokenAtaBalance,
    lpTokenSupply,

    previousDepth,
  };
}

export function printPoolUserBalances(
  logPrefix: string,
  poolUserBalances: PoolUserBalances,
) {
  const {
    poolTokenBalances: [poolToken0AtaBalance, poolToken1AtaBalance],
    governanceFeeBalance: governanceFeeBalance,
    userTokenBalances: [userToken0AtaBalance, userToken1AtaBalance],
    userLpTokenBalance: userLpTokenBalance,
    lpTokenSupply,
    previousDepth: previousDepth,
  } = poolUserBalances;
  console.info(`
    ${logPrefix}
    poolToken0AtaBalance: ${poolToken0AtaBalance.toString()},
    poolToken1AtaBalance: ${poolToken1AtaBalance.toString()},
    governanceFeeBalance:${governanceFeeBalance.toString()},
    userToken0AtaBalance: ${userToken0AtaBalance.toString()},
    userToken1AtaBalance: ${userToken1AtaBalance.toString()},
    userLpTokenBalance: ${userLpTokenBalance.toString()},
    lpTokenSupply: ${lpTokenSupply.toString()},
    previousDepth: ${previousDepth.toString()},
  `);
}

export function printBeforeAndAfterPoolUserBalances(
  logPrefix: string,
  poolUserBalances: ReadonlyArray<PoolUserBalances>,
) {
  const {
    poolTokenBalances: [poolToken0AtaBalanceBefore, poolToken1AtaBalanceBefore],
    governanceFeeBalance: governanceFeeBalanceBefore,
    userTokenBalances: [userToken0AtaBalanceBefore, userToken1AtaBalanceBefore],
    userLpTokenBalance: userLpTokenBalanceBefore,
    lpTokenSupply: lpTokenSupplyBefore,
    previousDepth: previousDepthBefore,
  } = poolUserBalances[0];
  const {
    poolTokenBalances: [poolToken0AtaBalanceAfter, poolToken1AtaBalanceAfter],
    governanceFeeBalance: governanceFeeBalanceAfter,
    userTokenBalances: [userToken0AtaBalanceAfter, userToken1AtaBalanceAfter],
    userLpTokenBalance: userLpTokenBalanceAfter,
    lpTokenSupply: lpTokenSupplyAfter,
    previousDepth: previousDepthAfter,
  } = poolUserBalances[1];
  console.info(`
    ${logPrefix}
    poolToken0AtaBalance:
      before: ${poolToken0AtaBalanceBefore.toString()},
      after: ${poolToken0AtaBalanceAfter.toString()}
    poolToken1AtaBalance:
      before: ${poolToken1AtaBalanceBefore.toString()},
      after: ${poolToken1AtaBalanceAfter.toString()}
    governanceFeeBalance:
      before: ${governanceFeeBalanceBefore.toString()},
      after: ${governanceFeeBalanceAfter.toString()}
    userToken0AtaBalance:
      before: ${userToken0AtaBalanceBefore.toString()},
      after: ${userToken0AtaBalanceAfter.toString()}
    userToken1AtaBalance:
      before: ${userToken1AtaBalanceBefore.toString()},
      after: ${userToken1AtaBalanceAfter.toString()}
    userLpTokenBalance:
      before: ${userLpTokenBalanceBefore.toString()},
      after: ${userLpTokenBalanceAfter.toString()}
    lpTokenSupply:
      before: ${lpTokenSupplyBefore.toString()},
      after: ${lpTokenSupplyAfter.toString()},
    previousDepth:
      before: ${previousDepthBefore.toString()},
      after: ${previousDepthAfter.toString()}
  `);
}

export const getPoolTokenKeys = async (
  pool: web3.PublicKey,
  twoPoolProgram: Program<TwoPool>,
) => {
  const poolInfo = await twoPoolProgram.account.twoPool.fetch(pool);
  return poolInfo.tokenKeys;
};

export const getPoolTokenAccountBalances = async (
  pool: web3.PublicKey,
  twoPoolProgram: Program<TwoPool>,
  splToken: Program<SplToken>,
): Promise<readonly BN[]> => {
  const poolTokenKeys = await getPoolTokenKeys(pool, twoPoolProgram);
  const poolAtaData = await Promise.all(
    poolTokenKeys.map(async (tokenKey) => {
      return splToken.account.token.fetch(tokenKey);
    }),
  );
  return poolAtaData.map((ata) => ata.amount);
};

export const getOwnerAtaAddrsForPool = async (
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

export const getUserAtaDataForPool = async (
  user: web3.PublicKey,
  pool: web3.PublicKey,
  twoPoolProgram: Program<TwoPool>,
  splToken: Program<SplToken>,
) => {
  const userAtaAddrs = await getOwnerAtaAddrsForPool(
    pool,
    user,
    twoPoolProgram,
  );
  return await Promise.all(
    userAtaAddrs.map(async (ataAddr) => {
      return splToken.account.token.fetch(ataAddr);
    }),
  );
};

export const getNullableUserAtaDataForPool = async (
  user: web3.PublicKey,
  pool: web3.PublicKey,
  twoPoolProgram: Program<TwoPool>,
  splToken: Program<SplToken>,
) => {
  const userAtaAddrs = await getOwnerAtaAddrsForPool(
    pool,
    user,
    twoPoolProgram,
  );
  return await Promise.all(
    userAtaAddrs.map(async (ataAddr) => {
      const data = await splToken.account.token.fetchNullable(ataAddr);
      return {
        ataAddr,
        data,
      };
    }),
  );
};

export const getUserAtaBalancesForPool = async (
  user: web3.PublicKey,
  pool: web3.PublicKey,
  twoPoolProgram: Program<TwoPool>,
  splToken: Program<SplToken>,
) => {
  const userTokenAccounts = await getUserAtaDataForPool(
    user,
    pool,
    twoPoolProgram,
    splToken,
  );
  return userTokenAccounts.map((ata) => ata.amount);
};

export const getSwapAccounts = async (
  pool: web3.PublicKey,
  user: web3.PublicKey,
  userTransferAuthority: web3.PublicKey,
  twoPoolProgram: Program<TwoPool>,
) => {
  const poolData = await twoPoolProgram.account.twoPool.fetch(pool);
  const [userTokenAccount0, userTokenAccount1] = await getOwnerAtaAddrsForPool(
    pool,
    user,
    twoPoolProgram,
  );
  return {
    pool,
    poolTokenAccount0: poolData.tokenKeys[0],
    poolTokenAccount1: poolData.tokenKeys[1],
    lpMint: poolData.lpMintKey,
    governanceFee: poolData.governanceFeeKey,
    userTransferAuthority,
    userTokenAccount0,
    userTokenAccount1,
    tokenProgram: TOKEN_PROGRAM_ID,
  };
};

export const getAddOrRemoveAccounts = async (
  pool: web3.PublicKey,
  user: web3.PublicKey,
  userTransferAuthority: web3.PublicKey,
  twoPoolProgram: Program<TwoPool>,
) => {
  const swapAccounts = await getSwapAccounts(
    pool,
    user,
    userTransferAuthority,
    twoPoolProgram,
  );
  const userLpTokenAccount = await getAssociatedTokenAddress(
    swapAccounts.lpMint,
    user,
  );
  return {
    swap: { ...swapAccounts },
    userLpTokenAccount,
  };
};
