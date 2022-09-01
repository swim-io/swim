import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { Env } from "@swim-io/core";
import type { UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { useEnvironment } from "../../core/store";
import type { TokenAccount } from "../../models";
import { deserializeTokenAccount } from "../../models";

import { useSolanaConnection } from "./useSolanaConnection";
import { useSolanaWallet } from "./useSolanaWallet";

export const getSplTokenAccountsQueryKey = (
  env: Env,
  address: string | null,
) => ["tokenAccounts", env, address];

export const useSplTokenAccountsQuery = (
  owner?: string,
  options?: UseQueryOptions<readonly TokenAccount[], Error>,
): UseQueryResult<readonly TokenAccount[], Error> => {
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();
  const { address: userAddress } = useSolanaWallet();
  const address = owner ?? userAddress;

  const queryKey = getSplTokenAccountsQueryKey(env, address);
  const query = useQuery<readonly TokenAccount[], Error>(
    queryKey,
    async () => {
      if (address === null) {
        return [];
      }
      const { value: accounts } =
        await solanaConnection.getTokenAccountsByOwner(new PublicKey(address), {
          programId: TOKEN_PROGRAM_ID,
        });
      return accounts.map((account) =>
        deserializeTokenAccount(account.pubkey, account.account.data),
      );
    },
    options,
  );

  return query;
};
