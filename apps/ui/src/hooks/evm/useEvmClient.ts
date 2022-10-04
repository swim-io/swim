import type { EvmClient, EvmEcosystemId } from "@swim-io/evm";
import { useContext } from "react";

import { GetEvmClientContext } from "../../contexts";

export const useEvmClients = (
  ecosystemIds: readonly EvmEcosystemId[],
): readonly EvmClient[] => {
  const getEvmClient = useContext(GetEvmClientContext);
  return ecosystemIds.map(getEvmClient);
};

export const useEvmClient = (ecosystemId: EvmEcosystemId): EvmClient =>
  useEvmClients([ecosystemId])[0];

export const useGetEvmClient = () => useContext(GetEvmClientContext);
