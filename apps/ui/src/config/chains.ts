import type { AptosChainConfig } from "@swim-io/aptos";
import { APTOS_ECOSYSTEM_ID, aptos } from "@swim-io/aptos";
import { Env } from "@swim-io/core";
import type { EvmChainConfig } from "@swim-io/evm";
import {
  EvmEcosystemId,
  acala,
  aurora,
  avalanche,
  bnb,
  ethereum,
  fantom,
  karura,
  polygon,
} from "@swim-io/evm";
import type { SolanaChainConfig } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID, solana } from "@swim-io/solana";
import type { ReadonlyRecord } from "@swim-io/utils";

import type { EcosystemId } from "./ecosystem";
import { Protocol } from "./ecosystem";

export const enum EvmChainId {
  EthereumMainnet = 1,
  EthereumGoerli = 5,
  EthereumLocal = 1337,
  BnbMainnet = 56,
  BnbTestnet = 97,
  BnbLocal = 1397,
  PolygonMainnet = 137,
  PolygonTestnet = 80001,
  PolygonLocal = 80002, // TODO: This is a placeholder
  AvalancheMainnet = 43114, // C-Chain
  AvalancheTestnet = 43113,
  AvalancheLocal = 43112, // TODO: This is a placeholder
  AuroraMainnet = 1313161554,
  AuroraTestnet = 1313161555,
  AuroraLocal = 1313161556, // TODO: This is a placeholder
  FantomMainnet = 250,
  FantomTestnet = 4002,
  FantomLocal = 4003, // TODO: This is a placeholder
  KaruraMainnet = 686,
  KaruraTestnet = 596,
  KaruraLocal = 606, // TODO: This is a placeholder
  AcalaMainnet = 787,
  AcalaTestnet = 597,
  AcalaLocal = 607, // TODO: This is a placeholder
}

export interface ChainSpec {
  /** This should be unique for a given Env */
  readonly ecosystem: EcosystemId;
}

export interface ChainsByProtocol {
  readonly [Protocol.Aptos]: readonly (AptosChainConfig & ChainSpec)[];
  readonly [Protocol.Solana]: readonly (SolanaChainConfig & ChainSpec)[];
  readonly [Protocol.Evm]: readonly (EvmChainConfig & ChainSpec)[];
}

const MAINNET_CHAINS: ChainsByProtocol = {
  [Protocol.Aptos]: [
    // adding an entry so that AptosClient context doesn't throw an error
    // TODO: Update when available on mainnet
    {
      ...aptos.chains[Env.Testnet],
      ecosystem: APTOS_ECOSYSTEM_ID,
    },
  ],
  [Protocol.Solana]: [
    {
      ...solana.chains[Env.Mainnet],
      ecosystem: SOLANA_ECOSYSTEM_ID,
    },
  ],
  [Protocol.Evm]: [
    {
      ...ethereum.chains[Env.Mainnet],
      ecosystem: EvmEcosystemId.Ethereum,
    },
    {
      ...bnb.chains[Env.Mainnet],
      ecosystem: EvmEcosystemId.Bnb,
    },
    {
      ...avalanche.chains[Env.Mainnet],
      ecosystem: EvmEcosystemId.Avalanche,
    },
    {
      ...polygon.chains[Env.Mainnet],
      ecosystem: EvmEcosystemId.Polygon,
    },
    {
      ...aurora.chains[Env.Mainnet],
      ecosystem: EvmEcosystemId.Aurora,
    },
    {
      ...fantom.chains[Env.Mainnet],
      ecosystem: EvmEcosystemId.Fantom,
    },
    {
      ...karura.chains[Env.Mainnet],
      ecosystem: EvmEcosystemId.Karura,
    },
    {
      ...acala.chains[Env.Mainnet],
      ecosystem: EvmEcosystemId.Acala,
    },
  ],
};

const TESTNET_CHAINS: ChainsByProtocol = {
  [Protocol.Aptos]: [
    {
      ...aptos.chains[Env.Testnet],
      ecosystem: APTOS_ECOSYSTEM_ID,
    },
  ],
  [Protocol.Solana]: [
    {
      ...solana.chains[Env.Testnet],
      ecosystem: SOLANA_ECOSYSTEM_ID,
    },
  ],
  [Protocol.Evm]: [
    {
      ...ethereum.chains[Env.Testnet],
      ecosystem: EvmEcosystemId.Ethereum,
    },
    {
      ...bnb.chains[Env.Testnet],
      ecosystem: EvmEcosystemId.Bnb,
    },
    {
      ...avalanche.chains[Env.Testnet],
      ecosystem: EvmEcosystemId.Avalanche,
    },
    {
      ...polygon.chains[Env.Testnet],
      ecosystem: EvmEcosystemId.Polygon,
    },
    {
      ...aurora.chains[Env.Testnet],
      ecosystem: EvmEcosystemId.Aurora,
    },
    {
      ...fantom.chains[Env.Testnet],
      ecosystem: EvmEcosystemId.Fantom,
    },
    {
      ...karura.chains[Env.Testnet],
      ecosystem: EvmEcosystemId.Karura,
    },
    {
      ...acala.chains[Env.Testnet],
      ecosystem: EvmEcosystemId.Acala,
    },
  ],
};

const LOCAL_CHAINS: ChainsByProtocol = {
  [Protocol.Aptos]: [
    // TODO: Remove
    // adding an entry so that AptosClient context doesn't throw an error
    {
      ...aptos.chains[Env.Testnet],
      ecosystem: APTOS_ECOSYSTEM_ID,
    },
  ],
  [Protocol.Solana]: [
    {
      ...solana.chains[Env.Local],
      ecosystem: SOLANA_ECOSYSTEM_ID,
    },
  ],
  [Protocol.Evm]: [
    {
      ...ethereum.chains[Env.Local],
      ecosystem: EvmEcosystemId.Ethereum,
    },
    {
      ...bnb.chains[Env.Local],
      ecosystem: EvmEcosystemId.Bnb,
    },
  ],
};

export const CHAINS: ReadonlyRecord<Env, ChainsByProtocol> = {
  [Env.Mainnet]: MAINNET_CHAINS,
  [Env.Testnet]: TESTNET_CHAINS,
  [Env.Local]: LOCAL_CHAINS,
  [Env.Custom]: LOCAL_CHAINS,
};
