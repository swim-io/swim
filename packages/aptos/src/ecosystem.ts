import type { GasToken } from "@swim-io/core";
import { Env } from "@swim-io/core";
import { assertType } from "@swim-io/utils";

import type { AptosChainConfig, AptosEcosystemConfig } from "./protocol";
import { APTOS_ECOSYSTEM_ID, APTOS_PROTOCOL } from "./protocol";

export enum AptosChainId {
  Testnet = 31, // TODO verify this, not sure if we need it?
}

const testnet: AptosChainConfig = {
  name: "Aptos Testnet",
  chainId: AptosChainId.Testnet,
  wormhole: {
    // from https://book.wormhole.com/reference/contracts.html
    bridge:
      "0xdd0a2618dc5564ccf38d0eca7877198fef51157fea74a6bc2e5e40b52c2a0a08",
    portal:
      "0x1b1752e26b65fc24971ee5ec9718d2ccdd36bf20486a10b2973ea6dedc6cd197",
  },
  publicRpcUrls: ["https://testnet.aptoslabs.com/v1"],
  swimUsdDetails: {
    address:
      "0xcadb45f34eff49d40875c4160880b6944de8261b955b42f6f084e771859f12a7::coin::T", // TODO: add when deployed,
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
