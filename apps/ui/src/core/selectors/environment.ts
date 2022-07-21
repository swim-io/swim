import type {
  ChainConfig,
  EcosystemConfig,
  TokenConfig,
} from "@swim-io/core-types";
import { Env } from "@swim-io/core-types";
import type { RedeemerConfig } from "@swim-io/redeemer";
import { redeemerConfigs } from "@swim-io/redeemer";
import type { WormholeConfig } from "@swim-io/wormhole";
import { wormholeConfigs } from "@swim-io/wormhole";

import { ECOSYSTEMS } from "../../config";
import { filterMap } from "../../utils";
import type { EnvironmentState } from "../store";
import { DEFAULT_ENV } from "../store";

export const selectEnvs = (state: EnvironmentState) =>
  state.customLocalnetIp === null ? [DEFAULT_ENV] : Object.values(Env);

export type EcosystemConfigForEnv = Omit<EcosystemConfig, "chains"> & {
  readonly chain: ChainConfig;
};

export const selectEcosystems = (
  state: EnvironmentState,
): readonly EcosystemConfigForEnv[] =>
  filterMap(
    (ecosystem: EcosystemConfig) => ecosystem.chains.has(state.env),
    (ecosystem) => {
      const chain = ecosystem.chains.get(state.env);
      if (!chain) {
        throw new Error("Oh no");
      }
      return {
        ...ecosystem,
        chain,
      };
    },
    ECOSYSTEMS,
  );

export const selectEcosystem = (
  state: EnvironmentState,
  ecosystemId: string,
): EcosystemConfigForEnv | null => {
  const ecosystems = selectEcosystems(state);
  return ecosystems.find((ecosystem) => ecosystem.id === ecosystemId) ?? null;
};

export const selectChains = (
  state: EnvironmentState,
): readonly ChainConfig[] => {
  const ecosystems = selectEcosystems(state);
  return ecosystems.map((ecosystem) => ecosystem.chain);
};

export const selectChain = (
  state: EnvironmentState,
  ecosystemId: string,
): ChainConfig | null => {
  const ecosystem = selectEcosystem(state, ecosystemId);
  return ecosystem?.chain ?? null;
};

export const selectTokens = (
  state: EnvironmentState,
): readonly TokenConfig[] => {
  const ecosystems = selectEcosystems(state);
  return ecosystems.flatMap((ecosystem) => ecosystem.chain.tokens);
};

export const selectToken = (
  state: EnvironmentState,
  tokenId: string,
): TokenConfig | null => {
  const tokens = selectTokens(state);
  return tokens.find((token) => token.id === tokenId) ?? null;
};

export const selectRedeemer = (
  state: EnvironmentState,
): RedeemerConfig | null => redeemerConfigs.get(state.env) ?? null;

export const selectWormhole = (
  state: EnvironmentState,
): WormholeConfig | null => wormholeConfigs.get(state.env) ?? null;
