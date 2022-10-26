import type { Decimal } from "decimal.js";

/** Ecosystem-neutral configuration object for a Swim liquidity pool */
export interface PoolConfig {
  readonly id: string;
  readonly displayName: string;
  /** Canonical address which individuates the pool */
  readonly address: string;
  readonly lpTokenId: string;
  readonly tokenIds: readonly string[];
  readonly feeDecimals: number;
  readonly isStableSwap: boolean;
  readonly isStakingPool: boolean;
  readonly isLegacyPool?: boolean;
  readonly isDisabled?: boolean;
}

export interface PoolState {
  readonly isPaused: boolean;
  readonly ampFactor: Decimal;
  readonly lpFee: Decimal;
  readonly governanceFee: Decimal;
  readonly balances: readonly Decimal[];
  readonly totalLpSupply: Decimal;
}
