import { useMemo } from "react";

import { getSolanaTokenDetails } from "../../config";
import {
  useEnvironment,
  useSolanaConnection,
  useSolanaWallet,
} from "../../contexts";
import { SwimDefiInstructor, findTokenAccountForMint } from "../../models";
import { isEachNotNull } from "../../utils";
import { useSplTokenAccountsQuery } from "../solana";

import { usePools } from "./usePools";

export const useInstructors = (
  poolIds: readonly string[],
): readonly (SwimDefiInstructor | null)[] => {
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();
  const { address: walletAddress, wallet: solanaWallet } = useSolanaWallet();
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();

  const pools = usePools(poolIds);

  return useMemo(
    () =>
      pools.map(
        ({
          spec: { authority, contract, address: poolAddress },
          state: poolState,
          lpToken,
          tokens,
          poolTokenAccounts,
        }) => {
          if (poolState === null) {
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
          const userLpAccount =
            walletAddress !== null
              ? findTokenAccountForMint(
                  lpTokenMintAddress,
                  walletAddress,
                  splTokenAccounts,
                )
              : null;
          const userTokenAccounts =
            walletAddress !== null
              ? tokenMintAddresses.map((mintAddress) =>
                  findTokenAccountForMint(
                    mintAddress,
                    walletAddress,
                    splTokenAccounts,
                  ),
                )
              : null;

          return poolTokenAccountAddresses !== null &&
            isEachNotNull(poolTokenAccountAddresses) &&
            solanaWallet
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
                userTokenAccounts?.map((t) => t?.address.toBase58() ?? null),
              )
            : null;
        },
      ),
    [
      env,
      pools,
      solanaConnection,
      solanaWallet,
      splTokenAccounts,
      walletAddress,
    ],
  );
};
