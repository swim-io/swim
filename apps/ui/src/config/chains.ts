import type { ReadonlyRecord } from "../utils";

import type {
  CosmosEcosystemId,
  EvmEcosystemId,
  SolanaEcosystemId,
} from "./ecosystem";
import { EcosystemId, Protocol } from "./ecosystem";
import { Env } from "./env";

const SOLANA_MAINNET_RPC_URL = process.env.REACT_APP_SOLANA_MAINNET_RPC_URL;

/** Adapted from @solana/spl-token-registry ENV */
export const enum SolanaChainId {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
  Localnet = 104,
}

export const enum EvmChainId {
  EthereumMainnet = 1,
  EthereumGoerli = 5,
  EthereumLocalnet = 1337,
  BscMainnet = 56,
  BscTestnet = 97,
  BscLocalnet = 1397,
  PolygonMainnet = 137,
  PolygonTestnet = 80001,
  PolygonLocalnet = 80002, // TODO: This is a placeholder
  AvalancheMainnet = 43114, // C-Chain
  AvalancheTestnet = 43113,
  AvalancheLocalnet = 43112, // TODO: This is a placeholder
}

export const evmChainIdToEcosystem: ReadonlyRecord<EvmChainId, EvmEcosystemId> =
  {
    [EvmChainId.EthereumMainnet]: EcosystemId.Ethereum,
    [EvmChainId.EthereumGoerli]: EcosystemId.Ethereum,
    [EvmChainId.EthereumLocalnet]: EcosystemId.Ethereum,
    [EvmChainId.BscMainnet]: EcosystemId.Bsc,
    [EvmChainId.BscTestnet]: EcosystemId.Bsc,
    [EvmChainId.BscLocalnet]: EcosystemId.Bsc,
    [EvmChainId.PolygonMainnet]: EcosystemId.Polygon,
    [EvmChainId.PolygonTestnet]: EcosystemId.Polygon,
    [EvmChainId.PolygonLocalnet]: EcosystemId.Polygon,
    [EvmChainId.AvalancheMainnet]: EcosystemId.Avalanche,
    [EvmChainId.AvalancheTestnet]: EcosystemId.Avalanche,
    [EvmChainId.AvalancheLocalnet]: EcosystemId.Avalanche,
  };

export const enum CosmosChainId {
  TerraMainnet = "columbus-5", // NOTE: Must be updated with every network hard fork
}

export interface WormholeChainSpec {
  readonly bridge: string;
  readonly tokenBridge: string;
}

export interface ChainSpec {
  /** This should be unique for a given Env */
  readonly ecosystem: EcosystemId;
  readonly wormhole: WormholeChainSpec;
}

export interface SolanaSpec extends ChainSpec {
  readonly ecosystem: SolanaEcosystemId;
  /** This should be unique for a given Env */
  readonly chainId: SolanaChainId;
  readonly endpoint: string;
  readonly tokenContract: string;
}

interface EvmNativeCurrencySpec {
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
}

export interface EvmSpec extends ChainSpec {
  readonly ecosystem: EvmEcosystemId;
  /** This should be unique for a given Env */
  readonly chainId: EvmChainId;
  readonly chainName: string;
  readonly nativeCurrency: EvmNativeCurrencySpec;
  readonly rpcUrls: readonly string[];
}

export interface CosmosSpec extends ChainSpec {
  readonly ecosystem: CosmosEcosystemId;
  /** This should be unique for a given Env */
  readonly chainId: CosmosChainId;
}

/** Every Protocol must specify a corresponding ChainSpec array */
export interface ChainsByProtocol {
  readonly [Protocol.Solana]: readonly SolanaSpec[];
  readonly [Protocol.Evm]: readonly EvmSpec[];
  readonly [Protocol.Cosmos]: readonly CosmosSpec[];
}

const ETHEREUM_NATIVE_CURRENCY = {
  name: "Ethereum",
  symbol: "ETH",
  decimals: 18,
};

const BSC_NATIVE_CURRENCY = {
  name: "Binance Coin",
  symbol: "BNB",
  decimals: 18, // no other value is allowed by Metamask
};

const AVALANCHE_NATIVE_CURRENCY = {
  name: "Avalanche",
  symbol: "AVAX",
  decimals: 18, // no other value is allowed by Metamask
};

const POLYGON_NATIVE_CURRENCY = {
  name: "Matic",
  symbol: "MATIC",
  decimals: 18, // no other value is allowed by Metamask
};

