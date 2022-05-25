import * as anchor from "@project-serum/anchor";
import type { PublicKey } from "@solana/web3.js";

import type { RedeemerSpec } from "../../config/redeemer";
import { useConfig } from "../../contexts";
import {
  findProgramAddress,
  getAssociatedTokenAddress,
} from "../../models/solana/utils";

export interface RedeemerData {
  readonly spec: RedeemerSpec;
  readonly pda: PublicKey;
  readonly vault: PublicKey;
}

const REDEEMER_PREFIX = "redeemer";
const utf8 = anchor.utils.bytes.utf8;

export const useRedeemer = (nftCollectionId: string | null): RedeemerData => {
  const { redeemers } = useConfig();
  const redeemerSpec =
    redeemers.find(
      (redeemer) => redeemer.collection.toString() === nftCollectionId,
    ) ?? null;
  if (!redeemerSpec) {
    throw new Error(`Redeemer with id ${nftCollectionId} not found`);
  }
  const redeemerPda = findProgramAddress(
    [
      utf8.encode(REDEEMER_PREFIX),
      redeemerSpec.collection.toBuffer(),
      redeemerSpec.mint.toBuffer(),
    ],
    redeemerSpec.id,
  )[0];

  const redeemerVault = getAssociatedTokenAddress(
    redeemerSpec.mint,
    redeemerPda,
    true,
  );

  return {
    spec: redeemerSpec,
    pda: redeemerPda,
    vault: redeemerVault,
  };
};
