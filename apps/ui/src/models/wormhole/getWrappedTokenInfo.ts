import type { WrappedTokenInfo } from "@swim-io/core";

import type { EcosystemId, TokenConfig } from "../../config";
import { ECOSYSTEMS } from "../../config";

import { formatWormholeAddress } from "./formatWormholeAddress";

export const getWrappedTokenInfo = (
  tokenConfig: TokenConfig,
  sourceEcosystemId: EcosystemId,
): WrappedTokenInfo | undefined => {
  if (tokenConfig.nativeEcosystemId === sourceEcosystemId) {
    return undefined;
  }
  const nativeAddress = tokenConfig.nativeDetails.address;
  const nativeEcosystem = ECOSYSTEMS[tokenConfig.nativeEcosystemId];
  return {
    originAddress: formatWormholeAddress(
      nativeEcosystem.protocol,
      nativeAddress,
    ),
    originChainId: nativeEcosystem.wormholeChainId,
  };
};
