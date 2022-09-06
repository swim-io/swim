import type { EvmEcosystemId } from "@swim-io/evm";
import { useContext } from "react";

import { GetEvmConnectionContext } from "../../contexts";
import type { EvmConnection } from "../../models";

export const useEvmConnections = (
  ecosystemIds: readonly EvmEcosystemId[],
): readonly EvmConnection[] => {
  const getEvmConnection = useContext(GetEvmConnectionContext);
  return ecosystemIds.map(getEvmConnection);
};

export const useEvmConnection = (ecosystemId: EvmEcosystemId): EvmConnection =>
  useEvmConnections([ecosystemId])[0];

export const useGetEvmConnection = () => useContext(GetEvmConnectionContext);
