import type { ChainConfig, EcosystemConfig, GasToken } from "./base";
import { Env } from "./base";

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
  AuroraMainnet = 1313161554,
  AuroraTestnet = 1313161555,
  AuroraLocalnet = 1313161556, // TODO: This is a placeholder
  FantomMainnet = 250,
  FantomTestnet = 4002,
  FantomLocalnet = 4003, // TODO: This is a placeholder
  KaruraMainnet = 686,
  KaruraTestnet = 596,
  KaruraLocalnet = 606, // TODO: This is a placeholder
  AcalaMainnet = 787,
  AcalaTestnet = 597,
  AcalaLocalnet = 607, // TODO: This is a placeholder
}

interface EvmNativeCurrencySpec {
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
}

export interface EvmChainConfig extends ChainConfig {
  /** This should be unique for a given Env */
  readonly ecosystem: EcosystemId,
  readonly chainId: EvmChainId;
  readonly chainName: string;
  readonly nativeCurrency: EvmNativeCurrencySpec;
  readonly rpcUrls: readonly string[];
}

export interface EvmEcosystemConfig extends EcosystemConfig {
  readonly chains: readonly EvmChainConfig[];
}

// const ETHEREUM_NATIVE_CURRENCY = {
//   name: "Ethereum",
//   symbol: "ETH",
//   decimals: 18,
// };

// const BSC_NATIVE_CURRENCY = {
//   name: "Binance Coin",
//   symbol: "BNB",
//   decimals: 18, // no other value is allowed by Metamask
// };

// const AVALANCHE_NATIVE_CURRENCY = {
//   name: "Avalanche",
//   symbol: "AVAX",
//   decimals: 18, // no other value is allowed by Metamask
// };

// const POLYGON_NATIVE_CURRENCY = {
//   name: "Matic",
//   symbol: "MATIC",
//   decimals: 18, // no other value is allowed by Metamask
// };

// const AURORA_NATIVE_CURRENCY = {
//   name: "Ethereum",
//   symbol: "ETH",
//   decimals: 18, // no other value is allowed by Metamask
// };

// const FANTOM_NATIVE_CURRENCY = {
//   name: "FTM",
//   symbol: "FTM",
//   decimals: 18, // no other value is allowed by Metamask
// };

// const KARURA_NATIVE_CURRENCY = {
//   name: "Karura",
//   symbol: "KAR",
//   decimals: 18, // no other value is allowed by Metamask
// };

// const ACALA_NATIVE_CURRENCY = {
//   name: "Acala",
//   symbol: "ACA",
//   decimals: 18, // no other value is allowed by Metamask
// };

export enum EcosystemId {
  Ethereum = "ethereum",
  Bsc = "bsc",
  Avalanche = "avalanche",
  Polygon = "polygon",
  Aurora = "aurora",
  Fantom = "fantom",
  Karura = "karura",
  Acala = "acala",
}

export const enum WormholeChainId {
  Solana = 1,
  Ethereum = 2,
  Terra = 3,
  Bsc = 4,
  Polygon = 5, // NOTE: in some parts of the code, the listed order is swapped with Avalanche but ID is the same
  Avalanche = 6,
  Oasis = 7,
  Algorand = 8,
  Aurora = 9,
  Fantom = 10,
  Karura = 11,
  Acala = 12,
  Klaytn = 13,
}

export interface Ecosystem {
  readonly id: EcosystemId;
  readonly wormholeChainId: WormholeChainId;
  readonly displayName: string;
  readonly nativeTokenSymbol: string;
}

