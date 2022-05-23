import type { UseQueryResult } from "react-query";
import { useQuery } from "react-query";

import { EcosystemId } from "../../config";
import { selectEnv } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import type { Tx } from "../../models";
import { useRecentSolanaTxsQuery } from "../solana";

export const useSolanaTxsForInteractionQuery = (
  interactionId: string,
): UseQueryResult<readonly Tx[], Error> => {
  const env = useEnvironment(selectEnv);
  const { data = [], isSuccess } = useRecentSolanaTxsQuery();
  return useQuery(
    [env, "txsForInteraction", interactionId, EcosystemId.Solana],
    () => data.filter((tx) => tx.interactionId === interactionId),
    {
      enabled: isSuccess,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  );
};
