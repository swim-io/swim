import type { Env, TokenDetails } from "@swim-io/core";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/solana";
import { TokenProjectId as TokenProjectIdV2 } from "@swim-io/token-projects";
import { deduplicate } from "@swim-io/utils";

import type { Ecosystem, EcosystemId } from "./ecosystem";
import { ECOSYSTEMS } from "./ecosystem";
import type { PoolSpec } from "./pools";
import type { TokenConfig } from "./tokens";
import { TOKENS } from "./tokens";

export const getTokenDetailsForEcosystem = (
  tokenConfig: TokenConfig,
  ecosystemId: EcosystemId,
): TokenDetails | null =>
  tokenConfig.nativeEcosystemId === ecosystemId
    ? tokenConfig.nativeDetails
    : tokenConfig.wrappedDetails?.get(ecosystemId) ?? null;

export const getSolanaTokenDetails = (
  tokenConfig: TokenConfig,
): TokenDetails => {
  const solanaTokenDetails = getTokenDetailsForEcosystem(
    tokenConfig,
    SOLANA_ECOSYSTEM_ID,
  );
  if (solanaTokenDetails === null) {
    throw new Error("Solana token details not found");
  }
  return solanaTokenDetails;
};

export const findTokenById = (tokenId: string, env: Env): TokenConfig => {
  const tokenConfig = TOKENS[env].find(({ id }) => id === tokenId);
  if (!tokenConfig) {
    throw new Error(`Token not found for ${tokenId} ${env}`);
  }
  return tokenConfig;
};

export const getPoolTokenEcosystems = (
  pool: PoolSpec,
  env: Env,
): readonly Ecosystem[] => {
  return deduplicate(
    (id) => id,
    pool.tokens.map((tokenId) => findTokenById(tokenId, env).nativeEcosystemId),
  ).map((ecosystemId) => ECOSYSTEMS[ecosystemId]);
};

export const hasTokenEcosystem = (
  pool: PoolSpec,
  env: Env,
  ecosystemId: EcosystemId,
): boolean =>
  getPoolTokenEcosystems(pool, env).some(({ id }) => id === ecosystemId);

export const isSwimUsd = (
  token: TokenConfig,
): token is TokenConfig & { readonly projectId: TokenProjectIdV2.SwimUsd } =>
  token.projectId === TokenProjectIdV2.SwimUsd;