// export const ecosystemList: ReadonlyMap<EcosystemId, Ecosystem> = new Map([
//   [
//     EcosystemId.Ethereum,
//     {
//       id: EcosystemId.Ethereum,
//       wormholeChainId: WormholeChainId.Ethereum,
//       displayName: "Ethereum",
//       nativeTokenSymbol: "ETH",
//     },
//   ],
//   [
//     EcosystemId.Bsc,
//     {
//       id: EcosystemId.Bsc,
//       wormholeChainId: WormholeChainId.Bsc,
//       displayName: "BNB Chain",
//       nativeTokenSymbol: "BNB",
//     },
//   ],
//   [
//     EcosystemId.Avalanche,
//     {
//       id: EcosystemId.Avalanche,
//       wormholeChainId: WormholeChainId.Avalanche,
//       displayName: "Avalanche",
//       nativeTokenSymbol: "AVAX",
//     },
//   ],
//   [
//     EcosystemId.Avalanche,
//     {
//       id: EcosystemId.Polygon,
//       wormholeChainId: WormholeChainId.Polygon,
//       displayName: "Polygon",
//       nativeTokenSymbol: "MATIC",
//     },
//   ],
//   [
//     EcosystemId.Aurora,
//     {
//       id: EcosystemId.Aurora,
//       wormholeChainId: WormholeChainId.Aurora,
//       displayName: "Aurora",
//       nativeTokenSymbol: "AURORA",
//     },
//   ],
//   [
//     EcosystemId.Fantom,
//     {
//       id: EcosystemId.Fantom,
//       wormholeChainId: WormholeChainId.Fantom,
//       displayName: "Fantom",
//       nativeTokenSymbol: "FTM",
//     },
//   ],
//   [
//     EcosystemId.Karura,
//     {
//       id: EcosystemId.Karura,
//       wormholeChainId: WormholeChainId.Karura,
//       displayName: "Karura",
//       nativeTokenSymbol: "KAR",
//     },
//   ],
//   [
//     EcosystemId.Acala,
//     {
//       id: EcosystemId.Acala,
//       wormholeChainId: WormholeChainId.Acala,
//       displayName: "Acala",
//       nativeTokenSymbol: "ACA",
//     },
//   ],
// ]);

