import type { MintInfo, AccountInfo as TokenAccount } from "@solana/spl-token";
import type { SwimPoolState } from "@swim-io/solana-types";
import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import shallow from "zustand/shallow.js";

import type { PoolSpec, SolanaPoolSpec, TokenSpec } from "../../config";
import { EcosystemId, getSolanaTokenDetails } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { findTokenAccountForMint, getPoolUsdValue } from "../../models";
import { findOrThrow, isNotNull } from "../../utils";
import {
  useLiquidityQueries,
  useSolanaWallet,
  useSplTokenAccountsQuery,
} from "../solana";

import { usePoolLpMints } from "./usePoolLpMint";
import { usePoolStates } from "./usePoolState";

export interface PoolData {
  readonly spec: PoolSpec;
  readonly nativeEcosystems: readonly EcosystemId[];
  readonly lpToken: TokenSpec;
  readonly tokens: readonly TokenSpec[];
  readonly state: SwimPoolState | null;
  readonly poolLpMint: MintInfo | null;
  readonly poolTokenAccounts: readonly (TokenAccount | null)[] | null;
  readonly userLpTokenAccount: TokenAccount | null;
  readonly poolUsdValue: Decimal | null;
  readonly isPoolPaused: boolean | null;
}

const constructPool = (
  allTokens: readonly TokenSpec[],
  poolSpec: PoolSpec,
  walletAddress: string | null,
  splTokenAccounts: readonly TokenAccount[] | null,
  { data: poolState = null }: UseQueryResult<SwimPoolState | null, Error>,
  { data: poolLpMint = null }: UseQueryResult<MintInfo | null, Error>,
  {
    data: poolTokenAccounts = null,
  }: UseQueryResult<readonly TokenAccount[] | null, Error>,
): PoolData => {
  const lpToken = findOrThrow(
    allTokens,
    (tokenSpec) => tokenSpec.id === poolSpec.lpToken,
  );
  const lpTokenMintAddress = getSolanaTokenDetails(lpToken).address;

  const tokens = poolSpec.tokens.map(
    (tokenId) =>
      allTokens.find((tokenSpec) => tokenSpec.id === tokenId) ?? null,
  );
  if (!tokens.every(isNotNull)) {
    throw new Error("Pool token not found");
  }

  const nativeEcosystems = [
    ...new Set(tokens.map((tokenSpec) => tokenSpec.nativeEcosystem)),
  ];

  const userLpTokenAccount =
    walletAddress !== null && splTokenAccounts !== null
      ? findTokenAccountForMint(
          lpTokenMintAddress,
          walletAddress,
          splTokenAccounts,
        )
      : null;

  const poolUsdValue =
    poolTokenAccounts !== null
      ? getPoolUsdValue(tokens, poolTokenAccounts)
      : null;

  return {
    spec: poolSpec,
    nativeEcosystems,
    lpToken,
    tokens,
    state: poolState ?? null,
    poolLpMint,
    poolTokenAccounts,
    userLpTokenAccount,
    poolUsdValue,
    isPoolPaused: poolState?.isPaused ?? null,
  };
};

export const usePools = (poolIds: readonly string[]): readonly PoolData[] => {
  const { pools, tokens: allTokens } = useEnvironment(selectConfig, shallow);
  const { address: walletAddress } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  const poolSpecs = poolIds.map((poolId) =>
    findOrThrow(pools, (pool) => pool.id === poolId),
  );
  const poolStates = usePoolStates(poolSpecs);
  const lpMints = usePoolLpMints(poolSpecs);
  const liquidityQueries = useLiquidityQueries(
    poolSpecs
      .filter(
        (poolSpec): poolSpec is SolanaPoolSpec =>
          poolSpec.ecosystem === SOLANA_ECOSYSTEM_ID,
      )
      .map((poolSpec) => [...poolSpec.tokenAccounts.values()]),
  );

  return poolSpecs.map((poolSpec, i) =>
    constructPool(
      allTokens,
      poolSpec,
      walletAddress,
      splTokenAccounts,
      poolStates[i],
      lpMints[i],
      liquidityQueries[i],
    ),
  );
};

export const usePool = (poolId: string): PoolData => usePools([poolId])[0];
