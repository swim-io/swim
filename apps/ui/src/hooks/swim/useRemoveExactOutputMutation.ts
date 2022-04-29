import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import { EcosystemId } from "../../config";
import { useSolanaConnection } from "../../contexts";
import type {
  RemoveExactOutputPoolInteraction,
  SolanaTx,
  SwimDefiInstructor,
  WithSplTokenAccounts,
} from "../../models";

export const useRemoveExactOutputMutation = (
  instructor: SwimDefiInstructor | null,
): UseMutationResult<
  SolanaTx,
  Error,
  WithSplTokenAccounts<RemoveExactOutputPoolInteraction>
> => {
  const solanaConnection = useSolanaConnection();

  return useMutation(
    async (
      interaction: WithSplTokenAccounts<RemoveExactOutputPoolInteraction>,
    ): Promise<SolanaTx> => {
      if (!instructor) {
        throw new Error("No instructor");
      }

      const txId = await instructor.removeExactOutput(interaction);
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
