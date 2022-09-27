import type { AptosEcosystemId } from "@swim-io/aptos";
import { APTOS_ECOSYSTEM_ID, AptosChainId } from "@swim-io/aptos";
import type { WormholeChainConfig } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { EvmEcosystemId } from "@swim-io/evm";
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
  readonly wormhole: WormholeChainConfig;
}

export interface SolanaSpec extends ChainSpec {
  readonly ecosystem: SolanaEcosystemId;
  /** This should be unique for a given Env */
  readonly chainId: SolanaChainId;
  // Note, subsequent endpoints are used as fallbacks for SolanaConnection.
  readonly endpoints: readonly string[];
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

export interface AptosSpec extends ChainSpec {
  readonly ecosystem: AptosEcosystemId;
  /** This should be unique for a given Env */
  readonly chainId: AptosChainId;
  readonly chainName: string;
  readonly publicRpcUrls: readonly string[];
}

/** Every Protocol must specify a corresponding ChainSpec array */
export interface ChainsByProtocol {
  readonly [Protocol.Aptos]: readonly AptosSpec[];
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
  [Protocol.Aptos]: [
    {
      // adding an entry so that AptosClient context doesn't throw an error
      ecosystem: APTOS_ECOSYSTEM_ID,
      chainId: AptosChainId.Devnet, // TODO aptos mainnet
      chainName: "Aptos Devnet", // TODO aptos mainnet
      wormhole: {
        bridge: "TODO aptos",
        portal: "TODO aptos",
      },
      publicRpcUrls: ["https://fullnode.devnet.aptoslabs.com/v1"], // TODO aptos mainnet
    },
  ],
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
    },
  ],
  [Protocol.Evm]: [
    {
      ecosystem: EvmEcosystemId.Ethereum,
      chainId: EvmChainId.EthereumMainnet,
      chainName: "Ethereum Mainnet",
      nativeCurrency: ETHEREUM_NATIVE_CURRENCY,
      rpcUrls: ["https://main-light.eth.linkpool.io/"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
        portal: "0x3ee18B2214AFF97000D974cf647E7C347E8fa585",
      },
    },
    {
      ecosystem: EvmEcosystemId.Bnb,
      chainId: EvmChainId.BnbMainnet,
      chainName: "BNB Chain Mainnet",
      nativeCurrency: BNB_NATIVE_CURRENCY,
      rpcUrls: ["https://bsc-dataseed1.ninicoin.io"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
        portal: "0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7",
      },
    },
    {
      ecosystem: EvmEcosystemId.Avalanche,
      chainId: EvmChainId.AvalancheMainnet,
      chainName: "Avalanche Mainnet",
      nativeCurrency: AVALANCHE_NATIVE_CURRENCY,
      rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0x54a8e5f9c4CbA08F9943965859F6c34eAF03E26c",
        portal: "0x0e082F06FF657D94310cB8cE8B0D9a04541d8052",
      },
    },
    {
      ecosystem: EvmEcosystemId.Polygon,
      chainId: EvmChainId.PolygonMainnet,
      chainName: "Polygon Mainnet",
      nativeCurrency: POLYGON_NATIVE_CURRENCY,
      rpcUrls: ["https://polygon-rpc.com/"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7",
        portal: "0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE",
      },
    },
    {
      ecosystem: EvmEcosystemId.Aurora,
      chainId: EvmChainId.AuroraMainnet,
      chainName: "Aurora Mainnet",
      nativeCurrency: AURORA_NATIVE_CURRENCY,
      rpcUrls: ["https://mainnet.aurora.dev/"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
        portal: "0x51b5123a7b0F9b2bA265f9c4C8de7D78D52f510F",
      },
    },
    {
      ecosystem: EvmEcosystemId.Fantom,
      chainId: EvmChainId.FantomMainnet,
      chainName: "Fantom Mainnet",
      nativeCurrency: FANTOM_NATIVE_CURRENCY,
      rpcUrls: ["https://rpc.ftm.tools/"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0x126783A6Cb203a3E35344528B26ca3a0489a1485",
        portal: "0x7C9Fc5741288cDFdD83CeB07f3ea7e22618D79D2",
      },
    },
    {
      ecosystem: EvmEcosystemId.Karura,
      chainId: EvmChainId.KaruraMainnet,
      chainName: "Karura Mainnet",
      nativeCurrency: KARURA_NATIVE_CURRENCY,
      rpcUrls: ["https://karura.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
        portal: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
      },
    },
    {
      ecosystem: EvmEcosystemId.Acala,
      chainId: EvmChainId.AcalaMainnet,
      chainName: "Acala Mainnet",
      nativeCurrency: ACALA_NATIVE_CURRENCY,
      rpcUrls: ["https://acala-polkadot.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
      wormhole: {
        bridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
        portal: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
      },
    },
  ],
};

