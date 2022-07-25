import type { ChainConfig } from "./chain";
import type { Env } from "./env";

export interface GasToken {
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
}

export interface EcosystemConfig {
  readonly protocol: string;
  readonly id: string;
  readonly wormholeChainId: number;
  readonly displayName: string;
  readonly gasToken: GasToken;
  readonly chains: ReadonlyMap<Env, ChainConfig>;
}
