import type { PoolConfig } from "./pool";
import type { TokenConfig } from "./token";
import type { WormholeChainConfig } from "./wormhole";

/** Ecosystem-neutral blockchain configuration interface */
export interface ChainConfig {
  readonly name: string;
  readonly chainId: number;
  readonly wormhole: WormholeChainConfig;
  readonly tokens: readonly TokenConfig[];
  readonly pools: readonly PoolConfig[];
}
