import { EuiListGroup, EuiLoadingSpinner, EuiText } from "@elastic/eui";
import type { VFC } from "react";
import shallow from "zustand/shallow.js";

import type { EcosystemId, TokenSpec } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

import { TxListItem } from "./TxListItem";

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
}) => {
  const { ecosystems } = useEnvironment(selectConfig, shallow);
  return (
    <EuiText size="m">
      <span style={{ display: "flex", alignItems: "center" }}>
        {isLoading && <EuiLoadingSpinner size="m" style={{ marginRight: 8 }} />}
        <span>{`Transfer ${token.project.displayName} from ${ecosystems[from].displayName} to ${ecosystems[to].displayName}`}</span>
      </span>
      <br />
      <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
        {transactions.map(({ txId, ecosystem }) => (
          <TxListItem key={txId} txId={txId} ecosystem={ecosystem} />
        ))}
      </EuiListGroup>
    </EuiText>
  );
};
