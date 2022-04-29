/* eslint-disable functional/immutable-data */
import type {
  MintInfo,
  AccountInfo as TokenAccountInfo,
} from "@solana/spl-token";
import { AccountLayout, MintLayout, u64 } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

import type { Amount } from "../amount";

export interface TokenAccount
  extends Omit<Readonly<TokenAccountInfo>, "amount"> {
  readonly amount: Amount;
}

/** Adapted from https://github.com/solana-labs/solana-program-library/blob/756696e/token/js/client/token.js#L757-L817 */
export const deserializeTokenAccount = (
  pubkey: PublicKey,
  data: Buffer,
): TokenAccountInfo => {
  const accountInfo = AccountLayout.decode(data);
  accountInfo.address = pubkey;
  accountInfo.mint = new PublicKey(accountInfo.mint);
  accountInfo.owner = new PublicKey(accountInfo.owner);
  accountInfo.amount = u64.fromBuffer(accountInfo.amount);

  if (accountInfo.delegateOption === 0) {
    accountInfo.delegate = null;
    accountInfo.delegatedAmount = new u64(0);
  } else {
    accountInfo.delegate = new PublicKey(accountInfo.delegate);
    accountInfo.delegatedAmount = u64.fromBuffer(accountInfo.delegatedAmount);
  }

  accountInfo.isInitialized = accountInfo.state !== 0;
  accountInfo.isFrozen = accountInfo.state === 2;

  if (accountInfo.isNativeOption === 1) {
    accountInfo.rentExemptReserve = u64.fromBuffer(accountInfo.isNative);
    accountInfo.isNative = true;
  } else {
    accountInfo.rentExemptReserve = null;
    accountInfo.isNative = false;
  }

  if (accountInfo.closeAuthorityOption === 0) {
    accountInfo.closeAuthority = null;
  } else {
    accountInfo.closeAuthority = new PublicKey(accountInfo.closeAuthority);
  }

  return accountInfo;
};

/** Adapted from https://github.com/solana-labs/solana-program-library/blob/756696e/token/js/client/token.js#L722-L755 */
export const deserializeMint = (data: Buffer): MintInfo => {
  if (data.length !== MintLayout.span) {
    throw new Error("Not a valid Mint");
  }

  const mintInfo = MintLayout.decode(data);

  if (mintInfo.mintAuthorityOption === 0) {
    mintInfo.mintAuthority = null;
  } else {
    mintInfo.mintAuthority = new PublicKey(mintInfo.mintAuthority);
  }

  mintInfo.supply = u64.fromBuffer(mintInfo.supply);
  mintInfo.isInitialized = mintInfo.isInitialized !== 0;

  if (mintInfo.freezeAuthorityOption === 0) {
    mintInfo.freezeAuthority = null;
  } else {
    mintInfo.freezeAuthority = new PublicKey(mintInfo.freezeAuthority);
  }

  return mintInfo;
};
