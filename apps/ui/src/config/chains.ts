import { Env } from "@swim-io/core";
import type { ReadonlyRecord } from "@swim-io/utils";

import type { EvmEcosystemId, SolanaEcosystemId } from "./ecosystem";
import { EcosystemId, Protocol } from "./ecosystem";

// TODO: Remove REACT_APP_SOLANA_MAINNET_RPC_URL in favor of multiple URLs.
const SOLANA_MAINNET_RPC_URL = process.env.REACT_APP_SOLANA_MAINNET_RPC_URL;
const SOLANA_MAINNET_RPC_URLS = process.env.REACT_APP_SOLANA_MAINNET_RPC_URLS;

const getSolanaMainnetRpcUrls = () => {
  if (SOLANA_MAINNET_RPC_URLS) {
    try {
      return SOLANA_MAINNET_RPC_URLS.split(" ").filter((url) => url);
      // eslint-disable-next-line no-empty
    } catch {
      // Invalid env variable, fallback to default case.
    }
  }
  return [SOLANA_MAINNET_RPC_URL || "https://solana-api.projectserum.com"];
};

/** Adapted from @solana/spl-token-registry ENV */
export const enum SolanaChainId {
  MainnetBeta = 101,
  Testnet = 102,
  Devnet = 103,
  Local = 104,
}

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

export const EVM_CHAIN_ID_TO_ECOSYSTEM: ReadonlyRecord<
  EvmChainId,
  EvmEcosystemId
> = {
  [EvmChainId.EthereumMainnet]: EcosystemId.Ethereum,
  [EvmChainId.EthereumGoerli]: EcosystemId.Ethereum,
  [EvmChainId.EthereumLocal]: EcosystemId.Ethereum,
  [EvmChainId.BnbMainnet]: EcosystemId.Bnb,
  [EvmChainId.BnbTestnet]: EcosystemId.Bnb,
  [EvmChainId.BnbLocal]: EcosystemId.Bnb,
  [EvmChainId.PolygonMainnet]: EcosystemId.Polygon,
  [EvmChainId.PolygonTestnet]: EcosystemId.Polygon,
  [EvmChainId.PolygonLocal]: EcosystemId.Polygon,
  [EvmChainId.AvalancheMainnet]: EcosystemId.Avalanche,
  [EvmChainId.AvalancheTestnet]: EcosystemId.Avalanche,
  [EvmChainId.AvalancheLocal]: EcosystemId.Avalanche,
  [EvmChainId.AuroraMainnet]: EcosystemId.Aurora,
  [EvmChainId.AuroraTestnet]: EcosystemId.Aurora,
  [EvmChainId.AuroraLocal]: EcosystemId.Aurora,
  [EvmChainId.FantomMainnet]: EcosystemId.Fantom,
  [EvmChainId.FantomTestnet]: EcosystemId.Fantom,
  [EvmChainId.FantomLocal]: EcosystemId.Fantom,
  [EvmChainId.KaruraMainnet]: EcosystemId.Karura,
  [EvmChainId.KaruraTestnet]: EcosystemId.Karura,
  [EvmChainId.KaruraLocal]: EcosystemId.Karura,
  [EvmChainId.AcalaMainnet]: EcosystemId.Acala,
  [EvmChainId.AcalaTestnet]: EcosystemId.Acala,
  [EvmChainId.AcalaLocal]: EcosystemId.Acala,
};

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
  // Note, subsequent endpoints are used as fallbacks for SolanaConnection.
  readonly endpoints: readonly string[];
  readonly tokenContract: string;
  readonly otterTotCollection: string;
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

/** Every Protocol must specify a corresponding ChainSpec array */
export interface ChainsByProtocol {
  readonly [Protocol.Solana]: readonly SolanaSpec[];
  readonly [Protocol.Evm]: readonly EvmSpec[];
}

const ETHEREUM_NATIVE_CURRENCY = {
  name: "Ethereum",
  symbol: "ETH",
  decimals: 18,
};

