export interface PoolConfig {
  readonly id: string;
  readonly displayName: string;
  /** Canonical address which individuates the pool */
  readonly address: string;
  readonly lpTokenId: string;
  readonly tokenIds: readonly string[];
  readonly feeDecimals: number;
  readonly isStakingPool: boolean;
  readonly isStableSwap: boolean;
  readonly isLegacyPool: boolean;
  readonly isDisabled?: boolean;
}
