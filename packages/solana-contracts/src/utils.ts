import fs from "fs";

import type { BN, Program, SplToken, web3 } from "@project-serum/anchor";

import type { TwoPool } from "./artifacts/two_pool";
// import TwoPoolIDL from "./artifacts/two_pool.json";

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return value.toString();
  }
  return value;
};

export const formatAmpFactor = (ampFactor: any) => {
  return {
    initialValue: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      value: ampFactor.initialValue.value.toString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      decimals: ampFactor.initialValue.decimals,
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    initialTs: ampFactor.initialTs.toString(),
    targetValue: {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      value: ampFactor.targetValue.value.toString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      decimals: ampFactor.targetValue.decimals,
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
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
  amounts: ReadonlyArray<BN>,
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
    tokenAccounts.map((tokenAccount) => {
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
