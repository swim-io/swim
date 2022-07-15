import { PublicKey } from "@solana/web3.js";
import type { SolanaTx } from "@swim-io/plugin-ecosystem-solana";
import {
  SOLANA_ECOSYSTEM_ID,
  isSolanaTx,
} from "@swim-io/plugin-ecosystem-solana";
import type { SwimPoolState } from "@swim-io/solana-types";
import { deserializeSwimPool } from "@swim-io/solana-types";

import type {
  Config,
  PoolSpec,
  SolanaPoolSpec,
  TokenSpec,
  Tx,
} from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { findOrThrow } from "../../utils";
import type { SolanaConnection } from "../solana";

export type TokensByPoolId = ReadonlyRecord<
  string, // Pool ID
  {
    readonly tokens: readonly TokenSpec[];
    readonly lpToken: TokenSpec;
  }
>;

export const getTokensByPool = ({ pools, tokens }: Config): TokensByPoolId =>
  pools.reduce(
    (accumulator, { id: poolId, tokens: poolTokens, lpToken }) => ({
      ...accumulator,
      [poolId]: {
        tokens: poolTokens.map((tokenId) =>
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
  const numberOfTokens = poolSpec.tokens.length;
  const accountInfo = await solanaConnection.getAccountInfo(
    new PublicKey(poolSpec.address),
  );
  return accountInfo
    ? deserializeSwimPool(numberOfTokens, accountInfo.data)
    : null;
};

export const isSolanaPool = (pool: PoolSpec): pool is SolanaPoolSpec =>
  pool.ecosystem === SOLANA_ECOSYSTEM_ID;
