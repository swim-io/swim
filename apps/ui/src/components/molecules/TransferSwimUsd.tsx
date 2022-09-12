import type { VFC } from "react";

import type { EcosystemId } from "../../config";
import { useSwimUsd } from "../../hooks";

import { Transfer } from "./Transfer/Transfer";

interface Props {
  readonly from: EcosystemId;
  readonly to: EcosystemId;
  readonly isLoading: boolean;
  readonly txId: string | null;
}

export const TransferSwimUsd: VFC<Props> = ({ from, to, isLoading, txId }) => {
  const swimUsd = useSwimUsd();
  if (swimUsd === null) {
    return null;
  }
  return (
    <Transfer
      from={from}
      to={to}
      token={swimUsd}
      isLoading={isLoading}
      transactions={
        txId === null
          ? []
          : [
              {
                txId,
                ecosystem: from,
              },
            ]
      }
    />
  );
};
