import fs from "fs";

import type { Program, SplToken, web3 } from "@project-serum/anchor";
import type * as anchor from "@project-serum/anchor";

import type { TwoPool } from "./artifacts/two_pool";
import TwoPoolIDL from "./artifacts/two_pool.json";

export const twoPoolToString = async (
  program: Program<TwoPool>,
  twoPoolKey: web3.PublicKey,
): Promise<string> => {
  const twoPool = await program.account.twoPool.fetch(twoPoolKey);
  const twoPoolFixed = {
    key: twoPoolKey.toString(),
    ...twoPool,
    ampFactor: formatAmpFactor(twoPool.ampFactor),
    previousDepth: twoPool.previousDepth.toString(),
  };

  return JSON.stringify(twoPoolFixed, null, 2);
};
export const twoPoolReplacer = (key: string, value: any) => {
  if (key === "ampFactor") {
    return formatAmpFactor(value);
  } else if (key === "previousDepth") {
    return value.toString();
  }
  return value;
};

export const formatAmpFactor = (ampFactor: any) => {
  return {
    initialValue: {
      value: ampFactor.initialValue.value.toString(),
      decimals: ampFactor.initialValue.decimals,
    },
    initialTs: ampFactor.initialTs.toString(),
    targetValue: {
      value: ampFactor.targetValue.value.toString(),
      decimals: ampFactor.targetValue.decimals,
    },
    targetTs: ampFactor.targetTs.toString(),
  };
};

export const writePoolStateToFile = (
  poolStatePath: string,
  poolStateStr: string,
) => {
  fs.writeFileSync(poolStatePath, poolStateStr);
};

export const getApproveAndRevokeIxs = async (
  splToken: Program<SplToken>,
  tokenAccounts: ReadonlyArray<web3.PublicKey>,
  amounts: ReadonlyArray<anchor.BN>,
  delegate: web3.PublicKey,
  authority: web3.Keypair,
): Promise<ReadonlyArray<ReadonlyArray<web3.TransactionInstruction>>> => {
  const approveIxs = await Promise.all(
    tokenAccounts.map((tokenAccount, i) => {
      return splToken.methods
        .approve(amounts[i])
        .accounts({
          source: tokenAccount,
          delegate,
          authority: authority.publicKey,
        })
        .signers([authority])
        .instruction();
    }),
  );
  const revokeIxs = await Promise.all(
    tokenAccounts.map((tokenAccount, i) => {
      return splToken.methods
        .revoke()
        .accounts({
          source: tokenAccount,
          authority: authority.publicKey,
        })
        .signers([authority])
        .instruction();
    }),
  );
  return [approveIxs, revokeIxs];
};
