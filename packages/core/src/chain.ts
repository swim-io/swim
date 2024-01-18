import { TokenProjectId } from "@swim-io/token-projects";
import { findOrThrow } from "@swim-io/utils";

import type { PoolConfig } from "./pool";
import type { TokenConfig, TokenDetails } from "./token";
import type { WormholeChainConfig } from "./wormhole";

/** Ecosystem-neutral blockchain configuration interface */
export interface ChainConfig {
  readonly name: string;
  readonly chainId: number;
  readonly wormhole: WormholeChainConfig;
  readonly publicRpcUrls: readonly string[];
  readonly swimUsdDetails: TokenDetails;
  readonly routingContractAddress: string;
  readonly tokens: readonly TokenConfig[];
  readonly pools: readonly PoolConfig[];
}

export const getTokenDetails = (
  chainConfig: ChainConfig,
  /** @todo to be removed: legacy v1 token project id */
  tokenProjectId: TokenProjectId | `${string}-v1`,
): TokenDetails =>
  tokenProjectId === TokenProjectId.SwimUsd
    ? chainConfig.swimUsdDetails
    : findOrThrow(
        chainConfig.tokens,
        (token) => token.projectId === tokenProjectId,
      ).nativeDetails;
