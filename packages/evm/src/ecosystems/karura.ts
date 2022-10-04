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

export const karuraChainId = assertType<EvmChainIdByEnv>()({
  [Env.Mainnet]: 686,
  [Env.Testnet]: 596,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Karura> = {
  name: "Karura Mainnet",
  chainId: karuraChainId[Env.Mainnet],
  wormhole: {
    bridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
    portal: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
  },
  publicRpcUrls: ["https://karura.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [
    {
      isDisabled: !process.env.REACT_APP_ENABLE_KARURA_AUSD,
      id: "mainnet-karura-ausd",
      projectId: TokenProjectId.Ausd,
      nativeDetails: {
        address: "0x0000000000000000000100000000000000000081",
        decimals: 12,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "3sEvyXzC2vAPqF7uprB2vRaL1X1FbqQqmPxhwVi53GYF",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "mainnet-karura-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "0x0000000000000000000500000000000000000007",
        decimals: 6,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "E942z7FnS7GpswTvF5Vggvo7cMTbvZojjLbFgsrDVff1",
            decimals: 6,
          },
        ],
      ]),
    },
  ],
  pools: [],
};

const testnet: EvmChainConfig<EvmEcosystemId.Karura> = {
  name: "Karura Testnet",
  chainId: karuraChainId[Env.Testnet],
  wormhole: {
    bridge: "0xE4eacc10990ba3308DdCC72d985f2a27D20c7d03",
    portal: "0xd11De1f930eA1F7Dd0290Fe3a2e35b9C91AEFb37",
  },
  publicRpcUrls: ["https://karura-dev.aca-dev.network/eth/http"], // TODO: Think about what is best to recommend to MetaMask
  swimUsdDetails: {
    address: "", // TODO: add when deployed
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [
    {
      id: "testnet-karura-ausd",
      projectId: TokenProjectId.Ausd,
      nativeDetails: {
        address: "0x074370ca8Fea9e8f1C5eE23f34CBdcD3FB7a66aD",
        decimals: 12,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "BRpsJtEUyCPQPRP4DAavXU5KmBqfgKQmX7fwnpVvUUMG",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      id: "testnet-karura-usdt",
      projectId: TokenProjectId.Usdt,
      nativeDetails: {
        address: "0x535d5e3b1ff7de526fe180e654a41350903c328d",
        decimals: 18,
      },
      wrappedDetails: new Map([
        [
          SOLANA_ECOSYSTEM_ID,
          {
            address: "AnYj8Rbkfd8FYmoiyv6iDS3Tje7PzhPWyE5VZVDh9pzD",
            decimals: 8,
          },
        ],
      ]),
    },
    {
      isDisabled: !process.env.REACT_APP_ENABLE_POOL_RESTRUCTURE,
      id: "testnet-karura-lp-usdt",
      projectId: TokenProjectId.SwimLpKaruraUsdt,
      nativeDetails: {
        address: "0x1111111111111111111111111111111111111111", // TODO: Update
        decimals: 8,
      },
      wrappedDetails: EMPTY_MAP,
    },
    {
      isDisabled:
        !process.env.REACT_APP_ENABLE_POOL_RESTRUCTURE ||
        !process.env.REACT_APP_ENABLE_KARURA_AUSD,
      id: "testnet-karura-lp-ausd",
      projectId: TokenProjectId.SwimLpKaruraAusd,
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
  name: "Karura",
  symbol: "KAR",
  decimals: 18,
};

export const karura = assertType<EvmEcosystemConfig<EvmEcosystemId.Karura>>()({
  id: EvmEcosystemId.Karura,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 11,
  displayName: "Karura",
  gasToken,
  chains: {
    [Env.Mainnet]: mainnet,
    [Env.Testnet]: testnet,
  },
} as const);
