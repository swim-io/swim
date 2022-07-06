import type { EvmChainConfig, EvmEcosystemConfig } from '@swim-io/evm-types';
import { createEvmEcosystemConfigPlugin } from '@swim-io/evm-types';
import { Env } from "@swim-io/core-types";

export type AcalaEcosystemId = "acala";
export const ACALA_ECOSYSTEM_ID: AcalaEcosystemId = "acala";

export type AcalaWormholeChainId = 12;
export const ACALA_WORMHOLE_CHAIN_ID: AcalaWormholeChainId = 12;

export const enum AcalaChainId {
  Mainnet = 787,
  Testnet = 597,
}

export type AcalaChainConfig = EvmChainConfig<AcalaEcosystemId, AcalaChainId>;

export type AcalaEcosystemConfig = EvmEcosystemConfig<
  AcalaEcosystemId,
  AcalaWormholeChainId,
  AcalaChainId
>;

export const PRESETS: ReadonlyMap<Env, AcalaChainConfig> = new Map([
  [
    Env.Mainnet,
    {
      ecosystem: ACALA_ECOSYSTEM_ID,
      chainId: AcalaChainId.Mainnet,
      chainName: "Acala Mainnet",
      rpcUrls: ["https://acala-polkadot.api.onfinality.io/public-rpc"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0xa321448d90d4e5b0A732867c18eA198e75CAC48E",
      wormholeTokenBridge: "0xae9d7fe007b3327AA64A32824Aaac52C42a6E624",
    },
  ],
  [
    Env.Devnet,
    {
      ecosystem: ACALA_ECOSYSTEM_ID,
      chainId: AcalaChainId.Testnet,
      chainName: "Acala Testnet",
      rpcUrls: ["https://acala-dev.aca-dev.network/eth/http"], // TODO: Think about what is best to recommend to MetaMask
      wormholeBridge: "0x4377B49d559c0a9466477195C6AdC3D433e265c0",
      wormholeTokenBridge: "0xebA00cbe08992EdD08ed7793E07ad6063c807004",
    },
  ],
]);

export const createAcalaEcosystemConfig = createEvmEcosystemConfigPlugin(
  ACALA_ECOSYSTEM_ID,
  ACALA_WORMHOLE_CHAIN_ID,
  {
    name: "Acala",
    symbol: "ACA",
    decimals: 18,
  },
);
