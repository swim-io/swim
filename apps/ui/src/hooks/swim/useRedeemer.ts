import * as anchor from "@project-serum/anchor";
import { RedeemerSpec } from "../../config/redeemer";
import {
  useConfig,
  useEnvironment,
  useSolanaConnection,
  useSolanaWallet,
} from "../../contexts";
import { findProgramAddress, getAssociatedTokenAddress } from "../../utils";
import { useLiquidityQuery, useSplTokenAccountsQuery } from "../solana";
import { PublicKey } from "@solana/web3.js";

// const redeemAmount = (await program.account.mplRedeemer.fetch(redeemerPDA)).redeemAmount;
// console.log(`redeemAmount: ${redeemAmount}`);
// const redeemCount = (await program.account.mplRedeemer.fetch(redeemerPDA)).redeemCount;
// console.log(`redeemCount: ${redeemCount}`);

export interface RedeemerData {
  readonly spec: RedeemerSpec;
  readonly pda: string;
  readonly vault: string;
}

const REDEEMER_PREFIX = "redeemer";
const utf8 = anchor.utils.bytes.utf8;

export const useRedeemer = (nftCollectionId: string | null): RedeemerData => {
  const { env } = useEnvironment();
  const { redeemers } = useConfig();
  const solanaConnection = useSolanaConnection();
  const { address: walletAddress } = useSolanaWallet();
  const { data: splTokenAccounts = null } = useSplTokenAccountsQuery();
  // if (nftCollectionId === null) {
  //   throw new Error("fuck!");
  // }

  const redeemerSpec =
    redeemers.find((redeemer) => redeemer.collection === nftCollectionId) ??
    null;
  if (!redeemerSpec) {
    throw new Error(`Redeemer with id ${nftCollectionId} not found`);
  }

  const redeemerPda = findProgramAddress(
    [
      utf8.encode(REDEEMER_PREFIX),
      new PublicKey(redeemerSpec.collection).toBuffer(),
      new PublicKey(redeemerSpec.mint).toBuffer(),
    ],
    redeemerSpec.id,
  );

  const redeemerVault = getAssociatedTokenAddress(
    new PublicKey(redeemerSpec.mint),
    new PublicKey(redeemerPda),
    true,
  );

  return {
    spec: redeemerSpec,
    pda: redeemerPda,
    vault: redeemerVault,
  };
};
