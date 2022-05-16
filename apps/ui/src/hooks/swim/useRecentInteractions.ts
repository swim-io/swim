import { useMemo } from "react";
import { useQuery } from "react-query";

import type { EcosystemId } from "../../config";
import { selectConfig, selectEnv } from "../../core/selectors";
import { useEnvironmentStore } from "../../core/store";
import type { Interaction, Tx } from "../../models";
import { loadInteractions } from "../../models";
import type { ReadonlyRecord } from "../../utils";
import { isNotNull } from "../../utils";
import { useRecentTxs } from "../crossEcosystem";

export type InteractionWithTxs = {
  readonly interaction: Interaction;
  readonly txs: readonly Tx[] | null;
};

export const useRecentInteractions = (): ReadonlyRecord<
  string, // Interaction ID
  InteractionWithTxs | undefined
> => {
  const env = useEnvironmentStore(selectEnv);
  const config = useEnvironmentStore(selectConfig);
  const { data: interactions = [] } = useQuery(["interactions"], () =>
    loadInteractions(env, config),
  );
  const interactionIds = useMemo(
    () => interactions.map((interaction) => interaction.id),
    [interactions],
  );
  const recentTxs = useRecentTxs(interactionIds);

  return interactions.reduce((processedInteractions, interaction) => {
    const requiredEcosystems = Object.entries(interaction.connectedWallets)
      .filter(([_, address]) => isNotNull(address))
      .map(([ecosystem]) => ecosystem as EcosystemId);
    const didTxsLoad = requiredEcosystems.every((ecosystem) =>
      isNotNull(recentTxs[ecosystem]),
    );

    const txs = didTxsLoad
      ? Object.values(recentTxs)
          .filter(isNotNull)
          .reduce<readonly Tx[]>(
            (filteredTxs, txsByEcosystem) => [
              ...filteredTxs,
              ...txsByEcosystem.filter(
                (tx) => tx.interactionId === interaction.id,
              ),
            ],
            [],
          )
      : null;
    return {
      ...processedInteractions,
      [interaction.id]: {
        interaction,
        txs,
      },
    };
  }, {});
};
