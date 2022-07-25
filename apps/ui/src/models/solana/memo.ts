import type { Layout } from "@project-serum/borsh";
import { array, u8 } from "@project-serum/borsh";
import type { AccountMeta } from "@solana/web3.js";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";

export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

const memoInstruction = (length: number): Layout<readonly number[]> =>
  array(u8() as Layout<number>, length);

export const createMemoIx = (
  memo: string,
  /** Can be length 0 */
  signers: readonly PublicKey[],
): TransactionInstruction => {
  // NOTE: Memo program requires a valid UTF-8 string, presumably for convenient display in explorers etc
  const memoArray = Buffer.from(memo, "utf8");
  const layout = memoInstruction(memoArray.length);
  const data = Buffer.alloc(layout.span);
  layout.encode([...memoArray], data);

  const keys: readonly AccountMeta[] = signers.map((publicKey) => ({
    pubkey: publicKey,
    isSigner: true,
    isWritable: false,
  }));

  return new TransactionInstruction({
    keys: [...keys],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data,
  });
};
