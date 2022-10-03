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

export const polygonChainId = assertType<EvmChainIdByEnv>()({
  [Env.Mainnet]: 137,
  [Env.Testnet]: 80001,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Polygon> = {
  name: "Polygon Mainnet",
  chainId: polygonChainId[Env.Mainnet],
  wormhole: {
    bridge: "0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7",
    portal: "0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE",
  },
  publicRpcUrls: ["https://polygon-rpc.com/"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [
    {
      id: "mainnet-polygon-usdc",
      projectId: TokenProjectId.Usdc,
      nativeDetails: {
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "E2VmbootbVCBkMNNxKQgCLMS1X3NoGMaYAsufaAsf7M",
            decimals: 6,
          },
        ],
      ]),
    },
    {
      id: "mainnet-polygon-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "5goWRao6a3yNC4d6UjMdQxonkCMvKBwdpubU3qhfcdf1",
            decimals: 6,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfig<EvmEcosystemId.Polygon> = {
  name: "Polygon Testnet",
  chainId: polygonChainId[Env.Testnet],
  wormhole: {
    bridge: "0x0CBE91CF822c73C2315FB05100C2F714765d5c20",
    portal: "0x377D55a7928c046E18eEbb61977e714d2a76472a",
  },
  publicRpcUrls: ["https://rpc-mumbai.maticvigil.com"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [],
  pools: [],
};

const gasToken: GasToken = {
  name: "Matic",
  symbol: "MATIC",
  decimals: 18,
};

export const polygon = assertType<EvmEcosystemConfig<EvmEcosystemId.Polygon>>()(
  {
    id: EvmEcosystemId.Polygon,
    protocol: EVM_PROTOCOL,
    wormholeChainId: 5,
    displayName: "Polygon",
    gasToken,
    chains: {
      [Env.Mainnet]: mainnet,
      [Env.Testnet]: testnet,
    },
  } as const,
);
