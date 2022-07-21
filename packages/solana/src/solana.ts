import type { GasToken } from "@swim-io/core-types";
import { Env } from "@swim-io/core-types";

import type { SolanaChainConfig, SolanaEcosystemConfig } from "./protocol";
import { SOLANA_PROTOCOL } from "./protocol";

/** Adapted from @solana/spl-token-registry ENV */
export enum SolanaChainId {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
  Localnet = 104,
}

const chains: ReadonlyMap<Env, SolanaChainConfig> = new Map([
  [
    Env.Mainnet,
    {
      name: "Solana Mainnet Beta",
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
      chainId: SolanaChainId.Devnet,
      wormholeBridge: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
      wormholeTokenBridge: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
      endpoint: "https://api.devnet.solana.com",
      wsEndpoint: "",
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "6rVZuenNaw3uECQjMjTLcfrXYKszpESEGi9HZnffJstn",
    },
  ],
  [
    Env.Local,
    {
      name: "Solana Localnet",
      chainId: SolanaChainId.Localnet,
      wormholeBridge: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
      wormholeTokenBridge: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
      endpoint: "http://127.0.0.1:8899",
      wsEndpoint: "",
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "", // TODO: Deploy on localnet
    },
  ],
]);

const gasToken: GasToken = {
  name: "sol",
  symbol: "SOL",
  decimals: 9,
};

export const solana: SolanaEcosystemConfig = {
  id: "solana",
  protocol: SOLANA_PROTOCOL,
  wormholeChainId: 1,
  displayName: "Solana",
  gasToken,
  chains,
};
