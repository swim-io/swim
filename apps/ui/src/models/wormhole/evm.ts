import type { WormholeChainConfig } from "@swim-io/core";
import type { EvmTx } from "@swim-io/evm";

import type { TokenConfig } from "../../config";
import { getTokenDetailsForEcosystem } from "../../config";

export const isLockEvmTx = (
  wormholeChainConfig: WormholeChainConfig,
  token: TokenConfig,
  tx: EvmTx,
): boolean => {
  const tokenDetails = getTokenDetailsForEcosystem(token, tx.ecosystemId);
  if (tokenDetails === null) {
    return false;
  }
  if (
    tx.response.to?.toLowerCase() !== wormholeChainConfig.portal.toLowerCase()
  ) {
    return false;
  }
  return tx.receipt.logs.some(
    (log) => log.address.toLowerCase() === tokenDetails.address.toLowerCase(),
  );
};

export const isUnlockEvmTx = (
  wormholeChainConfig: WormholeChainConfig,
  token: TokenConfig,
  tx: EvmTx,
): boolean => {
  const tokenDetails = getTokenDetailsForEcosystem(token, tx.ecosystemId);
  if (tokenDetails === null) {
    return false;
  }
  if (
    tx.receipt.to.toLowerCase() !== wormholeChainConfig.portal.toLowerCase()
  ) {
    return false;
  }
  return tx.receipt.logs.some(
    (log) => log.address.toLowerCase() === tokenDetails.address.toLowerCase(),
  );
};
