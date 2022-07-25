export interface TokenProject {
  readonly id: string;
  readonly symbol: string;
  readonly displayName: string;
  /** URL of an icon for the token */
  readonly icon: string;
  readonly isStablecoin: boolean;
  readonly isLp: boolean;
}

export interface TokenDetails {
  readonly address: string;
  readonly decimals: number;
}

export interface TokenConfig {
  readonly id: string;
  readonly projectId: string;
  readonly nativeEcosystemId: string;
  readonly nativeDetails: TokenDetails;
  /**
   * A map from ecosystem ID to token details for that chain.
   * Required for legacy pool support.
   */
  readonly wrappedDetails: ReadonlyMap<string, TokenDetails>;
  readonly isDisabled?: boolean;
}
