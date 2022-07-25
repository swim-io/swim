/**
 * A token project incorporates one or more tokens. For example USDT has deployments on several
 * different chains, which are technically independent tokens but share many features. Note that
 * these are not wrapped versions of some single original token.
 */
export interface TokenProject {
  readonly id: string;
  readonly symbol: string;
  readonly displayName: string;
  /** URL of an icon for the token */
  readonly icon: string;
  readonly isStablecoin: boolean;
  readonly isLp: boolean;
}

/** Ecosystem-specific details for a token which may vary between a native token and its wrapped versions */
export interface TokenDetails {
  readonly address: string;
  readonly decimals: number;
}

/**
 * Ecosystem-neutral config for a token which has a native ecosystem and may or may not have
 * wrapped versions on other ecosystems
 * */
export interface TokenConfig {
  readonly id: string;
  /** The ID of the token project to which this token belongs */
  readonly projectId: string;
  readonly nativeEcosystemId: string;
  readonly nativeDetails: TokenDetails;
  /**
   * Map from ecosystem ID to token details for that chain.
   * Required for legacy pool support.
   */
  readonly wrappedDetails: ReadonlyMap<string, TokenDetails>;
  readonly isDisabled?: boolean;
}
