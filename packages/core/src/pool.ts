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
