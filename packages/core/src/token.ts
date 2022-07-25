<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
/**
 * A token project incorporates one or more tokens. For example USDT has deployments on several
 * different chains, which are technically independent tokens but share many features. Note that
 * these are not wrapped versions of some single original token.
 */
<<<<<<< HEAD
=======
>>>>>>> aa8ce89c (feat(core): Add package)
=======
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
export interface TokenProject {
  readonly id: string;
  readonly symbol: string;
  readonly displayName: string;
  /** URL of an icon for the token */
  readonly icon: string;
  readonly isStablecoin: boolean;
  readonly isLp: boolean;
}

<<<<<<< HEAD
<<<<<<< HEAD
/** Ecosystem-specific details for a token which may vary between a native token and its wrapped versions */
=======
>>>>>>> aa8ce89c (feat(core): Add package)
=======
/** Ecosystem-specific details for a token which may vary between a native token and its wrapped versions */
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
export interface TokenDetails {
  readonly address: string;
  readonly decimals: number;
}

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
/**
 * Ecosystem-neutral config for a token which has a native ecosystem and may or may not have
 * wrapped versions on other ecosystems
 * */
export interface TokenConfig {
  readonly id: string;
  /** The ID of the token project to which this token belongs */
<<<<<<< HEAD
=======
export interface TokenConfig {
  readonly id: string;
>>>>>>> aa8ce89c (feat(core): Add package)
=======
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
  readonly projectId: string;
  readonly nativeEcosystemId: string;
  readonly nativeDetails: TokenDetails;
  /**
<<<<<<< HEAD
<<<<<<< HEAD
   * Map from ecosystem ID to token details for that chain.
=======
   * A map from ecosystem ID to token details for that chain.
>>>>>>> aa8ce89c (feat(core): Add package)
=======
   * Map from ecosystem ID to token details for that chain.
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
   * Required for legacy pool support.
   */
  readonly wrappedDetails: ReadonlyMap<string, TokenDetails>;
  readonly isDisabled?: boolean;
}
