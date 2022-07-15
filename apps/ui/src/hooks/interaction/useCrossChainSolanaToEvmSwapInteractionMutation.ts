import { useMutation } from "react-query";

import { useInteractionStateV2 } from "../../core/store";
import type { CrossChainSolanaToEvmSwapInteractionState } from "../../models";
import { InteractionType, SwapType } from "../../models";

export const useCrossChainSolanaToEvmSwapInteractionMutation = () => {
  const { updateInteractionState } = useInteractionStateV2();
  return useMutation(
    async (interactionState: CrossChainSolanaToEvmSwapInteractionState) => {
      const { interaction } = interactionState;

      // TODO: Handle cross chain solana to evm swap, swapAndTransfer

      updateInteractionState(interaction.id, (draft) => {
        if (draft.interactionType !== InteractionType.SwapV2) {
          throw new Error("Interaction type mismatch");
        }
        if (draft.swapType !== SwapType.CrossChainSolanaToEvm) {
          throw new Error("Swap type mismatch");
        }
        // TODO: update txId
        // draft.swapAndTransferTxId = txId;
      });

      // TODO: Handle cross chain solana to evm swap, receiveAndSwap

      updateInteractionState(interaction.id, (draft) => {
        if (draft.interactionType !== InteractionType.SwapV2) {
          throw new Error("Interaction type mismatch");
        }
        if (draft.swapType !== SwapType.CrossChainSolanaToEvm) {
          throw new Error("Swap type mismatch");
        }
        // TODO: update txId
        // draft.receiveAndSwapTxId = txId;
      });
    },
  );
};
