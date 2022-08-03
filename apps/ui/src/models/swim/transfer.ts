import type { EvmEcosystemId } from "../../config";
import { isEvmEcosystemId } from "../../config";

import type { Interaction } from "./interaction";
import { InteractionType } from "./interaction";
import type {
  FromSolanaTransferState,
  ToSolanaTransferState,
} from "./interactionState";

export const getFromEcosystemOfToSolanaTransfer = (
  transfer: ToSolanaTransferState,
  interaction: Interaction,
): EvmEcosystemId => {
  const ecosystemId =
    interaction.type === InteractionType.RemoveExactBurn ||
    interaction.type === InteractionType.RemoveExactOutput ||
    interaction.type === InteractionType.RemoveUniform
      ? interaction.lpTokenSourceEcosystem
      : transfer.token.nativeEcosystemId;
  if (!isEvmEcosystemId(ecosystemId)) {
    throw new Error("Invalid token");
  }
  return ecosystemId;
};

export const getToEcosystemOfFromSolanaTransfer = (
  transfer: FromSolanaTransferState,
  interaction: Interaction,
): EvmEcosystemId => {
  const ecosystemId =
    interaction.type === InteractionType.Add
      ? interaction.lpTokenTargetEcosystem
      : transfer.token.nativeEcosystemId;
  if (!isEvmEcosystemId(ecosystemId)) {
    throw new Error("Invalid token");
  }
  return ecosystemId;
};
