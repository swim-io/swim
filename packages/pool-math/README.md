# Pool Math

A package for performing Swim pool math in TS/JS projects.

## Installation

```sh
npm install @swim-io/pool-math
```

## Usage

Here is an example of how to use the `PoolMath` class to perform calculations relating to a Swim pool on Solana:

```ts
import PoolMath from "@swim-io/pool-math";
import Decimal from "decimal.js";

// STEP 1: Gather required constructor arguments

// See eg @swim-io/solana-types package for how to retrieve state for a Swim pool on Solana:
// https://www.npmjs.com/package/@swim-io/solana-types
const { ampFactor, lpFee, governanceFee, tokenKeys, tokenMintKeys } =
  swimPoolState;
const balances = tokenKeys.map((tokenKey) => {
  // retrieve pool balances from the blockchain and convert to decimal, remembering to convert from atomic if necessary
  return new Decimal(poolBalanceForTokenKey);
});

// STEP 2: Create an instance
const poolMath = new PoolMath(balances, ampFactor, lpFee, governanceFee);

// STEP 3: Perform calculations

// Read the total fee (LP fees plus governance fees)
console.log(`Total fee is: ${poolMath.totalFee}`);

// Define input and output values for a swap
const inputAmount = new Decimal(1.23);
const inputTokenMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const outputTokenMint = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const inputIndex = tokenMintKeys.findIndex(
  (tokenMintKey) => tokenMintKey.toBase58() === inputTokenMint,
);
const outputIndex = tokenMintKeys.findIndex(
  (tokenMintKey) => tokenMintKey.toBase58() === outputTokenMint,
);

// Calculate the expected output amount
const inputAmounts = tokenMintKeys.map((tokenMintKey) =>
  tokenMintKey.toBase58() === inputTokenMint ? inputAmount : new Decimal(0),
);
const { stableOutputAmount } = poolMath.swapExactInput(
  inputAmounts,
  outputIndex,
);
console.log(`Expected output amount is: ${stableOutputAmount}`);

// Find the price impact for a given swap
const priceImpact = poolMath.priceImpact(inputAmount, inputIndex, outputIndex);
console.log(`Price impact is: ${priceImpact}`);
```
