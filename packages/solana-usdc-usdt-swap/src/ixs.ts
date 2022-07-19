import type { Layout } from "@project-serum/borsh";
import { array, struct, u64, u8 } from "@project-serum/borsh";
import { TOKEN_PROGRAM_ID, createApproveInstruction } from "@solana/spl-token";
import type { AccountMeta, PublicKey } from "@solana/web3.js";
import { TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import Decimal from "decimal.js";

import { hexapool } from "./hexapool";

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

const SWIM_USD_DECIMALS = 8;
const TOKEN_DECIMALS = [
  6, // solana-usdc
  6, // solana-usdt
];

const decimalToBN = (decimalAmount: Decimal, tokenDecimals: number): BN =>
  new BN(decimalAmount.mul(Decimal.pow(10, tokenDecimals)).toString());

/**
 * Create Solana native USDC <> USDT swap instructions for Swim hexapool
 *
 * The transaction containing the swap instruction must be signed by userDelegateKey.
 * The actual output amount of a swap is a function of the stableswap invariant, the current pool balances
 * and ampfactor, and the current LP and governance fee.
 * Slippage is the difference between the actual output amount and the expected output amount due to
 * changes in the various parameters (typically only changes in the pool balances).
 * @param direction Determines the user's input and output token account of the swap
 * @param exactInputAmount The number of tokens taken from the user's input account
 * @param minimumOutputAmount The minimum number of (net) output tokens the user must receive for the
 *                            swap instruction to succeed. Net outputs below this threshold (no matter
 *                            the cause - e.g. fees, slippage, ...) will cause the instruction to fail.
 * @param userTokenKeys User's token accounts, must be passed using fixed order [USDC, USDT] (even when
 *                      swap direction is USDT -> USDC)
 * @param userDelegateKey The SPL token delegate account which must be authorized to take at least
 *                        exactInputAmount tokens from the input account
 * @returns The composed swap instruction
 */
export function createSwapIx(
  direction: SwapDirection,
  exactInputAmount: Decimal,
  minimumOutputAmount: Decimal,
  userTokenKeys: readonly [PublicKey, PublicKey],
  userDelegateKey: PublicKey,
): TransactionInstruction {
  const { programId } = hexapool;
  const exactInputAmounts = Array.from({
    length: hexapool.tokenKeys.length,
  }).map((_, i) =>
    i === direction
      ? decimalToBN(exactInputAmount, TOKEN_DECIMALS[i])
      : new BN(0),
  );
  const minimumOutputAmountBN = decimalToBN(
    minimumOutputAmount,
    SWIM_USD_DECIMALS,
  );
  const outputTokenIndex = (direction + 1) % 2;
  const filledTokenKeys = [
    ...userTokenKeys,
    ...hexapool.tokenKeys.slice(2).map(() => hexapool.stateKey),
  ];

  const defiInstructionEnumVal = 1;
  const swapExactInputInstructionEnumVal = 1;
  const instructionParameters = {
    instruction: defiInstructionEnumVal,
    defiInstruction: swapExactInputInstructionEnumVal,
    exactInputAmounts,
    outputTokenIndex,
    minimumOutputAmount: minimumOutputAmountBN,
  };

  const toAccountMeta = (
    pubkey: PublicKey,
    isWritable = false,
    isSigner = false,
  ): AccountMeta => ({ pubkey, isSigner, isWritable });

  const keys = [
    toAccountMeta(hexapool.stateKey, true),
    toAccountMeta(hexapool.authorityKey),
    ...hexapool.tokenKeys.map((pubkey) => toAccountMeta(pubkey, true)),
    toAccountMeta(hexapool.lpMintKey, true),
    toAccountMeta(hexapool.governanceFeeKey, true),
    toAccountMeta(userDelegateKey, false, true),
    ...filledTokenKeys.map((pubkey) => toAccountMeta(pubkey, true)),
    toAccountMeta(TOKEN_PROGRAM_ID),
  ];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const layout: Layout<SwapDefiInstruction> = struct(
    [
      u8("instruction"),
      u8("defiInstruction"),
      array(u64(), hexapool.numberOfTokens, "exactInputAmounts"),
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
export function createApproveAndSwapIxs(
  direction: SwapDirection,
  exactInputAmount: Decimal,
  minimumOutputAmount: Decimal,
  userTokenKeys: readonly [PublicKey, PublicKey],
  userDelegateKey: PublicKey,
  ownerKey: PublicKey,
): readonly [TransactionInstruction, TransactionInstruction] {
  const inputAmount = BigInt(
    decimalToBN(exactInputAmount, TOKEN_DECIMALS[direction]).toString(),
  );
  return [
    createApproveInstruction(
      userTokenKeys[direction],
      userDelegateKey,
      ownerKey,
      inputAmount,
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
