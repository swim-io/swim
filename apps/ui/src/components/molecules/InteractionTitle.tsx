import type React from "react";

import { EcosystemId } from "../../config";
import type { Interaction } from "../../models";
import { InteractionType } from "../../models";
import {
  AmountWithTokenIcon,
  AmountsWithTokenIcons,
  NativeTokenIcon,
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
        <>
          <span>Add&nbsp;</span>
          <AmountsWithTokenIcons amounts={nonZeroInputAmounts} />
        </>
      );
    }
    case InteractionType.Swap: {
      const { exactInputAmount } = interaction.params;
      return (
        <>
          <span>Swap</span>{" "}
          <AmountWithTokenIcon
            amount={exactInputAmount}
            ecosystem={EcosystemId.Solana}
          />{" "}
          <span>for</span>{" "}
          <NativeTokenIcon
            {...interaction.params.minimumOutputAmount.tokenSpec}
          />
        </>
      );
    }
    case InteractionType.RemoveUniform: {
      const { minimumOutputAmounts } = interaction.params;
      const nonZeroOutputAmounts = [...minimumOutputAmounts.values()].filter(
        (amount) => !amount.isZero(),
      );
      return (
        <>
          <span>Remove&nbsp;</span>
          <AmountsWithTokenIcons amounts={nonZeroOutputAmounts} />
        </>
      );
    }
    case InteractionType.RemoveExactBurn: {
      const { minimumOutputAmount } = interaction.params;
      return (
        <>
          <span>Remove</span>{" "}
          <AmountWithTokenIcon
            amount={minimumOutputAmount}
            ecosystem={minimumOutputAmount.tokenSpec.nativeEcosystem}
          />
          <span>.</span>
        </>
      );
    }
    case InteractionType.RemoveExactOutput: {
      const { exactOutputAmounts } = interaction.params;
      const nonZeroOutputAmounts = [...exactOutputAmounts.values()].filter(
        (amount) => !amount.isZero(),
      );
      return (
        <>
          <span>Remove&nbsp;</span>
          <AmountsWithTokenIcons amounts={nonZeroOutputAmounts} />
        </>
      );
    }
  }
};
