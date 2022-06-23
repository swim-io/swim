import type { EcosystemId } from "../../config";

import type { Interaction } from "./interaction";
import { InteractionType } from "./interaction";
import type {
  FromSolanaTransferState,
  ToSolanaTransferState,
} from "./interactionState";

export const getFromEcosystemOfToSolanaTransfer = (
  transfer: ToSolanaTransferState,
  interaction: Interaction,
): EcosystemId => {
  return interaction.type === InteractionType.RemoveExactBurn ||
    interaction.type === InteractionType.RemoveExactOutput ||
    interaction.type === InteractionType.RemoveUniform
    ? interaction.lpTokenSourceEcosystem
    : transfer.token.nativeEcosystem;
};

export const getToEcosystemOfFromSolanaTransfer = (
  transfer: FromSolanaTransferState,
  interaction: Interaction,
): EcosystemId => {
  return interaction.type === InteractionType.Add
    ? interaction.lpTokenTargetEcosystem
    : transfer.token.nativeEcosystem;
};
