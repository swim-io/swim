export enum Env {
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Local = "Local",
  Custom = "Custom",
}

export const isValidEnv = (envValue: string): envValue is Env =>
  (Object.values(Env) as readonly string[]).includes(envValue);

export interface ChainConfig {
  readonly name: string;
  readonly chainId: number;
  readonly wormholeBridge: string;
  readonly wormholeTokenBridge: string;
}

export interface GasToken {
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
}

export interface EcosystemConfig<> {
  readonly protocol: string;
  readonly id: string;
  readonly wormholeChainId: number;
  readonly displayName: string;
  readonly gasToken: GasToken;
  readonly chains: ReadonlyMap<Env, ChainConfig>;
}

export interface Tx {
  readonly ecosystemId: string;
  readonly txId: string;
  /** The time in seconds since Unix epoch */
  readonly timestamp: number | null;
  readonly interactionId: string | null;
}
