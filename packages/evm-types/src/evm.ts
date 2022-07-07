import type {
  ChainConfig,
  EcosystemConfig,
  EcosystemPlugin,
  Env,
  GasToken,
} from "@swim-io/core-types";

// evm-types
export type EvmProtocol = "evm";
export const EVM_PROTOCOL: EvmProtocol = "evm";

export interface EvmChainConfig<E extends string, C extends number>
  extends ChainConfig<E, C> {
  /** This will be recommended to wallet extensions in case they need to configure the relevant chain */
  readonly publicRpcUrl: string;
}

export interface EvmEcosystemConfig<
  E extends string,
  W extends number,
  C extends number,
> extends EcosystemConfig<EvmProtocol, E, W, C> {
  readonly chains: readonly EvmChainConfig<E, C>[];
}

export const createEvmEcosystemPlugin = <
  E extends string,
  W extends number,
  C extends number,
>(
  ecosystemId: E,
  wormholeChainId: W,
  displayName: string,
  gasToken: GasToken,
  presetChains: ReadonlyMap<Env, EvmChainConfig<E, C>>,
): EcosystemPlugin<EvmProtocol, E, W, C, EvmChainConfig<E, C>> => ({
  protocol: EVM_PROTOCOL,
  id: ecosystemId,
  wormholeChainId,
  displayName,
  gasToken,
  presetChains,
  createEcosystemConfig: (
    chains: readonly EvmChainConfig<E, C>[] = [...presetChains.values()],
  ): EvmEcosystemConfig<E, W, C> => ({
    id: ecosystemId,
    protocol: EVM_PROTOCOL,
    wormholeChainId: wormholeChainId,
    displayName,
    gasToken,
    chains,
  }),
});
