import type { WormholeChainConfig } from "@swim-io/core";
import { Env } from "@swim-io/core";
import type { EvmSpec } from "@swim-io/evm";
import {
  DEVNET_EVM_CHAINS,
  LOCAL_EVM_CHAINS,
  MAINNET_EVM_CHAINS,
} from "@swim-io/evm";
import type { SolanaEcosystemId } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID, SolanaChainId } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";

import type { EcosystemId } from "./ecosystem";
import { Protocol } from "./ecosystem";

const SOLANA_MAINNET_RPC_URLS = process.env.REACT_APP_SOLANA_MAINNET_RPC_URLS;

const getSolanaMainnetRpcUrls = () => {
  if (SOLANA_MAINNET_RPC_URLS) {
    try {
      return SOLANA_MAINNET_RPC_URLS.split(" ").filter((url) => url);
    } catch {
      // Invalid env variable, fallback to default case.
    }
  }
  return ["https://solana-api.projectserum.com"];
};

export interface ChainSpec {
  /** This should be unique for a given Env */
  readonly ecosystem: EcosystemId;
  readonly wormhole: WormholeChainConfig;
}

export interface SolanaSpec extends ChainSpec {
  readonly ecosystem: SolanaEcosystemId;
  /** This should be unique for a given Env */
  readonly chainId: SolanaChainId;
  // Note, subsequent endpoints are used as fallbacks for SolanaConnection.
  readonly endpoints: readonly string[];
  readonly tokenContract: string;
  readonly otterTotCollection: string;
}

/** Every Protocol must specify a corresponding ChainSpec array */
export interface ChainsByProtocol {
  readonly [Protocol.Solana]: readonly SolanaSpec[];
  readonly [Protocol.Evm]: readonly EvmSpec[];
}

const MAINNET_CHAINS: ChainsByProtocol = {
  [Protocol.Solana]: [
    {
      ecosystem: SOLANA_ECOSYSTEM_ID,
      chainId: SolanaChainId.MainnetBeta,
      wormhole: {
        bridge: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
        portal: "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
      },
      endpoints: getSolanaMainnetRpcUrls(),
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "EpozLY9dQ1jnaU5Wof524K7p9uHYxkuLF2hi32cf8W9s",
    },
  ],
  [Protocol.Evm]: MAINNET_EVM_CHAINS,
};

const DEVNET_CHAINS: ChainsByProtocol = {
  [Protocol.Solana]: [
    {
      ecosystem: SOLANA_ECOSYSTEM_ID,
      chainId: SolanaChainId.Devnet,
      wormhole: {
        bridge: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
        portal: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
      },
      endpoints: ["https://api.devnet.solana.com"],
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "6rVZuenNaw3uECQjMjTLcfrXYKszpESEGi9HZnffJstn",
    },
  ],
  [Protocol.Evm]: DEVNET_EVM_CHAINS,
};

const LOCAL_CHAINS: ChainsByProtocol = {
  [Protocol.Solana]: [
    {
      ecosystem: SOLANA_ECOSYSTEM_ID,
      chainId: SolanaChainId.Localnet,
      wormhole: {
        bridge: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
        portal: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
      },
      endpoints: ["http://127.0.0.1:8899"],
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "", // TODO: Deploy on teamnet
    },
  ],
  [Protocol.Evm]: LOCAL_EVM_CHAINS,
};

export const ALL_UNIQUE_CHAINS = {
  [Protocol.Solana]: [
    ...MAINNET_CHAINS[Protocol.Solana],
    ...DEVNET_CHAINS[Protocol.Solana],
    ...LOCAL_CHAINS[Protocol.Solana],
  ],
  [Protocol.Evm]: [
    ...MAINNET_CHAINS[Protocol.Evm],
    ...DEVNET_CHAINS[Protocol.Evm],
    ...LOCAL_CHAINS[Protocol.Evm],
  ],
};

export const CHAINS: ReadonlyRecord<Env, ChainsByProtocol> = {
  [Env.Mainnet]: MAINNET_CHAINS,
  [Env.Devnet]: DEVNET_CHAINS,
  [Env.Local]: LOCAL_CHAINS,
  [Env.Custom]: LOCAL_CHAINS,
};
