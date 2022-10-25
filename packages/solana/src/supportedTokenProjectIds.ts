import { TokenProjectId } from "@swim-io/token-projects";

export type SupportedTokenProjectId =
  | TokenProjectId.SwimUsd
  | TokenProjectId.Usdc
  | TokenProjectId.Usdt;

export const SUPPORTED_TOKEN_PROJECT_IDS = [
  TokenProjectId.SwimUsd,
  TokenProjectId.Usdc,
  TokenProjectId.Usdt,
];

export const isSupportedTokenProjectId = (
  id: TokenProjectId,
): id is SupportedTokenProjectId => SUPPORTED_TOKEN_PROJECT_IDS.includes(id);
