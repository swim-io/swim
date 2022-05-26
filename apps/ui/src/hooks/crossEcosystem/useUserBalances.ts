import type Decimal from "decimal.js";

import type { TokenSpec } from "../../config";
import { EcosystemId } from "../../config";
import { Amount } from "../../models";
import type { ReadonlyRecord } from "../../utils";
import { useErc20BalanceQuery } from "../evm";
import { useSplUserBalance } from "../solana";

export const useUserBalances = (
  tokenSpec: TokenSpec | null,
): ReadonlyRecord<EcosystemId, Decimal | null> => {
  // order of hooks can't change, so we pass in null values if we don't actually need the value
  const splBalance = useSplUserBalance(
    tokenSpec?.detailsByEcosystem.get(EcosystemId.Solana)?.address ?? null,
  );
  const { data: ethereumTokenBalance = null } = useErc20BalanceQuery(
    EcosystemId.Ethereum,
    tokenSpec?.detailsByEcosystem.get(EcosystemId.Ethereum)?.address ?? null,
  );
  const { data: bscTokenBalance = null } = useErc20BalanceQuery(
    EcosystemId.Bsc,
    tokenSpec?.detailsByEcosystem.get(EcosystemId.Bsc)?.address ?? null,
  );
  const { data: avalancheTokenBalance = null } = useErc20BalanceQuery(
    EcosystemId.Avalanche,
    tokenSpec?.detailsByEcosystem.get(EcosystemId.Avalanche)?.address ?? null,
  );
  const { data: polygonTokenBalance = null } = useErc20BalanceQuery(
    EcosystemId.Polygon,
    tokenSpec?.detailsByEcosystem.get(EcosystemId.Polygon)?.address ?? null,
  );

  return {
    [EcosystemId.Solana]: splBalance,
    [EcosystemId.Ethereum]: ethereumTokenBalance,
    [EcosystemId.Terra]: null,
    [EcosystemId.Bsc]: bscTokenBalance,
    [EcosystemId.Avalanche]: avalancheTokenBalance,
    [EcosystemId.Polygon]: polygonTokenBalance,
    [EcosystemId.Aurora]: null,
    [EcosystemId.Fantom]: null,
    [EcosystemId.Karura]: null,
    [EcosystemId.Acala]: null,
  };
};

export const useUserBalanceAmounts = (
  tokenSpec: TokenSpec | null,
): ReadonlyRecord<EcosystemId, Amount | null> => {
  const {
    solana: solanaBalance,
    ethereum: ethereumBalance,
    bsc: bscBalance,
    avalanche: avalancheBalance,
    polygon: polygonBalance,
  } = useUserBalances(tokenSpec);

  const solanaAmount =
    solanaBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Solana)
      ? Amount.fromAtomicString(
          tokenSpec,
          solanaBalance.toString(),
          EcosystemId.Solana,
        )
      : null;

  const ethereumAmount =
    ethereumBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Ethereum)
      ? Amount.fromAtomicString(
          tokenSpec,
          ethereumBalance.toString(),
          EcosystemId.Ethereum,
        )
      : null;

  const bscAmount =
    bscBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Bsc)
      ? Amount.fromAtomicString(
          tokenSpec,
          bscBalance.toString(),
          EcosystemId.Bsc,
        )
      : null;

  const avalancheAmount =
    avalancheBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Avalanche)
      ? Amount.fromAtomicString(
          tokenSpec,
          avalancheBalance.toString(),
          EcosystemId.Avalanche,
        )
      : null;

  const polygonAmount =
    polygonBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Polygon)
      ? Amount.fromAtomicString(
          tokenSpec,
          polygonBalance.toString(),
          EcosystemId.Polygon,
        )
      : null;

  return {
    [EcosystemId.Solana]: solanaAmount,
    [EcosystemId.Ethereum]: ethereumAmount,
    [EcosystemId.Bsc]: bscAmount,
    [EcosystemId.Terra]: null,
    [EcosystemId.Avalanche]: avalancheAmount,
    [EcosystemId.Polygon]: polygonAmount,
    [EcosystemId.Aurora]: null,
    [EcosystemId.Fantom]: null,
    [EcosystemId.Karura]: null,
    [EcosystemId.Acala]: null,
  };
};
