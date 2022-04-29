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
  // TODO: Add real hook when Terra is supported
  const lunaBalance = new Decimal(0);
  return {
    [EcosystemId.Solana]: solBalance,
    [EcosystemId.Ethereum]: ethBalance,
    [EcosystemId.Bsc]: bnbBalance,
    [EcosystemId.Terra]: lunaBalance,
    [EcosystemId.Avalanche]: new Decimal(0), // TODO: Avalanche
    [EcosystemId.Polygon]: new Decimal(0), // TODO: Polygon
  };
};
