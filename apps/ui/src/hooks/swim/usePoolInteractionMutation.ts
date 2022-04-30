import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import type {
  PoolInteraction,
  SolanaTx,
  WithSplTokenAccounts,
} from "../../models";
import { SwimDefiInstruction } from "../../models";

import { useAddMutation } from "./useAddMutation";
import { useInstructor } from "./useInstructor";
import { useRemoveExactBurnMutation } from "./useRemoveExactBurnMutation";
import { useRemoveExactOutputMutation } from "./useRemoveExactOutputMutation";
import { useRemoveUniformMutation } from "./useRemoveUniformMutation";
import { useSwapMutation } from "./useSwapMutation";

export const usePoolInteractionMutation = (
  poolId: string,
): UseMutationResult<
  SolanaTx,
  Error,
  WithSplTokenAccounts<PoolInteraction>
> => {
  const instructor = useInstructor(poolId);
  const addMutation = useAddMutation(instructor);
  const swapMutation = useSwapMutation(instructor);
  const removeUniformMutation = useRemoveUniformMutation(instructor);
  const removeExactBurnMutation = useRemoveExactBurnMutation(instructor);
  const removeExactOutputMutation = useRemoveExactOutputMutation(instructor);

  return useMutation(async (interaction) => {
    switch (interaction.instruction) {
      case SwimDefiInstruction.Add:
        return addMutation.mutateAsync(interaction);
      case SwimDefiInstruction.Swap:
        return swapMutation.mutateAsync(interaction);
      case SwimDefiInstruction.RemoveUniform:
        return removeUniformMutation.mutateAsync(interaction);
      case SwimDefiInstruction.RemoveExactBurn:
        return removeExactBurnMutation.mutateAsync(interaction);
      case SwimDefiInstruction.RemoveExactOutput:
        return removeExactOutputMutation.mutateAsync(interaction);
      default:
        throw new Error("Instruction not supported");
    }
  });
};
