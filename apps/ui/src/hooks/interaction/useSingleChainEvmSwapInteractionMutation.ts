import { useMutation } from "react-query";

import { useInteractionStateV2 } from "../../core/store";
import type { SingleChainEvmSwapInteractionState } from "../../models";
import { InteractionType, SwapType } from "../../models";

export const useSingleChainEvmSwapInteractionMutation = () => {
  const { updateInteractionState } = useInteractionStateV2();
  return useMutation(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (interactionState: SingleChainEvmSwapInteractionState) => {
      const { interaction } = interactionState;

      // TODO: Handle single chain evm swap

      updateInteractionState(interaction.id, (draft) => {
        if (draft.interactionType !== InteractionType.SwapV2) {
          throw new Error("Interaction type mismatch");
        }
        if (draft.swapType !== SwapType.SingleChainEvm) {
          throw new Error("Swap type mismatch");
        }
        // TODO: update txId
        // draft.onChainSwapTxId = txId;
      });
    },
  );
};
