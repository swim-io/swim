import { EuiLink } from "@elastic/eui";
import type { ReactElement } from "react";

import { Env, Protocol } from "../config";
import { selectConfig, selectEnv } from "../core/selectors";
import { useEnvironment } from "../core/store";

export const SolanaTxLink = ({
  txId,
}: {
  readonly txId: string;
}): ReactElement => {
  const env = useEnvironment(selectEnv);
  const { chains } = useEnvironment(selectConfig);
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
