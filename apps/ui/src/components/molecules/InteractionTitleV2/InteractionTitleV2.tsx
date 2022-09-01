import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type React from "react";
import { Trans } from "react-i18next";

import { findTokenById } from "../../../config";
import { useEnvironment } from "../../../core/store";
import type { InteractionV2 } from "../../../models";
import { Amount, InteractionType } from "../../../models";
import {
  AmountWithTokenIcon,
  AmountsWithTokenIcons,
  TokenSpecIcon,
} from "../../TokenIcon";

interface Props {
  readonly interaction: InteractionV2;
}

export const InteractionTitleV2: React.FC<Props> = ({ interaction }) => {
  const { env } = useEnvironment();

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
    case InteractionType.SwapV2: {
      const { fromTokenDetail, toTokenDetail } = interaction.params;
      const fromTokenSpec = findTokenById(fromTokenDetail.tokenId, env);
      const toTokenSpec = findTokenById(toTokenDetail.tokenId, env);
      const exactInputAmount = Amount.fromHuman(
        fromTokenSpec,
        fromTokenDetail.value,
      );

      return (
        <div title={interaction.id}>
          <Trans
            i18nKey="recent_interactions.swap_tokens"
            components={{
              tokenAmounts: (
                <AmountWithTokenIcon
                  amount={exactInputAmount}
                  ecosystem={SOLANA_ECOSYSTEM_ID}
                />
              ),
              tokenName: <TokenSpecIcon token={toTokenSpec} />,
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
                  ecosystem={minimumOutputAmount.tokenConfig.nativeEcosystemId}
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
