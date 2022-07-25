<<<<<<< HEAD
/** Ecosystem-neutral configuration object for a Swim liquidity pool */
=======
>>>>>>> aa8ce89c (feat(core): Add package)
export interface PoolConfig {
  readonly id: string;
  readonly displayName: string;
  /** Canonical address which individuates the pool */
  readonly address: string;
  readonly lpTokenId: string;
  readonly tokenIds: readonly string[];
  readonly feeDecimals: number;
<<<<<<< HEAD
  readonly isStableSwap: boolean;
  readonly isStakingPool: boolean;
  readonly isLegacyPool?: boolean;
=======
  readonly isStakingPool: boolean;
  readonly isStableSwap: boolean;
  readonly isLegacyPool: boolean;
>>>>>>> aa8ce89c (feat(core): Add package)
  readonly isDisabled?: boolean;
}
