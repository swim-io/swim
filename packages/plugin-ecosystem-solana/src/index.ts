import { ChainSpec, EcosystemSpec } from "./base";

/** Adapted from @solana/spl-token-registry ENV */
export const enum SolanaChainId {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
  Localnet = 104,
}

export interface SolanaChainSpec extends ChainSpec {
  /** This should be unique for a given Env */
  readonly chainId: SolanaChainId;
  readonly endpoint: string;
  readonly wsEndpoint: string;
  readonly tokenContract: string;
  readonly otterTotCollection: string;
}

export interface SolanaEcosystemSpec extends EcosystemSpec {
  readonly chainSpecs: readonly SolanaChainSpec[];
}

const createEcosystemConfig = (
  chainSpecs: readonly SolanaChainSpec[],
): EcosystemSpec => ({
  id: "solana" as const,
  protocol: "solana-protocol" as const,
  wormholeChainId: 1 as const,
  displayName: "Solana",
  nativeTokenSymbol: "SOL",
  chainSpecs,
});

export default createEcosystemConfig;
