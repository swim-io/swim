import type {
  SolanaChainConfig,
  SolanaEcosystemConfig,
} from "@swim-io/plugin-ecosystem-solana";
import {
  SOLANA_ECOSYSTEM_ID,
  SOLANA_PROTOCOL,
} from "@swim-io/plugin-ecosystem-solana";
import shallow from "zustand/shallow.js";

import type { EcosystemConfigWithSingleChain, EcosystemId } from "../../config";
import { selectConfig } from "../../core/selectors";
import { useEnvironment } from "../../core/store";

export const useEcosystems = (
  ecosystemIds: readonly EcosystemId[],
): readonly (EcosystemConfigWithSingleChain | null)[] => {
  const { ecosystems } = useEnvironment(selectConfig, shallow);
  return ecosystemIds.map(
    (ecosystemId) => ecosystems.find(({ id }) => id === ecosystemId) ?? null,
  );
};

export const useEcosystem = (
  ecosystemId: EcosystemId | null,
): EcosystemConfigWithSingleChain | null => {
  const [ecosystem] = useEcosystems(ecosystemId ? [ecosystemId] : []);
  return ecosystem ?? null;
};

export const useSolanaEcosystem = (): SolanaEcosystemConfig & {
  readonly chain: SolanaChainConfig;
} => {
  const ecosystem = useEcosystem(SOLANA_ECOSYSTEM_ID);
  if (ecosystem === null || ecosystem.protocol !== SOLANA_PROTOCOL) {
    throw new Error("Invalid Solana ecosystem");
  }
  return ecosystem;
};
