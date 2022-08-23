import { Env } from "@swim-io/core";
import { EvmEcosystemId } from "@swim-io/evm";
import type { SolanaEcosystemId } from "@swim-io/solana";
import { SOLANA_ECOSYSTEM_ID, SolanaChainId } from "@swim-io/solana";

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

export interface WormholeChainSpec {
  readonly bridge: string;
  readonly tokenBridge: string;
}

export interface ChainSpec {
  /** This should be unique for a given Env */
  readonly ecosystem: EcosystemId;
  readonly wormhole: WormholeChainSpec;
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

export interface SolanaSpec extends ChainSpec {
  readonly ecosystem: SolanaEcosystemId;
  /** This should be unique for a given Env */
  readonly chainId: SolanaChainId;
  // Note, subsequent endpoints are used as fallbacks for SolanaConnection.
  readonly endpoints: readonly string[];
  readonly tokenContract: string;
  readonly otterTotCollection: string;
}

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

const DEVNET_CHAINS: ChainsByProtocol = {
  [Protocol.Solana]: [
    {
      ecosystem: SOLANA_ECOSYSTEM_ID,
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
      ecosystem: EvmEcosystemId.Ethereum,
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
      ecosystem: EvmEcosystemId.Bnb,
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
      ecosystem: EvmEcosystemId.Avalanche,
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
      ecosystem: EvmEcosystemId.Polygon,
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
      ecosystem: EvmEcosystemId.Aurora,
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
      ecosystem: EvmEcosystemId.Fantom,
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
      ecosystem: EvmEcosystemId.Karura,
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
      ecosystem: EvmEcosystemId.Acala,
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

export const CHAINS: ReadonlyRecord<Env, ChainsByProtocol> = {
  [Env.Mainnet]: { [Protocol.Solana]: [], [Protocol.Evm]: [] },
  [Env.Devnet]: DEVNET_CHAINS,
  [Env.Local]: { [Protocol.Solana]: [], [Protocol.Evm]: [] },
  [Env.Custom]: { [Protocol.Solana]: [], [Protocol.Evm]: [] },
};