const mainnetChains: ChainsByProtocol = {
  [Protocol.Solana]: [
    {
      ecosystem: EcosystemId.Solana,
      chainId: SolanaChainId.MainnetBeta,
      wormhole: {
        bridge: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
        tokenBridge: "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
      },
      endpoint: SOLANA_MAINNET_RPC_URL ?? "https://solana-api.projectserum.com",
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    },
  ],
  [Protocol.Evm]: [
    {
      ecosystem: EcosystemId.Ethereum,
      chainId: EvmChainId.EthereumMainnet,
      chainName: "Ethereum Mainnet",
      nativeCurrency: ETHEREUM_NATIVE_CURRENCY,
      rpcUrls: ["https://main-light.eth.linkpool.io/"],
      wormhole: {
        bridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
        tokenBridge: "0x3ee18B2214AFF97000D974cf647E7C347E8fa585",
      },
    },
    {
      ecosystem: EcosystemId.Bsc,
      chainId: EvmChainId.BscMainnet,
      chainName: "BNB Chain Mainnet",
      nativeCurrency: BSC_NATIVE_CURRENCY,
      rpcUrls: ["https://bsc-dataseed1.ninicoin.io"],
      wormhole: {
        bridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
        tokenBridge: "0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7",
      },
    },
    {
      ecosystem: EcosystemId.Avalanche,
      chainId: EvmChainId.AvalancheMainnet,
      chainName: "Avalanche Mainnet",
      nativeCurrency: AVALANCHE_NATIVE_CURRENCY,
      rpcUrls: ["https://api.polygonscan.com/"], // TODO: Replace with real endpoint
      wormhole: {
        bridge: "0x54a8e5f9c4CbA08F9943965859F6c34eAF03E26c",
        tokenBridge: "0x0e082F06FF657D94310cB8cE8B0D9a04541d8052",
      },
    },
    {
      ecosystem: EcosystemId.Polygon,
      chainId: EvmChainId.PolygonMainnet,
      chainName: "Polygon Mainnet",
      nativeCurrency: POLYGON_NATIVE_CURRENCY,
      rpcUrls: ["https://polygon-rpc.com/"], // TODO: Replace with real endpoint
      wormhole: {
        bridge: "0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7",
        tokenBridge: "0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE",
      },
    },
  ],
  [Protocol.Cosmos]: [],
};

const devnetChains: ChainsByProtocol = {
  [Protocol.Solana]: [
    {
      ecosystem: EcosystemId.Solana,
      chainId: SolanaChainId.Devnet,
      wormhole: {
        bridge: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
        tokenBridge: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
      },
      endpoint: "https://api.devnet.solana.com",
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    },
  ],
  [Protocol.Evm]: [
    {
      ecosystem: EcosystemId.Ethereum,
      chainId: EvmChainId.EthereumGoerli,
      chainName: "Ethereum Goerli Testnet",
      nativeCurrency: ETHEREUM_NATIVE_CURRENCY,
      rpcUrls: ["https://goerli.prylabs.net/"],
      wormhole: {
        bridge: "0x706abc4E45D419950511e474C7B9Ed348A4a716c",
        tokenBridge: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
      },
    },
    {
      ecosystem: EcosystemId.Bsc,
      chainId: EvmChainId.BscTestnet,
      chainName: "BNB Chain Testnet",
      nativeCurrency: BSC_NATIVE_CURRENCY,
      rpcUrls: ["https://data-seed-prebsc-2-s2.binance.org:8545"],
      wormhole: {
        bridge: "0x68605AD7b15c732a30b1BbC62BE8F2A509D74b4D",
        tokenBridge: "0x9dcF9D205C9De35334D646BeE44b2D2859712A09",
      },
    },
    {
      ecosystem: EcosystemId.Avalanche,
      chainId: EvmChainId.AvalancheTestnet,
      chainName: "Avalanche Testnet",
      nativeCurrency: AVALANCHE_NATIVE_CURRENCY,
      rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"], // TODO: Replace/refactor
      wormhole: {
        bridge: "0x7bbcE28e64B3F8b84d876Ab298393c38ad7aac4C",
        tokenBridge: "0x61E44E506Ca5659E6c0bba9b678586fA2d729756",
      },
    },
    {
      ecosystem: EcosystemId.Polygon,
      chainId: EvmChainId.PolygonTestnet,
      chainName: "Polygon Testnet",
      nativeCurrency: POLYGON_NATIVE_CURRENCY,
      rpcUrls: ["https://rpc-mumbai.maticvigil.com"], // TODO: Replace/refactor
      wormhole: {
        bridge: "0x0CBE91CF822c73C2315FB05100C2F714765d5c20",
        tokenBridge: "0x377D55a7928c046E18eEbb61977e714d2a76472a",
      },
    },
  ],
  [Protocol.Cosmos]: [],
};

const localnetChains: ChainsByProtocol = {
  [Protocol.Solana]: [
    {
      ecosystem: EcosystemId.Solana,
      chainId: SolanaChainId.Localnet,
      wormhole: {
        bridge: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
        tokenBridge: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
      },
      endpoint: "http://127.0.0.1:8899",
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    },
  ],
  [Protocol.Evm]: [
    {
      ecosystem: EcosystemId.Ethereum,
      chainId: EvmChainId.EthereumLocalnet,
      chainName: "Ethereum Localnet",
      nativeCurrency: ETHEREUM_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8545"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        tokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EcosystemId.Bsc,
      chainId: EvmChainId.BscLocalnet,
      chainName: "BNB Chain Localnet",
      nativeCurrency: BSC_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8546"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        tokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EcosystemId.Avalanche,
      chainId: EvmChainId.AvalancheLocalnet,
      chainName: "Avalanche Localnet",
      nativeCurrency: AVALANCHE_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8547"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        tokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EcosystemId.Polygon,
      chainId: EvmChainId.PolygonLocalnet,
      chainName: "Polygon Localnet",
      nativeCurrency: POLYGON_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8548"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        tokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
  ],
  [Protocol.Cosmos]: [],
};

export const allUniqueChains = {
  [Protocol.Solana]: [
    ...mainnetChains[Protocol.Solana],
    ...devnetChains[Protocol.Solana],
    ...localnetChains[Protocol.Solana],
  ],
  [Protocol.Evm]: [
    ...mainnetChains[Protocol.Evm],
    ...devnetChains[Protocol.Evm],
    ...localnetChains[Protocol.Evm],
  ],
};

export const chains: ReadonlyRecord<Env, ChainsByProtocol> = {
  [Env.Mainnet]: mainnetChains,
  [Env.Devnet]: devnetChains,
  [Env.Localnet]: localnetChains,
  [Env.CustomLocalnet]: localnetChains,
};
