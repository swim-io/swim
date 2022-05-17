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
  TransfersToSolanaWithExistingTxs,
  TxWithTokenId,
  WormholeTransferWithSignatureSet,
} from "../../models";
import {
  findTokenAccountForMint,
  generateTransferEvmTokensToSolana,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useSplTokenAccountsQuery } from "../solana";
import type { UseAsyncGeneratorResult } from "../utils";
import { useAsyncGenerator } from "../utils";

export const useTransferEvmTokensToSolanaGenerator =
  (): UseAsyncGeneratorResult<
    TransfersToSolanaWithExistingTxs,
    TxWithTokenId
  > => {
    const config = useConfig();
    const evmConnections = useEvmConnections();
    const solanaConnection = useSolanaConnection();
    const wallets = useWallets();
    const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
    const solanaWallet = wallets.solana.wallet;

    return useAsyncGenerator(
      async ({
        transfers,
        existingTxs,
      }: TransfersToSolanaWithExistingTxs): Promise<
        AsyncGenerator<TxWithTokenId>
      > => {
        const solanaAddress = solanaWallet?.publicKey?.toBase58() ?? null;
        if (solanaWallet === null || solanaAddress === null) {
          throw new Error("Missing Solana wallet");
        }
        if (splTokenAccounts === null) {
          throw new Error(
            "SPL token accounts not loaded, please try again later",
          );
        }

        const filteredTransfers = transfers.filter(
          ({ amount }) => amount.isPositive() && !amount.isZero(),
        );

        const wormholeTransfers: readonly WormholeTransferWithSignatureSet[] =
          await Promise.all(
            filteredTransfers.map(
              async ({
                interactionId,
                amount,
                fromEcosystem,
                token,
                signatureSetKeypair,
              }) => {
                const existingTxsForToken = existingTxs[token.id] ?? [];
                const fromTokenDetails =
                  token.detailsByEcosystem.get(fromEcosystem) ?? null;
                if (fromTokenDetails === null) {
                  throw new Error("Missing EVM details");
                }
                const solanaTokenDetails = getSolanaTokenDetails(token);
                const evmChain =
                  config.chains[Protocol.Evm].find(
                    (chain) => chain.ecosystem === fromEcosystem,
                  ) ?? null;
                if (evmChain === null) {
                  throw new Error("Missing EVM chain");
                }
                if (!isEvmEcosystemId(fromEcosystem)) {
                  throw new Error(`Invalid from ecosystem ${fromEcosystem}`);
                }
                const evmWallet = wallets[fromEcosystem].wallet;
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
                  evmConnection: evmConnections[fromEcosystem],
                  fromTokenDetails,
                  splTokenAccountAddress: splTokenAccount.address.toBase58(),
                  token,
                  existingTxs: existingTxsForToken,
                  signatureSetKeypair,
                };
              },
            ),
          );

        return generateTransferEvmTokensToSolana(
          config,
          solanaConnection,
          solanaWallet,
          wormholeTransfers,
        );
      },
    );
  };
