import type { Env } from "@swim-io/core-types";
import { SOLANA_ECOSYSTEM_ID } from "@swim-io/plugin-ecosystem-solana";

import { deduplicate } from "../utils";

import type { EcosystemConfig, EcosystemId } from "./ecosystem";
import { ECOSYSTEMS } from "./ecosystem";
import type { PoolSpec } from "./pools";
import type { TokenDetails, TokenSpec } from "./tokens";
import { TOKENS } from "./tokens";

export const getNativeTokenDetails = (tokenSpec: TokenSpec): TokenDetails => {
  const nativeTokenDetails =
    tokenSpec.detailsByEcosystem.get(tokenSpec.nativeEcosystem) ?? null;
  if (nativeTokenDetails === null) {
    throw new Error("Native token details not found");
  }
  return nativeTokenDetails;
};

export const getSolanaTokenDetails = (tokenSpec: TokenSpec): TokenDetails => {
  const solanaTokenDetails =
    tokenSpec.detailsByEcosystem.get(SOLANA_ECOSYSTEM_ID) ?? null;
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
): readonly EcosystemConfig[] => {
  return deduplicate(
    (id) => id,
    pool.tokens.map((tokenId) => findTokenById(tokenId, env).nativeEcosystem),
  ).map((ecosystemId) => ECOSYSTEMS[ecosystemId]);
};

export const hasTokenEcosystem = (
  pool: PoolSpec,
  env: Env,
  ecosystemId: EcosystemId,
): boolean => {
  return getPoolTokenEcosystems(pool, env).some(({ id }) => id === ecosystemId);
};
