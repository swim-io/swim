import type { EvmEcosystemId } from "@swim-io/evm";
import { isEvmEcosystemId } from "@swim-io/evm";
import type { Pool } from "@swim-io/evm-contracts";
import { Pool__factory } from "@swim-io/evm-contracts";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import { useMutation, useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import { getTokenDetailsForEcosystem } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import type {
  RemoveExactBurnInteraction,
  RemoveExactOutputInteraction,
  RemoveInteractionState,
  RemoveUniformInteraction,
} from "../../models";
import {
  InteractionType,
  createOperationSpecs,
  doSingleSolanaPoolOperationV2,
  findOrCreateSplTokenAccount,
  getTokensByPool,
} from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";
import { useSolanaClient, useUserSolanaTokenAccountsQuery } from "../solana";

const getPopulatedTxForEvmRemoveInteraction = (
  interaction:
    | RemoveUniformInteraction
    | RemoveExactBurnInteraction
    | RemoveExactOutputInteraction,
  poolContract: Pool,
  ecosystem: EvmEcosystemId,
  poolTokenIds: readonly string[],
) => {
  switch (interaction.type) {
    case InteractionType.RemoveUniform: {
      const { exactBurnAmount, minimumOutputAmounts } = interaction.params;
      return poolContract.populateTransaction[
        "removeUniform(uint256,uint256[],bytes16)"
      ](
        exactBurnAmount.toAtomicString(ecosystem),
        minimumOutputAmounts.map((amount) =>
          amount.toAtomicString(amount.tokenConfig.nativeEcosystemId),
        ),
        `0x${interaction.id}`,
      );
    }
    case InteractionType.RemoveExactOutput: {
      const { maximumBurnAmount, exactOutputAmounts } = interaction.params;
      return poolContract.populateTransaction[
        "removeExactOutput(uint256[],uint256,bytes16)"
      ](
        exactOutputAmounts.map((amount) =>
          amount.toAtomicString(amount.tokenConfig.nativeEcosystemId),
        ),
        maximumBurnAmount.toAtomicString(ecosystem),
        `0x${interaction.id}`,
      );
    }
    case InteractionType.RemoveExactBurn: {
      const { exactBurnAmount, minimumOutputAmount } = interaction.params;
      const outputTokenIndex = poolTokenIds.findIndex(
        (tokenId) => tokenId === minimumOutputAmount.tokenId,
      );
      if (outputTokenIndex === -1) {
        throw new Error("Output token not found");
      }
      return poolContract.populateTransaction[
        "removeExactBurn(uint256,uint8,uint256,bytes16)"
      ](
        exactBurnAmount.toAtomicString(ecosystem),
        outputTokenIndex,
        minimumOutputAmount.toAtomicString(
          minimumOutputAmount.tokenConfig.nativeEcosystemId,
        ),
        `0x${interaction.id}`,
      );
    }
  }
};

export const useRemoveInteractionMutation = () => {
  const { env } = useEnvironment();
  const queryClient = useQueryClient();
  const config = useEnvironment(selectConfig, shallow);
  const wallets = useWallets();
  const solanaClient = useSolanaClient();
  const getEvmClient = useGetEvmClient();
  const { data: existingSplTokenAccounts = [] } =
    useUserSolanaTokenAccountsQuery();
  const { updateInteractionState } = useInteractionStateV2();

  const tokensByPoolId = getTokensByPool(config);

  return useMutation(
    async (interactionState: RemoveInteractionState) => {
      const { interaction, requiredSplTokenAccounts } = interactionState;
      const poolSpec = findOrThrow(
        config.pools,
        (pool) => pool.id === interaction.poolId,
      );
      const { ecosystem } = poolSpec;
      if (ecosystem === SOLANA_ECOSYSTEM_ID) {
        const solanaWallet = wallets[SOLANA_ECOSYSTEM_ID].wallet;
        if (solanaWallet === null) {
          throw new Error("Missing Solana wallet");
        }
        if (requiredSplTokenAccounts === null) {
          throw new Error("Remove from Solana Pool require SPL token accounts");
        }
        const splTokenAccounts = await Promise.all(
          Object.keys(requiredSplTokenAccounts).map(async (mint) => {
            const { tokenAccount, creationTxId } =
              await findOrCreateSplTokenAccount({
                env,
                solanaClient,
                wallet: solanaWallet,
                queryClient,
                splTokenMintAddress: mint,
                splTokenAccounts: existingSplTokenAccounts,
              });

            // Update interactionState
            if (creationTxId !== null) {
              updateInteractionState(interaction.id, (draft) => {
                if (
                  draft.interactionType !== interaction.type ||
                  draft.requiredSplTokenAccounts === null
                ) {
                  throw new Error("Interaction type mismatch");
                }
                draft.requiredSplTokenAccounts[mint].txId = creationTxId;
              });
            }
            return tokenAccount;
          }),
        );
        const solanaPoolOperations = createOperationSpecs(
          tokensByPoolId,
          [poolSpec],
          [],
          interaction,
        );
        if (solanaPoolOperations.length !== 1) {
          throw new Error("Invalid number of operation");
        }
        const txId = await doSingleSolanaPoolOperationV2({
          solanaClient,
          wallet: solanaWallet,
          splTokenAccounts,
          poolTokens: tokensByPoolId[poolSpec.id],
          poolSpec,
          operation: solanaPoolOperations[0],
          interactionId: interaction.id,
        });
        updateInteractionState(interaction.id, (draft) => {
          if (draft.interactionType !== interaction.type) {
            throw new Error("Interaction type mismatch");
          }
          draft.removeTxId = txId;
        });
      } else if (isEvmEcosystemId(ecosystem)) {
        const removeAmount =
          interaction.type === InteractionType.RemoveExactOutput
            ? interaction.params.maximumBurnAmount
            : interaction.params.exactBurnAmount;
        const { wallet } = wallets[ecosystem];
        if (wallet === null) {
          throw new Error(`${ecosystem} wallet not found`);
        }
        const { address, signer } = wallet;
        if (address === null || signer === null) {
          throw new Error(`${ecosystem} wallet not connected`);
        }
        const connection = getEvmClient(ecosystem);
        const tokenDetails = getTokenDetailsForEcosystem(
          removeAmount.tokenConfig,
          ecosystem,
        );
        if (tokenDetails === null) {
          throw new Error("Missing token detail");
        }
        const approvalResponses = await connection.approveTokenAmount({
          atomicAmount: removeAmount.toAtomicString(ecosystem),
          wallet,
          mintAddress: tokenDetails.address,
          spenderAddress: poolSpec.address,
        });
        const approvalTxs = await Promise.all(
          approvalResponses.map((response) =>
            connection.getTxReceiptOrThrow(response),
          ),
        );
        updateInteractionState(interaction.id, (draft) => {
          if (draft.interactionType !== interaction.type) {
            throw new Error("Interaction type mismatch");
          }
          draft.approvalTxIds = [
            ...draft.approvalTxIds,
            ...approvalTxs.map((tx) => tx.transactionHash),
          ];
        });

        const poolContract = Pool__factory.connect(poolSpec.address, signer);
        const txRequest = await getPopulatedTxForEvmRemoveInteraction(
          interaction,
          poolContract,
          ecosystem,
          poolSpec.tokens,
        );
        const txResponse = await signer.sendTransaction(txRequest);
        const evmReceipt = await connection.getTxReceiptOrThrow(txResponse);
        updateInteractionState(interaction.id, (draft) => {
          if (draft.interactionType !== interaction.type) {
            throw new Error("Interaction type mismatch");
          }
          draft.removeTxId = evmReceipt.transactionHash;
        });
      } else {
        throw new Error("Unexpected ecosystem for remove interaction");
      }
    },
    {
      onSuccess: async (_data, variable) => {
        await queryClient.invalidateQueries([
          env,
          "poolState",
          variable.interaction.poolId,
        ]);
      },
    },
  );
};
