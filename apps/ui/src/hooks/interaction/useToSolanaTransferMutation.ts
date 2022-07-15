import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { Keypair } from "@solana/web3.js";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import type { ethers } from "ethers";
import { useMutation } from "react-query";
import shallow from "zustand/shallow.js";

import type { EvmEcosystemId } from "../../config";
import { ECOSYSTEMS, getSolanaTokenDetails } from "../../config";
import { selectConfig, selectGetInteractionState } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import type { EvmConnection, EvmTx } from "../../models";
import {
  Amount,
  generateUnlockSplTokenTxIds,
  lockEvmToken,
} from "../../models";
import { getFromEcosystemOfToSolanaTransfer } from "../../models/swim/transfer";
import { findOrThrow } from "../../utils";
import { useWallets } from "../crossEcosystem";
import { useEvmConnections } from "../evm";
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
    ecosystem: ecosystemId,
    txId: txReceipt.transactionHash,
    timestamp: txResponse.timestamp ?? null,
    txResponse,
    txReceipt,
  };
};

export const useToSolanaTransferMutation = () => {
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { env } = useEnvironment();
  const { ecosystems, wormhole } = useEnvironment(selectConfig, shallow);
  const solanaConnection = useSolanaConnection();
  const evmConnections = useEvmConnections();
  const wallets = useWallets();
  const solanaWallet = wallets[SOLANA_ECOSYSTEM_ID].wallet;
  const updateInteractionState = useInteractionState(
    (state) => state.updateInteractionState,
  );
  const getInteractionState = useInteractionState(selectGetInteractionState);
  const [solanaChain] = ecosystems[SOLANA_ECOSYSTEM_ID].chains;

  return useMutation(async (interactionId: string) => {
    if (!solanaWallet) {
      throw new Error("No Solana wallet");
    }

    const { interaction, toSolanaTransfers } =
      getInteractionState(interactionId);

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
      const evmConnection = evmConnections[fromEcosystem];
      const evmChain = findOrThrow(
        ecosystems[fromEcosystem].chains,
        (chain) => chain.env === env,
      );
      const fromTokenDetails = token.detailsByEcosystem.get(fromEcosystem);
      if (!fromTokenDetails) {
        throw new Error("No token detail");
      }
      const splTokenAccountAddress = findOrThrow(
        splTokenAccounts,
        ({ mint }) => mint.toBase58() === getSolanaTokenDetails(token).address,
      ).address.toBase58();

      // Process transfer if transfer txId does not exist
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
      const approveAndTransferEvmTokenTxIds = [...approvalTxs, transferTx].map(
        ({ txId }) => txId,
      );
      updateInteractionState(interactionId, (draft) => {
        draft.toSolanaTransfers[index].txIds.approveAndTransferEvmToken =
          approveAndTransferEvmTokenTxIds;
      });
      transferTxIds = [...transferTxIds, transferTx.txId];
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
        const evmChain = findOrThrow(
          ecosystems[fromEcosystem].chains,
          (chain) => chain.env === env,
        );
        const evmConnection = evmConnections[fromEcosystem];
        const transferResponse = await evmConnection.provider.getTransaction(
          transferTxId,
        );
        const transferTx = await txResponseToTx(
          interactionId,
          fromEcosystem,
          evmConnection,
          transferResponse,
        );

        return parseSequenceFromLogEth(
          transferTx.txReceipt,
          evmChain.wormholeBridge,
        );
      }),
    );

    for (const [index, transfer] of toSolanaTransfers.entries()) {
      const fromEcosystem = getFromEcosystemOfToSolanaTransfer(
        transfer,
        interaction,
      );
      const evmChain = findOrThrow(
        ecosystems[fromEcosystem].chains,
        (chain) => chain.env === env,
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
        getEmitterAddressEth(evmChain.wormholeTokenBridge),
        sequence,
        solanaChain,
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
