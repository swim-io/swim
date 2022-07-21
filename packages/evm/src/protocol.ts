import type {
  ChainConfig,
  EcosystemConfig,
  Env,
  Tx,
} from "@swim-io/core-types";
import type { ethers } from "ethers";

export type EvmProtocol = "evm";
export const EVM_PROTOCOL: EvmProtocol = "evm";

export interface EvmChainConfig extends ChainConfig {
  /** This will be recommended to wallet extensions in case they need to configure the relevant chain */
  readonly publicRpcUrl: string;
}

export interface EvmEcosystemConfig extends EcosystemConfig {
  readonly chains: ReadonlyMap<Env, EvmChainConfig>;
}

export interface EvmTx extends Tx {
  readonly txResponse: ethers.providers.TransactionResponse;
  readonly txReceipt: ethers.providers.TransactionReceipt;
}
