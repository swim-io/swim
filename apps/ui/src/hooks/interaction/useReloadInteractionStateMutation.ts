import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import { useMutation, useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import { getSolanaTokenDetails } from "../../config";
import { selectConfig, selectGetInteractionState } from "../../core/selectors";
import { useEnvironment, useInteractionState } from "../../core/store";
import {
  fetchEvmTxForInteractionId,
  fetchSolanaTxsForInteractionId,
  getFromEcosystemOfToSolanaTransfer,
  getRequiredEcosystems,
  getToEcosystemOfFromSolanaTransfer,
  isLockEvmTx,
  isLockSplTx,
  isPoolTx,
  isPostVaaSolanaTx,
  isRedeemOnSolanaTx,
  isRequiredSplTokenAccountsCompleted,
  isSolanaPool,
  isUnlockEvmTx,
} from "../../models";
import { findOrThrow } from "../../utils";
import { useEvmConnections, useEvmWallet } from "../evm";
import {
  useSolanaConnection,
  useSolanaWallet,
  useSplTokenAccountsQuery,
} from "../solana";

export const useReloadInteractionStateMutation = () => {
  const queryClient = useQueryClient();
  const { data: splTokenAccounts = [] } = useSplTokenAccountsQuery();
  const solanaConnection = useSolanaConnection();
  const { address: solanaAddress } = useSolanaWallet();
  const { address: evmAddress } = useEvmWallet();
  const evmConnections = useEvmConnections();
  const updateInteractionState = useInteractionState(
    (state) => state.updateInteractionState,
  );
  const getInteractionState = useInteractionState(selectGetInteractionState);
  const { env } = useEnvironment();
  const { tokens, ecosystems, pools } = useEnvironment(selectConfig, shallow);
  const solanaEcosystem = ecosystems[SOLANA_ECOSYSTEM_ID];
  const [solanaChain] = solanaEcosystem.chains;

  return useMutation(async (interactionId: string) => {
    const interactionState = getInteractionState(interactionId);

    const {
      interaction,
      requiredSplTokenAccounts,
      toSolanaTransfers,
      solanaPoolOperations,
      fromSolanaTransfers,
    } = interactionState;

    if (!isRequiredSplTokenAccountsCompleted(requiredSplTokenAccounts)) {
      // Token accounts not ready
      return;
    }

    const requiredEcosystems = getRequiredEcosystems(tokens, interaction);

    if (solanaAddress === null) {
      throw new Error("Solana address not found");
    }

    if (evmAddress === null) {
      throw new Error("Evm address not found");
    }

    // Get solana tx
    const solanaTxs = await fetchSolanaTxsForInteractionId(
      interactionId,
      queryClient,
      interaction.env,
      solanaConnection,
      solanaAddress,
    );

    // Get other evm tx
    const evmTxs = await fetchEvmTxForInteractionId(
      interactionId,
      queryClient,
      interaction.env,
      evmConnections,
      evmAddress,
      requiredEcosystems,
    );

    toSolanaTransfers.forEach((transfer, index) => {
      const { token, txIds } = transfer;
      const fromEcosystem = getFromEcosystemOfToSolanaTransfer(
        transfer,
        interaction,
      );
      if (txIds.approveAndTransferEvmToken.length === 0) {
        const sourceChainSpec = findOrThrow(
          ecosystems[fromEcosystem].chains,
          (chain) => chain.env === env,
        );
        const match = evmTxs.find(
          (evmTx) =>
            evmTx.ecosystem === fromEcosystem &&
            isLockEvmTx(sourceChainSpec.wormholeTokenBridge, token, evmTx),
        );
        if (match) {
          updateInteractionState(interactionId, (draft) => {
            draft.toSolanaTransfers[index].txIds.approveAndTransferEvmToken = [
              match.txId,
            ];
          });
        }
      }

      const splTokenAccountAddress = findOrThrow(
        splTokenAccounts,
        ({ mint }) => mint.toBase58() === getSolanaTokenDetails(token).address,
      ).address.toBase58();

      if (txIds.postVaaOnSolana.length === 0) {
        const match = solanaTxs.filter((solanaTx) =>
          isPostVaaSolanaTx(
            solanaChain.wormholeBridge,
            transfer.signatureSetAddress,
            solanaTx,
          ),
        );
        if (match.length > 0) {
          updateInteractionState(interactionId, (draft) => {
            draft.toSolanaTransfers[index].txIds.postVaaOnSolana = match.map(
              (tx) => tx.txId,
            );
          });
        }
      }

      if (txIds.claimTokenOnSolana === null) {
        const match = solanaTxs.find((solanaTx) =>
          isRedeemOnSolanaTx(
            solanaChain.wormholeTokenBridge,
            token,
            splTokenAccountAddress,
            solanaTx,
          ),
        );
        if (match) {
          updateInteractionState(interactionId, (draft) => {
            draft.toSolanaTransfers[index].txIds.claimTokenOnSolana =
              match.txId;
          });
        }
      }
    });

    solanaPoolOperations.forEach((operationState, index) => {
      const {
        operation: { poolId },
        txId,
      } = operationState;

      if (txId === null) {
        const poolSpec = pools
          .filter(isSolanaPool)
          .find((pool) => pool.id === poolId);
        if (!poolSpec) {
          throw new Error("Pool spec not found");
        }
        const match = solanaTxs.find(
          (solanaTx) =>
            isPoolTx(poolSpec.contract, solanaTx) &&
            solanaTx.parsedTx.transaction.message.accountKeys.some(
              (key) => key.pubkey.toBase58() === poolSpec.address,
            ),
        );

        if (match) {
          updateInteractionState(interactionId, (draft) => {
            draft.solanaPoolOperations[index].txId = match.txId;
          });
        }
      }
    });

    fromSolanaTransfers.forEach((transfer, index) => {
      const { token, txIds } = transfer;
      const toEcosystem = getToEcosystemOfFromSolanaTransfer(
        transfer,
        interaction,
      );
      const splTokenAccountAddress = findOrThrow(
        splTokenAccounts,
        ({ mint }) => mint.toBase58() === getSolanaTokenDetails(token).address,
      ).address.toBase58();

      if (txIds.transferSplToken === null) {
        const match = solanaTxs.find((solanaTx) =>
          isLockSplTx(
            solanaChain.wormholeTokenBridge,
            splTokenAccountAddress,
            token,
            solanaTx,
          ),
        );
        if (match) {
          updateInteractionState(interactionId, (draft) => {
            draft.fromSolanaTransfers[index].txIds.transferSplToken =
              match.txId;
          });
        }
      }

      if (txIds.claimTokenOnEvm === null) {
        const destinationChainSpec = findOrThrow(
          ecosystems[toEcosystem].chains,
          (chain) => chain.env === env,
        );
        const match = evmTxs.find((evmTx) =>
          isUnlockEvmTx(destinationChainSpec.wormholeTokenBridge, token, evmTx),
        );
        if (match) {
          updateInteractionState(interactionId, (draft) => {
            draft.fromSolanaTransfers[index].txIds.claimTokenOnEvm = match.txId;
          });
        }
      }
    });
  });
};
