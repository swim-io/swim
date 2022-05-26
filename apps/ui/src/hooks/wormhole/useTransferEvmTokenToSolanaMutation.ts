import type { UseMutationResult } from "react-query";
import { useMutation, useQueryClient } from "react-query";

import type { EvmEcosystemId, TokenSpec } from "../../config";
import { Protocol, getSolanaTokenDetails } from "../../config";
import { useEvmConnection, useSolanaConnection } from "../../contexts";
import { useEnvironment } from "../../core/store";
import type { Amount, Tx, WormholeTransfer } from "../../models";
import {
  findOrCreateSplTokenAccount,
  transferEvmTokensToSolana,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useSplTokenAccountsQuery } from "../solana";

export interface TransferErc20TokenToSolanaMutationVariables {
  readonly interactionId: string;
  readonly transferAmount: Amount;
}

export const useTransferEvmTokenToSolanaMutation = (
  ecosystemId: EvmEcosystemId,
  token: TokenSpec,
): UseMutationResult<
  readonly Tx[] | void,
  Error,
  TransferErc20TokenToSolanaMutationVariables
> => {
  const {
    env,
    config: { chains, wormhole },
  } = useEnvironment();
  const queryClient = useQueryClient();
  const splTokenContractAddress = getSolanaTokenDetails(token).address;
  const [solanaChain] = chains[Protocol.Solana];
  const evmChain =
    chains[Protocol.Evm].find((chain) => chain.ecosystem === ecosystemId) ??
    null;
  const evmConnection = useEvmConnection(ecosystemId);
  const solanaConnection = useSolanaConnection();
  const wallets = useWallets();
  const solanaWallet = wallets.solana.wallet;
  const evmWallet = wallets[ecosystemId].wallet;
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();

  return useMutation(
    async ({
      interactionId,
      transferAmount,
    }: TransferErc20TokenToSolanaMutationVariables): Promise<
      readonly Tx[] | void
    > => {
      if (solanaWallet === null) {
        throw new Error("Missing Solana wallet");
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

      const fromTokenDetails =
        token.detailsByEcosystem.get(ecosystemId) ?? null;
      // This hook is only being used because of hook rules
      if (fromTokenDetails === null) {
        return;
      }

      const splTokenAccount = await findOrCreateSplTokenAccount(
        env,
        solanaConnection,
        solanaWallet,
        queryClient,
        splTokenContractAddress,
        splTokenAccounts,
      );

      const transfer: WormholeTransfer = {
        interactionId,
        token,
        amount: transferAmount,
        splTokenAccountAddress: splTokenAccount.address.toBase58(),
        evmChain,
        evmWallet,
        evmConnection,
        fromTokenDetails,
        // TODO: add this?
        existingTxs: [],
      };
      const results = await transferEvmTokensToSolana(
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
