import { findOrThrow } from "@swim-io/utils";

import type { EvmChainId, EvmEcosystemId } from "../../config";
import { CHAINS, Protocol } from "../../config";
import { useEnvironment } from "../../core/store";

export const useEvmChainId = (ecosystemId: EvmEcosystemId): EvmChainId => {
  const { env } = useEnvironment();
  return findOrThrow(
    CHAINS[env][Protocol.Evm],
    (evmSpec) => evmSpec.ecosystem === ecosystemId,
  ).chainId;
};
