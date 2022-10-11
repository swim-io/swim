import { isEvmEcosystemId } from "@swim-io/evm";
import { Pool__factory } from "@swim-io/evm-contracts";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { findOrThrow } from "@swim-io/utils";
import { useMutation, useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import { Protocol, getTokenDetailsForEcosystem } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment, useInteractionStateV2 } from "../../core/store";
import {
  createOperationSpecs,
  doSingleSolanaPoolOperationV2,
  findOrCreateSplTokenAccount,
  getTokensByPool,
} from "../../models";
import type { AddInteractionState } from "../../models";
import { useWallets } from "../crossEcosystem";
import { useGetEvmClient } from "../evm";
import { useSolanaClient, useSplTokenAccountsQuery } from "../solana";

export const useAddInteractionMutation = () => {
  const queryClient = useQueryClient();
  const { env } = useEnvironment();
  const config = useEnvironment(selectConfig, shallow);
  const wallets = useWallets();
  const solanaClient = useSolanaClient();
  const getEvmClient = useGetEvmClient();
  const { data: existingSplTokenAccounts = [] } = useSplTokenAccountsQuery();
  const { updateInteractionState } = useInteractionStateV2();

  const tokensByPoolId = getTokensByPool(config);

  return useMutation(
    async (interactionState: AddInteractionState) => {
      const { interaction, requiredSplTokenAccounts } = interactionState;
      const poolSpec = findOrThrow(
        config.pools,
        (pool) => pool.id === interaction.poolId,
      );
      const { ecosystem } = poolSpec;
      if (ecosystem === SOLANA_ECOSYSTEM_ID) {
        const { wallet } = wallets[SOLANA_ECOSYSTEM_ID];
        if (wallet === null) {
          throw new Error("Missing Solana wallet");
        }
        if (requiredSplTokenAccounts === null) {
          throw new Error("Add to Solana Pool require SPL token accounts");
        }
        const splTokenAccounts = await Promise.all(
          Object.keys(requiredSplTokenAccounts).map(async (mint) => {
            const { tokenAccount, creationTxId } =
              await findOrCreateSplTokenAccount({
                env,
                solanaClient,
                wallet,
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
          wallet,
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
          draft.addTxId = txId;
        });
      } else if (isEvmEcosystemId(ecosystem)) {
        const { inputAmounts, minimumMintAmount } = interaction.params;
        const { wallet } = wallets[ecosystem];
        if (wallet === null) {
          throw new Error(`${ecosystem} wallet not found`);
        }
        const { address, signer } = wallet;
        if (address === null || signer === null) {
          throw new Error(`${ecosystem} wallet not connected`);
        }
        const evmClient = getEvmClient(ecosystem);
        const evmChainSpec = findOrThrow(
          config.chains[Protocol.Evm],
          (chain) => chain.ecosystem === ecosystem,
        );
        await wallet.switchNetwork(evmChainSpec.chainId);
        await Promise.all(
          inputAmounts.map(async (amount) => {
            const tokenDetails = getTokenDetailsForEcosystem(
              amount.tokenConfig,
              ecosystem,
            );
            if (tokenDetails === null) {
              throw new Error("Missing token detail");
            }
            const responses = await evmClient.approveTokenAmount({
              atomicAmount: amount.toAtomicString(ecosystem),
              wallet,
              mintAddress: tokenDetails.address,
              spenderAddress: poolSpec.address,
            });

            await Promise.all(
              responses.map(async (response) => {
                const tx = await evmClient.getTx(response);
                updateInteractionState(interaction.id, (draft) => {
                  if (draft.interactionType !== interaction.type) {
                    throw new Error("Interaction type mismatch");
                  }
                  draft.approvalTxIds = [...draft.approvalTxIds, tx.id];
                });
              }),
            );
          }),
        );

        const poolContract = Pool__factory.connect(
          poolSpec.address,
          evmClient.provider,
        );
        const amounts = inputAmounts.map((amount) =>
          amount.toAtomicString(ecosystem),
        );
        const txRequest = await poolContract.populateTransaction[
          "add(uint256[],uint256,bytes16)"
        ](
          amounts,
          minimumMintAmount.toAtomicString(ecosystem),
          `0x${interaction.id}`,
        );
        const txResponse = await signer.sendTransaction(txRequest);
        const tx = await evmClient.getTx(txResponse);
        updateInteractionState(interaction.id, (draft) => {
          if (draft.interactionType !== interaction.type) {
            throw new Error("Interaction type mismatch");
          }
          draft.addTxId = tx.id;
        });
      } else {
        throw new Error("Unexpected ecosystem for add interaction");
      }
    },
    {
      onSuccess: async (_data, variable) => {
        await queryClient.invalidateQueries([env, "liquidity"]);
        await queryClient.invalidateQueries([
          env,
          "poolState",
          variable.interaction.poolId,
        ]);
      },
    },
  );
};
