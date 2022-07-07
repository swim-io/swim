export enum Env {
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Local = "Local",
  Custom = "Custom",
}

export interface ChainConfig<E extends string, C extends number> {
  readonly name: string;
  readonly env: Env;
  readonly ecosystemId: E;
  readonly chainId: C;
  readonly wormholeBridge: string;
  readonly wormholeTokenBridge: string;
}

export interface GasToken {
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
}

export interface EcosystemConfig<
  P extends string,
  E extends string,
  W extends number,
  C extends number,
> {
  readonly id: E;
  readonly protocol: P;
  readonly wormholeChainId: W;
  readonly displayName: string;
  readonly gasToken: GasToken;
  readonly chains: readonly ChainConfig<E, C>[];
}

export interface EcosystemPlugin<
  Protocol extends string,
  EcosystemId extends string,
  WormholeChainId extends number,
  ChainId extends number,
  C extends ChainConfig<EcosystemId, ChainId>,
> {
  readonly protocol: Protocol;
  readonly id: EcosystemId;
  readonly wormholeChainId: WormholeChainId;
  readonly displayName: string;
  readonly gasToken: GasToken;
  readonly presetChains: ReadonlyMap<Env, ChainConfig<EcosystemId, ChainId>>;
  readonly createEcosystemConfig: (
    chains?: readonly C[],
  ) => EcosystemConfig<Protocol, EcosystemId, WormholeChainId, ChainId>;
}
