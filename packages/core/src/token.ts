import type { TokenProjectId } from "@swim-io/token-projects";

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
  readonly projectId: TokenProjectId;
  readonly nativeDetails: TokenDetails;
  readonly isDisabled?: boolean;
}
