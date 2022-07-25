import type { PoolConfig } from "./pool";
import type { TokenConfig } from "./token";

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
/** Configuration interface for Wormhole-supported blockchains */
=======
>>>>>>> def57a39 (refactor(core): Adjust wormhole properties in ChainConfig)
=======
/** Configuration interface for Wormhole-supported blockchains */
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
export interface WormholeConfig {
  /** The core (generic) VAA bridge contract */
  readonly bridge: string;
  /** The portal token bridge application contract */
  readonly portal: string;
}

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
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
=======
export interface ChainConfig {
  readonly name: string;
  readonly chainId: number;
  readonly wormhole: WormholeConfig;
>>>>>>> def57a39 (refactor(core): Adjust wormhole properties in ChainConfig)
  readonly tokens: readonly TokenConfig[];
  readonly pools: readonly PoolConfig[];
}
