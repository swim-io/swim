import { EcosystemId } from "./ecosystem";
import type { TokenDetails, TokenSpec } from "./tokens";

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
