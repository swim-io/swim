import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { assertType } from "@swim-io/utils";

import type { AptosChainConfig, AptosEcosystemConfig } from "./protocol";
import { APTOS_ECOSYSTEM_ID, APTOS_PROTOCOL } from "./protocol";

// Visible on the explorer https://explorer.aptoslabs.com/
export enum AptosChainId {
  Devnet = 31,
}

const testnet: AptosChainConfig = {
  name: "Aptos Devnet",
  chainId: AptosChainId.Devnet,
  wormhole: {
    // https://github.com/wormhole-foundation/wormhole/blob/dee93c4eb39f90f1a09b7c2c62eed9d5a9279f4f/aptos/token_bridge/Move_testnet.toml#L20
    bridge:
      "0xdd0a2618dc5564ccf38d0eca7877198fef51157fea74a6bc2e5e40b52c2a0a08",
    // https://github.com/wormhole-foundation/wormhole/blob/dee93c4eb39f90f1a09b7c2c62eed9d5a9279f4f/aptos/wormhole/Move_testnet.toml#L17
    portal:
      "0x1b1752e26b65fc24971ee5ec9718d2ccdd36bf20486a10b2973ea6dedc6cd197",
  },
  publicRpcUrls: ["https://fullnode.devnet.aptoslabs.com/v1"],
  swimUsdDetails: {
    address: "", // TODO: add when deployed,
    decimals: 8, // TODO: confirm when deployed
  },
  routingContractAddress: "", // TODO: add when deployed
  tokens: [],
  pools: [],
};

const gasToken: GasToken = {
  name: "Aptos Coin",
  symbol: "APT",
  decimals: 8,
};

export const aptos = assertType<AptosEcosystemConfig>()({
  id: APTOS_ECOSYSTEM_ID,
  protocol: APTOS_PROTOCOL,
  wormholeChainId: 22,
  displayName: "Aptos",
  gasToken,
  chains: {
    [Env.Testnet]: testnet,
  },
} as const);
