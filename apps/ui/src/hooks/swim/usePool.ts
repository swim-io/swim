import type {
  MintInfo,
  AccountInfo as TokenAccountInfo,
} from "@solana/spl-token";
import Decimal from "decimal.js";

import type { PoolSpec, TokenSpec } from "../../config";
import { EcosystemId, getSolanaTokenDetails } from "../../config";
import { useConfig, useSolanaWallet } from "../../contexts";
import type { SwimPoolState } from "../../models";
import { Amount, findTokenAccountForMint } from "../../models";
import { findOrThrow, isEachNotNull, isNotNull } from "../../utils";
import { useLiquidityQuery, useSplTokenAccountsQuery } from "../solana";

import { usePoolLpMint } from "./usePoolLpMint";
import { usePoolState } from "./usePoolState";

export interface PoolData {
  readonly spec: PoolSpec;
  readonly nativeEcosystems: readonly EcosystemId[];
  readonly lpToken: TokenSpec;
  readonly tokens: readonly TokenSpec[];
  readonly state: SwimPoolState | null;
  readonly poolLpMint: MintInfo | null;
  readonly poolTokenAccounts: readonly (TokenAccountInfo | null)[] | null;
  readonly userLpTokenAccount: TokenAccountInfo | null;
  readonly poolUsdValue: Decimal | null;
  readonly isPoolPaused: boolean;
}

export const usePool = (poolId: string): PoolData => {
  const { pools, tokens: allTokens } = useConfig();
  const { address: walletAddress } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();

  const poolSpec = pools.find((pool) => pool.id === poolId) ?? null;
  if (!poolSpec) {
    throw new Error(`Pool with id ${poolId} not found`);
  }

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

  const { data: poolState = null } = usePoolState(poolSpec);
  const { data: poolLpMint = null } = usePoolLpMint(poolSpec);

  const poolTokenAccountAddresses: readonly (string | null)[] = [
    ...poolSpec.tokenAccounts.values(),
  ];
  if (!isEachNotNull(poolTokenAccountAddresses)) {
    throw new Error("Could not find all pool tokens");
  }
  const { data: poolTokenAccounts = null } = useLiquidityQuery(
    poolTokenAccountAddresses,
  );
  const userLpTokenAccount =
    walletAddress !== null && splTokenAccounts !== null
      ? findTokenAccountForMint(
          lpTokenMintAddress,
          walletAddress,
          splTokenAccounts,
        )
      : null;

  // Approximate pool USD value
  const poolUsdValue =
    poolTokenAccounts && tokens.every((tokenSpec) => tokenSpec.isStablecoin)
      ? poolTokenAccounts.reduce((acc, account) => {
          const tokenSpec = tokens.find(
            (spec) =>
              spec.detailsByEcosystem.get(EcosystemId.Solana)?.address ===
              account.mint.toBase58(),
          );
          if (!tokenSpec) {
            throw new Error("Token spec not found");
          }
          return acc.add(
            Amount.fromU64(
              tokenSpec,
              account.amount,
              EcosystemId.Solana,
            ).toHuman(EcosystemId.Solana),
          );
        }, new Decimal(0))
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
    isPoolPaused: poolState?.isPaused ?? false,
  };
};
