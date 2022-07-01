export enum Env {
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Local = "Local",
  Custom = "Custom",
}

export interface ChainConfig {
  readonly env: Env;
  readonly chainId: number;
  readonly wormholeBridge: string;
  readonly wormholeTokenBridge: string;
}

export interface EcosystemConfig {
  readonly id: string;
  readonly protocol: string;
  readonly wormholeChainId: number;
  readonly displayName: string;
  readonly nativeTokenSymbol: string;
  readonly chains: readonly ChainConfig[];
}
