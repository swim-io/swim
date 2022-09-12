import { isNotNull } from "@swim-io/utils";
import type { VFC } from "react";

import type { EcosystemId, TokenConfig } from "../../config";
import { useSwimUsd } from "../../hooks";

import { SwapTransfer } from "./SwapTransfer";

interface Props {
  readonly ecosystemId: EcosystemId;
  readonly fromToken: TokenConfig;
  readonly isLoading: boolean;
  readonly txId: string | null;
}

export const SwapToSwimUsd: VFC<Props> = ({
  ecosystemId,
  fromToken,
  isLoading,
  txId,
}) => {
  const swimUsd = useSwimUsd();
  return (
    <SwapTransfer
      ecosystemId={ecosystemId}
      fromToken={fromToken}
      toToken={swimUsd}
      isLoading={isLoading}
      transactions={[txId].filter(isNotNull)}
    />
  );
};
