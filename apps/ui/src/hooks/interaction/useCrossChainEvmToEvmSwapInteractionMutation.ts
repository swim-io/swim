import { useMutation } from "react-query";

import { useInteractionStateV2 } from "../../core/store";
import type { CrossChainEvmSwapInteractionState } from "../../models";
import { InteractionType, SwapType } from "../../models";

export const useCrossChainEvmToEvmSwapInteractionMutation = () => {
  const { updateInteractionState } = useInteractionStateV2();
  return useMutation(
    async (interactionState: CrossChainEvmSwapInteractionState) => {
      const { interaction } = interactionState;

      // TODO: Handle cross chain evm to evm swap, swapAndTransfer

      updateInteractionState(interaction.id, (draft) => {
        if (draft.interactionType !== InteractionType.SwapV2) {
          throw new Error("Interaction type mismatch");
        }
        if (draft.swapType !== SwapType.CrossChainEvmToEvm) {
          throw new Error("Swap type mismatch");
        }
        // TODO: update txId
        // draft.swapAndTransferTxId = txId;
      });

      // TODO: Handle cross chain evm swap, receiveAndSwap

      updateInteractionState(interaction.id, (draft) => {
        if (draft.interactionType !== InteractionType.SwapV2) {
          throw new Error("Interaction type mismatch");
        }
        if (draft.swapType !== SwapType.CrossChainEvmToEvm) {
          throw new Error("Swap type mismatch");
        }
        // TODO: update txId
        // draft.receiveAndSwapTxId = txId;
      });
    },
  );
};
