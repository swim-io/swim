import { EuiListGroup } from "@elastic/eui";
import type { FC, VFC } from "react";

import type { EcosystemId } from "../../config";

import { TxListItem } from "./TxListItem";

type TxEcosystemListProps = {
  readonly ecosystemId: EcosystemId;
  readonly transactions: ReadonlyArray<string>;
};

const Root: FC = ({ children }) => (
  <EuiListGroup gutterSize="none" flush maxWidth={200} showToolTips>
    {children}
  </EuiListGroup>
);

export const TxEcosystemList: VFC<TxEcosystemListProps> = ({
  ecosystemId,
  transactions,
}) => (
  <Root>
    {transactions.map((txId) => (
      <TxListItem key={txId} txId={txId} ecosystem={ecosystemId} />
    ))}
  </Root>
);

type TxListProps = {
  readonly transactions: ReadonlyArray<{
    readonly txId: string;
    readonly ecosystem: EcosystemId;
  }>;
};

export const TxList: VFC<TxListProps> = ({ transactions }) => (
  <Root>
    {transactions.map(({ ecosystem, txId }) => (
      <TxListItem key={txId} txId={txId} ecosystem={ecosystem} />
    ))}
  </Root>
);
