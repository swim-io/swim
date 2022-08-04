/* eslint-disable functional/immutable-data, functional/prefer-readonly-type */
import type { MintInfo, AccountInfo as TokenAccount } from "@solana/spl-token";
import { AccountLayout, MintLayout, u64 } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { PublicKeyInitData } from "@solana/web3.js";

type DecodedAccountLayout = {
  mint: PublicKeyInitData;
  owner: PublicKeyInitData;
  amount: Buffer;
  delegateOption: number;
  delegate: PublicKeyInitData;
  delegatedAmount: Buffer;
  state: number;
  isNativeOption: number;
  isNative: Buffer;
  closeAuthorityOption: number;
  closeAuthority: PublicKeyInitData;
};

/** Adapted from https://github.com/solana-labs/solana-program-library/blob/756696e/token/js/client/token.js#L757-L817 */
export const deserializeTokenAccount = (
  pubkey: PublicKey,
  data: Buffer,
): TokenAccount => {
  // missing `decode` in `Layout` type
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const decodedAccountLayout = AccountLayout.decode(
    data,
  ) as DecodedAccountLayout;

  const tokenAccount: Partial<TokenAccount> = {};
  tokenAccount.address = pubkey;
  tokenAccount.mint = new PublicKey(decodedAccountLayout.mint);
  tokenAccount.owner = new PublicKey(decodedAccountLayout.owner);
  tokenAccount.amount = u64.fromBuffer(decodedAccountLayout.amount);

  if (decodedAccountLayout.delegateOption === 0) {
    tokenAccount.delegate = null;
    tokenAccount.delegatedAmount = new u64(0);
  } else {
    tokenAccount.delegate = new PublicKey(decodedAccountLayout.delegate);
    tokenAccount.delegatedAmount = u64.fromBuffer(
      decodedAccountLayout.delegatedAmount,
    );
  }

  tokenAccount.isInitialized = decodedAccountLayout.state !== 0;
  tokenAccount.isFrozen = decodedAccountLayout.state === 2;

  if (decodedAccountLayout.isNativeOption === 1) {
    tokenAccount.rentExemptReserve = u64.fromBuffer(
      decodedAccountLayout.isNative,
    );
    tokenAccount.isNative = true;
  } else {
    tokenAccount.rentExemptReserve = null;
    tokenAccount.isNative = false;
  }

  if (decodedAccountLayout.closeAuthorityOption === 0) {
    tokenAccount.closeAuthority = null;
  } else {
    tokenAccount.closeAuthority = new PublicKey(
      decodedAccountLayout.closeAuthority,
    );
  }

  return tokenAccount as TokenAccount;
};

type DecodedMintLayout = {
  mintAuthorityOption: number;
  mintAuthority: PublicKeyInitData;
  supply: Buffer;
  isInitialized: number;
  freezeAuthorityOption: number;
  freezeAuthority: PublicKeyInitData;
};

/** Adapted from https://github.com/solana-labs/solana-program-library/blob/756696e/token/js/client/token.js#L722-L755 */
export const deserializeMint = (data: Buffer): MintInfo => {
  // missing `span` in `Layout` type
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (data.length !== MintLayout.span) {
    throw new Error("Not a valid Mint");
  }

  // missing `decode` in `Layout` type
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const decodedMintLayout = MintLayout.decode(data) as DecodedMintLayout;

  const mintInfo: Partial<MintInfo> = {};

  if (decodedMintLayout.mintAuthorityOption === 0) {
    mintInfo.mintAuthority = null;
  } else {
    mintInfo.mintAuthority = new PublicKey(decodedMintLayout.mintAuthority);
  }

  mintInfo.supply = u64.fromBuffer(decodedMintLayout.supply);
  mintInfo.isInitialized = decodedMintLayout.isInitialized !== 0;

  if (decodedMintLayout.freezeAuthorityOption === 0) {
    mintInfo.freezeAuthority = null;
  } else {
    mintInfo.freezeAuthority = new PublicKey(decodedMintLayout.freezeAuthority);
  }

  return mintInfo as MintInfo;
};
