import {
  getEmitterAddressEth,
  parseSequenceFromLogEth,
} from "@certusone/wormhole-sdk";
import { Keypair } from "@solana/web3.js";
import type { ethers } from "ethers";
import { useMutation } from "react-query";

import type { EvmEcosystemId } from "../../config";
import {
  EcosystemId,
  Protocol,
  ecosystems,
  getSolanaTokenDetails,
  isEvmEcosystemId,
} from "../../config";
import {
  useConfig,
  useEvmConnections,
  useSolanaConnection,
} from "../../contexts";
import { useInteractionStateStore } from "../../core/store/useInteractionStateStore";
import type {
  EvmConnection,
  EvmTx,
  InteractionState,
  ToSolanaTransferState,
} from "../../models";
import {
  Amount,
  generateUnlockSplTokenTxIds,
  lockEvmToken,
} from "../../models";
import { findOrThrow } from "../../utils";
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
  const { chains, wormhole } = useConfig();
  const evmConnections = useEvmConnections();
  const solanaConnection = useSolanaConnection();
  const wallets = useWallets();
  const solanaWallet = wallets[EcosystemId.Solana].wallet;
  const solanaWormhole = chains[Protocol.Solana][0].wormhole;
  const { updateInteractionState } = useInteractionStateStore();

  return useMutation(
    async ({
      interactionState,
      transfer,
    }: {
      readonly interactionState: InteractionState;
      readonly transfer: ToSolanaTransferState;
    }) => {
      const { id: interactionId } = interactionState.interaction;
      const { token, value, txIds } = transfer;
      const fromEcosystem = token.nativeEcosystem;

      // Transfer completed, skip
      if (txIds.claimTokenOnSolana !== null) {
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
        ({ mint }) => mint.toBase58() === getSolanaTokenDetails(token).address,
      ).address.toBase58();

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

      const approvalTxs = await Promise.all(
        approvalResponses.map((txResponse) =>
          txResponseToTx(
            interactionId,
            fromEcosystem,
            evmConnection,
            txResponse,
          ),
        ),
      );
      const transferTx = await txResponseToTx(
        interactionId,
        fromEcosystem,
        evmConnection,
        transferResponse,
      );

      // TODO: [refactor] update transfer state with txId
      const approveAndTransferEvmTokenTxIds = [...approvalTxs, transferTx].map(
        ({ txId }) => txId,
      );
      console.log([...approvalTxs, transferTx].map(({ txId }) => txId));
      updateInteractionState(interactionId, (draft) => {
        const index = draft.toSolanaTransfers.findIndex(
          (t) => t.token === token,
        );
        // eslint-disable-next-line functional/immutable-data
        draft.toSolanaTransfers[index].txIds.approveAndTransferEvmToken =
          approveAndTransferEvmTokenTxIds;
      });

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
      // TODO: [refactor] update transfer state with txId
      const postVaaOnSolanaTxIds = unlockSplTokenTxIds.slice(0, -1);
      const [claimTokenOnSolanaTxId] = unlockSplTokenTxIds.slice(-1);
      console.log({ postVaaOnSolanaTxIds, claimTokenOnSolanaTxId });
      updateInteractionState(interactionId, (draft) => {
        const index = draft.toSolanaTransfers.findIndex(
          (t) => t.token === token,
        );
        // eslint-disable-next-line functional/immutable-data
        draft.toSolanaTransfers[index].txIds.postVaaOnSolana =
          postVaaOnSolanaTxIds;
        // eslint-disable-next-line functional/immutable-data
        draft.toSolanaTransfers[index].txIds.claimTokenOnSolana =
          claimTokenOnSolanaTxId;
      });
    },
  );
};
