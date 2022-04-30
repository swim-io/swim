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

  return {
    [EcosystemId.Solana]: splBalance,
    [EcosystemId.Ethereum]: ethereumTokenBalance,
    [EcosystemId.Terra]: null,
    [EcosystemId.Bsc]: bscTokenBalance,
    [EcosystemId.Avalanche]: null,
    [EcosystemId.Polygon]: null,
  };
};

export const useUserBalanceAmounts = (
  tokenSpec: TokenSpec | null,
): ReadonlyRecord<EcosystemId, Amount | null> => {
  const balances = useUserBalances(tokenSpec);

  const solanaBalance = balances[EcosystemId.Solana];
  const solanaAmount =
    solanaBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Solana)
      ? Amount.fromAtomicString(
          tokenSpec,
          solanaBalance.toString(),
          EcosystemId.Solana,
        )
      : null;

  const ethereumBalance = balances[EcosystemId.Ethereum];
  const ethereumAmount =
    ethereumBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Ethereum)
      ? Amount.fromAtomicString(
          tokenSpec,
          ethereumBalance.toString(),
          EcosystemId.Ethereum,
        )
      : null;

  const bscBalance = balances[EcosystemId.Bsc];
  const bscAmount =
    bscBalance && tokenSpec?.detailsByEcosystem.get(EcosystemId.Bsc)
      ? Amount.fromAtomicString(
          tokenSpec,
          bscBalance.toString(),
          EcosystemId.Bsc,
        )
      : null;

  return {
    [EcosystemId.Solana]: solanaAmount,
    [EcosystemId.Ethereum]: ethereumAmount,
    [EcosystemId.Bsc]: bscAmount,
    [EcosystemId.Terra]: null,
    [EcosystemId.Avalanche]: null,
    [EcosystemId.Polygon]: null,
  };
};
