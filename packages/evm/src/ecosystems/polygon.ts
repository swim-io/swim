import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { assertType } from "@swim-io/utils";

import type {
  EvmChainConfig,
  EvmChainIdByEnv,
  EvmEcosystemConfig,
} from "../protocol";
import { EVM_PROTOCOL, EvmEcosystemId } from "../protocol";

export const polygonChainId = assertType<EvmChainIdByEnv>()({
  [Env.Mainnet]: 137,
  [Env.Devnet]: 80001,
});

const mainnet: EvmChainConfig<EvmEcosystemId.Polygon> = {
  name: "Polygon Mainnet",
  chainId: polygonChainId[Env.Mainnet],
  wormhole: {
    bridge: "0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7",
    portal: "0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE",
  },
  publicRpcUrls: ["https://polygon-rpc.com/"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const devnet: EvmChainConfig<EvmEcosystemId.Polygon> = {
  name: "Polygon Testnet",
  chainId: polygonChainId[Env.Devnet],
  wormhole: {
    bridge: "0x0CBE91CF822c73C2315FB05100C2F714765d5c20",
    portal: "0x377D55a7928c046E18eEbb61977e714d2a76472a",
  },
  publicRpcUrls: ["https://rpc-mumbai.maticvigil.com"], // TODO: Think about what is best to recommend to MetaMask
  tokens: [],
  pools: [],
};

const chains: ReadonlyMap<
  Env,
  EvmChainConfig<EvmEcosystemId.Polygon>
> = new Map([
  [Env.Mainnet, mainnet],
  [Env.Devnet, devnet],
]);

const gasToken: GasToken = {
  name: "Matic",
  symbol: "MATIC",
  decimals: 18,
};

export const polygon: EvmEcosystemConfig<EvmEcosystemId.Polygon> = {
  id: EvmEcosystemId.Polygon,
  protocol: EVM_PROTOCOL,
  wormholeChainId: 5,
  displayName: "Polygon",
  gasToken,
  chains,
};
