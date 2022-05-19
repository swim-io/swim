import { EcosystemId } from "../../config";
import type { SwapInteraction } from "../../models";
import { InteractionType } from "../../models";

import { useInteraction } from "./useInteraction";
import type { WormholeFromSolanaTransferState } from "./useInteractionState";

const generateTransferForSwapInteraction = (
  interaction: SwapInteraction,
): readonly WormholeFromSolanaTransferState[] => {
  const {
    params: { minimumOutputAmount },
  } = interaction;
  const toToken = minimumOutputAmount.tokenSpec;

  // No WormholeFromSolana if toToken is Solana
  if (toToken.nativeEcosystem === EcosystemId.Solana) {
    return [];
  }
  return [
    {
      id: `${interaction.id}_${toToken.nativeEcosystem}_${toToken.symbol}_fromSolana`,
      token: toToken,
      value: null,
      toEcosystem: toToken.nativeEcosystem,
      txs: {
        transferSplToken: null,
        claimTokenOnEvm: null,
      },
    },
  ];
};

export const useWormholeFromSolanaTransfersState = (
  interactionId: string,
): readonly WormholeFromSolanaTransferState[] => {
  const interaction = useInteraction(interactionId);

  switch (interaction.type) {
    case InteractionType.Swap:
      return generateTransferForSwapInteraction(interaction);
    default:
      return [];
  }
};