const BNB_NATIVE_CURRENCY = {
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

const AURORA_NATIVE_CURRENCY = {
  name: "Ethereum",
  symbol: "ETH",
  decimals: 18, // no other value is allowed by Metamask
};

const FANTOM_NATIVE_CURRENCY = {
  name: "FTM",
  symbol: "FTM",
  decimals: 18, // no other value is allowed by Metamask
};

const KARURA_NATIVE_CURRENCY = {
  name: "Karura",
  symbol: "KAR",
  decimals: 18, // no other value is allowed by Metamask
};

const ACALA_NATIVE_CURRENCY = {
  name: "Acala",
  symbol: "ACA",
  decimals: 18, // no other value is allowed by Metamask
};

const MAINNET_CHAINS: ChainsByProtocol = {
  [Protocol.Solana]: [
    {
      ecosystem: EcosystemId.Solana,
      chainId: SolanaChainId.MainnetBeta,
      wormhole: {
        bridge: "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",
        tokenBridge: "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",
      },
      endpoints: getSolanaRpcs(),
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "EpozLY9dQ1jnaU5Wof524K7p9uHYxkuLF2hi32cf8W9s",
    },
  ],
  [Protocol.Evm]: [
    {
      ecosystem: EcosystemId.Ethereum,
      chainId: EvmChainId.EthereumMainnet,
      chainName: "Ethereum Mainnet",
      nativeCurrency: ETHEREUM_NATIVE_CURRENCY,
      rpcUrls: ["https://main-light.eth.linkpool.io/"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
        tokenBridge: "0x3ee18B2214AFF97000D974cf647E7C347E8fa585",
      },
    },
    {
      ecosystem: EcosystemId.Bnb,
      chainId: EvmChainId.BnbMainnet,
      chainName: "BNB Chain Mainnet",
      nativeCurrency: BNB_NATIVE_CURRENCY,
      rpcUrls: ["https://bsc-dataseed1.ninicoin.io"], // TODO: Think about what is best to recommend to MetaMask
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
      rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"], // TODO: Think about what is best to recommend to MetaMask
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
      rpcUrls: ["https://polygon-rpc.com/"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7",
        tokenBridge: "0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE",
      },
    },
    {
      ecosystem: EcosystemId.Aurora,
      chainId: EvmChainId.AuroraMainnet,
      chainName: "Aurora Mainnet",
      nativeCurrency: AURORA_NATIVE_CURRENCY,
      rpcUrls: ["https://mainnet.aurora.dev/"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
        tokenBridge: "0x51b5123a7b0F9b2bA265f9c4C8de7D78D52f510F",
      },
    },
    {
      ecosystem: EcosystemId.Fantom,
      chainId: EvmChainId.FantomMainnet,
      chainName: "Fantom Mainnet",
      nativeCurrency: FANTOM_NATIVE_CURRENCY,
      rpcUrls: ["https://rpc.ftm.tools/"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0x126783A6Cb203a3E35344528B26ca3a0489a1485",
        tokenBridge: "0x7C9Fc5741288cDFdD83CeB07f3ea7e22618D79D2",
      },
    },
    {
      ecosystem: EcosystemId.Karura,
      chainId: EvmChainId.KaruraMainnet,
      chainName: "Karura Mainnet",
      nativeCurrency: KARURA_NATIVE_CURRENCY,
      rpcUrls: ["https://karura.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
        tokenBridge: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
      },
    },
    {
      ecosystem: EcosystemId.Acala,
      chainId: EvmChainId.AcalaMainnet,
      chainName: "Acala Mainnet",
      nativeCurrency: ACALA_NATIVE_CURRENCY,
      rpcUrls: ["https://acala-polkadot.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
        tokenBridge: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
      },
    },
  ],
};

const DEVNET_CHAINS: ChainsByProtocol = {
  [Protocol.Solana]: [
    {
      ecosystem: EcosystemId.Solana,
      chainId: SolanaChainId.Devnet,
      wormhole: {
        bridge: "3u8hJUVTA4jH1wYAyUur7FFZVQ8H635K3tSHHF4ssjQ5",
        tokenBridge: "DZnkkTmCiFWfYTfT41X3Rd1kDgozqzxWaHqsw6W4x2oe",
      },
      endpoints: ["https://api.devnet.solana.com"],
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "6rVZuenNaw3uECQjMjTLcfrXYKszpESEGi9HZnffJstn",
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
      ecosystem: EcosystemId.Bnb,
      chainId: EvmChainId.BnbTestnet,
      chainName: "BNB Chain Testnet",
      nativeCurrency: BNB_NATIVE_CURRENCY,
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
    {
      ecosystem: EcosystemId.Aurora,
      chainId: EvmChainId.AuroraTestnet,
      chainName: "Aurora Testnet",
      nativeCurrency: AURORA_NATIVE_CURRENCY,
      rpcUrls: ["https://testnet.aurora.dev/"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0xBd07292de7b505a4E803CEe286184f7Acf908F5e",
        tokenBridge: "0xD05eD3ad637b890D68a854d607eEAF11aF456fba",
      },
    },
    {
      ecosystem: EcosystemId.Fantom,
      chainId: EvmChainId.FantomTestnet,
      chainName: "Fantom Testnet",
      nativeCurrency: FANTOM_NATIVE_CURRENCY,
      rpcUrls: ["https://rpc.testnet.fantom.network/"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0x1BB3B4119b7BA9dfad76B0545fb3F531383c3bB7",
        tokenBridge: "0x599CEa2204B4FaECd584Ab1F2b6aCA137a0afbE8",
      },
    },
    {
      ecosystem: EcosystemId.Karura,
      chainId: EvmChainId.KaruraTestnet,
      chainName: "Karura Testnet",
      nativeCurrency: KARURA_NATIVE_CURRENCY,
      rpcUrls: ["https://karura-dev.aca-dev.network/eth/http"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0xE4eacc10990ba3308DdCC72d985f2a27D20c7d03",
        tokenBridge: "0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37",
      },
    },
    {
      ecosystem: EcosystemId.Acala,
      chainId: EvmChainId.AcalaTestnet,
      chainName: "Acala Testnet",
      nativeCurrency: ACALA_NATIVE_CURRENCY,
      rpcUrls: ["https://acala-dev.aca-dev.network/eth/http"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0x4377B49d559c0a9466477195C6AdC3D433e265c0",
        tokenBridge: "0xebA00cbe08992EdD08ed7793E07ad6063c807004",
      },
    },
  ],
};

const LOCAL_CHAINS: ChainsByProtocol = {
  [Protocol.Solana]: [
    {
      ecosystem: EcosystemId.Solana,
      chainId: SolanaChainId.Local,
      wormhole: {
        bridge: "Bridge1p5gheXUvJ6jGWGeCsgPKgnE3YgdGKRVCMY9o",
        tokenBridge: "B6RHG3mfcckmrYN1UhmJzyS1XX3fZKbkeUcpJe9Sy3FE",
      },
      endpoints: ["http://127.0.0.1:8899"],
      tokenContract: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      otterTotCollection: "", // TODO: Deploy on teamnet
    },
  ],
  [Protocol.Evm]: [
    {
      ecosystem: EcosystemId.Ethereum,
      chainId: EvmChainId.EthereumLocal,
      chainName: "Ethereum Local",
      nativeCurrency: ETHEREUM_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8545"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        tokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EcosystemId.Bnb,
      chainId: EvmChainId.BnbLocal,
      chainName: "BNB Chain Local",
      nativeCurrency: BNB_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8546"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        tokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EcosystemId.Avalanche,
      chainId: EvmChainId.AvalancheLocal,
      chainName: "Avalanche Local",
      nativeCurrency: AVALANCHE_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8547"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        tokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EcosystemId.Polygon,
      chainId: EvmChainId.PolygonLocal,
      chainName: "Polygon Local",
      nativeCurrency: POLYGON_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8548"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        tokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EcosystemId.Aurora,
      chainId: EvmChainId.AuroraLocal,
      chainName: "Aurora Local",
      nativeCurrency: AURORA_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8549"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        tokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EcosystemId.Fantom,
      chainId: EvmChainId.FantomLocal,
      chainName: "Fantom Local",
      nativeCurrency: FANTOM_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8550"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        tokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EcosystemId.Karura,
      chainId: EvmChainId.KaruraLocal,
      chainName: "Karura Local",
      nativeCurrency: KARURA_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8551"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        tokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EcosystemId.Acala,
      chainId: EvmChainId.AcalaLocal,
      chainName: "Acala Local",
      nativeCurrency: ACALA_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8552"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        tokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
  ],
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
