<<<<<<< HEAD
<<<<<<< HEAD
/** Ecosystem-neutral configuration object for a Swim liquidity pool */
=======
>>>>>>> aa8ce89c (feat(core): Add package)
=======
/** Ecosystem-neutral configuration object for a Swim liquidity pool */
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
export interface PoolConfig {
  readonly id: string;
  readonly displayName: string;
  /** Canonical address which individuates the pool */
  readonly address: string;
  readonly lpTokenId: string;
  readonly tokenIds: readonly string[];
  readonly feeDecimals: number;
<<<<<<< HEAD
<<<<<<< HEAD
  readonly isStableSwap: boolean;
  readonly isStakingPool: boolean;
  readonly isLegacyPool?: boolean;
=======
  readonly isStakingPool: boolean;
  readonly isStableSwap: boolean;
  readonly isLegacyPool: boolean;
>>>>>>> aa8ce89c (feat(core): Add package)
=======
  readonly isStableSwap: boolean;
  readonly isStakingPool: boolean;
  readonly isLegacyPool?: boolean;
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
  readonly isDisabled?: boolean;
}
