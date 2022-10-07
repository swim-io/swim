import { findOrThrow } from "@swim-io/utils";
import type React from "react";
import { Trans } from "react-i18next";
import shallow from "zustand/shallow.js";

import { selectConfig } from "../../../core/selectors";
import { useEnvironment } from "../../../core/store";
import type { InteractionV2 } from "../../../models";
import { Amount, InteractionType } from "../../../models";
import {
  AmountWithTokenIcon,
  AmountsWithTokenIcons,
  TokenConfigIcon,
} from "../../TokenIcon";

interface Props {
  readonly interaction: InteractionV2;
}

export const InteractionTitleV2: React.FC<Props> = ({ interaction }) => {
  const { pools } = useEnvironment(selectConfig, shallow);

  switch (interaction.type) {
    case InteractionType.Add: {
      const pool = findOrThrow(
        pools,
        (poolSpec) => poolSpec.id === interaction.poolId,
      );
      const { inputAmounts } = interaction.params;
      const nonZeroInputAmounts = [...inputAmounts.values()].filter(
        (amount) => !amount.isZero(),
      );
      return (
        <div title={interaction.id}>
          <Trans
            i18nKey="recent_interactions.add_tokens"
            components={{
              tokenAmounts: (
                <AmountsWithTokenIcons
                  amounts={nonZeroInputAmounts}
                  ecosystem={pool.ecosystem}
                />
              ),
            }}
          />
        </div>
      );
    }
    case InteractionType.SwapV2: {
      const { fromTokenData, toTokenData } = interaction.params;
      const exactInputAmount = Amount.fromHuman(
        fromTokenData.tokenConfig,
        fromTokenData.value,
      );
      return (
        <div title={interaction.id}>
          <Trans
            i18nKey="recent_interactions.swap_tokens_for"
            components={{
              tokenAmounts: (
                <AmountWithTokenIcon
                  amount={exactInputAmount}
                  ecosystem={fromTokenData.ecosystemId}
                />
              ),
              tokenName: (
                <TokenConfigIcon
                  token={toTokenData.tokenConfig}
                  ecosystem={toTokenData.ecosystemId}
                />
              ),
            }}
          />
        </div>
      );
    }
    case InteractionType.RemoveUniform: {
      const pool = findOrThrow(
        pools,
        (poolSpec) => poolSpec.id === interaction.poolId,
      );
      const { minimumOutputAmounts, exactBurnAmount } = interaction.params;
      const nonZeroOutputAmounts = [...minimumOutputAmounts.values()].filter(
        (amount) => !amount.isZero(),
      );
      return (
        <div title={interaction.id}>
          <Trans
            i18nKey="recent_interactions.remove_tokens"
            components={{
              lpToken: <TokenConfigIcon token={exactBurnAmount.tokenConfig} />,
              tokenAmounts: (
                <AmountsWithTokenIcons
                  amounts={nonZeroOutputAmounts}
                  ecosystem={pool.ecosystem}
                />
              ),
            }}
          />
        </div>
      );
    }
    case InteractionType.RemoveExactBurn: {
      const pool = findOrThrow(
        pools,
        (poolSpec) => poolSpec.id === interaction.poolId,
      );
      const { minimumOutputAmount, exactBurnAmount } = interaction.params;
      return (
        <div title={interaction.id}>
          <Trans
            i18nKey="recent_interactions.remove_tokens"
            components={{
              lpToken: <TokenConfigIcon token={exactBurnAmount.tokenConfig} />,
              tokenAmounts: (
                <AmountWithTokenIcon
                  amount={minimumOutputAmount}
                  ecosystem={pool.ecosystem}
                />
              ),
            }}
          />
        </div>
      );
    }
    case InteractionType.RemoveExactOutput: {
      const pool = findOrThrow(
        pools,
        (poolSpec) => poolSpec.id === interaction.poolId,
      );
      const { exactOutputAmounts, maximumBurnAmount } = interaction.params;
      const nonZeroOutputAmounts = [...exactOutputAmounts.values()].filter(
        (amount) => !amount.isZero(),
      );
      return (
        <div title={interaction.id}>
          <Trans
            i18nKey="recent_interactions.remove_tokens"
            components={{
              lpToken: (
                <TokenConfigIcon token={maximumBurnAmount.tokenConfig} />
              ),
              tokenAmounts: (
                <AmountsWithTokenIcons
                  amounts={nonZeroOutputAmounts}
                  ecosystem={pool.ecosystem}
                />
              ),
            }}
          />
        </div>
      );
    }
  }
};
