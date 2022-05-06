import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import { useMemo } from "react";

import type { Env } from "../../config";
import { getSolanaTokenDetails } from "../../config";
import {
  useEnvironment,
  useSolanaConnection,
  useSolanaWallet,
} from "../../contexts";
import type { SolanaConnection, SolanaWalletAdapter } from "../../models";
import { SwimDefiInstructor, findTokenAccountForMint } from "../../models";
import { isEachNotNull } from "../../utils";
import { useSplTokenAccountsQuery } from "../solana";

import type { PoolData } from "./usePool";
import { usePools } from "./usePools";

const constructInstructor = (
  env: Env,
  solanaConnection: SolanaConnection,
  solanaWallet: SolanaWalletAdapter | null,
  splTokenAccounts: readonly TokenAccount[],
  {
    spec: { authority, contract, address: poolAddress },
    state: poolState,
    lpToken,
    tokens,
    poolTokenAccounts,
  }: PoolData,
): SwimDefiInstructor | null => {
  const walletAddress = solanaWallet?.publicKey?.toBase58() ?? null;
  if (poolState === null || solanaWallet === null || walletAddress === null) {
    return null;
  }
  const lpTokenMintAddress = getSolanaTokenDetails(lpToken).address;
  const tokenMintAddresses = tokens.map(
    (tokenSpec) => getSolanaTokenDetails(tokenSpec).address,
  );
  const poolTokenAccountAddresses =
    poolTokenAccounts?.map((account) =>
      account ? account.address.toBase58() : null,
    ) ?? null;
  const userLpAccount = findTokenAccountForMint(
    lpTokenMintAddress,
    walletAddress,
    splTokenAccounts,
  );
  const userTokenAccounts = tokenMintAddresses.map((mintAddress) =>
    findTokenAccountForMint(mintAddress, walletAddress, splTokenAccounts),
  );

  return poolTokenAccountAddresses !== null &&
    isEachNotNull(poolTokenAccountAddresses)
    ? new SwimDefiInstructor(
        env,
        solanaConnection,
        solanaWallet,
        contract,
        poolAddress,
        authority,
        lpTokenMintAddress,
        poolState.governanceFeeKey.toBase58(),
        tokenMintAddresses,
        poolTokenAccountAddresses,
        userLpAccount?.address.toBase58(),
        userTokenAccounts.map((t) => t?.address.toBase58() ?? null),
      )
    : null;
};

export const useInstructors = (
  poolIds: readonly string[],
): readonly (SwimDefiInstructor | null)[] => {
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();
  const { wallet: solanaWallet } = useSolanaWallet();
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();

  const pools = usePools(poolIds);

  return useMemo(
    () =>
      pools.map((pool) =>
        constructInstructor(
          env,
          solanaConnection,
          solanaWallet,
          splTokenAccounts,
          pool,
        ),
      ),
    [env, pools, solanaConnection, solanaWallet, splTokenAccounts],
  );
};
