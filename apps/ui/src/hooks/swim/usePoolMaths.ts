import PoolMath from "@swim-io/pool-math";
import Decimal from "decimal.js";

import { BNtoDecimal, atomicToHuman } from "../../amounts";
import { getSolanaTokenDetails } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { Amount } from "../../models";
import { isEachNotNull } from "../../utils";

import type { PoolData } from "./usePools";
import { usePools } from "./usePools";

const getPoolMath = ({
  spec: poolSpec,
  state: poolState,
  lpToken,
  tokens: poolTokens,
  poolLpMint,
  poolTokenAccounts,
}: PoolData): PoolMath | null => {
  if (
    !poolState ||
    poolLpMint === null ||
    poolTokenAccounts === null ||
    !isEachNotNull(poolTokenAccounts)
  ) {
    return null;
  }

  const poolTokenDecimals = poolTokens.map(
    (tokenSpec) => getSolanaTokenDetails(tokenSpec).decimals,
  );

  const tokenBalances = poolTokenAccounts.map((tokenAccount, i) =>
    Amount.fromAtomicBn(poolTokens[i], tokenAccount.amount, "solana"),
  );

  // calculate amp factor
  const ampFactor = BNtoDecimal(poolState.ampFactor.targetValue.value);
  // TODO: do correct interpolation with Solana block time

  // lpFee
  const humanLpFee = atomicToHuman(
    new Decimal(poolState.lpFee),
    poolSpec.feeDecimals,
  );

  // governanceFee
  const humanGovernanceFee = atomicToHuman(
    new Decimal(poolState.governanceFee),
    poolSpec.feeDecimals,
  );

  const lpSupply = Amount.fromAtomicBn(lpToken, poolLpMint.supply, "solana");
  const maxDecimals = Math.max(...poolTokenDecimals);
  const tolerance = new Decimal(10).pow(-maxDecimals);

  return new PoolMath(
    tokenBalances.map((amount) => amount.toHuman("solana")),
    ampFactor,
    humanLpFee,
    humanGovernanceFee,
    lpSupply.toHuman("solana"),
    tolerance,
  );
};

export const usePoolMaths = (
  poolIds: readonly string[],
): readonly (PoolMath | null)[] => {
  const pools = usePools(poolIds);
  return pools.map(getPoolMath);
};

export const usePoolMath = (poolId: string) => usePoolMaths([poolId])[0];

export const usePoolMathByPoolIds = () => {
  const config = useEnvironment(selectConfig);
  const poolIds = config.pools.map(({ id }) => id);
  const pools = usePools(poolIds);
  return poolIds.reduce(
    (accumulator, id, i) => ({
      ...accumulator,
      [id]: getPoolMath(pools[i]),
    }),
    {},
  );
};
