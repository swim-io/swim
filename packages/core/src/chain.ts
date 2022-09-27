import { findOrThrow } from "@swim-io/utils";

import type { PoolConfig } from "./pool";
import type { TokenConfig, TokenDetails } from "./token";
import { SWIM_USD_TOKEN_ID } from "./token";
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
  tokenId: string,
): TokenDetails =>
  tokenId === SWIM_USD_TOKEN_ID
    ? chainConfig.swimUsdDetails
    : findOrThrow(chainConfig.tokens, (token) => token.id === tokenId)
        .nativeDetails;