const TESTNET_CHAINS: ChainsByProtocol = {
  [Protocol.Aptos]: [
    {
      ecosystem: APTOS_ECOSYSTEM_ID,
      chainId: AptosChainId.Devnet,
      chainName: "Aptos Devnet",
      wormhole: {
        bridge: "TODO aptos",
        portal: "TODO aptos",
      },
      publicRpcUrls: ["https://fullnode.devnet.aptoslabs.com/v1"],
    },
  ],
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
        portal: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
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
        portal: "0x9dcF9D205C9De35334D646BeE44b2D2859712A09",
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
        portal: "0x61E44E506Ca5659E6c0bba9b678586fA2d729756",
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
        portal: "0x377D55a7928c046E18eEbb61977e714d2a76472a",
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
        portal: "0xD05eD3ad637b890D68a854d607eEAF11aF456fba",
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
        portal: "0x599CEa2204B4FaECd584Ab1F2b6aCA137a0afbE8",
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
        portal: "0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37",
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
        portal: "0xebA00cbe08992EdD08ed7793E07ad6063c807004",
      },
    },
  ],
};

const LOCAL_CHAINS: ChainsByProtocol = {
  [Protocol.Aptos]: [
    {
      // adding an entry so that AptosClient context doesn't throw an error
      ecosystem: APTOS_ECOSYSTEM_ID,
      chainId: AptosChainId.Devnet, // TODO aptos
      chainName: "Aptos Devnet", // TODO aptos
      wormhole: {
        bridge: "TODO aptos",
        portal: "TODO aptos",
      },
      publicRpcUrls: ["https://fullnode.devnet.aptoslabs.com/v1"], // TODO aptos
    },
  ],
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
    },
  ],
  [Protocol.Evm]: [
    {
      ecosystem: EvmEcosystemId.Ethereum,
      chainId: EvmChainId.EthereumLocal,
      chainName: "Ethereum Local",
      nativeCurrency: ETHEREUM_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8545"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        portal: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EvmEcosystemId.Bnb,
      chainId: EvmChainId.BnbLocal,
      chainName: "BNB Chain Local",
      nativeCurrency: BNB_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8546"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        portal: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EvmEcosystemId.Avalanche,
      chainId: EvmChainId.AvalancheLocal,
      chainName: "Avalanche Local",
      nativeCurrency: AVALANCHE_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8547"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        portal: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EvmEcosystemId.Polygon,
      chainId: EvmChainId.PolygonLocal,
      chainName: "Polygon Local",
      nativeCurrency: POLYGON_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8548"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        portal: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EvmEcosystemId.Aurora,
      chainId: EvmChainId.AuroraLocal,
      chainName: "Aurora Local",
      nativeCurrency: AURORA_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8549"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        portal: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EvmEcosystemId.Fantom,
      chainId: EvmChainId.FantomLocal,
      chainName: "Fantom Local",
      nativeCurrency: FANTOM_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8550"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        portal: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EvmEcosystemId.Karura,
      chainId: EvmChainId.KaruraLocal,
      chainName: "Karura Local",
      nativeCurrency: KARURA_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8551"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        portal: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
    {
      ecosystem: EvmEcosystemId.Acala,
      chainId: EvmChainId.AcalaLocal,
      chainName: "Acala Local",
      nativeCurrency: ACALA_NATIVE_CURRENCY,
      rpcUrls: ["http://localhost:8552"],
      wormhole: {
        bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
        portal: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
      },
    },
  ],
};

export const CHAINS: ReadonlyRecord<Env, ChainsByProtocol> = {
  [Env.Mainnet]: MAINNET_CHAINS,
  [Env.Testnet]: TESTNET_CHAINS,
  [Env.Local]: LOCAL_CHAINS,
  [Env.Custom]: LOCAL_CHAINS,
};
