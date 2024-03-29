import type {
  ParsedInstruction,
  PartiallyDecodedInstruction,
} from "@solana/web3.js";
import type { WormholeChainConfig } from "@swim-io/core";
import {
  SOLANA_ECOSYSTEM_ID,
  getAmountBurnedByMint,
  getAmountMintedToAccount,
  getAmountTransferredFromAccount,
  getAmountTransferredToAccount,
} from "@swim-io/solana";
import type { SolanaTx } from "@swim-io/solana";

import type { TokenConfig } from "../../config";
import { getSolanaTokenDetails } from "../../config";

export const isLockSplTx = (
  wormholeChainConfig: WormholeChainConfig,
  splTokenAccountAddress: string,
  token: TokenConfig,
  { original }: SolanaTx,
): boolean => {
  if (
    !original.transaction.message.instructions.some(
      (ix) => ix.programId.toBase58() === wormholeChainConfig.portal,
    )
  ) {
    return false;
  }

  return token.nativeEcosystemId === SOLANA_ECOSYSTEM_ID
    ? getAmountTransferredFromAccount(
        original,
        splTokenAccountAddress,
      ).greaterThan(0)
    : getAmountBurnedByMint(
        original,
        getSolanaTokenDetails(token).address,
      ).greaterThan(0);
};

export const isPartiallyDecodedInstruction = (
  ix: PartiallyDecodedInstruction | ParsedInstruction,
): ix is PartiallyDecodedInstruction =>
  !!(ix as PartiallyDecodedInstruction).accounts;

export const isPostVaaSolanaTx = (
  wormholeChainConfig: WormholeChainConfig,
  signatureSetAddress: string | null,
  tx: SolanaTx,
): boolean => {
  if (signatureSetAddress === null) {
    return false;
  }
  return tx.original.transaction.message.instructions.some(
    (ix) =>
      isPartiallyDecodedInstruction(ix) &&
      ix.programId.toBase58() === wormholeChainConfig.bridge &&
      ix.accounts.some((account) => account.toBase58() === signatureSetAddress),
  );
};

export const isRedeemOnSolanaTx = (
  wormholeChainConfig: WormholeChainConfig,
  token: TokenConfig,
  splTokenAccount: string,
  { original }: SolanaTx,
): boolean => {
  if (
    !original.transaction.message.instructions.some(
      (ix) => ix.programId.toBase58() === wormholeChainConfig.portal,
    )
  ) {
    return false;
  }
  return token.nativeEcosystemId === SOLANA_ECOSYSTEM_ID
    ? getAmountTransferredToAccount(original, splTokenAccount).greaterThan(0)
    : getAmountMintedToAccount(original, splTokenAccount).greaterThan(0);
};
