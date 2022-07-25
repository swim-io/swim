import { EuiLoadingSpinner, EuiText } from "@elastic/eui";
import type { VFC } from "react";

import type { EcosystemId, TokenSpec } from "../../../config";
import { ECOSYSTEMS } from "../../../config";
import { TxList } from "../TxList";

interface Props {
  readonly token: TokenSpec;
  readonly from: EcosystemId;
  readonly to: EcosystemId;
  readonly isLoading: boolean;
  readonly transactions: ReadonlyArray<{
    readonly txId: string;
    readonly ecosystem: EcosystemId;
  }>;
}

export const Transfer: VFC<Props> = ({
  token,
  from,
  to,
  isLoading,
  transactions,
}) => (
  <EuiText size="m">
    <span style={{ display: "flex", alignItems: "center" }}>
      {isLoading && <EuiLoadingSpinner size="m" style={{ marginRight: 8 }} />}
      <span>{`Transfer ${token.project.displayName} from ${ECOSYSTEMS[from].displayName} to ${ECOSYSTEMS[to].displayName}`}</span>
    </span>
    <TxList transactions={transactions} />
  </EuiText>
);
