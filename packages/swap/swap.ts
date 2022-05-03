import { PublicKey, TransactionInstruction, AccountMeta } from "@solana/web3.js";
import { createApproveInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { array, struct, u64, u8 } from "@project-serum/borsh";
import BN from "bn.js";

export const hexaPool = {
  numberOfTokens: 6,
  programId: new PublicKey("SWiMDJYFUGj6cPrQ6QYYYWZtvXQdRChSVAygDZDsCHC"),
  stateKey: new PublicKey("8cUvGTFvSWx9WPebYYfDxwiJPdGx2EJUtpve6jP9SBma"),
  authority: new PublicKey("AfhhYsLMXXyDxQ1B7tNqLTXXDHYtDxCzPcnXWXzHAvDb"),
  tokenKeys: [[
    "5uBU2zUG8xTLA6XwwcTFWib1p7EjCBzWbiy44eVASTfV", //solana-usdc
    "Hv7yPYnGs6fpN3o1NZvkima9mKDrRDJtNxf23oKLCjau", //solana-usdt
    "4R6b4aibi46JzAnuA8ZWXrHAsR1oZBTZ8dqkuer3LsbS", //ethereum-usdc
    "2DMUL42YEb4g1HAKXhUxL3Yjfgoj4VvRqKwheorfFcPV", //ethereum-usdt
    "DukQAFyxR41nbbq2FBUDMyrtF2CRmWBREjZaTVj4u9As", //bsc-busd
    "9KMH3p8cUocvQRbJfKRAStKG52xCCWNmEPsJm5gc8fzw", //bsc-usdt
  ]].map(address => new PublicKey(address)),
  lpMintKey: new PublicKey("BJUH9GJLaMSLV1E7B3SQLCy9eCfyr6zsrwGcpS2MkqR1"),
  governanceFeeKey: new PublicKey("9Yau6DnqYasBUKcyxQJQZqThvUnqZ32ZQuUCcC2AdT9P"),
}

export enum SwapDirection {
  USDCtoUSDT,
  USDTtoUSDC,
}

export function createSwapIx(
  direction: SwapDirection,
  exactInputAmount: BN,
  minimumOutputAmount: BN,
  userTokenKeys: readonly PublicKey[], // [USDC, USDT]
  userDelegate: PublicKey,
): TransactionInstruction
{
  if (userTokenKeys.length !== 2)
    throw new Error("must specify user's USDC and USDT account keys");

  const programId = hexaPool.programId;
  const exactInputAmounts = Array.from({length: hexaPool.numberOfTokens})
    .map((_, i) => i == direction ? exactInputAmount : new BN(0));
  const filledTokenKeys = userTokenKeys
    .concat(Array.from({length: hexaPool.numberOfTokens - 2})
    .map(_ => PublicKey.default));

  const defiInstructionEnumVal = 1;
  const swapExactInputInstructionEnumVal = 1;
  const instructionParameters = {
    instruction: defiInstructionEnumVal,
    defiInstruction: swapExactInputInstructionEnumVal,
    exactInputAmounts,
    minimumOutputAmount,
  };

  const toAccountMeta = (
    pubkey: PublicKey,
    isWritable: boolean = false,
    isSigner: boolean = false
  ): AccountMeta => ({ pubkey, isSigner, isWritable });

  const keys = [
    toAccountMeta(hexaPool.stateKey, true),
    toAccountMeta(hexaPool.authority),
    ...hexaPool.tokenKeys.map((pubkey) => toAccountMeta(pubkey, true)),
    toAccountMeta(hexaPool.lpMintKey, true),
    toAccountMeta(hexaPool.governanceFeeKey, true),
    toAccountMeta(userDelegate, false, true),
    ...filledTokenKeys.map((pubkey) => toAccountMeta(pubkey, true)),
    toAccountMeta(TOKEN_PROGRAM_ID),
  ];

  const layout = struct(
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

export function createApproveAndSwapIx(
  direction: SwapDirection,
  exactInputAmount: BN,
  minimumOutputAmount: BN,
  userTokenKeys: readonly PublicKey[],
  userDelegate: PublicKey,
  owner: PublicKey,
): readonly TransactionInstruction[] {
  return [
    createApproveInstruction(userTokenKeys[direction], userDelegate, owner, BigInt(exactInputAmount.toString())),
    createSwapIx(direction, exactInputAmount, minimumOutputAmount, userTokenKeys, userDelegate)
  ];
}
