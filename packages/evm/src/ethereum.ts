import type { GasToken } from "@swim-io/core-types";
import { Env } from "@swim-io/core-types";

import type { EvmChainConfig, EvmEcosystemConfig } from "./protocol";
import { EVM_PROTOCOL } from "./protocol";

export enum EthereumChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Localnet = 1337,
}

const mainnet: EvmChainConfig = {
  name: "Ethereum Mainnet",
  chainId: EthereumChainId.Mainnet,
  wormholeBridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
  wormholeTokenBridge: "0x3ee18B2214AFF97000D974cf647E7C347E8fa585",
  publicRpcUrl: "https://main-light.eth.linkpool.io/", // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const devnet: EvmChainConfig = {
  name: "Ethereum Görli Testnet",
  chainId: EthereumChainId.Goerli,
  wormholeBridge: "0x706abc4E45D419950511e474C7B9Ed348A4a716c",
  wormholeTokenBridge: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
  publicRpcUrl: "https://goerli.prylabs.net/", // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const localnet: EvmChainConfig = {
  name: "Ethereum Localnet",
  chainId: EthereumChainId.Localnet,
  wormholeBridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
  wormholeTokenBridge: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
  publicRpcUrl: "http://localhost:8545",
  tokens: [],
  pools: [],
};

const chains: ReadonlyMap<Env, EvmChainConfig> = new Map([
  [Env.Mainnet, mainnet],
  [Env.Devnet, devnet],
  [Env.Local, localnet],
]);

const gasToken: GasToken = {
  name: "Ethereum",
  symbol: "ETH",
  decimals: 18,
};

export const ethereum: EvmEcosystemConfig = {
  id: "ethereum",
  protocol: EVM_PROTOCOL,
  wormholeChainId: 2,
  displayName: "Ethereum",
  gasToken,
  chains,
};
