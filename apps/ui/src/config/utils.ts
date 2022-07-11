import { deduplicate } from "../utils";

import type { Ecosystem } from "./ecosystem";
import { ECOSYSTEMS, EcosystemId } from "./ecosystem";
import type { Env } from "./env";
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
    tokenSpec.detailsByEcosystem.get(EcosystemId.Solana) ?? null;
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
    pool.tokens
      .map((tokenId) => findTokenById(tokenId, env))
      .map((tokenSpec) => tokenSpec.nativeEcosystem),
  ).map((ecosystemId) => ECOSYSTEMS[ecosystemId]);
};

export const hasTokenEcosystem = (
  pool: PoolSpec,
  env: Env,
  ecosystemId: EcosystemId,
): boolean => {
  return getPoolTokenEcosystems(pool, env)
    .map(({ id }) => id)
    .includes(ecosystemId);
};
