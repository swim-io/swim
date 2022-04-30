import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import { EcosystemId } from "../../config";
import { useSolanaConnection } from "../../contexts";
import type {
  RemoveUniformPoolInteraction,
  SolanaTx,
  SwimDefiInstructor,
  WithSplTokenAccounts,
} from "../../models";

export const useRemoveUniformMutation = (
  instructor: SwimDefiInstructor | null,
): UseMutationResult<
  SolanaTx,
  Error,
  WithSplTokenAccounts<RemoveUniformPoolInteraction>
> => {
  const solanaConnection = useSolanaConnection();

  return useMutation(
    async (
      interaction: WithSplTokenAccounts<RemoveUniformPoolInteraction>,
    ): Promise<SolanaTx> => {
      if (!instructor) {
        throw new Error("No instructor");
      }

      const txId = await instructor.removeUniform(interaction);
      const tx = await solanaConnection.getParsedTx(txId);

      return {
        ecosystem: EcosystemId.Solana,
        txId,
        timestamp: tx.blockTime ?? null,
        interactionId: interaction.id,
        parsedTx: tx,
      };
    },
  );
};
