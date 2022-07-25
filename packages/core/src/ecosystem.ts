import type { ChainConfig } from "./chain";
import type { Env } from "./env";

<<<<<<< HEAD
/** Basic properties of the primary gas token used by an ecosystem */
=======
>>>>>>> aa8ce89c (feat(core): Add package)
export interface GasToken {
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
}

<<<<<<< HEAD
/** Configuration interface which any ecosystem has to support */
=======
>>>>>>> aa8ce89c (feat(core): Add package)
export interface EcosystemConfig {
  readonly protocol: string;
  readonly id: string;
  readonly wormholeChainId: number;
  readonly displayName: string;
  readonly gasToken: GasToken;
  readonly chains: ReadonlyMap<Env, ChainConfig>;
}
