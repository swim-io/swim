import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import { EcosystemId } from "../../config";
import { useSolanaConnection } from "../../contexts";
import type {
  SolanaTx,
  SwapPoolInteraction,
  SwimDefiInstructor,
  WithSplTokenAccounts,
} from "../../models";

export const useSwapMutation = (
  instructor: SwimDefiInstructor | null,
): UseMutationResult<
  SolanaTx,
  Error,
  WithSplTokenAccounts<SwapPoolInteraction>
> => {
  const solanaConnection = useSolanaConnection();

  return useMutation(
    async (
      interaction: WithSplTokenAccounts<SwapPoolInteraction>,
    ): Promise<SolanaTx> => {
      if (!instructor) {
        throw new Error("No instructor");
      }

      const txId = await instructor.swap(interaction);
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
