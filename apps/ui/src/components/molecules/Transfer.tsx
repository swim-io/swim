import shallow from "zustand/shallow.js";

import { EuiListGroup, EuiLoadingSpinner, EuiText } from "@elastic/eui";
import type { VFC } from "react";

import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { EcosystemId, TokenSpec } from "../../config";

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

const { ecosystems } = useEnvironment(selectConfig, shallow);

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
      <span>{`Transfer ${token.displayName} from ${ecosystems[from].displayName} to ${ecosystems[to].displayName}`}</span>
    </span>
    <br />
    <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
      {transactions.map(({ txId, ecosystem }) => (
        <TxListItem key={txId} txId={txId} ecosystem={ecosystem} />
      ))}
    </EuiListGroup>
  </EuiText>
);
