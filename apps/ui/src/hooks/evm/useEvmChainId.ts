import { EVM_PROTOCOL } from "@swim-io/evm-types";

import type { EvmChainId, EvmEcosystemId } from "../../config";
import { useEcosystem } from "../crossEcosystem/useEcosystems";

export const useEvmChainId = (ecosystemId: EvmEcosystemId): EvmChainId => {
  const ecosystem = useEcosystem(ecosystemId);
  if (ecosystem === null || ecosystem.protocol !== EVM_PROTOCOL) {
    throw new Error("Missing ecosystem");
  }
  return ecosystem.chain.chainId;
};
