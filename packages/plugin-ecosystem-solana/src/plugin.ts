import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type {
  ChainConfig,
  EcosystemConfig,
  EcosystemPlugin,
  Tx,
} from "@swim-io/core-types";
import { Env } from "@swim-io/core-types";

export type SolanaProtocol = "solana-protocol";
export const SOLANA_PROTOCOL: SolanaProtocol = "solana-protocol";

type SolanaEcosystemId = "solana";
const SOLANA_ECOSYSTEM_ID: SolanaEcosystemId = "solana";

type SolanaWormholeChainId = 1;
const SOLANA_WORMHOLE_CHAIN_ID: SolanaWormholeChainId = 1;

/** Adapted from @solana/spl-token-registry ENV */
export enum SolanaChainId {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
  Localnet = 104,
}

export interface SolanaChainConfig
  extends ChainConfig<SolanaEcosystemId, SolanaChainId> {
  readonly endpoint: string;
  readonly wsEndpoint: string;
  readonly tokenContract: string;
  readonly otterTotCollection: string;
}

export type SolanaEcosystemConfig = EcosystemConfig<
  SolanaProtocol,
  SolanaEcosystemId,
  SolanaWormholeChainId,
  SolanaChainId,
  SolanaChainConfig
>;

export interface SolanaTx extends Tx<SolanaEcosystemId> {
  readonly parsedTx: ParsedTransactionWithMeta;
}

export const isSolanaTx = (tx: Tx<string>): tx is SolanaTx =>
  tx.ecosystem === SOLANA_ECOSYSTEM_ID;

const presetChains: ReadonlyMap<Env, SolanaChainConfig> = new Map([
  [
    Env.Mainnet,
    {
      name: "Solana Mainnet Beta",
      ecosystemId: SOLANA_ECOSYSTEM_ID,
      chainId: SolanaChainId.MainnetBeta,
      wormholeBridge: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
      wormholeTokenBridge: "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
      endpoint: "https://solana-api.projectserum.com",
      wsEndpoint: "",
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "EpozLY9dQ1jnaU5Wof524K7p9uHYxkuLF2hi32cf8W9s",
    },
  ],
  [
    Env.Devnet,
    {
      name: "Solana Devnet",
      ecosystemId: SOLANA_ECOSYSTEM_ID,
      chainId: SolanaChainId.Devnet,
      wormholeBridge: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
      wormholeTokenBridge: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
      endpoint: "https://api.devnet.solana.com",
      wsEndpoint: "",
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "6rVZuenNaw3uECQjMjTLcfrXYKszpESEGi9HZnffJstn",
    },
  ],
]);

const baseInfo: Omit<
  EcosystemConfig<
    SolanaProtocol,
    SolanaEcosystemId,
    SolanaWormholeChainId,
    SolanaChainId
  >,
  "chains"
> = {
  id: SOLANA_ECOSYSTEM_ID,
  protocol: SOLANA_PROTOCOL,
  wormholeChainId: SOLANA_WORMHOLE_CHAIN_ID,
  displayName: "Solana",
  gasToken: {
    name: "sol",
    symbol: "SOL",
    decimals: 9,
  },
};

const createEcosystemConfig = (
  chains: ReadonlyMap<Env, SolanaChainConfig> = presetChains,
): SolanaEcosystemConfig => ({
  ...baseInfo,
  chains,
});

export const plugin: EcosystemPlugin<
  SolanaProtocol,
  SolanaEcosystemId,
  SolanaWormholeChainId,
  SolanaChainId,
  SolanaChainConfig
> = {
  ...baseInfo,
  presetChains,
  createEcosystemConfig,
};
