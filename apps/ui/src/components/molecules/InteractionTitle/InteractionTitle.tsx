import type React from "react";
import { Trans } from "react-i18next";

import type { Interaction } from "../../../models";
import { InteractionType } from "../../../models";
import {
  AmountWithTokenIcon,
  AmountsWithTokenIcons,
  TokenConfigIcon,
} from "../../TokenIcon";

interface Props {
  readonly interaction: Interaction;
}

export const InteractionTitle: React.FC<Props> = ({ interaction }) => {
  switch (interaction.type) {
    case InteractionType.Add: {
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
                <AmountsWithTokenIcons amounts={nonZeroInputAmounts} />
              ),
            }}
          />
        </div>
      );
    }
    case InteractionType.Swap: {
      const { exactInputAmount } = interaction.params;
      return (
        <div
          title={interaction.id}
          style={{
            display: "inline-flex",
            alignContent: "center",
            whiteSpace: "pre",
          }}
        >
          <Trans
            i18nKey="recent_interactions.swap_tokens_for"
            components={{
              tokenAmounts: (
                <AmountWithTokenIcon
                  amount={exactInputAmount}
                  ecosystem={exactInputAmount.tokenConfig.nativeEcosystemId}
                />
              ),
              tokenName: (
                <TokenConfigIcon
                  token={interaction.params.minimumOutputAmount.tokenConfig}
                />
              ),
            }}
          />
        </div>
      );
    }
    case InteractionType.RemoveUniform: {
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
                <AmountsWithTokenIcons amounts={nonZeroOutputAmounts} />
              ),
            }}
          />
        </div>
      );
    }
    case InteractionType.RemoveExactBurn: {
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
                  ecosystem={minimumOutputAmount.tokenConfig.nativeEcosystemId}
                />
              ),
            }}
          />
        </div>
      );
    }
    case InteractionType.RemoveExactOutput: {
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
                <AmountsWithTokenIcons amounts={nonZeroOutputAmounts} />
              ),
            }}
          />
        </div>
      );
    }
  }
};
