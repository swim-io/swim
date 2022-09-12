import { isNotNull } from "@swim-io/utils";
import type { VFC } from "react";

import type { EcosystemId, TokenConfig } from "../../config";
import { useSwimUsd } from "../../hooks";

import { SwapTransfer } from "./SwapTransfer";

interface Props {
  readonly ecosystemId: EcosystemId;
  readonly toToken: TokenConfig;
  readonly isLoading: boolean;
  readonly txId: string | null;
}

export const SwapFromSwimUsd: VFC<Props> = ({
  ecosystemId,
  toToken,
  isLoading,
  txId,
}) => {
  const swimUsd = useSwimUsd();
  return (
    <SwapTransfer
      ecosystemId={ecosystemId}
      fromToken={swimUsd}
      toToken={toToken}
      isLoading={isLoading}
      transactions={[txId].filter(isNotNull)}
    />
  );
};
