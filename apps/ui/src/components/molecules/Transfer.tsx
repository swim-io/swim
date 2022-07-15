import { EuiListGroup, EuiLoadingSpinner, EuiText } from "@elastic/eui";
import type { VFC } from "react";

import type { EcosystemId, TokenSpec } from "../../config";
import { useEcosystem } from "../../hooks";

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
  const fromEcosystem = useEcosystem(from);
  const toEcosystem = useEcosystem(to);
  if (fromEcosystem === null || toEcosystem === null) {
    throw new Error("Missing ecosystem");
  }
  return (
    <EuiText size="m">
      <span style={{ display: "flex", alignItems: "center" }}>
        {isLoading && <EuiLoadingSpinner size="m" style={{ marginRight: 8 }} />}
        <span>{`Transfer ${token.project.displayName} from ${fromEcosystem.displayName} to ${toEcosystem.displayName}`}</span>
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
