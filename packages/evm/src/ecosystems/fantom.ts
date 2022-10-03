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

export const fantomChainId = assertType<EvmChainIdByEnv>()({
  [Env.Mainnet]: 250,
  [Env.Testnet]: 4002,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Fantom> = {
  name: "Fantom Mainnet",
  chainId: fantomChainId[Env.Mainnet],
  wormhole: {
    bridge: "0x126783A6Cb203a3E35344528B26ca3a0489a1485",
    portal: "0x7C9Fc5741288cDFdD83CeB07f3ea7e22618D79D2",
  },
  publicRpcUrls: ["https://rpc.ftm.tools/"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [
    {
      id: "mainnet-fantom-usdc",
      projectId: TokenProjectId.Usdc,
      nativeDetails: {
        address: "0x04068DA6C83AFCFA0e13ba15A6696662335D5B75",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "Dnr8fDaswHtYMSKbtR9e8D5EadyxqyJwE98xp17ZxE2E",
            decimals: 6,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfig<EvmEcosystemId.Fantom> = {
  name: "Fantom Testnet",
  chainId: fantomChainId[Env.Testnet],
  wormhole: {
    bridge: "0x1BB3B4119b7BA9dfad76B0545fb3F531383c3bB7",
    portal: "0x599CEa2204B4FaECd584Ab1F2b6aCA137a0afbE8",
  },
  publicRpcUrls: ["https://rpc.testnet.fantom.network/"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [],
  pools: [],
};

const gasToken: GasToken = {
  name: "FTM",
  symbol: "FTM",
  decimals: 18,
};

export const fantom = assertType<EvmEcosystemConfig<EvmEcosystemId.Fantom>>()({
  id: EvmEcosystemId.Fantom,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 10,
  displayName: "Fantom",
  gasToken,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
  },
} as const);
