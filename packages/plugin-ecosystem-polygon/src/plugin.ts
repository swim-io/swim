import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-types';
import { createEvmEcosystemConfigPlugin } from '@swim-io/evm-types';
import { Env } from "@swim-io/core-types";

export type PolygonEcosystemId = "polygon";
export const POLYGON_ECOSYSTEM_ID: PolygonEcosystemId = "polygon";

export type PolygonWormholeChainId = 5;
export const POLYGON_WORMHOLE_CHAIN_ID: PolygonWormholeChainId = 5;

export const enum PolygonChainId {
  Mainnet = 137,
  Testnet = 80001,
}

export type PolygonChainConfig = EvmChainConfig<PolygonEcosystemId, PolygonChainId>;

export type PolygonEcosystemConfig = EvmEcosystemConfig<
  PolygonEcosystemId,
  PolygonWormholeChainId,
  PolygonChainId
>;

export const PRESETS: ReadonlyMap<Env, PolygonChainConfig> = new Map([
  [
    Env.Mainnet,
    {
      ecosystem: POLYGON_ECOSYSTEM_ID,
      chainId: PolygonChainId.Mainnet,
      chainName: "Polygon Mainnet",
      rpcUrls: ["https://polygon-rpc.com/"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0x7A4B5a56256163F07b2C80A7cA55aBE66c4ec4d7",
      wormholeTokenBridge: "0x5a58505a96D1dbf8dF91cB21B54419FC36e93fdE",
    },
  ],
  [
    Env.Devnet,
    {
      ecosystem: POLYGON_ECOSYSTEM_ID,
      chainId: PolygonChainId.Testnet,
      chainName: "Polygon Testnet",
      rpcUrls: ["https://rpc-mumbai.maticvigil.com"], // TODO: Replace/refactor
      wormholeBridge: "0x0CBE91CF822c73C2315FB05100C2F714765d5c20",
      wormholeTokenBridge: "0x377D55a7928c046E18eEbb61977e714d2a76472a",
    },
  ],
]);

export const createPolygonEcosystemConfig = createEvmEcosystemConfigPlugin(
  POLYGON_ECOSYSTEM_ID,
  POLYGON_WORMHOLE_CHAIN_ID,
  {
    name: "Matic",
    symbol: "MATIC",
    decimals: 18,
  },
);
