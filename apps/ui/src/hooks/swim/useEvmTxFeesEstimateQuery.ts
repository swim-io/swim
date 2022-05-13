import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { sumToDecimal } from "../../amounts";
import type { EvmEcosystemId, TokenSpec } from "../../config";
import { useConfig, useEnvironment, useEvmConnection } from "../../contexts";
import type { Interaction } from "../../models";
import { InteractionType, getTokensByPool } from "../../models";

import { usePools } from "./usePools";

// NOTE: These values are based on the highest gas limit seen in a relatively small sample of txs, and then increased by an arbitrary margin.
// We might have to increase these if we come across higher gas usages in the wild.
const APPROVAL_CEILING = 70000;
const TRANSFER_CEILING = 120000;
const REDEEM_CEILING = 300000;

const getTransferToTokens = (
  lpToken: TokenSpec,
  tokens: readonly TokenSpec[],
  interaction: Interaction,
  ecosystemId: EvmEcosystemId,
): readonly TokenSpec[] => {
  switch (interaction.type) {
    case InteractionType.Swap:
      return tokens.filter(
        (token) =>
          token.nativeEcosystem === ecosystemId &&
          token.id === interaction.params.exactInputAmount.tokenId,
      );
    case InteractionType.Add:
      return tokens.filter((token) => {
        const inputAmount =
          interaction.params.inputAmounts.get(token.id) ?? null;
        return (
          token.nativeEcosystem === ecosystemId &&
          inputAmount !== null &&
          !inputAmount.isZero()
        );
      });
    case InteractionType.RemoveUniform:
    case InteractionType.RemoveExactBurn:
    case InteractionType.RemoveExactOutput:
      return interaction.lpTokenSourceEcosystem === ecosystemId
        ? [lpToken]
        : [];
    default:
      throw new Error("Unknown instruction");
  }
};

const getTransferFromTokens = (
  lpToken: TokenSpec,
  tokens: readonly TokenSpec[],
  interaction: Interaction,
  ecosystemId: EvmEcosystemId,
): readonly TokenSpec[] => {
  switch (interaction.type) {
    case InteractionType.Swap:
      return tokens.filter(
        (token) =>
          token.nativeEcosystem === ecosystemId &&
          token.id === interaction.params.minimumOutputAmount.tokenId,
      );
    case InteractionType.Add:
      return interaction.lpTokenTargetEcosystem === ecosystemId
        ? [lpToken]
        : [];
    case InteractionType.RemoveUniform:
      return tokens.filter((token) => {
        const outputAmount =
          interaction.params.minimumOutputAmounts.get(token.id) ?? null;
        return (
          token.nativeEcosystem === ecosystemId &&
          outputAmount !== null &&
          !outputAmount.isZero()
        );
      });
    case InteractionType.RemoveExactBurn:
      return tokens.filter(
        (token, i) =>
          token.nativeEcosystem === ecosystemId &&
          token.id === interaction.params.outputTokenId,
      );
    case InteractionType.RemoveExactOutput:
      return tokens.filter((token, i) => {
        const outputAmount =
          interaction.params.exactOutputAmounts.get(token.id) ?? null;
        return (
          token.nativeEcosystem === ecosystemId &&
          outputAmount !== null &&
          !outputAmount.isZero()
        );
      });
    default:
      throw new Error("Unknown instruction");
  }
};

export const useEvmTxFeesEstimateQuery = (
  ecosystem: EvmEcosystemId,
  interaction: Interaction | null,
): UseQueryResult<Decimal | null, Error> => {
  const { env } = useEnvironment();
  const config = useConfig();
  const tokensByPool = getTokensByPool(config);
  const connection = useEvmConnection(ecosystem);
  const pools = usePools(interaction?.poolIds ?? []);

  const inputPool = pools[0];
  const outputPool = pools[pools.length - 1];
  const inputPoolTokens = tokensByPool[inputPool.spec.id];
  const outputPoolTokens = tokensByPool[outputPool.spec.id];

  return useQuery(
    ["evmTxFeesEstimate", env, ecosystem, interaction?.id ?? null],
    async () => {
      if (interaction === null) {
        return null;
      }
      const transferToTokens = getTransferToTokens(
        inputPoolTokens.lpToken,
        inputPoolTokens.tokens,
        interaction,
        ecosystem,
      );
      const transferFromTokens = getTransferFromTokens(
        outputPoolTokens.lpToken,
        outputPoolTokens.tokens,
        interaction,
        ecosystem,
      );
      const gasEstimates = [
        // Transferring to Solana requires a transfer tx and most likely an approval
        ...transferToTokens.flatMap(() => [APPROVAL_CEILING, TRANSFER_CEILING]),
        // Transferring from Solana only requires a redeem tx
        ...transferFromTokens.map(() => REDEEM_CEILING),
      ];
      const totalGasEstimate = sumToDecimal(gasEstimates);
      const gasPrice = await connection.provider.getGasPrice();
      const txFeesEstimate = totalGasEstimate.mul(gasPrice.toString());
      return txFeesEstimate;
    },
  );
};
