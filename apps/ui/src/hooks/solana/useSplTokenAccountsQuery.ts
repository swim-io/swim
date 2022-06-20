import type { AccountInfo as TokenAccount } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import type { Env } from "../../config";
import { useSolanaConnection } from "../../contexts";
import { useEnvironment } from "../../core/store";
import { deserializeTokenAccount } from "../../models";

import { useSolanaWallet } from "./useSolanaWallet";

export const getSplTokenAccountsQueryKey = (
  env: Env,
  address: string | null,
) => ["tokenAccounts", env, address];

export const useSplTokenAccountsQuery = (
  owner?: string,
): UseQueryResult<readonly TokenAccount[], Error> => {
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();
  const { address: userAddress } = useSolanaWallet();
  const address = owner ?? userAddress;

  const queryKey = getSplTokenAccountsQueryKey(env, address);
  const query = useQuery<readonly TokenAccount[], Error>(queryKey, async () => {
    if (address === null) {
      return [];
    }
    const { value: accounts } = await solanaConnection.getTokenAccountsByOwner(
      new PublicKey(address),
      {
        programId: TOKEN_PROGRAM_ID,
      },
    );
    return accounts.map((account) =>
      deserializeTokenAccount(account.pubkey, account.account.data),
    );
  });

  return query;
};
