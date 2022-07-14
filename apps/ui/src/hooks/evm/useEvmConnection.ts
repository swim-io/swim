import { EVM_PROTOCOL } from "@swim-io/evm-types";
import { BNB_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-bnb";
import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";
import { useQueryClient } from "react-query";
import shallow from "zustand/shallow.js";

import type { EvmEcosystemId } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { EvmConnection } from "../../models";
import { findOrThrow } from "../../utils";
import type { ReadonlyRecord } from "../../utils";

export const useEvmConnection = (
  ecosystemId: EvmEcosystemId,
): EvmConnection => {
  const queryClient = useQueryClient();
  const { env } = useEnvironment();
  const { chains } = useEnvironment(selectConfig, shallow);
  const chainSpec = findOrThrow(
    chains[EVM_PROTOCOL],
    (chain) => chain.ecosystem === ecosystemId,
  );

  const queryKey = [env, "evmConnection", ecosystemId];

  const connection =
    queryClient.getQueryData<EvmConnection>(queryKey) ||
    (function createEvmConnection(): EvmConnection {
      const evmConnection = new EvmConnection(env, chainSpec);
      queryClient.setQueryData(queryKey, evmConnection);
      return evmConnection;
    })();

  return connection;
};

export const useEvmConnections = (): ReadonlyRecord<
  EvmEcosystemId,
  EvmConnection
> => ({
  [ETHEREUM_ECOSYSTEM_ID]: useEvmConnection(ETHEREUM_ECOSYSTEM_ID),
  [BNB_ECOSYSTEM_ID]: useEvmConnection(BNB_ECOSYSTEM_ID),
  [EcosystemId.Avalanche]: useEvmConnection(EcosystemId.Avalanche),
  [EcosystemId.Polygon]: useEvmConnection(EcosystemId.Polygon),
  [EcosystemId.Aurora]: useEvmConnection(EcosystemId.Aurora),
  [EcosystemId.Fantom]: useEvmConnection(EcosystemId.Fantom),
  [EcosystemId.Karura]: useEvmConnection(EcosystemId.Karura),
  [EcosystemId.Acala]: useEvmConnection(EcosystemId.Acala),
});
