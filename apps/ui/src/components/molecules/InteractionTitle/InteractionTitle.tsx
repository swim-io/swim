import type React from "react";
import { Trans } from "react-i18next";

import { EcosystemId } from "../../../config";
import type { Interaction } from "../../../models";
import { InteractionType } from "../../../models";
import {
  AmountWithTokenIcon,
  AmountsWithTokenIcons,
  TokenSpecIcon,
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
            whiteSpace: 'pre'
          }}
        >
          <Trans
            i18nKey="recent_interactions.swap_tokens"
            components={{
              tokenAmounts: (
                <AmountWithTokenIcon
                  amount={exactInputAmount}
                  ecosystem={EcosystemId.Solana}
                />
              ),
              tokenName: (
                <TokenSpecIcon
                  token={interaction.params.minimumOutputAmount.tokenSpec}
                />
              ),
            }}
          />
        </div>
      );
    }
    case InteractionType.RemoveUniform: {
      const { minimumOutputAmounts } = interaction.params;
      const nonZeroOutputAmounts = [...minimumOutputAmounts.values()].filter(
        (amount) => !amount.isZero(),
      );
      return (
        <div title={interaction.id}>
          <Trans
            i18nKey="recent_interactions.remove_tokens"
            components={{
              tokenAmounts: (
                <AmountsWithTokenIcons amounts={nonZeroOutputAmounts} />
              ),
            }}
          />
        </div>
      );
    }
    case InteractionType.RemoveExactBurn: {
      const { minimumOutputAmount } = interaction.params;
      return (
        <div title={interaction.id}>
          <Trans
            i18nKey="recent_interactions.remove_tokens"
            components={{
              tokenAmounts: (
                <AmountWithTokenIcon
                  amount={minimumOutputAmount}
                  ecosystem={minimumOutputAmount.tokenSpec.nativeEcosystemId}
                />
              ),
            }}
          />
        </div>
      );
    }
    case InteractionType.RemoveExactOutput: {
      const { exactOutputAmounts } = interaction.params;
      const nonZeroOutputAmounts = [...exactOutputAmounts.values()].filter(
        (amount) => !amount.isZero(),
      );
      return (
        <div title={interaction.id}>
          <Trans
            i18nKey="recent_interactions.remove_tokens"
            components={{
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
