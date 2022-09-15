import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { Keypair } from "@solana/web3.js";
import type { EvmConnection, EvmEcosystemId, EvmTx } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import type { ethers } from "ethers";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import {
  ECOSYSTEMS,
  Protocol,
  getSolanaTokenDetails,
  getTokenDetailsForEcosystem,
} from "../../config";
import { selectConfig, selectGetInteractionState } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import {
  generateUnlockSplTokenTxIds,
  humanDecimalToAtomicString,
  lockEvmToken,
} from "../../models";
import { getFromEcosystemOfToSolanaTransfer } from "../../models/swim/transfer";
import { useWallets } from "../crossEcosystem";
import { useGetEvmConnection } from "../evm";
import { useSolanaConnection, useSplTokenAccountsQuery } from "../solana";

const txResponseToTx = async (
  interactionId: string,
  ecosystemId: EvmEcosystemId,
  evmConnection: EvmConnection,
  txResponse: ethers.providers.TransactionResponse,
): Promise<EvmTx> => {
  const txReceipt = await evmConnection.getTxReceiptOrThrow(txResponse);
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
  const getEvmConnection = useGetEvmConnection();
  const solanaConnection = useSolanaConnection();
  const wallets = useWallets();
  const solanaWallet = wallets[SOLANA_ECOSYSTEM_ID].wallet;
  const solanaWormhole = chains[Protocol.Solana][0].wormhole;
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
    const evmConnections = fromEcosystems.map(getEvmConnection);

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
      const fromTokenDetails = getTokenDetailsForEcosystem(
        token,
        fromEcosystem,
      );
      if (!fromTokenDetails) {
        throw new Error("No token detail");
      }
      const splTokenAccountAddress = findOrThrow(
        splTokenAccounts,
        ({ mint }) => mint.toBase58() === getSolanaTokenDetails(token).address,
      ).address.toBase58();

      // Process transfer if transfer txId does not exist
      const { approvalResponses, transferResponse } = await lockEvmToken(
        evmConnections[index],
        evmWallet,
        evmChains[index],
        fromTokenDetails,
        splTokenAccountAddress,
        humanDecimalToAtomicString(value, token, fromEcosystem),
        interactionId,
      );

      const [transferTx, ...approvalTxs] = await Promise.all(
        [transferResponse, ...approvalResponses].map((txResponse) =>
          txResponseToTx(
            interactionId,
            fromEcosystem,
            evmConnections[index],
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
        const transferResponse = await evmConnections[
          index
        ].provider.getTransaction(transferTxId);
        const transferTx = await txResponseToTx(
          interactionId,
          fromEcosystem,
          evmConnections[index],
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

      const signatureKeyPair = Keypair.generate();
      updateInteractionState(interactionId, (draft) => {
        draft.toSolanaTransfers[index].signatureSetAddress =
          signatureKeyPair.publicKey.toBase58();
      });
      const unlockSplTokenTxIdsGenerator = generateUnlockSplTokenTxIds(
        interactionId,
        wormhole.rpcUrls,
        ECOSYSTEMS[fromEcosystem].wormholeChainId,
        getEmitterAddressEth(evmChain.wormhole.portal),
        sequence,
        solanaWormhole,
        solanaConnection,
        solanaWallet,
        signatureKeyPair,
      );
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
