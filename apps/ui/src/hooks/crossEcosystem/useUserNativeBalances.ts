import type { ReadonlyRecord } from "@swim-io/utils";
import Decimal from "decimal.js";

import { ECOSYSTEM_IDS, EcosystemId } from "../../config";
import { useEvmUserNativeBalanceQuery } from "../evm";
import { useSolBalanceQuery } from "../solana";

export const useUserNativeBalances = (
  /** only fetch the ecosystems specified to reduce network calls */
  ecosystemIds: readonly EcosystemId[] = ECOSYSTEM_IDS,
): ReadonlyRecord<EcosystemId, Decimal> => {
  const { data: solBalance = new Decimal(0) } = useSolBalanceQuery({
    enabled: ecosystemIds.includes(EcosystemId.Solana),
  });
  const { data: ethBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EcosystemId.Ethereum,
    { enabled: ecosystemIds.includes(EcosystemId.Ethereum) },
  );
  const { data: bnbBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EcosystemId.Bnb,
    { enabled: ecosystemIds.includes(EcosystemId.Bnb) },
  );
  const { data: avaxBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EcosystemId.Avalanche,
    { enabled: ecosystemIds.includes(EcosystemId.Avalanche) },
  );
  const { data: maticBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EcosystemId.Polygon,
    { enabled: ecosystemIds.includes(EcosystemId.Polygon) },
  );
  const { data: auroraEthBalance = new Decimal(0) } =
    useEvmUserNativeBalanceQuery(EcosystemId.Aurora, {
      enabled: ecosystemIds.includes(EcosystemId.Aurora),
    });
  const { data: ftmBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EcosystemId.Fantom,
    { enabled: ecosystemIds.includes(EcosystemId.Fantom) },
  );
  const { data: karBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EcosystemId.Karura,
    { enabled: ecosystemIds.includes(EcosystemId.Karura) },
  );
  const { data: acaBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EcosystemId.Acala,
    { enabled: ecosystemIds.includes(EcosystemId.Acala) },
  );

  return {
    [EcosystemId.Solana]: solBalance,
    [EcosystemId.Ethereum]: ethBalance,
    [EcosystemId.Bnb]: bnbBalance,
    [EcosystemId.Avalanche]: avaxBalance,
    [EcosystemId.Polygon]: maticBalance,
    [EcosystemId.Aurora]: auroraEthBalance,
    [EcosystemId.Fantom]: ftmBalance,
    [EcosystemId.Karura]: karBalance,
    [EcosystemId.Acala]: acaBalance,
  };
};
