import { EuiLoadingSpinner, EuiText } from "@elastic/eui";
import type { VFC } from "react";

import type { EcosystemId, TokenSpec } from "../../config";
import { ECOSYSTEMS } from "../../config";

import { TxEcosystemList } from "./TxList";

interface Props {
  readonly ecosystemId: EcosystemId;
  readonly fromToken: TokenSpec;
  readonly toToken: TokenSpec;
  readonly isLoading: boolean;
  readonly transactions: ReadonlyArray<string>;
}

export const SwapTransfer: VFC<Props> = ({
  ecosystemId,
  fromToken,
  toToken,
  isLoading,
  transactions,
}) => (
  <EuiText size="m">
    <span style={{ display: "flex", alignItems: "center" }}>
      {isLoading && <EuiLoadingSpinner size="m" style={{ marginRight: 8 }} />}
      <span>{`Swap ${fromToken.project.displayName} to ${toToken.project.displayName} on ${ECOSYSTEMS[ecosystemId].displayName}`}</span>
    </span>
    <TxEcosystemList transactions={transactions} ecosystemId={ecosystemId} />
  </EuiText>
);
