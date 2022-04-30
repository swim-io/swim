import type { AccountInfo as TokenAccountInfo } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import {
  useEnvironment,
  useSolanaConnection,
  useSolanaWallet,
} from "../../contexts";
import { deserializeTokenAccount } from "../../models";

export const useSplTokenAccountsQuery = (
  owner?: string,
): UseQueryResult<readonly TokenAccountInfo[], Error> => {
  const { env } = useEnvironment();
  const solanaConnection = useSolanaConnection();
  const { address: userAddress } = useSolanaWallet();
  const address = owner ?? userAddress;

  const queryKey = ["tokenAccounts", env, address];
  const query = useQuery<readonly TokenAccountInfo[], Error>(
    queryKey,
    async () => {
      if (!address) {
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
  );

  return query;
};
