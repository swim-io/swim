import { useQuery } from "react-query";

import { useConfig, useEnvironment } from "../../contexts";
import type { Interaction, InteractionType, Tx } from "../../models";
import { loadInteractions } from "../../models";

export type InteractionWithTxs = {
  readonly interaction: Interaction;
  readonly txs: readonly Tx[] | null;
};

export const useRecentInteractionIds = (
  types: readonly InteractionType[],
): readonly string[] => {
  const { env } = useEnvironment();
  const config = useConfig();
  const { data: interactionIds = [] } = useQuery(
    [env, "recentInteractions"],
    () => loadInteractions(env, config),
    {
      select: (interactions) =>
        interactions
          .filter(({ type }) => types.includes(type))
          .map(({ id }) => id),
    },
  );
  return interactionIds;
};
