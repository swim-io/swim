import type React from "react";

import type { Interaction } from "../../models";
import { InteractionType } from "../../models";
import {
  AmountWithTokenIcon,
  AmountsWithTokenIcons,
  TokenSpecIcon,
} from "../TokenIcon";

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
          <span>Add&nbsp;</span>
          <AmountsWithTokenIcons amounts={nonZeroInputAmounts} />
        </div>
      );
    }
    case InteractionType.Swap: {
      const { exactInputAmount } = interaction.params;
      return (
        <div title={interaction.id}>
          <span>Swap</span>{" "}
          <AmountWithTokenIcon amount={exactInputAmount} ecosystem={"solana"} />{" "}
          <span>for</span>{" "}
          <TokenSpecIcon
            token={interaction.params.minimumOutputAmount.tokenSpec}
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
          <span>Remove&nbsp;</span>
          <AmountsWithTokenIcons amounts={nonZeroOutputAmounts} />
        </div>
      );
    }
    case InteractionType.RemoveExactBurn: {
      const { minimumOutputAmount } = interaction.params;
      return (
        <div title={interaction.id}>
          <span>Remove</span>{" "}
          <AmountWithTokenIcon
            amount={minimumOutputAmount}
            ecosystem={minimumOutputAmount.tokenSpec.nativeEcosystem}
          />
          <span>.</span>
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
          <span>Remove&nbsp;</span>
          <AmountsWithTokenIcons amounts={nonZeroOutputAmounts} />
        </div>
      );
    }
  }
};
