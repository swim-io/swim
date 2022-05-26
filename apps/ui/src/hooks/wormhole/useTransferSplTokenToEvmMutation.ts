import type { UseMutationResult } from "react-query";
import { useMutation, useQueryClient } from "react-query";

import type { EvmEcosystemId, TokenSpec } from "../../config";
import { Protocol, getSolanaTokenDetails } from "../../config";
import { useEvmConnection, useSolanaConnection } from "../../contexts";
import { useEnvironment } from "../../core/store";
import type { Amount, Tx, WormholeTransfer } from "../../models";
import {
  findOrCreateSplTokenAccount,
  transferSplTokensToEvm,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useSplTokenAccountsQuery } from "../solana";

export interface TransferSplTokenToEvmMutationVariables {
  readonly interactionId: string;
  readonly transferAmount: Amount;
}

export const useTransferSplTokenToEvmMutation = (
  ecosystemId: EvmEcosystemId,
  token: TokenSpec,
): UseMutationResult<
  readonly Tx[] | void,
  Error,
  TransferSplTokenToEvmMutationVariables
> => {
  const {
    env,
    config: { chains, wormhole },
  } = useEnvironment();
  const queryClient = useQueryClient();
  const evmChain =
    chains[Protocol.Evm].find((chain) => chain.ecosystem === ecosystemId) ??
    null;
  const [solanaChain] = chains[Protocol.Solana];
  const evmConnection = useEvmConnection(ecosystemId);
  const solanaConnection = useSolanaConnection();
  const wallets = useWallets();
  const solanaWallet = wallets.solana.wallet;
  const evmWallet = wallets[ecosystemId].wallet;
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();

  const solanaTokenDetails = getSolanaTokenDetails(token);

  return useMutation(
    async ({
      interactionId,
      transferAmount,
    }: TransferSplTokenToEvmMutationVariables): Promise<
      readonly Tx[] | void
    > => {
      if (!solanaWallet) {
        throw new Error("No Solana wallet connected");
      }
      if (evmChain === null) {
        throw new Error("Missing EVM chain");
      }
      if (evmWallet === null) {
        throw new Error("Missing EVM wallet");
      }
      if (splTokenAccounts === null) {
        throw new Error("Missing SPL token accounts");
      }

      const splTokenAccount = await findOrCreateSplTokenAccount(
        env,
        solanaConnection,
        solanaWallet,
        queryClient,
        solanaTokenDetails.address,
        splTokenAccounts,
      );

      const transfer: WormholeTransfer = {
        interactionId,
        amount: transferAmount,
        evmChain,
        evmWallet,
        evmConnection,
        fromTokenDetails: solanaTokenDetails,
        splTokenAccountAddress: splTokenAccount.address.toBase58(),
        token,
        // TODO: add this?
        existingTxs: [],
      };
      const results = await transferSplTokensToEvm(
        solanaConnection,
        wormhole,
        solanaChain.wormhole,
        solanaWallet,
        [transfer],
      );
      return results[token.id];
    },
  );
};
