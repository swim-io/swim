import type { PoolConfig } from "./pool";
import type { TokenConfig } from "./token";

<<<<<<< HEAD
/** Configuration interface for Wormhole-supported blockchains */
export interface WormholeConfig {
  /** The core (generic) VAA bridge contract */
  readonly bridge: string;
  /** The portal token bridge application contract */
  readonly portal: string;
}

/** Ecosystem-neutral blockchain configuration interface */
export interface ChainConfig {
  readonly name: string;
  readonly chainId: number;
  readonly wormhole: WormholeConfig;
=======
export interface ChainConfig {
  readonly name: string;
  readonly chainId: number;
  readonly wormholeBridge: string;
  readonly wormholeTokenBridge: string;
>>>>>>> aa8ce89c (feat(core): Add package)
  readonly tokens: readonly TokenConfig[];
  readonly pools: readonly PoolConfig[];
}
