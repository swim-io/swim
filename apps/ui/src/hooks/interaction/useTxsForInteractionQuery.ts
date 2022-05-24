import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { EcosystemId } from "../../config";
import { useEnvironment } from "../../contexts";
import type { Tx } from "../../models";

import { useEvmTxsForInteractionQuery } from "./useEvmTxsForInteractionQuery";
import { useInteraction } from "./useInteraction";
import { useRequiredEcosystemsForInteraction } from "./useRequiredEcosystemsForInteraction";
import { useSolanaTxsForInteractionQuery } from "./useSolanaTxsForInteractionQuery";

export const useTxsForInteractionQuery = (
  interactionId: string,
): UseQueryResult<readonly Tx[], Error> => {
  const { env } = useEnvironment();
  const interaction = useInteraction(interactionId);
  const txQueries = {
    [EcosystemId.Solana]: useSolanaTxsForInteractionQuery(interactionId),
    [EcosystemId.Ethereum]: useEvmTxsForInteractionQuery(
      EcosystemId.Ethereum,
      interactionId,
    ),
    [EcosystemId.Bsc]: useEvmTxsForInteractionQuery(
      EcosystemId.Bsc,
      interactionId,
    ),
    [EcosystemId.Avalanche]: useEvmTxsForInteractionQuery(
      EcosystemId.Avalanche,
      interactionId,
    ),
    [EcosystemId.Polygon]: useEvmTxsForInteractionQuery(
      EcosystemId.Polygon,
      interactionId,
    ),
    [EcosystemId.Terra]: useQuery({ enabled: false }),
    [EcosystemId.Aurora]: useQuery({ enabled: false }),
    [EcosystemId.Fantom]: useQuery({ enabled: false }),
    [EcosystemId.Acala]: useQuery({ enabled: false }),
  };
  const requiredEcosystems = [
    ...useRequiredEcosystemsForInteraction(interaction).values(),
  ];
  return useQuery(
    [env, "txsForInteraction", interactionId],
    async () =>
      requiredEcosystems.map((ecosystem) => txQueries[ecosystem].data).flat(),
    {
      enabled: requiredEcosystems.every(
        (ecosystem) => txQueries[ecosystem].isSuccess,
      ),
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );
};
