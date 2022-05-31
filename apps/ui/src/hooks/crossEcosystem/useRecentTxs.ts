import { useMemo } from "react";

import { EcosystemId } from "../../config";
import type { Tx } from "../../models";
import type { ReadonlyRecord } from "../../utils";
import { useRecentEvmTxsQuery } from "../evm";
import { useRecentSolanaTxsQuery } from "../solana";

export const useRecentTxs = (
  recentInteractionIds: readonly string[],
): ReadonlyRecord<EcosystemId, readonly Tx[] | null> => {
  const { data: solanaTxs = null } = useRecentSolanaTxsQuery();
  const { data: ethereumTxs = null } = useRecentEvmTxsQuery(
    EcosystemId.Ethereum,
    recentInteractionIds,
  );
  const { data: bscTxs = null } = useRecentEvmTxsQuery(
    EcosystemId.Bsc,
    recentInteractionIds,
  );
  const { data: avalancheTxs = null } = useRecentEvmTxsQuery(
    EcosystemId.Avalanche,
    recentInteractionIds,
  );
  const { data: polygonTxs = null } = useRecentEvmTxsQuery(
    EcosystemId.Polygon,
    recentInteractionIds,
  );

  return useMemo(
    () => ({
      [EcosystemId.Solana]: solanaTxs,
      [EcosystemId.Ethereum]: ethereumTxs,
      [EcosystemId.Bsc]: bscTxs,
      [EcosystemId.Terra]: null,
      [EcosystemId.Avalanche]: avalancheTxs,
      [EcosystemId.Polygon]: polygonTxs,
      [EcosystemId.Aurora]: null,
      [EcosystemId.Fantom]: null,
      [EcosystemId.Karura]: null,
      [EcosystemId.Acala]: null,
    }),
    [solanaTxs, ethereumTxs, bscTxs, avalancheTxs, polygonTxs],
  );
};
