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

export const auroraChainId = assertType<EvmChainIdByEnv>()({
  [Env.Mainnet]: 1313161554,
  [Env.Testnet]: 1313161555,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Aurora> = {
  name: "Aurora Mainnet",
  chainId: auroraChainId[Env.Mainnet],
  wormhole: {
    bridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
    portal: "0x51b5123a7b0F9b2bA265f9c4C8de7D78D52f510F",
  },
  publicRpcUrls: ["https://mainnet.aurora.dev/"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [
    {
      id: "mainnet-aurora-usdc",
      projectId: TokenProjectId.Usdc,
      nativeDetails: {
        address: "0xB12BFcA5A55806AaF64E99521918A4bf0fC40802",
        decimals: 6,
      },
    },
    {
      id: "mainnet-aurora-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "0x4988a896b1227218e4A686fdE5EabdcAbd91571f",
        decimals: 6,
      },
    },
    {
      id: "mainnet-aurora-usn",
      projectId: TokenProjectId.Usn,
      nativeDetails: {
        address: "0x5183e1B1091804BC2602586919E6880ac1cf2896",
        decimals: 18,
      },
    },
  ],
  pools: [],
};

const testnet: EvmChainConfig<EvmEcosystemId.Aurora> = {
  name: "Aurora Testnet",
  chainId: auroraChainId[Env.Testnet],
  wormhole: {
    bridge: "0xBd07292de7b505a4E803CEe286184f7Acf908F5e",
    portal: "0xD05eD3ad637b890D68a854d607eEAF11aF456fba",
  },
  publicRpcUrls: ["https://testnet.aurora.dev/"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [
    {
      id: "testnet-aurora-usdc",
      projectId: TokenProjectId.Usdc,
      nativeDetails: {
        address: "0x92934a8b10DDF85e81B65Be1D6810544744700dC",
        decimals: 6,
      },
    },
    {
      id: "testnet-aurora-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "0x489dDcd070b6c4e0373FBB5d529Cc06328E048c3",
        decimals: 6,
      },
    },
    {
      id: "testnet-aurora-usn",
      projectId: TokenProjectId.Usn,
      nativeDetails: {
        address: "0x0000000000000000000000000000000000000000", // TODO: Update
        decimals: 18,
      },
    },
    {
      id: "testnet-aurora-lp-usdc-usdt",
      projectId: TokenProjectId.SwimLpAuroraUsdcUsdt,
      nativeDetails: {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    },
    {
      id: "testnet-aurora-lp-usn",
      projectId: TokenProjectId.SwimLpAuroraUsn,
      nativeDetails: {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
    },
  ],
  pools: [],
};

const gasToken: GasToken = {
  name: "Ethereum",
  symbol: "ETH",
  decimals: 18,
};

export const aurora = assertType<EvmEcosystemConfig<EvmEcosystemId.Aurora>>()({
  id: EvmEcosystemId.Aurora,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 9,
  displayName: "Aurora",
  gasToken,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
  },
} as const);
