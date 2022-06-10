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
  const { data: auroraTxs = null } = useRecentEvmTxsQuery(
    EcosystemId.Aurora,
    recentInteractionIds,
  );
  const { data: fantomTxs = null } = useRecentEvmTxsQuery(
    EcosystemId.Fantom,
    recentInteractionIds,
  );
  const { data: karuraTxs = null } = useRecentEvmTxsQuery(
    EcosystemId.Karura,
    recentInteractionIds,
  );
  const { data: acalaTxs = null } = useRecentEvmTxsQuery(
    EcosystemId.Acala,
    recentInteractionIds,
  );

  return {
    [EcosystemId.Solana]: solanaTxs,
    [EcosystemId.Ethereum]: ethereumTxs,
    [EcosystemId.Bsc]: bscTxs,
    [EcosystemId.Avalanche]: avalancheTxs,
    [EcosystemId.Polygon]: polygonTxs,
    [EcosystemId.Aurora]: auroraTxs,
    [EcosystemId.Fantom]: fantomTxs,
    [EcosystemId.Karura]: karuraTxs,
    [EcosystemId.Acala]: acalaTxs,
  };
};
