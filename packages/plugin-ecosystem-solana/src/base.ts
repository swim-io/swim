export enum Env {
  Mainnet = "Mainnet",
  Devnet = "Devnet",
  Local = "Local",
  Custom = "Custom",
}

export interface WormholeChainSpec {
  readonly bridge: string;
  readonly tokenBridge: string;
}

export interface ChainSpec {
  readonly env: Env;
  readonly chainId: number;
  readonly wormhole: WormholeChainSpec;
}

export interface EcosystemSpec {
  readonly id: string;
  readonly protocol: string;
  readonly wormholeChainId: number;
  readonly displayName: string;
  readonly nativeTokenSymbol: string;
  readonly chainSpecs: readonly ChainSpec[];
}
