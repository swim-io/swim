import type { Layout } from "@project-serum/borsh";
import { array, struct, u64, u8 } from "@project-serum/borsh";
import { TOKEN_PROGRAM_ID, createApproveInstruction } from "@solana/spl-token";
import type { AccountMeta, Connection } from "@solana/web3.js";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import type {
  SwimPoolConstantState,
  SwimPoolMutableState,
  SwimPoolState,
} from "@swim-io/solana-types";
import { deserializeSwimPool } from "@swim-io/solana-types";
import BN from "bn.js";

export { PoolMath } from "@swim-io/pool-math";
export { deserializeSwimPool } from "@swim-io/solana-types";

interface SwimPoolConstantProperties {
  readonly numberOfTokens: number;
  readonly programId: PublicKey;
  readonly stateKey: PublicKey;
  readonly authorityKey: PublicKey;
}

export type SwimPool = SwimPoolConstantProperties & SwimPoolState;

export const hexapool: SwimPoolConstantProperties &
  SwimPoolConstantState &
  Pick<SwimPoolMutableState, "governanceFeeKey"> = {
  numberOfTokens: 6,
  programId: new PublicKey("SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC"),
  stateKey: new PublicKey("8cUvGTFvSWx9WPebYYfDxwiJPdGx2EJUtpve6jP9SBma"),
  nonce: 0,
  authorityKey: new PublicKey("AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb"),
  lpMintKey: new PublicKey("BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1"),
  governanceFeeKey: new PublicKey(
    "9Yau6DnqYasBUKcyxQJQZqThvUnqZ32ZQuUCcC2AdT9P",
  ),
  lpDecimalEqualizer: 0,
  tokenMintKeys: [
    new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // solana-usdc
    new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"), // solana-usdt
    new PublicKey("A9mUU4qviSctJVPJdBJWkb28deg915LYJKrzQ19ji3FM"), // ethereum-usdc
    new PublicKey("Dn4noZ5jgGfkntzcQSUZ8czkreiZ1ForXYoV2H8Dm7S1"), // ethereum-usdt
    new PublicKey("5RpUwQ8wtdPCZHhu6MERp2RGrpobsbZ6MH5dDHkUjs2"), // bnb-busd
    new PublicKey("8qJSyQprMC57TWKaYEmetUR3UUiTP2M3hXdcvFhkZdmv"), // bnb-usdt
  ],
  tokenDecimalEqualizers: [2, 2, 2, 2, 0, 0],
  tokenKeys: [
    new PublicKey("5uBU2zUG8xTLA6XwwcTFWib1p7EjCBzWbiy44eVASTfV"), // solana-usdc
    new PublicKey("Hv7yPYnGs6fpN3o1NZvkima9mKDrRDJtNxf23oKLCjau"), // solana-usdt
    new PublicKey("4R6b4aibi46JzAnuA8ZWXrHAsR1oZBTZ8dqkuer3LsbS"), // ethereum-usdc
    new PublicKey("2DMUL42YEb4g1HAKXhUxL3Yjfgoj4VvRqKwheorfFcPV"), // ethereum-usdt
    new PublicKey("DukQAFyxR41nbbq2FBUDMyrtF2CRmWBREjZaTVj4u9As"), // bnb-busd
    new PublicKey("9KMH3p8cUocvQRbJfKRAStKG52xCCWNmEPsJm5gc8fzw"), // bnb-usdt
  ],
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
  exactInputAmount: BN,
  minimumOutputAmount: BN,
  userTokenKeys: readonly PublicKey[],
  userDelegateKey: PublicKey,
): TransactionInstruction {
  if (userTokenKeys.length !== 2)
    throw new Error("must specify user's USDC and USDT account keys");

  const { programId } = hexapool;
  const exactInputAmounts = Array.from({
    length: hexapool.tokenKeys.length,
  }).map((_, i) => (i === direction ? exactInputAmount : new BN(0)));
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
    minimumOutputAmount,
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

export const getSwimPool = async (
  solanaConnection: Connection,
): Promise<SwimPool> => {
  const accountInfo = await solanaConnection.getAccountInfo(hexapool.stateKey);
  if (accountInfo === null) {
    throw new Error("Could not retrieve account info");
  }
  const poolState = deserializeSwimPool(
    hexapool.numberOfTokens,
    accountInfo.data,
  );
  return {
    ...hexapool,
    ...poolState,
  };
};
