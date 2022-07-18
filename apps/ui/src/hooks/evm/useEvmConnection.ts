import { EVM_PROTOCOL } from "@swim-io/evm-types";
import { useQueryClient } from "react-query";

import type { EvmEcosystemId } from "../../config";
import { useEnvironment } from "../../core/store";
import { EvmConnection } from "../../models";
import type { ReadonlyRecord } from "../../utils";
import { useEcosystem } from "../crossEcosystem/useEcosystems";

export const useEvmConnection = (
  ecosystemId: EvmEcosystemId,
): EvmConnection => {
  const queryClient = useQueryClient();
  const { env } = useEnvironment();
  const ecosystem = useEcosystem(ecosystemId);
  if (ecosystem === null || ecosystem.protocol !== EVM_PROTOCOL) {
    throw new Error("Missing ecosystem");
  }

  const queryKey = [env, "evmConnection", ecosystemId];

  const connection =
    queryClient.getQueryData<EvmConnection>(queryKey) ||
    (function createEvmConnection(): EvmConnection {
      const evmConnection = new EvmConnection(env, ecosystem.chain);
      queryClient.setQueryData(queryKey, evmConnection);
      return evmConnection;
    })();

  return connection;
};

export const useEvmConnections = (): ReadonlyRecord<
  EvmEcosystemId,
  EvmConnection
> => ({
  ethereum: useEvmConnection("ethereum"),
  bnb: useEvmConnection("bnb"),
  // [EcosystemId.Avalanche]: useEvmConnection(EcosystemId.Avalanche),
  // [EcosystemId.Polygon]: useEvmConnection(EcosystemId.Polygon),
  // [EcosystemId.Aurora]: useEvmConnection(EcosystemId.Aurora),
  // [EcosystemId.Fantom]: useEvmConnection(EcosystemId.Fantom),
  // [EcosystemId.Karura]: useEvmConnection(EcosystemId.Karura),
  // [EcosystemId.Acala]: useEvmConnection(EcosystemId.Acala),
});
