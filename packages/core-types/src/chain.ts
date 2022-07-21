import type { PoolConfig } from "./pool";
import type { TokenConfig } from "./token";

export interface ChainConfig {
  readonly name: string;
  readonly chainId: number;
  readonly wormholeBridge: string;
  readonly wormholeTokenBridge: string;
  readonly tokens: readonly TokenConfig[];
  readonly pools: readonly PoolConfig[];
}
