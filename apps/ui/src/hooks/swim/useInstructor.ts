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

import { usePool } from "./usePool";

export const useInstructor = (poolId: string): SwimDefiInstructor | null => {
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();
  const { address: walletAddress, wallet: solanaWallet } = useSolanaWallet();

  const {
    spec: { authority, contract, address: poolAddress },
    state: poolState,
    lpToken,
    tokens,
    poolTokenAccounts,
  } = usePool(poolId);

  const lpTokenMintAddress = useMemo(
    () => getSolanaTokenDetails(lpToken).address,
    [lpToken],
  );
  const tokenMintAddresses = useMemo(
    () => tokens.map((tokenSpec) => getSolanaTokenDetails(tokenSpec).address),
    [tokens],
  );

  const poolTokenAccountAddresses = useMemo(
    () =>
      poolTokenAccounts?.map((account) =>
        account ? account.address.toBase58() : null,
      ) ?? null,
    [poolTokenAccounts],
  );

  // optional user accounts
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const userLpAccount = useMemo(
    () =>
      walletAddress !== null
        ? findTokenAccountForMint(
            lpTokenMintAddress,
            walletAddress,
            splTokenAccounts,
          )
        : null,
    [lpTokenMintAddress, walletAddress, splTokenAccounts],
  );

  const userTokenAccounts = useMemo(
    () =>
      walletAddress !== null
        ? tokenMintAddresses.map((mintAddress) =>
            findTokenAccountForMint(
              mintAddress,
              walletAddress,
              splTokenAccounts,
            ),
          )
        : null,
    [tokenMintAddresses, walletAddress, splTokenAccounts],
  );

  // create Instructor
  return useMemo(
    () =>
      authority &&
      poolState?.governanceKey &&
      poolTokenAccountAddresses !== null &&
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
        : null,
    [
      env,
      solanaConnection,
      solanaWallet,
      contract,
      lpTokenMintAddress,
      authority,
      poolAddress,
      poolState?.governanceKey,
      poolState?.governanceFeeKey,
      tokenMintAddresses,
      poolTokenAccountAddresses,
      userLpAccount,
      userTokenAccounts,
    ],
  );
};
