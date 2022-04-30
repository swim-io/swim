import { EuiLink } from "@elastic/eui";
import type { ReactElement } from "react";

export const EthereumTxLink = ({
  txId,
}: {
  readonly txId: string;
}): ReactElement => {
  return (
    <EuiLink href={`https://etherscan.io/tx/${txId}`} target="_blank">
      Etherscan
    </EuiLink>
  );
};
