import type Decimal from "decimal.js";
import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { sumToDecimal } from "../../amounts";
import type { EvmEcosystemId, TokenSpec } from "../../config";
import { useConfig, useEnvironment, useEvmConnection } from "../../contexts";
import type { Interaction } from "../../models";
import { SwimDefiInstruction } from "../../models";

import { usePool } from "./usePool";

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
  switch (interaction.instruction) {
    case SwimDefiInstruction.Swap:
      return tokens.filter(
        (token, i) =>
          token.nativeEcosystem === ecosystemId &&
          !interaction.params.exactInputAmounts[i].isZero(),
      );
    case SwimDefiInstruction.Add:
      return tokens.filter(
        (token, i) =>
          token.nativeEcosystem === ecosystemId &&
          !interaction.params.inputAmounts[i].isZero(),
      );
    case SwimDefiInstruction.RemoveUniform:
    case SwimDefiInstruction.RemoveExactBurn:
    case SwimDefiInstruction.RemoveExactOutput:
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
  switch (interaction.instruction) {
    case SwimDefiInstruction.Swap:
      return tokens.filter(
        (token, i) =>
          token.nativeEcosystem === ecosystemId &&
          i === interaction.params.outputTokenIndex,
      );
    case SwimDefiInstruction.Add:
      return interaction.lpTokenTargetEcosystem === ecosystemId
        ? [lpToken]
        : [];
    case SwimDefiInstruction.RemoveUniform:
      return tokens.filter(
        (token, i) =>
          token.nativeEcosystem === ecosystemId &&
          !interaction.params.minimumOutputAmounts[i].isZero(),
      );
    case SwimDefiInstruction.RemoveExactBurn:
      return tokens.filter(
        (token, i) =>
          token.nativeEcosystem === ecosystemId &&
          i === interaction.params.outputTokenIndex,
      );
    case SwimDefiInstruction.RemoveExactOutput:
      return tokens.filter(
        (token, i) =>
          token.nativeEcosystem === ecosystemId &&
          !interaction.params.exactOutputAmounts[i].isZero(),
      );
    default:
      throw new Error("Unknown instruction");
  }
};

export const useEvmTxFeesEstimateQuery = (
  ecosystem: EvmEcosystemId,
  interaction: Interaction | null,
): UseQueryResult<Decimal | null, Error> => {
  const { env } = useEnvironment();
  const { pools } = useConfig();
  const connection = useEvmConnection(ecosystem);
  const poolId = interaction?.poolId ?? pools[0].id;
  const { lpToken, tokens } = usePool(poolId);
  return useQuery(
    ["evmTxFeesEstimate", env, ecosystem, interaction?.id ?? null],
    async () => {
      if (interaction === null) {
        return null;
      }
      const transferToTokens = getTransferToTokens(
        lpToken,
        tokens,
        interaction,
        ecosystem,
      );
      const transferFromTokens = getTransferFromTokens(
        lpToken,
        tokens,
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
