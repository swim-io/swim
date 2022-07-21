import { useMutation } from "react-query";

import { useInteractionStateV2 } from "../../core/store";
import type { CrossChainEvmToSolanaSwapInteractionState } from "../../models";
import { InteractionType, SwapType } from "../../models";

export const useCrossChainEvmToSolanaSwapInteractionMutation = () => {
  const { updateInteractionState } = useInteractionStateV2();
  return useMutation(
    // eslint-disable-next-line @typescript-eslint/require-await
    async (interactionState: CrossChainEvmToSolanaSwapInteractionState) => {
      const { interaction } = interactionState;

      // TODO: Handle cross chain evm to solana swap, swapAndTransfer

      updateInteractionState(interaction.id, (draft) => {
        if (draft.interactionType !== InteractionType.SwapV2) {
          throw new Error("Interaction type mismatch");
        }
        if (draft.swapType !== SwapType.CrossChainEvmToSolana) {
          throw new Error("Swap type mismatch");
        }
        // TODO: update txId
        // draft.swapAndTransferTxId = txId;
      });

      // TODO: Handle cross chain evm to solana swap,

      updateInteractionState(interaction.id, (draft) => {
        if (draft.interactionType !== InteractionType.SwapV2) {
          throw new Error("Interaction type mismatch");
        }
        if (draft.swapType !== SwapType.CrossChainEvmToSolana) {
          throw new Error("Swap type mismatch");
        }
        // TODO: update txId
        // draft.postVaaOnSolanaTxIds = txIds;
        // draft.claimTokenOnSolanaTxId = txId;
      });
    },
  );
};
