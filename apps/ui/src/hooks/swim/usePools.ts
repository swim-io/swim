import type { MintInfo, AccountInfo as TokenAccount } from "@solana/spl-token";
import { useMemo } from "react";
import type { UseQueryResult } from "react-query";

import type { PoolSpec, TokenSpec } from "../../config";
import { getSolanaTokenDetails } from "../../config";
import { useConfig, useSolanaWallet } from "../../contexts";
import type { SwimPoolState } from "../../models";
import { findTokenAccountForMint } from "../../models";
import { findOrThrow, isNotNull } from "../../utils";
import { useLiquidityQueries, useSplTokenAccountsQuery } from "../solana";

import type { PoolData } from "./usePool";
import { usePoolLpMints } from "./usePoolLpMint";
import { usePoolStates } from "./usePoolState";

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

  const tokens = [...poolSpec.tokenAccounts.keys()].map(
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

  return {
    spec: poolSpec,
    nativeEcosystems,
    lpToken,
    tokens,
    state: poolState ?? null,
    poolLpMint,
    poolTokenAccounts,
    userLpTokenAccount,
    // TODO: Add this?
    poolUsdValue: null,
    isPoolPaused: poolState?.isPaused ?? false,
  };
};

export const usePools = (poolIds: readonly string[]): readonly PoolData[] => {
  const { pools, tokens: allTokens } = useConfig();
  const { address: walletAddress } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  const poolSpecs = poolIds.map((poolId) =>
    findOrThrow(pools, (pool) => pool.id === poolId),
  );
  const poolStates = usePoolStates(poolSpecs);
  const lpMints = usePoolLpMints(poolSpecs);
  const liquidityQueries = useLiquidityQueries(
    poolSpecs.map((poolSpec) => [...poolSpec.tokenAccounts.values()]),
  );

  return useMemo(
    () =>
      poolSpecs.map((poolSpec, i) =>
        constructPool(
          allTokens,
          poolSpec,
          walletAddress,
          splTokenAccounts,
          poolStates[i],
          lpMints[i],
          liquidityQueries[i],
        ),
      ),
    [
      allTokens,
      liquidityQueries,
      lpMints,
      poolSpecs,
      poolStates,
      splTokenAccounts,
      walletAddress,
    ],
  );
};
