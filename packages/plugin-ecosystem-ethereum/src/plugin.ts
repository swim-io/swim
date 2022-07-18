import type { EcosystemPlugin, GasToken } from "@swim-io/core-types";
import { Env } from "@swim-io/core-types";
import type {
  EvmChainConfig,
  EvmEcosystemConfig,
  EvmProtocol,
} from "@swim-io/evm-types";
import { createEvmEcosystemPlugin } from "@swim-io/evm-types";

type EthereumEcosystemId = "ethereum";
const ETHEREUM_ECOSYSTEM_ID: EthereumEcosystemId = "ethereum";

type EthereumWormholeChainId = 2;
const ETHEREUM_WORMHOLE_CHAIN_ID: EthereumWormholeChainId = 2;

export enum EthereumChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
}

export type EthereumChainConfig = EvmChainConfig<
  EthereumEcosystemId,
  EthereumChainId
>;

export type EthereumEcosystemConfig = EvmEcosystemConfig<
  EthereumEcosystemId,
  EthereumWormholeChainId,
  EthereumChainId,
  EthereumChainConfig
>;

const presetChains: ReadonlyMap<Env, EthereumChainConfig> = new Map([
  [
    Env.Mainnet,
    {
      name: "Ethereum Mainnet",
      ecosystemId: ETHEREUM_ECOSYSTEM_ID,
      chainId: EthereumChainId.Mainnet,
      wormholeBridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
      wormholeTokenBridge: "0x3ee18B2214AFF97000D974cf647E7C347E8fa585",
      publicRpcUrl: "https://main-light.eth.linkpool.io/", // TODO: Think about what is best to recommend to MetaMask
    },
  ],
  [
    Env.Devnet,
    {
      name: "Ethereum Goerli Testnet",
      ecosystemId: ETHEREUM_ECOSYSTEM_ID,
      chainId: EthereumChainId.Goerli,
      wormholeBridge: "0x706abc4E45D419950511e474C7B9Ed348A4a716c",
      wormholeTokenBridge: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
      publicRpcUrl: "https://goerli.prylabs.net/", // TODO: Think about what is best to recommend to MetaMask
    },
  ],
]);

const gasToken: GasToken = {
  name: "Ethereum",
  symbol: "ETH",
  decimals: 18,
};

export const plugin: EcosystemPlugin<
  EvmProtocol,
  EthereumEcosystemId,
  EthereumWormholeChainId,
  EthereumChainId,
  EthereumChainConfig
> = createEvmEcosystemPlugin(
  ETHEREUM_ECOSYSTEM_ID,
  ETHEREUM_WORMHOLE_CHAIN_ID,
  "Ethereum",
  gasToken,
  presetChains,
);
