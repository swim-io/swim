export enum Env {
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Local = "Local",
  Custom = "Custom",
}

export const isValidEnv = (envValue: string): envValue is Env =>
  (Object.values(Env) as readonly string[]).includes(envValue);

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
  Protocol extends string,
  EcosystemId extends string,
  WormholeChainId extends number,
  ChainId extends number,
  CC extends ChainConfig<EcosystemId, ChainId> = ChainConfig<
    EcosystemId,
    ChainId
  >,
> {
  readonly protocol: Protocol;
  readonly id: EcosystemId;
  readonly wormholeChainId: WormholeChainId;
  readonly displayName: string;
  readonly gasToken: GasToken;
  readonly chains: readonly CC[];
}

export interface EcosystemPlugin<
  Protocol extends string,
  EcosystemId extends string,
  WormholeChainId extends number,
  ChainId extends number,
  CC extends ChainConfig<EcosystemId, ChainId> = ChainConfig<
    EcosystemId,
    ChainId
  >,
> {
  readonly protocol: Protocol;
  readonly id: EcosystemId;
  readonly wormholeChainId: WormholeChainId;
  readonly displayName: string;
  readonly gasToken: GasToken;
  readonly presetChains: ReadonlyMap<Env, CC>;
  readonly createEcosystemConfig: (
    chains?: readonly CC[],
  ) => EcosystemConfig<Protocol, EcosystemId, WormholeChainId, ChainId, CC>;
}
