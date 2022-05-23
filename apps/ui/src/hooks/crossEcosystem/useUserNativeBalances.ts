import Decimal from "decimal.js";

import { EcosystemId } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { useEvmUserNativeBalanceQuery } from "../evm";
import { useSolBalanceQuery } from "../solana";

export const useUserNativeBalances = (): ReadonlyRecord<
  EcosystemId,
  Decimal
> => {
  const { data: solBalance = new Decimal(0) } = useSolBalanceQuery();
  const { data: ethBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EcosystemId.Ethereum,
  );
  const { data: bnbBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EcosystemId.Bsc,
  );
  const { data: avaxBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EcosystemId.Avalanche,
  );
  const { data: maticBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    EcosystemId.Polygon,
  );
  // TODO: Add real hookS when ecosystems are supported
  const lunaBalance = new Decimal(0);
  const auroraEthBalance = new Decimal(0);
  const ftmBalance = new Decimal(0);
  const acaBalance = new Decimal(0);
  return {
    [EcosystemId.Solana]: solBalance,
    [EcosystemId.Ethereum]: ethBalance,
    [EcosystemId.Bsc]: bnbBalance,
    [EcosystemId.Terra]: lunaBalance,
    [EcosystemId.Avalanche]: avaxBalance,
    [EcosystemId.Polygon]: maticBalance,
    [EcosystemId.Aurora]: auroraEthBalance,
    [EcosystemId.Fantom]: ftmBalance,
    [EcosystemId.Acala]: acaBalance,
  };
};
