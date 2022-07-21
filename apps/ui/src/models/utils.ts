import type {
  EcosystemConfig,
  Env,
  PoolConfig,
  TokenConfig,
  TokenDetails,
} from "@swim-io/core-types";
import { solana } from "@swim-io/solana";

import type { EcosystemId, EvmEcosystemId } from "../config";
import { ECOSYSTEMS_BY_ID, isEvmEcosystemId } from "../config";
import { deduplicate } from "../utils";

import type { Amount } from "./amount";

export const INTERACTION_ID_LENGTH = 16;
export const INTERACTION_ID_LENGTH_HEX = INTERACTION_ID_LENGTH * 2;

export const generateId = (length = INTERACTION_ID_LENGTH): string => {
  const idBytes = crypto.getRandomValues(new Uint8Array(length));
  return Buffer.from(idBytes).toString("hex");
};

export const countNonZeroAmounts = (
  amounts: readonly (Amount | null)[],
  ecosystemId: EcosystemId,
): number =>
  amounts.filter(
    (amount) =>
      amount &&
      amount.tokenSpec.nativeEcosystem === ecosystemId &&
      !amount.isZero(),
  ).length;

export const getIncludedEvmEcosystemIds = (
  amounts: readonly (Amount | null)[],
): readonly EvmEcosystemId[] =>
  amounts
    .filter((amount): amount is Amount => amount !== null && !amount.isZero())
    .map((amount) => amount.tokenSpec.nativeEcosystem)
    .filter(isEvmEcosystemId);

export const getSolanaTokenDetails = (tokenSpec: TokenConfig): TokenDetails => {
  if (tokenSpec.nativeEcosystemId === solana.id) {
    return tokenSpec.nativeDetails;
  }
  const solanaTokenDetails = tokenSpec.wrappedDetails.get(solana.id) ?? null;
  if (solanaTokenDetails === null) {
    throw new Error("Solana token details not found");
  }
  return solanaTokenDetails;
};

export const findTokenById = (tokenId: string, env: Env): TokenConfig => {
  const tokenSpec = TOKENS[env].find(({ id }) => id === tokenId);
  if (!tokenSpec) {
    throw new Error(`Token not found for ${tokenId} ${env}`);
  }
  return tokenSpec;
};

export const getPoolTokenEcosystems = (
  pool: PoolConfig,
  env: Env,
): readonly EcosystemConfig[] => {
  return deduplicate(
    (id) => id,
    pool.tokenIds.map(
      (tokenId) => findTokenById(tokenId, env).nativeEcosystemId,
    ),
  ).map((ecosystemId) => ECOSYSTEMS_BY_ID[ecosystemId]);
};

export const hasTokenEcosystem = (
  pool: PoolConfig,
  env: Env,
  ecosystemId: EcosystemId,
): boolean => {
  return getPoolTokenEcosystems(pool, env).some(({ id }) => id === ecosystemId);
};
