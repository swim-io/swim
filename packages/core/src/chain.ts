import type { PoolConfig } from "./pool";
import type { TokenConfig } from "./token";

export interface WormholeConfig {
  /** The core (generic) VAA bridge contract */
  readonly bridge: string;
  /** The portal token bridge application contract */
  readonly portal: string;
}

export interface ChainConfig {
  readonly name: string;
  readonly chainId: number;
  readonly wormhole: WormholeConfig;
  readonly tokens: readonly TokenConfig[];
  readonly pools: readonly PoolConfig[];
}
