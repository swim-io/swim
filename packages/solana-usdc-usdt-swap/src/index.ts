import type { Layout } from "@project-serum/borsh";
import { array, struct, u64, u8 } from "@project-serum/borsh";
import { TOKEN_PROGRAM_ID, createApproveInstruction } from "@solana/spl-token";
import type { AccountMeta } from "@solana/web3.js";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";

export { PoolMath } from "@swim-io/pool-math";

export const hexaPool = {
  numberOfTokens: 6,
  programId: new PublicKey("SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC"),
  stateKey: new PublicKey("8cUvGTFvSWx9WPebYYfDxwiJPdGx2EJUtpve6jP9SBma"),
  authorityKey: new PublicKey("AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb"),
  tokenKeys: [
    //the pool's token accounts
    "5uBU2zUG8xTLA6XwwcTFWib1p7EjCBzWbiy44eVASTfV", //solana-usdc
    "Hv7yPYnGs6fpN3o1NZvkima9mKDrRDJtNxf23oKLCjau", //solana-usdt
    "4R6b4aibi46JzAnuA8ZWXrHAsR1oZBTZ8dqkuer3LsbS", //ethereum-usdc
    "2DMUL42YEb4g1HAKXhUxL3Yjfgoj4VvRqKwheorfFcPV", //ethereum-usdt
    "DukQAFyxR41nbbq2FBUDMyrtF2CRmWBREjZaTVj4u9As", //bsc-busd
    "9KMH3p8cUocvQRbJfKRAStKG52xCCWNmEPsJm5gc8fzw", //bsc-usdt
  ].map((address) => new PublicKey(address)),
  lpMintKey: new PublicKey("BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1"),
  governanceFeeKey: new PublicKey(
    "9Yau6DnqYasBUKcyxQJQZqThvUnqZ32ZQuUCcC2AdT9P",
  ),
};

export enum SwapDirection {
  UsdcToUsdt,
  UsdtToUsdc,
}

export interface SwapDefiInstruction {
  readonly instruction: number;
  readonly defiInstruction: number;
  readonly exactInputAmounts: readonly BN[];
  readonly outputTokenIndex: number;
  readonly minimumOutputAmount: BN;
}

/**
 * Create Solana native USDC <> USDT swap instructions for Swim hexapool
 *
 * The transaction containing the swap instruction must be signed by userDelegateKey.
 * The actual output amount of a swap is a function of the stableswap invariant, the current pool balances
 * and ampfactor, and the current LP and governance fee.
 * Slippage is the difference between the actual output amount and the expected output amount due to
 * changes in the various parameters (typically only changes in the pool balances).
 * @param direction determines the user's input and output token account of the swap
 * @param exactInputAmount the number of tokens taken from the user's input account
 * @param minimumOutputAmount the minimum number of (net) output tokens the user must receive for the
 *                            swap instruction to succeed. net outputs below this threshold (no matter
 *                            the cause - e.g. fees, slippage, ...) will cause the instruction to fail.
 * @param userTokenKeys user's token accounts, must be passed using fixed order [USDC, USDT] (even when
 *                      swap direction is USDT -> USDC)
 * @param userDelegateKey the SPL token delegate account which must be authorized to take at least
 *                        exactInputAmount tokens from the input account
 * @returns the composed swap instruction
 */
export function createSwapIx(
  direction: SwapDirection,
  exactInputAmount: BN,
  minimumOutputAmount: BN,
  userTokenKeys: readonly PublicKey[],
  userDelegateKey: PublicKey,
): TransactionInstruction {
  if (userTokenKeys.length !== 2)
    throw new Error("must specify user's USDC and USDT account keys");

  const { programId } = hexaPool;
  const exactInputAmounts = Array.from({
    length: hexaPool.tokenKeys.length,
  }).map((_, i) => (i === direction ? exactInputAmount : new BN(0)));
  const outputTokenIndex = (direction + 1) % 2;
  const filledTokenKeys = [
    ...userTokenKeys,
    ...hexaPool.tokenKeys.slice(2).map(() => hexaPool.stateKey),
  ];

  const defiInstructionEnumVal = 1;
  const swapExactInputInstructionEnumVal = 1;
  const instructionParameters = {
    instruction: defiInstructionEnumVal,
    defiInstruction: swapExactInputInstructionEnumVal,
    exactInputAmounts,
    outputTokenIndex,
    minimumOutputAmount,
  };

  const toAccountMeta = (
    pubkey: PublicKey,
    isWritable = false,
    isSigner = false,
  ): AccountMeta => ({ pubkey, isSigner, isWritable });

  const keys = [
    toAccountMeta(hexaPool.stateKey, true),
    toAccountMeta(hexaPool.authorityKey),
    ...hexaPool.tokenKeys.map((pubkey) => toAccountMeta(pubkey, true)),
    toAccountMeta(hexaPool.lpMintKey, true),
    toAccountMeta(hexaPool.governanceFeeKey, true),
    toAccountMeta(userDelegateKey, false, true),
    ...filledTokenKeys.map((pubkey) => toAccountMeta(pubkey, true)),
    toAccountMeta(TOKEN_PROGRAM_ID),
  ];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const layout: Layout<SwapDefiInstruction> = struct(
    [
      u8("instruction"),
      u8("defiInstruction"),
      array(u64(), hexaPool.numberOfTokens, "exactInputAmounts"),
      u8("outputTokenIndex"),
      u64("minimumOutputAmount"),
    ],
    "swapInstruction",
  );
  const data = Buffer.alloc(layout.span);
  layout.encode(instructionParameters, data);
  return new TransactionInstruction({ keys, programId, data });
}

/**
 * See createSwapIx documentation
 *
 * Transaction containing approve instruction must be signed by ownerKey.
 * Transaction containing swap instruction must be signed by userDelegateKey.
 * @param ownerKey the key controlling the user's input token account (USDC or USDT, depending on direction)
 * @returns array containing approve and swap instructions
 */
export function createApproveAndSwapIx(
  direction: SwapDirection,
  exactInputAmount: BN,
  minimumOutputAmount: BN,
  userTokenKeys: readonly PublicKey[],
  userDelegateKey: PublicKey,
  ownerKey: PublicKey,
): readonly TransactionInstruction[] {
  return [
    createApproveInstruction(
      userTokenKeys[direction],
      userDelegateKey,
      ownerKey,
      BigInt(exactInputAmount.toString()),
    ),
    createSwapIx(
      direction,
      exactInputAmount,
      minimumOutputAmount,
      userTokenKeys,
      userDelegateKey,
    ),
  ];
}
