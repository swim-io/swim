import type { UseMutationResult } from "react-query";
import { useMutation } from "react-query";

import { EcosystemId } from "../../config";
import { useSolanaConnection } from "../../contexts";
import type {
  AddPoolInteraction,
  SolanaTx,
  SwimDefiInstructor,
  WithSplTokenAccounts,
} from "../../models";

export const useAddMutation = (
  instructor: SwimDefiInstructor | null,
): UseMutationResult<
  SolanaTx,
  Error,
  WithSplTokenAccounts<AddPoolInteraction>
> => {
  const solanaConnection = useSolanaConnection();
  return useMutation(
    async (
      interaction: WithSplTokenAccounts<AddPoolInteraction>,
    ): Promise<SolanaTx> => {
      if (!instructor) {
        throw new Error("No instructor");
      }

      const txId = await instructor.add(interaction);
      // NOTE: Confirming can take a while on Mainnet so we use retries
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
