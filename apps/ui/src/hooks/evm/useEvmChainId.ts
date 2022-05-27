import type { EvmChainId, EvmEcosystemId } from "../../config";
import { Protocol, chains } from "../../config";
import { useEnvironment } from "../../core/store";
import { findOrThrow } from "../../utils";

export const useEvmChainId = (ecosystemId: EvmEcosystemId): EvmChainId => {
  const { env } = useEnvironment();
  return findOrThrow(
    chains[env][Protocol.Evm],
    (evmSpec) => evmSpec.ecosystem === ecosystemId,
  ).chainId;
};
