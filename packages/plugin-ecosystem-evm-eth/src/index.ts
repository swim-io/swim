import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-config';
import { Env } from "@swim-io/core-types";

const EthereumEcosystemId = "ethereum";
const EthereumMainnetChainId = 1;
const EthereumGoerliChainId = 5;
const EthereumWormholeChainId = 2;

export const PRESETS: ReadonlyMap<Env, EvmEcosystemConfig> = new Map([
    [
        Env.Mainnet,
        {
        ecosystem: EthereumEcosystemId,
        chainId: EthereumMainnetChainId,
        chainName: "Ethereum Mainnet",
        rpcUrls: ["https://main-light.eth.linkpool.io/"], // TODO: Think about what is best to recommend to MetaMask
        wormholeBridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
        wormholeTokenBridge: "0x3ee18B2214AFF97000D974cf647E7C347E8fa585",
        },
    ],
    [
      Env.Devnet,
      {
        ecosystem: EthereumEcosystemId,
        chainId: EthereumGoerliChainId,
        chainName: "Ethereum Goerli Testnet",
        rpcUrls: ["https://goerli.prylabs.net/"],
        wormholeBridge: "0x706abc4E45D419950511e474C7B9Ed348A4a716c",
        wormholeTokenBridge: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
      },
    ],
  ]);

export const createEthEcosystemConfig = (
  chains: readonly EvmChainConfig[],
): EvmEcosystemConfig => ({
  id: EthereumEcosystemId,
  protocol: "evm" as const,
  wormholeChainId: EthereumWormholeChainId,
  displayName: "Ethereum",
  gasToken: {
    name: "eth",
    symbol: "ETH",
    decimals: 9,
  },
  chains,
});