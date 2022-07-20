# Solana USDC <-> USDT Swap

Minimalist package to create swap and approve instructions for Solana-native USDC and USDT token swaps with Swim's Hexapool.

## Example usage

```js
import { Connection, PublicKey } from "@solana/web3.js";
import {
  SwapDirection,
  createApproveAndSwapIx,
  createPoolMath,
  fetchSwimPool,
} from "@swim-io/solana-usdc-usdt-swap";
import Decimal from "decimal.js";

// Initialize a Solana Connection
const solanaConnection = new Connection(/* your arguments */);

// Gather required keys
const ownerPublicKey = new PublicKey(/* user wallet address */);
const delegateKeypair = Keypair.generate();
const usdcTokenAccountPublicKey =
  new PublicKey(/* user token account address */);
const usdtTokenAccountPublicKey =
  new PublicKey(/* user token account address */);

// Gather intended swap info
const direction = SwapDirection.UsdcToUsdt;
const inputAmount = new Decimal("1.234"); // whole units of USDC
const inputTokenIndex = direction;
const outputTokenIndex = 1 - direction;
const slippageFraction = 0.005; // 0.5%

// Fetch Swim Hexapool state and initialize pool math
const swimPool = await fetchSwimPool(solanaConnection);
const poolMath = createPoolMath(swimPool);

// Calculate expected output for current state
const { stableOutputAmount } = poolMath.swapExactInput(
  [inputAmount, new Decimal(0)],
  outputTokenIndex,
);
console.log(
  `Expected output for ${inputAmount} USDC: ${stableOutputAmount} USDT`,
);

// Calculate expected price impact for current state
const priceImpact = poolMath.priceImpact(
  inputAmount,
  inputTokenIndex,
  outputTokenIndex,
);
console.log(
  `Expected price impact when swapping ${inputAmount} USDC to USDT: ${priceImpact}`,
);

// Build instructions for a swap
const minimumOutputAmount = stableOutputAmount.mul(1 - slippageFraction);
const approveAndSwapIxs = createApproveAndSwapIx(
  direction,
  inputAmount,
  minimumOutputAmount,
  [usdcTokenAccountPublicKey, usdtTokenAccountPublicKey],
  delegateKeypair.publicKey,
  ownerPublicKey,
);

// Build a transaction and submit it to the Solana blockchain
const tx = new Transaction({
  feePayer: ownerPublicKey,
});
tx.add(...approveAndSwapIxs);
tx.partialSign(delegateKeypair);
const signedTx = userWallet.signTransaction(tx);
const txId = await solanaConnection.sendRawTransaction(signedTx.serialize());

console.log(`Transaction submitted: ${txId}`);
```
