import type { Env, TokenDetails } from "@swim-io/core";
import { TokenProjectId } from "@swim-io/token-projects";
import { deduplicate } from "@swim-io/utils";

import type { Ecosystem } from "./ecosystem";
import { ECOSYSTEMS, EcosystemId } from "./ecosystem";
import type { PoolSpec } from "./pools";
import type { TokenSpec } from "./tokens";
import { TOKENS } from "./tokens";

export const getTokenDetailsForEcosystem = (
  tokenSpec: TokenSpec,
  ecosystemId: EcosystemId,
): TokenDetails | null =>
  tokenSpec.nativeEcosystemId === ecosystemId
    ? tokenSpec.nativeDetails
    : tokenSpec.wrappedDetails.get(ecosystemId) ?? null;

export const getSolanaTokenDetails = (tokenSpec: TokenSpec): TokenDetails => {
  const solanaTokenDetails = getTokenDetailsForEcosystem(
    tokenSpec,
    EcosystemId.Solana,
  );
  if (solanaTokenDetails === null) {
    throw new Error("Solana token details not found");
  }
  return solanaTokenDetails;
};

export const findTokenById = (tokenId: string, env: Env): TokenSpec => {
  const tokenSpec = TOKENS[env].find(({ id }) => id === tokenId);
  if (!tokenSpec) {
    throw new Error(`Token not found for ${tokenId} ${env}`);
  }
  return tokenSpec;
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

export const isSwimUsd = (token: TokenSpec) =>
  token.projectId === TokenProjectId.SwimLpSolanaUsdcUsdt;
