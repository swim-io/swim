import shallow from "zustand/shallow.js";

import type { EvmChainId, EvmEcosystemId } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";
import { findOrThrow } from "../../utils";

export const useEvmChainId = (ecosystemId: EvmEcosystemId): EvmChainId => {
  const { env } = useEnvironment();
  const { ecosystems } = useEnvironment(selectConfig, shallow);
  const currentChain = findOrThrow(
    ecosystems[ecosystemId].chains,
    (chain) => chain.env === env,
  );
  return currentChain.chainId;
};
