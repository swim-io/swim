import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { Keypair } from "@solana/web3.js";
import type { ethers } from "ethers";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import type { EvmEcosystemId } from "../../config";
import {
  EcosystemId,
  Protocol,
  ecosystems,
  getSolanaTokenDetails,
  isEvmEcosystemId,
} from "../../config";
import { useEvmConnections, useSolanaConnection } from "../../contexts";
import { selectConfig, selectGetInteractionState } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import type { EvmConnection, EvmTx } from "../../models";
import {
  Amount,
  generateUnlockSplTokenTxIds,
  isToSolanaTransferCompleted,
  lockEvmToken,
} from "../../models";
import { getFromEcosystemOfToSolanaTransfer } from "../../models/swim/transfer";
import { findOrThrow, getRecordKeys, groupBy } from "../../utils";
import { useWallets } from "../crossEcosystem";
import { useSplTokenAccountsQuery } from "../solana";

const txResponseToTx = async (
  interactionId: string,
  ecosystemId: EvmEcosystemId,
  evmConnection: EvmConnection,
  txResponse: ethers.providers.TransactionResponse,
): Promise<EvmTx> => {
  const txReceipt = await evmConnection.getTxReceiptOrThrow(txResponse);
  return {
    interactionId,
    ecosystem: ecosystemId,
    txId: txReceipt.transactionHash,
    timestamp: txResponse.timestamp ?? null,
    txResponse,
    txReceipt,
  };
};

export const useToSolanaTransferMutation = () => {
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { chains, wormhole } = useEnvironment(selectConfig, shallow);
  const evmConnections = useEvmConnections();
  const solanaConnection = useSolanaConnection();
  const wallets = useWallets();
  const solanaWallet = wallets[EcosystemId.Solana].wallet;
  const solanaWormhole = chains[Protocol.Solana][0].wormhole;
  const updateInteractionState = useInteractionState(
    (state) => state.updateInteractionState,
  );
  const getInteractionState = useInteractionState(selectGetInteractionState);

  return useMutation(async (interactionId: string) => {
    const { interaction, toSolanaTransfers } =
      getInteractionState(interactionId);

    const transfersGroupByFromEcosystem = groupBy(
      toSolanaTransfers,
      (transfer) => getFromEcosystemOfToSolanaTransfer(transfer, interaction),
    );

    for await (const fromEcosystem of getRecordKeys(
      transfersGroupByFromEcosystem,
    )) {
      const transfers = transfersGroupByFromEcosystem[fromEcosystem];
      await Promise.all(
        transfers.map(async (transfer) => {
          const index = toSolanaTransfers.findIndex(
            (target) => target === transfer,
          );
          const { token, value, txIds } = transfer;
          // Transfer completed, skip
          if (isToSolanaTransferCompleted(transfer)) {
            return;
          }
          if (!solanaWallet) {
            throw new Error("No Solana wallet");
          }
          if (!isEvmEcosystemId(fromEcosystem)) {
            throw new Error("Invalid token");
          }
          const evmConnection = evmConnections[fromEcosystem];
          const evmWallet = wallets[fromEcosystem].wallet;
          if (!evmWallet) {
            throw new Error("No EVM wallet");
          }
          const evmChain = findOrThrow(
            chains[Protocol.Evm],
            ({ ecosystem }) => ecosystem === fromEcosystem,
          );
          const fromTokenDetails = token.detailsByEcosystem.get(fromEcosystem);
          if (!fromTokenDetails) {
            throw new Error("No token detail");
          }
          const splTokenAccountAddress = findOrThrow(
            splTokenAccounts,
            ({ mint }) =>
              mint.toBase58() === getSolanaTokenDetails(token).address,
          ).address.toBase58();

          let transferTxId: string | undefined =
            txIds.approveAndTransferEvmToken.slice(-1)[0];

          // Process transfer if transfer txId does not exist
          if (!transferTxId) {
            const { approvalResponses, transferResponse } = await lockEvmToken({
              interactionId,
              token,
              amount: Amount.fromHuman(token, value),
              evmChain,
              evmConnection,
              fromTokenDetails,
              evmWallet,
              splTokenAccountAddress,
              existingTxs: [],
            });

            const [transferTx, ...approvalTxs] = await Promise.all(
              [transferResponse, ...approvalResponses].map((txResponse) =>
                txResponseToTx(
                  interactionId,
                  fromEcosystem,
                  evmConnection,
                  txResponse,
                ),
              ),
            );

            // Update transfer state with txId
            const approveAndTransferEvmTokenTxIds = [
              ...approvalTxs,
              transferTx,
            ].map(({ txId }) => txId);

            updateInteractionState(interactionId, (draft) => {
              draft.toSolanaTransfers[index].txIds.approveAndTransferEvmToken =
                approveAndTransferEvmTokenTxIds;
            });

            transferTxId = transferTx.txId;
          }

          const transferResponse = await evmConnection.provider.getTransaction(
            transferTxId,
          );
          const transferTx = await txResponseToTx(
            interactionId,
            fromEcosystem,
            evmConnection,
            transferResponse,
          );

          const sequence = parseSequenceFromLogEth(
            transferTx.txReceipt,
            evmChain.wormhole.bridge,
          );

          const unlockSplTokenTxIdsGenerator = generateUnlockSplTokenTxIds(
            interactionId,
            wormhole.endpoint,
            ecosystems[fromEcosystem].wormholeChainId,
            getEmitterAddressEth(evmChain.wormhole.tokenBridge),
            sequence,
            solanaWormhole,
            solanaConnection,
            solanaWallet,
            Keypair.generate(),
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
        }),
      );
    }
  });
};
