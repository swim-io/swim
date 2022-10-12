import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { Env } from "@swim-io/core";
import type { TokenAccount } from "@swim-io/solana";
import { deserializeTokenAccount } from "@swim-io/solana";
import { useState } from "react";
import type { UseQueryOptions, UseQueryResult } from "react-query";
import { useQuery, useQueryClient } from "react-query";

import { useEnvironment } from "../../core/store";

import { useSolanaClient } from "./useSolanaClient";
import { useSolanaAccountChangeListener } from "./useSolanaConnectionListener";
import { useSolanaWallet } from "./useSolanaWallet";

export const getSplTokenAccountsQueryKey = (
  env: Env,
  address: string | null,
) => [env, "tokenAccounts", address];

type ResultData = readonly TokenAccount[];

export const useSplTokenAccountsQuery = (
  owner?: string,
  options?: Omit<UseQueryOptions<ResultData, Error>, "staleTime">,
): UseQueryResult<ResultData, Error> => {
  const { env } = useEnvironment();
  const queryClient = useQueryClient();
  const solanaClient = useSolanaClient();
  const { address: userAddress } = useSolanaWallet();
  const address = owner ?? userAddress;

  const [tokenAccountMapping, setTokenAccountMapping] = useState(
    new Map<string, readonly string[]>(),
  );

  useSolanaAccountChangeListener(
    Array.from(tokenAccountMapping.values())
      .flat()
      .map((tokenAccountAddress) => ({ key: tokenAccountAddress })),
    (updatedTokenAccountAddress, accountInfo) => {
      const updatedEntries = Array.from(tokenAccountMapping.entries()).filter(
        ([, tokenAccountAddresses]) => {
          return tokenAccountAddresses.includes(updatedTokenAccountAddress);
        },
      );
      if (updatedEntries.length === 0) return;

      const newTokenAccount = deserializeTokenAccount(
        new PublicKey(updatedTokenAccountAddress),
        accountInfo.data,
      );

      for (const [ownerAddress] of updatedEntries) {
        queryClient.setQueryData<ResultData>(
          getSplTokenAccountsQueryKey(env, ownerAddress),
          (prevQueryData) => {
            if (!prevQueryData) return [];

            return prevQueryData.map((prevTokenAccount) => {
              if (
                prevTokenAccount.address.toString() ===
                updatedTokenAccountAddress
              ) {
                return newTokenAccount;
              }
              return prevTokenAccount;
            });
          },
        );
      }
    },
  );

  const queryKey = getSplTokenAccountsQueryKey(env, address);
  return useQuery<ResultData, Error>(
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

      setTokenAccountMapping((prevTokenAccountMapping) => {
        const newTokenAccountMapping = new Map(prevTokenAccountMapping);
        newTokenAccountMapping.set(
          address,
          accounts.map((account) => account.pubkey.toString()),
        );
        return newTokenAccountMapping;
      });

      return accounts.map((account) => {
        return deserializeTokenAccount(account.pubkey, account.account.data);
      });
    },
    {
      ...options,
      // rely on websocket to update outdated data
      staleTime: Infinity,
    },
  );
};
