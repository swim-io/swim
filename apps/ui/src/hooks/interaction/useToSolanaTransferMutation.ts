import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { Keypair } from "@solana/web3.js";
import type { EvmClient, EvmEcosystemId, EvmTx } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import { WormholeChainId } from "@swim-io/wormhole";
import type { ethers } from "ethers";
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

const txResponseToTx = async (
  interactionId: string,
  ecosystemId: EvmEcosystemId,
  client: EvmClient,
  txResponse: ethers.providers.TransactionResponse,
): Promise<EvmTx> => {
  const txReceipt = await client.getTxReceiptOrThrow(txResponse);
  return {
    interactionId,
    ecosystemId,
    id: txReceipt.transactionHash,
    timestamp: txResponse.timestamp ?? null,
    response: txResponse,
    receipt: txReceipt,
  };
};

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
    if (!solanaWallet) {
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

    let transferTxIds: readonly string[] = [];
    for (const [index, transfer] of toSolanaTransfers.entries()) {
      const { token, value, txIds } = transfer;
      const fromEcosystem = getFromEcosystemOfToSolanaTransfer(
        transfer,
        interaction,
      );
      // Transfer completed, skip
      if (txIds.approveAndTransferEvmToken.length > 0) {
        transferTxIds = [
          ...transferTxIds,
          txIds.approveAndTransferEvmToken[
            txIds.approveAndTransferEvmToken.length - 1
          ],
        ];
        continue;
      }
      const evmWallet = wallets[fromEcosystem].wallet;
      if (!evmWallet) {
        throw new Error("No EVM wallet");
      }
      const splTokenAccountAddress = findOrThrow(
        splTokenAccounts,
        ({ mint }) => mint.toBase58() === getSolanaTokenDetails(token).address,
      ).address.toBase58();

      // Process transfer if transfer txId does not exist
      const { approvalResponses, transferResponse } = await evmClients[
        index
      ].initiateWormholeTransfer({
        atomicAmount: humanDecimalToAtomicString(value, token, fromEcosystem),
        interactionId,
        targetAddress: formatWormholeAddress(
          Protocol.Solana,
          splTokenAccountAddress,
        ),
        targetChainId: WormholeChainId.Solana,
        tokenId: token.id,
        wallet: evmWallet,
        wrappedTokenInfo: getWrappedTokenInfo(token, fromEcosystem),
      });

      const [transferTx, ...approvalTxs] = await Promise.all(
        [transferResponse, ...approvalResponses].map((txResponse) =>
          txResponseToTx(
            interactionId,
            fromEcosystem,
            evmClients[index],
            txResponse,
          ),
        ),
      );

      // Update transfer state with txId
      const approveAndTransferEvmTokenTxIds = [...approvalTxs, transferTx].map(
        ({ id }) => id,
      );
      updateInteractionState(interactionId, (draft) => {
        draft.toSolanaTransfers[index].txIds.approveAndTransferEvmToken =
          approveAndTransferEvmTokenTxIds;
      });
      transferTxIds = [...transferTxIds, transferTx.id];
    }

    const sequences = await Promise.all(
      toSolanaTransfers.map(async (transfer, index) => {
        // Claim token completed, skip
        if (transfer.txIds.claimTokenOnSolana !== null) {
          return null;
        }
        const transferTxId = transferTxIds[index];
        const fromEcosystem = getFromEcosystemOfToSolanaTransfer(
          transfer,
          interaction,
        );
        const transferResponse = await evmClients[
          index
        ].provider.getTransaction(transferTxId);
        const transferTx = await txResponseToTx(
          interactionId,
          fromEcosystem,
          evmClients[index],
          transferResponse,
        );

        return parseSequenceFromLogEth(
          transferTx.receipt,
          evmChains[index].wormhole.bridge,
        );
      }),
    );

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
        solanaClient.generateCompleteWormholeTransferTxIds({
          interactionId,
          vaa,
          wallet: solanaWallet,
          auxiliarySigner,
        });
      let unlockSplTokenTxIds: readonly string[] = [];
      for await (const txId of unlockSplTokenTxIdsGenerator) {
        unlockSplTokenTxIds = [...unlockSplTokenTxIds, txId];
      }
      // Update transfer state with txId
      const postVaaOnSolanaTxIds = unlockSplTokenTxIds.slice(0, -1);
      const [claimTokenOnSolanaTxId] = unlockSplTokenTxIds.slice(-1);
      updateInteractionState(interactionId, (draft) => {
        draft.toSolanaTransfers[index].txIds.postVaaOnSolana =
          postVaaOnSolanaTxIds;
        draft.toSolanaTransfers[index].txIds.claimTokenOnSolana =
          claimTokenOnSolanaTxId;
      });
    }
  });
};
