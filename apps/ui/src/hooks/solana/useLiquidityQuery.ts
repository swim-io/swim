import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { useEnvironment, useSolanaConnection } from "../../contexts";
import {
  deserializeTokenAccount,
  getMultipleSolanaAccounts,
} from "../../models";

export const useLiquidityQuery = (
  tokenAccountAddresses: readonly string[],
): UseQueryResult<readonly TokenAccountInfo[] | null, Error> => {
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();
  return useQuery<readonly TokenAccountInfo[] | null, Error>(
    ["liquidity", env, tokenAccountAddresses.join("")],
    async () => {
      if (tokenAccountAddresses.length === 0) {
        return [];
      }

      const { keys: foundAddresses, array: tokenAccounts } =
        await getMultipleSolanaAccounts(
          solanaConnection,
          tokenAccountAddresses,
        );

      return tokenAccounts.map((account, i) =>
        deserializeTokenAccount(new PublicKey(foundAddresses[i]), account.data),
      );
    },
  );
};
