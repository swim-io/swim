import { EcosystemId } from "./ecosystem";
import type { Env } from "./env";
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
