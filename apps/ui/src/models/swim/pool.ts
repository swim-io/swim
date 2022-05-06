import { PublicKey } from "@solana/web3.js";

import type { Config, PoolSpec, TokenSpec } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { findOrThrow } from "../../utils";
import type { SolanaTx, Tx } from "../crossEcosystem";
import { isSolanaTx } from "../crossEcosystem";
import type { SolanaConnection } from "../solana";

import type { SwimPoolState } from "./poolState";
import { deserializeSwimPool } from "./poolState";

export type TokensByPoolId = ReadonlyRecord<
  string, // Pool ID
  {
    readonly tokens: readonly TokenSpec[];
    readonly lpToken: TokenSpec;
  }
>;

export const getTokensByPool = ({ pools, tokens }: Config): TokensByPoolId =>
  pools.reduce(
    (accumulator, { id: poolId, tokenAccounts, lpToken }) => ({
      ...accumulator,
      [poolId]: {
        tokens: [...tokenAccounts.keys()].map((tokenId) =>
          findOrThrow(tokens, (token) => token.id === tokenId),
        ),
        lpToken: findOrThrow(tokens, (token) => token.id === lpToken),
      },
    }),
    {},
  );

export const isPoolTx = (
  poolContractAddress: string,
  tx: Tx,
): tx is SolanaTx => {
  if (!isSolanaTx(tx)) {
    return false;
  }
  const { message } = tx.parsedTx.transaction;
  return message.instructions.some(
    (ix) => ix.programId.toBase58() === poolContractAddress,
  );
};

export const getPoolState = async (
  solanaConnection: SolanaConnection,
  poolSpec: PoolSpec,
): Promise<SwimPoolState | null> => {
  const numberOfTokens = poolSpec.tokenAccounts.size;
  const accountInfo = await solanaConnection.getAccountInfo(
    new PublicKey(poolSpec.address),
  );
  return accountInfo
    ? deserializeSwimPool(numberOfTokens, accountInfo.data)
    : null;
};
