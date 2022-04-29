import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import { EcosystemId } from "../../config";
import { useSolanaConnection } from "../../contexts";
import type {
  RemoveExactBurnPoolInteraction,
  SolanaTx,
  SwimDefiInstructor,
  WithSplTokenAccounts,
} from "../../models";

export const useRemoveExactBurnMutation = (
  instructor: SwimDefiInstructor | null,
): UseMutationResult<
  SolanaTx,
  Error,
  WithSplTokenAccounts<RemoveExactBurnPoolInteraction>
> => {
  const solanaConnection = useSolanaConnection();

  return useMutation(
    async (
      interaction: WithSplTokenAccounts<RemoveExactBurnPoolInteraction>,
    ): Promise<SolanaTx> => {
      if (!instructor) {
        throw new Error("No instructor");
      }

      const txId = await instructor.removeExactBurn(interaction);
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