// export const PRESETS: ReadonlyMap<Env, EvmChainConfig> = new Map([
//   // Mainnet
//   [
//     Env.Mainnet,
//     {
//       env: Env.Mainnet,
//       ecosystem: EcosystemId.Ethereum,
//       chainId: EvmChainId.EthereumMainnet,
//       chainName: "Ethereum Mainnet",
//       nativeCurrency: ETHEREUM_NATIVE_CURRENCY,
//       rpcUrls: ["https://main-light.eth.linkpool.io/"], // TODO: Think about what is best to recommend to MetaMask
//       wormholeBridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
//       wormholeTokenBridge: "0x3ee18B2214AFF97000D974cf647E7C347E8fa585",
//     },
//   ],
//   [
//     Env.Mainnet,
//     {
//       env: Env.Mainnet,
//       ecosystem: EcosystemId.Bsc,
//       chainId: EvmChainId.BscMainnet,
//       chainName: "BNB Chain Mainnet",
//       nativeCurrency: BSC_NATIVE_CURRENCY,
//       rpcUrls: ["https://bsc-dataseed1.ninicoin.io"], // TODO: Think about what is best to recommend to MetaMask
//       wormholeBridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
//       wormholeTokenBridge: "0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7",
//     },
//   ],
//   [
//     Env.Mainnet,
//     {
//       env: Env.Mainnet,
//       ecosystem: EcosystemId.Avalanche,
//       chainId: EvmChainId.AvalancheMainnet,
//       chainName: "Avalanche Mainnet",
//       nativeCurrency: AVALANCHE_NATIVE_CURRENCY,
//       rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"], // TODO: Think about what is best to recommend to MetaMask
//       wormholeBridge: "0x54a8e5f9c4CbA08F9943965859F6c34eAF03E26c",
//       wormholeTokenBridge: "0x0e082F06FF657D94310cB8cE8B0D9a04541d8052",
//     },
//   ],
//   [
//     Env.Mainnet,
//     {
//       env: Env.Mainnet,
//       ecosystem: EcosystemId.Polygon,
//       chainId: EvmChainId.PolygonMainnet,
//       chainName: "Polygon Mainnet",
//       nativeCurrency: POLYGON_NATIVE_CURRENCY,
//       rpcUrls: ["https://polygon-rpc.com/"], // TODO: Think about what is best to recommend to MetaMask
//       wormholeBridge: "0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7",
//       wormholeTokenBridge: "0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE",
//     },
//   ],
//   [
//     Env.Mainnet,
//     {
//       env: Env.Mainnet,
//       ecosystem: EcosystemId.Aurora,
//       chainId: EvmChainId.AuroraMainnet,
//       chainName: "Aurora Mainnet",
//       nativeCurrency: AURORA_NATIVE_CURRENCY,
//       rpcUrls: ["https://mainnet.aurora.dev/"], // TODO: Think about what is best to recommend to MetaMask
//       wormholeBridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
//       wormholeTokenBridge: "0x51b5123a7b0F9b2bA265f9c4C8de7D78D52f510F",
//     },
//   ],
//   [
//     Env.Mainnet,
//     {
//       env: Env.Mainnet,
//       ecosystem: EcosystemId.Fantom,
//       chainId: EvmChainId.FantomMainnet,
//       chainName: "Fantom Mainnet",
//       nativeCurrency: FANTOM_NATIVE_CURRENCY,
//       rpcUrls: ["https://rpc.ftm.tools/"], // TODO: Think about what is best to recommend to MetaMask
//       wormholeBridge: "0x126783A6Cb203a3E35344528B26ca3a0489a1485",
//       wormholeTokenBridge: "0x7C9Fc5741288cDFdD83CeB07f3ea7e22618D79D2",
//     },
//   ],
//   [
//     Env.Mainnet,
//     {
//       env: Env.Mainnet,
//       ecosystem: EcosystemId.Karura,
//       chainId: EvmChainId.KaruraMainnet,
//       chainName: "Karura Mainnet",
//       nativeCurrency: KARURA_NATIVE_CURRENCY,
//       rpcUrls: ["https://karura.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
//       wormholeBridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
//       wormholeTokenBridge: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
//     },
//   ],
//   [
//     Env.Mainnet,
//     {
//       env: Env.Mainnet,
//       ecosystem: EcosystemId.Acala,
//       chainId: EvmChainId.AcalaMainnet,
//       chainName: "Acala Mainnet",
//       nativeCurrency: ACALA_NATIVE_CURRENCY,
//       rpcUrls: ["https://acala-polkadot.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
//       wormholeBridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
//       wormholeTokenBridge: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
//     },
//   ],
//   // Devnet
//   [
//     Env.Devnet,
//     {
//       env: Env.Devnet,
//       ecosystem: EcosystemId.Ethereum,
//       chainId: EvmChainId.EthereumGoerli,
//       chainName: "Ethereum Goerli Testnet",
//       nativeCurrency: ETHEREUM_NATIVE_CURRENCY,
//       rpcUrls: ["https://goerli.prylabs.net/"],
//       wormholeBridge: "0x706abc4E45D419950511e474C7B9Ed348A4a716c",
//       wormholeTokenBridge: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
//     },
//   ],
//   [
//     Env.Devnet,
//     {
//       env: Env.Devnet,
//       ecosystem: EcosystemId.Bsc,
//       chainId: EvmChainId.BscTestnet,
//       chainName: "BNB Chain Testnet",
//       nativeCurrency: BSC_NATIVE_CURRENCY,
//       rpcUrls: ["https://data-seed-prebsc-2-s2.binance.org:8545"],
//       wormholeBridge: "0x68605AD7b15c732a30b1BbC62BE8F2A509D74b4D",
//       wormholeTokenBridge: "0x9dcF9D205C9De35334D646BeE44b2D2859712A09",
//     },
//   ],
//   [
//     Env.Devnet,
//     {
//       env: Env.Devnet,
//       ecosystem: EcosystemId.Avalanche,
//       chainId: EvmChainId.AvalancheTestnet,
//       chainName: "Avalanche Testnet",
//       nativeCurrency: AVALANCHE_NATIVE_CURRENCY,
//       rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"], // TODO: Replace/refactor
//       wormholeBridge: "0x7bbcE28e64B3F8b84d876Ab298393c38ad7aac4C",
//       wormholeTokenBridge: "0x61E44E506Ca5659E6c0bba9b678586fA2d729756",
//     },
//   ],
//   [
//     Env.Devnet,
//     {
//       env: Env.Devnet,
//       ecosystem: EcosystemId.Polygon,
//       chainId: EvmChainId.PolygonTestnet,
//       chainName: "Polygon Testnet",
//       nativeCurrency: POLYGON_NATIVE_CURRENCY,
//       rpcUrls: ["https://rpc-mumbai.maticvigil.com"], // TODO: Replace/refactor
//       wormholeBridge: "0x0CBE91CF822c73C2315FB05100C2F714765d5c20",
//       wormholeTokenBridge: "0x377D55a7928c046E18eEbb61977e714d2a76472a",
//     },
//   ],
//   [
//     Env.Devnet,
//     {
//       env: Env.Devnet,
//       ecosystem: EcosystemId.Aurora,
//       chainId: EvmChainId.AuroraTestnet,
//       chainName: "Aurora Testnet",
//       nativeCurrency: AURORA_NATIVE_CURRENCY,
//       rpcUrls: ["https://testnet.aurora.dev/"], // TODO: Think about what is best to recommend to MetaMask
//       wormholeBridge: "0xBd07292de7b505a4E803CEe286184f7Acf908F5e",
//       wormholeTokenBridge: "0xD05eD3ad637b890D68a854d607eEAF11aF456fba",
//     },
//   ],
//   [
//     Env.Devnet,
//     {
//       env: Env.Devnet,
//       ecosystem: EcosystemId.Fantom,
//       chainId: EvmChainId.FantomTestnet,
//       chainName: "Fantom Testnet",
//       nativeCurrency: FANTOM_NATIVE_CURRENCY,
//       rpcUrls: ["https://rpc.testnet.fantom.network/"], // TODO: Think about what is best to recommend to MetaMask
//       wormholeBridge: "0x1BB3B4119b7BA9dfad76B0545fb3F531383c3bB7",
//       wormholeTokenBridge: "0x599CEa2204B4FaECd584Ab1F2b6aCA137a0afbE8",
//     },
//   ],
//   [
//     Env.Devnet,
//     {
//       env: Env.Devnet,
//       ecosystem: EcosystemId.Karura,
//       chainId: EvmChainId.KaruraTestnet,
//       chainName: "Karura Testnet",
//       nativeCurrency: KARURA_NATIVE_CURRENCY,
//       rpcUrls: ["https://karura-dev.aca-dev.network/eth/http"], // TODO: Think about what is best to recommend to MetaMask
//       wormholeBridge: "0xE4eacc10990ba3308DdCC72d985f2a27D20c7d03",
//       wormholeTokenBridge: "0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37",
//     },
//   ],
//   [
//     Env.Devnet,
//     {
//       env: Env.Devnet,
//       ecosystem: EcosystemId.Acala,
//       chainId: EvmChainId.AcalaTestnet,
//       chainName: "Acala Testnet",
//       nativeCurrency: ACALA_NATIVE_CURRENCY,
//       rpcUrls: ["https://acala-dev.aca-dev.network/eth/http"], // TODO: Think about what is best to recommend to MetaMask
//       wormholeBridge: "0x4377B49d559c0a9466477195C6AdC3D433e265c0",
//       wormholeTokenBridge: "0xebA00cbe08992EdD08ed7793E07ad6063c807004",
//     },
//   ],
// ]);

const createEcosystemConfig = (
  ecosystemId: EcosystemId,
  wormholeChainId: WormholeChainId,
  displayName: string,
  gasToken: GasToken,
  nativeTokenSymbol: string,
  chains: readonly EvmChainConfig[],
): EvmEcosystemConfig => ({
  id: ecosystemId,
  protocol: "evm" as const,
  wormholeChainId: wormholeChainId,
  displayName: displayName,
  nativeTokenSymbol: nativeTokenSymbol,
  chains,
});

export default createEcosystemConfig;
