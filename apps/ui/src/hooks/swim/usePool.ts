import type {
  MintInfo,
  AccountInfo as TokenAccountInfo,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import Decimal from "decimal.js";
import { useQuery } from "react-query";

import type { PoolSpec, TokenSpec } from "../../config";
import { EcosystemId, getSolanaTokenDetails } from "../../config";
import {
  useConfig,
  useEnvironment,
  useSolanaConnection,
  useSolanaWallet,
} from "../../contexts";
import type { SwimPoolState } from "../../models";
import {
  Amount,
  deserializeMint,
  deserializeSwimPool,
  findTokenAccountForMint,
} from "../../models";
import { isEachNotNull, isNotNull } from "../../utils";
import { useLiquidityQuery, useSplTokenAccountsQuery } from "../solana";

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
  const { env } = useEnvironment();
  const { pools, tokens: allTokens } = useConfig();
  const solanaConnection = useSolanaConnection();
  const { address: walletAddress } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();

  const poolSpec = pools.find((pool) => pool.id === poolId) ?? null;
  if (!poolSpec) {
    throw new Error(`Pool with id ${poolId} not found`);
  }

  const lpToken =
    allTokens.find((tokenSpec) => tokenSpec.id === poolSpec.lpToken) ?? null;
  if (!isNotNull(lpToken)) {
    throw new Error("Pool LP token not found");
  }
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

  const numberOfTokens = poolSpec.tokenAccounts.size;
  const { data: poolState = null } = useQuery<SwimPoolState | null, Error>(
    ["poolState", env, poolSpec.address],
    async () => {
      const accountInfo = await solanaConnection.getAccountInfo(
        new PublicKey(poolSpec.address),
      );
      return accountInfo
        ? deserializeSwimPool(numberOfTokens, accountInfo.data)
        : null;
    },
  );

  const { data: poolLpMint = null } = useQuery<MintInfo | null, Error>(
    ["poolLpMintAccount", env, poolSpec.id],
    async () => {
      const account = await solanaConnection.getAccountInfo(
        new PublicKey(lpTokenMintAddress),
      );
      return account ? deserializeMint(account.data) : null;
    },
  );

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
