import { EuiLink } from "@elastic/eui";
import type { ReactElement } from "react";

import { Env, Protocol } from "../config";
import { useConfig, useEnvironment } from "../contexts";

export const SolanaTxLink = ({
  txId,
}: {
  readonly txId: string;
}): ReactElement => {
  const { env } = useEnvironment();
  const { chains } = useConfig();
  const [chain] = chains[Protocol.Solana];
  const endpointParam = env === Env.Mainnet ? "" : chain.endpoint;
  const endpointURLSuffix = endpointParam
    ? "?cluster=custom&customUrl=" + encodeURIComponent(endpointParam)
    : "";

  return (
    <EuiLink
      href={`https://explorer.solana.com/tx/${txId}${endpointURLSuffix}`}
      target="_blank"
    >
      Solana Explorer
    </EuiLink>
  );
};
