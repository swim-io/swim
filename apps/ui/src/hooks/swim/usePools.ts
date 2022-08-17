import type { MintInfo, AccountInfo as TokenAccount } from "@solana/spl-token";
import { findOrThrow, isNotNull } from "@swim-io/utils";
import Decimal from "decimal.js";
import shallow from "zustand/shallow.js";

import type { PoolSpec, TokenSpec } from "../../config";
import { EcosystemId, getSolanaTokenDetails } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { PoolState } from "../../models";
import {
  findTokenAccountForMint,
  getPoolUsdValue,
  isEvmPoolState,
} from "../../models";
import {
  useSolanaLiquidityQueries,
  useSolanaWallet,
  useSplTokenAccountsQuery,
} from "../solana";

import { usePoolLpMints } from "./usePoolLpMint";
import { usePoolStateQueries } from "./usePoolStateQueries";

export interface PoolData {
  readonly spec: PoolSpec;
  readonly nativeEcosystems: readonly EcosystemId[];
  readonly lpToken: TokenSpec;
  readonly tokens: readonly TokenSpec[];
  readonly state: PoolState | null;
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
  poolState: PoolState | null = null,
  poolLpMint: MintInfo | null = null,
  poolTokenAccounts: readonly TokenAccount[] | null = null,
): PoolData => {
  const lpToken = findOrThrow(
    allTokens,
    (tokenSpec) => tokenSpec.id === poolSpec.lpToken,
  );

  const tokens = poolSpec.tokens.map(
    (tokenId) =>
      allTokens.find((tokenSpec) => tokenSpec.id === tokenId) ?? null,
  );
  if (!tokens.every(isNotNull)) {
    throw new Error("Pool token not found");
  }

  const nativeEcosystems = [
    ...new Set(tokens.map((tokenSpec) => tokenSpec.nativeEcosystemId)),
  ];

  if (poolState === null) {
    return {
      spec: poolSpec,
      nativeEcosystems,
      lpToken,
      tokens,
      state: poolState,
      poolLpMint,
      poolTokenAccounts,
      userLpTokenAccount: null,
      poolUsdValue: null,
      isPoolPaused: null,
    };
  }

  if (isEvmPoolState(poolState)) {
    return {
      spec: poolSpec,
      nativeEcosystems,
      lpToken,
      tokens,
      state: poolState,
      poolLpMint,
      poolTokenAccounts,
      userLpTokenAccount: null,
      poolUsdValue: Decimal.sum(...poolState.balances),
      isPoolPaused: poolState.isPaused,
    };
  }
  const lpTokenMintAddress = getSolanaTokenDetails(lpToken).address;
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
    state: poolState,
    poolLpMint,
    poolTokenAccounts,
    userLpTokenAccount,
    poolUsdValue,
    isPoolPaused: poolState.isPaused,
  };
};

export const usePools = (poolIds: readonly string[]): readonly PoolData[] => {
  const { pools, tokens: allTokens } = useEnvironment(selectConfig, shallow);
  const { address: walletAddress } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  const poolSpecs = poolIds.map((poolId) =>
    findOrThrow(pools, (pool) => pool.id === poolId),
  );
  const poolStates = usePoolStateQueries(poolSpecs);
  const lpMints = usePoolLpMints(poolSpecs);
  const liquidityQueries = useSolanaLiquidityQueries(
    poolSpecs.map((poolSpec) =>
      poolSpec.ecosystem === EcosystemId.Solana
        ? [...poolSpec.tokenAccounts.values()]
        : [],
    ),
  );

  return poolSpecs.map((poolSpec, i) =>
    constructPool(
      allTokens,
      poolSpec,
      walletAddress,
      splTokenAccounts,
      poolStates[i].data,
      lpMints[i].data,
      liquidityQueries[i].data,
    ),
  );
};

export const usePool = (poolId: string): PoolData => usePools([poolId])[0];
