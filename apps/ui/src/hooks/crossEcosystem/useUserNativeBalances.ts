import { BNB_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-bnb";
import { ETHEREUM_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-ethereum";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";
import Decimal from "decimal.js";

import type { EcosystemId } from "../../config";
import type { ReadonlyRecord } from "../../utils";
import { useEvmUserNativeBalanceQuery } from "../evm";
import { useSolBalanceQuery } from "../solana";

export const useUserNativeBalances = (): ReadonlyRecord<
  EcosystemId,
  Decimal
> => {
  const { data: solBalance = new Decimal(0) } = useSolBalanceQuery();
  const { data: ethBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
    ETHEREUM_ECOSYSTEM_ID,
  );
  const { data: bnbBalance = new Decimal(0) } =
    useEvmUserNativeBalanceQuery(BNB_ECOSYSTEM_ID);
  // const { data: avaxBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
  //   EcosystemId.Avalanche,
  // );
  // const { data: maticBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
  //   EcosystemId.Polygon,
  // );
  // const { data: auroraEthBalance = new Decimal(0) } =
  //   useEvmUserNativeBalanceQuery(EcosystemId.Aurora);
  // const { data: ftmBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
  //   EcosystemId.Fantom,
  // );
  // const { data: karBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
  //   EcosystemId.Karura,
  // );
  // const { data: acaBalance = new Decimal(0) } = useEvmUserNativeBalanceQuery(
  //   EcosystemId.Acala,
  // );

  return {
    [SOLANA_ECOSYSTEM_ID]: solBalance,
    [ETHEREUM_ECOSYSTEM_ID]: ethBalance,
    [BNB_ECOSYSTEM_ID]: bnbBalance,
    // [EcosystemId.Avalanche]: avaxBalance,
    // [EcosystemId.Polygon]: maticBalance,
    // [EcosystemId.Aurora]: auroraEthBalance,
    // [EcosystemId.Fantom]: ftmBalance,
    // [EcosystemId.Karura]: karBalance,
    // [EcosystemId.Acala]: acaBalance,
  };
};
