import type { TokenSpec } from "../../config";
import { Env, tokens } from "../../config";

export const findLocalnetTokenById = (tokenId: string): TokenSpec =>
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  tokens[Env.Localnet].find(({ id }) => id === tokenId)!;

export const SOLANA_USDC = findLocalnetTokenById("localnet-solana-usdc");
export const SOLANA_USDT = findLocalnetTokenById("localnet-solana-usdt");
export const ETHEREUM_USDC = findLocalnetTokenById("localnet-ethereum-usdc");
export const ETHEREUM_USDT = findLocalnetTokenById("localnet-ethereum-usdt");
export const BSC_USDT = findLocalnetTokenById("localnet-bsc-usdt");
export const BSC_BUSD = findLocalnetTokenById("localnet-bsc-busd");
export const SOLANA_LP_HEXAPOOL = findLocalnetTokenById(
  "localnet-solana-lp-hexapool",
);
