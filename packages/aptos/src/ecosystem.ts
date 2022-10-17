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
    // Usually listed in https://book.wormhole.com/reference/contracts.html
    // For now https://github.com/kcsongor provided these addresses:
    // https://github.com/wormhole-foundation/wormhole/blob/a93d8d65296410e5d6d8d214edd7ce6cb454fa76/clients/js/main.ts#L82-L85
    // and told us that the same addresses will be used in production.
    bridge:
      "0x7041d0a5ae46a24fd5f1df67c54bf1a2e0fe7668ae9402e30e58f3ad452f9d52",
    portal:
      "0x799c8d35a610b6fa8ed33432e31c686c97b4ce4205fce88c13577615372e99a3",
  },
  publicRpcUrls: ["https://testnet.aptoslabs.com/v1"],
  swimUsdDetails: {
    address:
      "0x246bfb8da92a72f29d0441138058a43970551734d68958281d59e23a4f2b19a0::coin::T",
    decimals: 6,
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
