import { EuiLink } from "@elastic/eui";
import type { ReactElement } from "react";

export const BscTxLink = ({
  txId,
}: {
  readonly txId: string;
}): ReactElement => {
  return (
    <EuiLink href={`https://bsccan.com/tx/${txId}`} target="_blank">
      BscScan
    </EuiLink>
  );
};
