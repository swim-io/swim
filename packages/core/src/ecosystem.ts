import type { ChainConfig } from "./chain";
import type { Env } from "./env";

/** Basic properties of the primary gas token used by an ecosystem */
export interface GasToken {
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
}

/** Configuration interface which any ecosystem has to support */
export interface EcosystemConfig {
  readonly protocol: string;
  readonly id: string;
  readonly wormholeChainId: number;
  readonly displayName: string;
  readonly gasToken: GasToken;
  readonly chains: ReadonlyMap<Env, ChainConfig>;
}
