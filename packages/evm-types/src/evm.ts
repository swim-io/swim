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
  readonly chains: ReadonlyMap<Env, CC>;
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
): EcosystemPlugin<EvmProtocol, E, W, C, CC> => {
  const baseInfo: Omit<EcosystemConfig<EvmProtocol, E, W, C>, "chains"> = {
    id: ecosystemId,
    protocol: EVM_PROTOCOL,
    wormholeChainId,
    displayName,
    gasToken,
  };
  return {
    ...baseInfo,
    presetChains,
    createEcosystemConfig: (
      chains: ReadonlyMap<Env, CC> = presetChains,
    ): EvmEcosystemConfig<E, W, C, CC> => ({
      ...baseInfo,
      chains,
    }),
  };
};
