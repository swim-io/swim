import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { Env } from "@swim-io/core";
import type { TokenAccount } from "@swim-io/solana";
import { deserializeTokenAccount } from "@swim-io/solana";
import type { UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { useEnvironment } from "../../core/store";

import { useSolanaClient } from "./useSolanaClient";
import { useSolanaWallet } from "./useSolanaWallet";

export const getSplTokenAccountsQueryKey = (
  env: Env,
  address: string | null,
) => [env, "tokenAccounts", address];

export const useSplTokenAccountsQuery = (
  owner?: string,
  options?: UseQueryOptions<readonly TokenAccount[], Error>,
): UseQueryResult<readonly TokenAccount[], Error> => {
  const { env } = useEnvironment();
  const solanaClient = useSolanaClient();
  const { address: userAddress } = useSolanaWallet();
  const address = owner ?? userAddress;

  const queryKey = getSplTokenAccountsQueryKey(env, address);
  return useQuery<readonly TokenAccount[], Error>(
    queryKey,
    async () => {
      if (address === null) {
        return [];
      }
      const { value: accounts } =
        await solanaClient.connection.getTokenAccountsByOwner(
          new PublicKey(address),
          {
            programId: TOKEN_PROGRAM_ID,
          },
        );
      return accounts.map((account) =>
        deserializeTokenAccount(account.pubkey, account.account.data),
      );
    },
    options,
  );
};
