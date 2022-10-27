import { PublicKey } from "@solana/web3.js";
import type { PoolState as BasePoolState } from "@swim-io/core";
import type { EvmEcosystemId } from "@swim-io/evm";
import { isEvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID, isSolanaTx } from "@swim-io/solana";
import type {
  SolanaPoolState as BaseSolanaPoolState,
  SolanaClient,
  SolanaEcosystemId,
  SolanaTx,
} from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import { findOrThrow } from "@swim-io/utils";

import type {
  Config,
  PoolSpec,
  SolanaPoolSpec,
  TokenConfig,
} from "../../config";
import type { Tx } from "../crossEcosystem";
import { deserializeLegacySolanaPoolState } from "../solana";

export interface SolanaPoolState
  extends Omit<BaseSolanaPoolState, "balances" | "pauseKey" | "totalLpSupply"> {
  readonly ecosystem: SolanaEcosystemId;
}

export interface EvmPoolState extends BasePoolState {
  readonly ecosystem: EvmEcosystemId;
}

export type PoolState = SolanaPoolState | EvmPoolState;

export type TokensByPoolId = ReadonlyRecord<
  string, // Pool ID
  {
    readonly tokens: readonly TokenConfig[];
    readonly lpToken: TokenConfig;
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
  const { message } = tx.original.transaction;
  return message.instructions.some(
    (ix) => ix.programId.toBase58() === poolContractAddress,
  );
};

export const isSolanaPool = (pool: PoolSpec): pool is SolanaPoolSpec =>
  pool.ecosystem === SOLANA_ECOSYSTEM_ID;

export const getLegacySolanaPoolState = async (
  solanaClient: SolanaClient,
  poolSpec: SolanaPoolSpec,
): Promise<SolanaPoolState | null> => {
  if (!poolSpec.isLegacyPool) {
    throw new Error("Invalid pool version");
  }
  const numberOfTokens = poolSpec.tokens.length;
  const accountInfo = await solanaClient.connection.getAccountInfo(
    new PublicKey(poolSpec.address),
  );
  if (accountInfo === null) {
    return null;
  }
  const deserialized = deserializeLegacySolanaPoolState(
    numberOfTokens,
    accountInfo.data,
  );
  return {
    ...deserialized,
    governanceFee: { value: deserialized.governanceFee },
    lpFee: { value: deserialized.lpFee },
    preparedGovernanceFee: { value: deserialized.preparedGovernanceFee },
    preparedLpFee: { value: deserialized.preparedLpFee },
  };
};

export const isEvmPoolState = (
  poolState: PoolState | null,
): poolState is EvmPoolState =>
  poolState !== null && isEvmEcosystemId(poolState.ecosystem);

export const isSolanaPoolState = (
  poolState: PoolState,
): poolState is SolanaPoolState => poolState.ecosystem === SOLANA_ECOSYSTEM_ID;
