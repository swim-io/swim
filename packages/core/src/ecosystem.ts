import type { ChainConfig } from "./chain";
import type { Env } from "./env";

<<<<<<< HEAD
<<<<<<< HEAD
/** Basic properties of the primary gas token used by an ecosystem */
=======
>>>>>>> aa8ce89c (feat(core): Add package)
=======
/** Basic properties of the primary gas token used by an ecosystem */
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
export interface GasToken {
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
}

<<<<<<< HEAD
<<<<<<< HEAD
/** Configuration interface which any ecosystem has to support */
=======
>>>>>>> aa8ce89c (feat(core): Add package)
=======
/** Configuration interface which any ecosystem has to support */
>>>>>>> 527a7a8a (docs(core): Add docstrings to types)
export interface EcosystemConfig {
  readonly protocol: string;
  readonly id: string;
  readonly wormholeChainId: number;
  readonly displayName: string;
  readonly gasToken: GasToken;
  readonly chains: ReadonlyMap<Env, ChainConfig>;
}
