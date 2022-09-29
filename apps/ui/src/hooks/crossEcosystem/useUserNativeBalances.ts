import { APTOS_ECOSYSTEM_ID } from "@swim-io/aptos";
import { EvmEcosystemId } from "@swim-io/evm";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";
import Decimal from "decimal.js";

import type { EcosystemId } from "../../config";
import { ECOSYSTEM_IDS } from "../../config";
import { useAptosGasBalanceQuery } from "../aptos";
import { useEvmUserNativeBalanceQuery } from "../evm";
import { useSolBalanceQuery } from "../solana";

export const useUserNativeBalances = (
  /** only fetch the ecosystems specified to reduce network calls */
  ecosystemIds: readonly EcosystemId[] = ECOSYSTEM_IDS,
): ReadonlyRecord<EcosystemId, Decimal> => {
  const { data: aptBalance = new Decimal(0) } = useAptosGasBalanceQuery({
    enabled: ecosystemIds.includes(APTOS_ECOSYSTEM_ID),
  });
  const { data: solBalance = new Decimal(0) } = useSolBalanceQuery({
    enabled: ecosystemIds.includes(SOLANA_ECOSYSTEM_ID),
  });
  const { data: ethBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EvmEcosystemId.Ethereum,
    { enabled: ecosystemIds.includes(EvmEcosystemId.Ethereum) },
  );
  const { data: bnbBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EvmEcosystemId.Bnb,
    { enabled: ecosystemIds.includes(EvmEcosystemId.Bnb) },
  );
  const { data: avaxBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EvmEcosystemId.Avalanche,
    { enabled: ecosystemIds.includes(EvmEcosystemId.Avalanche) },
  );
  const { data: maticBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EvmEcosystemId.Polygon,
    { enabled: ecosystemIds.includes(EvmEcosystemId.Polygon) },
  );
  const { data: auroraEthBalance = new Decimal(0) } =
    useEvmUserNativeBalanceQuery(EvmEcosystemId.Aurora, {
      enabled: ecosystemIds.includes(EvmEcosystemId.Aurora),
    });
  const { data: ftmBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EvmEcosystemId.Fantom,
    { enabled: ecosystemIds.includes(EvmEcosystemId.Fantom) },
  );
  const { data: karBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EvmEcosystemId.Karura,
    { enabled: ecosystemIds.includes(EvmEcosystemId.Karura) },
  );
  const { data: acaBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EvmEcosystemId.Acala,
    { enabled: ecosystemIds.includes(EvmEcosystemId.Acala) },
  );

  return {
    [APTOS_ECOSYSTEM_ID]: aptBalance,
    [SOLANA_ECOSYSTEM_ID]: solBalance,
    [EvmEcosystemId.Ethereum]: ethBalance,
    [EvmEcosystemId.Bnb]: bnbBalance,
    [EvmEcosystemId.Avalanche]: avaxBalance,
    [EvmEcosystemId.Polygon]: maticBalance,
    [EvmEcosystemId.Aurora]: auroraEthBalance,
    [EvmEcosystemId.Fantom]: ftmBalance,
    [EvmEcosystemId.Karura]: karBalance,
    [EvmEcosystemId.Acala]: acaBalance,
  };
};
