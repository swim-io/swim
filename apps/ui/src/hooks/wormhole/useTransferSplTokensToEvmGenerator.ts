import {
  Protocol,
  getSolanaTokenDetails,
  isEvmEcosystemId,
} from "../../config";
import {
  useConfig,
  useEvmConnections,
  useSolanaConnection,
} from "../../contexts";
import type {
  TransfersWithExistingTxs,
  TxWithTokenId,
  WithSplTokenAccounts,
  WormholeTransfer,
} from "../../models";
import {
  findTokenAccountForMint,
  generateTransferSplTokensToEvm,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import type { UseAsyncGeneratorResult } from "../utils";
import { useAsyncGenerator } from "../utils";

export const useTransferSplTokensToEvmGenerator = (): UseAsyncGeneratorResult<
  WithSplTokenAccounts<TransfersWithExistingTxs>,
  TxWithTokenId
> => {
  const config = useConfig();
  const evmConnections = useEvmConnections();
  const solanaConnection = useSolanaConnection();
  const wallets = useWallets();
  const solanaWallet = wallets.solana.wallet;

  return useAsyncGenerator(
    async ({
      transfers,
      existingTxs,
      splTokenAccounts,
    }: WithSplTokenAccounts<TransfersWithExistingTxs>) => {
      const solanaAddress = solanaWallet?.publicKey?.toBase58() ?? null;
      if (solanaWallet === null || solanaAddress === null) {
        throw new Error("Missing Solana wallet");
      }

      const filteredTransfers = transfers.filter(
        ({ amount }) => amount.isPositive() && !amount.isZero(),
      );
      const wormholeTransfers: readonly WormholeTransfer[] = await Promise.all(
        filteredTransfers.map(
          async ({ interactionId, amount, toEcosystem, token }) => {
            const existingTxsForToken = existingTxs[token.id] ?? [];
            const solanaTokenDetails = getSolanaTokenDetails(token);
            const evmChain =
              config.chains[Protocol.Evm].find(
                (chain) => chain.ecosystem === toEcosystem,
              ) ?? null;
            if (evmChain === null) {
              throw new Error("Missing EVM chain");
            }
            if (!isEvmEcosystemId(toEcosystem)) {
              throw new Error(`Invalid to ecosystem ${toEcosystem}`);
            }
            const evmWallet = wallets[toEcosystem].wallet;
            if (evmWallet === null) {
              throw new Error("Missing EVM wallet");
            }

            const splTokenAccount = findTokenAccountForMint(
              solanaTokenDetails.address,
              solanaAddress,
              splTokenAccounts,
            );
            if (splTokenAccount === null) {
              throw new Error("Missing SPL token account");
            }

            return {
              interactionId,
              amount,
              evmChain,
              evmWallet,
              evmConnection: evmConnections[toEcosystem],
              fromTokenDetails: solanaTokenDetails,
              splTokenAccountAddress: splTokenAccount.address.toBase58(),
              token,
              existingTxs: existingTxsForToken,
            };
          },
        ),
      );
      return generateTransferSplTokensToEvm(
        config,
        solanaConnection,
        solanaWallet,
        wormholeTransfers,
      );
    },
  );
};
