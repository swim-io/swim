import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";

import type { EvmChainConfig, EvmEcosystemConfig } from "../protocol";
import { EVM_PROTOCOL, EvmChainId, EvmEcosystemId } from "../protocol";

export enum EthereumChainId {
  Mainnet = EvmChainId.EthereumMainnet,
  Ropsten = 3, // TODO: can we remove it?
  Rinkeby = 4, // TODO: can we remove it?
  Goerli = EvmChainId.EthereumGoerli,
  Localnet = EvmChainId.EthereumLocal,
}

const mainnet: EvmChainConfig<EvmEcosystemId.Ethereum> = {
  name: "Ethereum Mainnet",
  chainId: EthereumChainId.Mainnet,
  wormhole: {
    bridge: "0x98f3c9e6E3fAce36bAAd05FE09d375Ef1464288B",
    portal: "0x3ee18B2214AFF97000D974cf647E7C347E8fa585",
  },
  publicRpcUrls: ["https://main-light.eth.linkpool.io/"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const devnet: EvmChainConfig<EvmEcosystemId.Ethereum> = {
  name: "Ethereum Görli Testnet",
  chainId: EthereumChainId.Goerli,
  wormhole: {
    bridge: "0x706abc4E45D419950511e474C7B9Ed348A4a716c",
    portal: "0xF890982f9310df57d00f659cf4fd87e65adEd8d7",
  },
  publicRpcUrls: ["https://goerli.prylabs.net/"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const localnet: EvmChainConfig<EvmEcosystemId.Ethereum> = {
  name: "Ethereum Localnet",
  chainId: EthereumChainId.Localnet,
  wormhole: {
    bridge: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
    portal: "0x0290FB167208Af455bB137780163b7B7a9a10C16",
  },
  publicRpcUrls: ["http://localhost:8545"],
  tokens: [],
  pools: [],
};

const chains: ReadonlyMap<
  Env,
  EvmChainConfig<EvmEcosystemId.Ethereum>
> = new Map([
  [Env.Mainnet, mainnet],
  [Env.Devnet, devnet],
  [Env.Local, localnet],
]);

const gasToken: GasToken = {
  name: "Ethereum",
  symbol: "ETH",
  decimals: 18,
};

export const ethereum: EvmEcosystemConfig<EvmEcosystemId.Ethereum> = {
  id: EvmEcosystemId.Ethereum,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 2,
  displayName: "Ethereum",
  gasToken,
  chains,
};
