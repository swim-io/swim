import type { GasToken, TokenDetails } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { TokenProjectId } from "@swim-io/token-projects";
import { assertType } from "@swim-io/utils";

import type {
  EvmChainConfig,
  EvmChainIdByEnv,
  EvmEcosystemConfig,
} from "../protocol";
import { EVM_PROTOCOL, EvmEcosystemId } from "../protocol";

const EMPTY_MAP: ReadonlyMap<string, TokenDetails> = new Map();
const SOLANA_ECOSYSTEM_ID = "solana";

export const acalaChainId = assertType<EvmChainIdByEnv>()({
  [Env.Mainnet]: 787,
  [Env.Testnet]: 597,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Acala> = {
  name: "Acala Mainnet",
  chainId: acalaChainId[Env.Mainnet],
  wormhole: {
    bridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
    portal: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
  },
  publicRpcUrls: ["https://acala-polkadot.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [
    {
      isDisabled: !process.env.REACT_APP_ENABLE_ACALA,
      id: "mainnet-acala-ausd",
      projectId: TokenProjectId.Ausd,
      nativeDetails: {
        address: "0x0000000000000000000000000000000000000000", // TODO: Update
        decimals: 6, // TODO: Update
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "11111111111111111111111111111112", // TODO: Update
            decimals: 6, // TODO: Update
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfig<EvmEcosystemId.Acala> = {
  name: "Acala Testnet",
  chainId: acalaChainId[Env.Testnet],
  wormhole: {
    bridge: "0x4377B49d559c0a9466477195C6AdC3D433e265c0",
    portal: "0xebA00cbe08992EdD08ed7793E07ad6063c807004",
  },
  publicRpcUrls: ["https://acala-dev.aca-dev.network/eth/http"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [
    {
      isDisabled: !process.env.REACT_APP_ENABLE_ACALA,
      id: "testnet-acala-ausd",
      projectId: TokenProjectId.Ausd,
      nativeDetails: {
        address: "0x996f42BdB0CB71F831C2eFB05Ac6d0d226979e5B",
        decimals: 12,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "BbdPh2Nvpp7XftBHWENJu5dpC5gF5FtCSyFLTU4qNr7g",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      isDisabled:
        !process.env.REACT_APP_ENABLE_POOL_RESTRUCTURE ||
        !process.env.REACT_APP_ENABLE_ACALA,
      id: "testnet-acala-lp-ausd",
      projectId: TokenProjectId.SwimLpAcalaAusd,
      nativeDetails: {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
  ],
  pools: [],
};

const gasToken: GasToken = {
  name: "Acala",
  symbol: "ACA",
  decimals: 18,
};

export const acala = assertType<EvmEcosystemConfig<EvmEcosystemId.Acala>>()({
  id: EvmEcosystemId.Acala,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 12,
  displayName: "Acala",
  gasToken,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
  },
} as const);
