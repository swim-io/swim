import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { TokenProjectId } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import type {
  EvmChainConfig,
  EvmChainIdByEnv,
  EvmEcosystemConfig,
} from "../protocol";
import { EVM_PROTOCOL, EvmEcosystemId } from "../protocol";

const SOLANA_ECOSYSTEM_ID = "solana";

export const bnbChainId = assertType<EvmChainIdByEnv>()({
  [Env.Mainnet]: 56,
  [Env.Testnet]: 97,
  [Env.Local]: 1397,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Bnb> = {
  name: "BNB Chain Mainnet",
  chainId: bnbChainId[Env.Mainnet],
  wormhole: {
    bridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
    portal: "0xB6F6D86a8f9879A9c87f643768d9efc38c1Da6E7",
  },
  publicRpcUrls: ["https://bsc-dataseed1.ninicoin.io/"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "0xF78479d516A12b9cFb000951D19f67B4fE0B065d", // TODO: Update when deployed
    decimals: 8, // TODO: Confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [
    {
      id: "mainnet-bnb-busd",
      projectId: TokenProjectId.Busd,
      nativeDetails: {
        address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
        decimals: 18,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "mainnet-bnb-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "0x55d398326f99059ff775485246999027b3197955",
        decimals: 18,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "8qJSyQprMC57TWKaYEmetUR3UUiTP2M3hXdcvFhkZdmv",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "mainnet-bnb-gst",
      projectId: TokenProjectId.Gst,
      nativeDetails: {
        address: "0x4a2c860cec6471b9f5f5a336eb4f38bb21683c98",
        decimals: 8,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "GDuUFXEhUm4jG71vPxYRX3VxUMJ5etGvHTR1iKwTdb6p",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "mainnet-bnb-gmt",
      projectId: TokenProjectId.Gmt,
      nativeDetails: {
        address: "0x3019bf2a2ef8040c242c9a4c5c4bd4c81678b2a1",
        decimals: 8,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "7dzFD8xQ3FDmVLxwn75UA9WhVnBsUdRAexASVvpXX3Bo",
            decimals: 8,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfig<EvmEcosystemId.Bnb> = {
  name: "BNB Chain Testnet",
  chainId: bnbChainId[Env.Testnet],
  wormhole: {
    bridge: "0x68605AD7b15c732a30b1BbC62BE8F2A509D74b4D",
    portal: "0x9dcF9D205C9De35334D646BeE44b2D2859712A09",
  },
  publicRpcUrls: ["https://data-seed-prebsc-2-s2.binance.org:8545/"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "0x84252522366DB2eA1dAaDe5E2C55CD90a50aC46e", // TODO: Update when deployed
    decimals: 8, // TODO: Confirm when deployed
  },
  routingContractAddress: "0x280999aB9aBfDe9DC5CE7aFB25497d6BB3e8bDD4", // TODO: Update if necessary
  tokens: [],
  pools: [],
};

const localnet: EvmChainConfig<EvmEcosystemId.Bnb> = {
  name: "BNB Chain Localnet",
  chainId: bnbChainId[Env.Local],
  wormhole: {
    bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
    portal: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
  },
  publicRpcUrls: ["http://localhost:8546"],
  swimUsdDetails: {
    address: "0x7231BBdaB2F3814664f6E1f072A5ae0525709431", // TODO: Update when deployed
    decimals: 8, // TODO: Confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [],
  pools: [],
};

const gasToken: GasToken = {
  name: "Binance Coin",
  symbol: "BNB",
  decimals: 18,
};

export const bnb = assertType<EvmEcosystemConfig<EvmEcosystemId.Bnb>>()({
  id: EvmEcosystemId.Bnb,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 4,
  displayName: "BNB Chain",
  gasToken,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
    [Env.Local]: localnet,
  },
} as const);
