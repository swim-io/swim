import type { ChainConfig, EcosystemConfig, GasToken } from "@swim-io/core-types";

// export interface EvmChainConfig extends ChainConfig {
//   readonly ecosystem: string,
//   /** This should be unique for a given Env */
//   readonly chainId: number;
//   readonly chainName: string;
//   readonly rpcUrls: readonly string[];
// }

// export interface EvmEcosystemConfig extends EcosystemConfig {
//   readonly chains: readonly EvmChainConfig[];
// }

// export const EVM_PROTOCOL = "evm" as const;

// evm-types
export type EvmProtocol = "evm";
export const EVM_PROTOCOL: EvmProtocol = "evm";

export interface EvmChainConfig<E extends string, C extends number>
  extends ChainConfig<E, C> {
  readonly rpcUrls: readonly string[];
}

export interface EvmEcosystemConfig<
  E extends string,
  W extends number,
  C extends number,
> extends EcosystemConfig<EvmProtocol, E, W, C> {
  readonly chains: readonly EvmChainConfig<E, C>[];
}

export const createEvmEcosystemConfigPlugin =
  <E extends string, W extends number, C extends number>(
    ecosystemId: E,
    wormholeChainId: W,
    gasToken: GasToken,
  ) =>
  (chains: readonly EvmChainConfig<E, C>[]): EvmEcosystemConfig<E, W, C> => ({
    id: ecosystemId,
    protocol: EVM_PROTOCOL,
    wormholeChainId: wormholeChainId,
    displayName: "Ethereum",
    gasToken,
    chains,
  });
