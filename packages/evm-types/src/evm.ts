import type {
  ChainConfig,
  EcosystemConfig,
  EcosystemPlugin,
  Env,
  GasToken,
  Tx,
} from "@swim-io/core-types";
import type { ethers } from "ethers";

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
  CC extends EvmChainConfig<E, C> = EvmChainConfig<E, C>,
> extends EcosystemConfig<EvmProtocol, E, W, C, CC> {
  readonly chains: readonly CC[];
}

export interface EvmTx<EcosystemId extends string> extends Tx<EcosystemId> {
  readonly txResponse: ethers.providers.TransactionResponse;
  readonly txReceipt: ethers.providers.TransactionReceipt;
}

export const createEvmEcosystemPlugin = <
  E extends string,
  W extends number,
  C extends number,
  CC extends EvmChainConfig<E, C> = EvmChainConfig<E, C>,
>(
  ecosystemId: E,
  wormholeChainId: W,
  displayName: string,
  gasToken: GasToken,
  presetChains: ReadonlyMap<Env, CC>,
): EcosystemPlugin<EvmProtocol, E, W, C, CC> => ({
  protocol: EVM_PROTOCOL,
  id: ecosystemId,
  wormholeChainId,
  displayName,
  gasToken,
  presetChains,
  createEcosystemConfig: (
    chains: readonly CC[] = [...presetChains.values()],
  ): EvmEcosystemConfig<E, W, C, CC> => ({
    id: ecosystemId,
    protocol: EVM_PROTOCOL,
    wormholeChainId: wormholeChainId,
    displayName,
    gasToken,
    chains,
  }),
});
