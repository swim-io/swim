import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { Keypair } from "@solana/web3.js";
import type { EvmTx } from "@swim-io/evm";
import { EvmTxType } from "@swim-io/evm";
import {
  SOLANA_ECOSYSTEM_ID,
  SolanaTxType,
  findTokenAccountForMint,
} from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import { WormholeChainId } from "@swim-io/wormhole";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import {
  ECOSYSTEMS,
  Protocol,
  getSolanaTokenDetails,
  getWormholeRetries,
} from "../../config";
import { selectConfig, selectGetInteractionState } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import {
  formatWormholeAddress,
  getFromEcosystemOfToSolanaTransfer,
  getSignedVaaWithRetry,
  getWrappedTokenInfo,
  humanDecimalToAtomicString,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";
import { useSolanaClient, useSplTokenAccountsQuery } from "../solana";

export const useToSolanaTransferMutation = () => {
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { chains, wormhole } = useEnvironment(selectConfig, shallow);
  const getEvmClient = useGetEvmClient();
  const solanaClient = useSolanaClient();
  const wallets = useWallets();
  const solanaWallet = wallets[SOLANA_ECOSYSTEM_ID].wallet;
  const updateInteractionState = useInteractionState(
    (state) => state.updateInteractionState,
  );
  const getInteractionState = useInteractionState(selectGetInteractionState);

  return useMutation(async (interactionId: string) => {
    if (solanaWallet === null || solanaWallet.address === null) {
      throw new Error("No Solana wallet");
    }
    if (!wormhole) {
      throw new Error("No Wormhole RPC configured");
    }

    const { interaction, toSolanaTransfers } =
      getInteractionState(interactionId);

    const fromEcosystems = toSolanaTransfers.map((transfer) =>
      getFromEcosystemOfToSolanaTransfer(transfer, interaction),
    );
    const evmChains = fromEcosystems.map((ecosystemId) =>
      findOrThrow(
        chains[Protocol.Evm],
        ({ ecosystem }) => ecosystem === ecosystemId,
      ),
    );
    const evmClients = fromEcosystems.map(getEvmClient);

    let transferTxs: readonly EvmTx[] = [];
    for (const [index, transfer] of toSolanaTransfers.entries()) {
      const { token, value, txIds } = transfer;
      const fromEcosystem = getFromEcosystemOfToSolanaTransfer(
        transfer,
        interaction,
      );
      // Transfer completed, skip
      if (txIds.approveAndTransferEvmToken.length > 0) {
        const transferTx = await evmClients[index].getTx(
          txIds.approveAndTransferEvmToken[
            txIds.approveAndTransferEvmToken.length - 1
          ],
        );
        transferTxs = [...transferTxs, transferTx];
        continue;
      }
      const evmWallet = wallets[fromEcosystem].wallet;
      if (!evmWallet) {
        throw new Error("No EVM wallet");
      }

      const splTokenAccount = findTokenAccountForMint(
        getSolanaTokenDetails(token).address,
        solanaWallet.address,
        splTokenAccounts,
      );
      if (splTokenAccount === null) {
        throw new Error("SPL token account not found");
      }

      // Process transfer if transfer txId does not exist
      const evmTxGenerator = evmClients[
        index
      ].generateInitiatePortalTransferTxs({
        atomicAmount: humanDecimalToAtomicString(value, token, fromEcosystem),
        interactionId,
        targetAddress: formatWormholeAddress(
          Protocol.Solana,
          splTokenAccount.address.toBase58(),
        ),
        targetChainId: WormholeChainId.Solana,
        tokenProjectId: token.projectId,
        wallet: evmWallet,
        wrappedTokenInfo: getWrappedTokenInfo(token, fromEcosystem),
      });

      for await (const result of evmTxGenerator) {
        switch (result.type) {
          case EvmTxType.PortalTransferTokens:
          case EvmTxType.Erc20Approve:
            if (result.type === EvmTxType.PortalTransferTokens) {
              transferTxs = [...transferTxs, result.tx];
            }
            updateInteractionState(interactionId, (draft) => {
              draft.toSolanaTransfers[
                index
              ].txIds.approveAndTransferEvmToken.push(result.tx.id);
            });
            break;
          default:
            throw new Error(`Unexpected transaction type: ${result.tx.id}`);
        }
      }
    }

    const sequences = toSolanaTransfers.map((transfer, index) => {
      // Claim token completed, skip
      if (transfer.txIds.claimTokenOnSolana !== null) {
        return null;
      }
      return parseSequenceFromLogEth(
        transferTxs[index].original,
        evmChains[index].wormhole.bridge,
      );
    });

    for (const [index, transfer] of toSolanaTransfers.entries()) {
      const fromEcosystem = getFromEcosystemOfToSolanaTransfer(
        transfer,
        interaction,
      );
      const evmChain = findOrThrow(
        chains[Protocol.Evm],
        ({ ecosystem }) => ecosystem === fromEcosystem,
      );
      const sequence = sequences[index];
      // Claim token completed, skip
      if (sequence === null) {
        continue;
      }

      const auxiliarySigner = Keypair.generate();
      updateInteractionState(interactionId, (draft) => {
        draft.toSolanaTransfers[index].signatureSetAddress =
          auxiliarySigner.publicKey.toBase58();
      });
      const { wormholeChainId: emitterChainId } = ECOSYSTEMS[fromEcosystem];
      const retries = getWormholeRetries(emitterChainId);
      const { vaaBytes: vaa } = await getSignedVaaWithRetry(
        [...wormhole.rpcUrls],
        emitterChainId,
        getEmitterAddressEth(evmChain.wormhole.portal),
        sequence,
        undefined,
        undefined,
        retries,
      );
      const unlockSplTokenTxIdsGenerator =
        solanaClient.generateCompletePortalTransferTxs({
          interactionId,
          vaa,
          wallet: solanaWallet,
          auxiliarySigner,
        });
      for await (const result of unlockSplTokenTxIdsGenerator) {
        switch (result.type) {
          case SolanaTxType.WormholeVerifySignatures:
          case SolanaTxType.WormholePostVaa:
            updateInteractionState(interactionId, (draft) => {
              draft.toSolanaTransfers[index].txIds.postVaaOnSolana.push(
                result.tx.id,
              );
            });
            break;
          case SolanaTxType.PortalRedeem:
            updateInteractionState(interactionId, (draft) => {
              draft.toSolanaTransfers[index].txIds.claimTokenOnSolana =
                result.tx.id;
            });
            break;
          default:
            throw new Error(`Unexpected transaction type: ${result.tx.id}`);
        }
      }
    }
  });
};
