import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-types';
import { EVM_PROTOCOL } from '@swim-io/evm-types';
import { Env } from "@swim-io/core-types";

export const ETHEREUM_ECOSYSTEM_ID = "ethereum" as const;
export enum EthereumChainId {
  Mainnet = 1,
  Goerli = 5,
}
export const ETHEREUM_WORMHOLE_CHAIN_ID = 2 as const;

export const PRESETS: ReadonlyMap<Env, EvmEcosystemConfig> = new Map([
    [
        Env.Mainnet,
        {
        ecosystem: ETHEREUM_ECOSYSTEM_ID,
        chainId: EthereumChainId.Mainnet,
        chainName: "Ethereum Mainnet",
        rpcUrls: ["https://main-light.eth.linkpool.io/"], // TODO: Think about what is best to recommend to MetaMask
        wormholeBridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
        wormholeTokenBridge: "0x3ee18B2214AFF97000D974cf647E7C347E8fa585",
        },
    ],
    [
      Env.Devnet,
      {
        ecosystem: ETHEREUM_ECOSYSTEM_ID,
        chainId: EthereumChainId.Goerli,
        chainName: "Ethereum Goerli Testnet",
        rpcUrls: ["https://goerli.prylabs.net/"],
        wormholeBridge: "0x706abc4E45D419950511e474C7B9Ed348A4a716c",
        wormholeTokenBridge: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
      },
    ],
  ]);

export const createEthereumEcosystemConfig = (
  chains: readonly EvmChainConfig[],
): EvmEcosystemConfig => ({
  id: ETHEREUM_ECOSYSTEM_ID,
  protocol: EVM_PROTOCOL,
  wormholeChainId: ETHEREUM_WORMHOLE_CHAIN_ID,
  displayName: "Ethereum",
  gasToken: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  chains,
});
