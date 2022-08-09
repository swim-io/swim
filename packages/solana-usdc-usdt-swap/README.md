# Solana USDC <-> USDT Swap

A minimalist package to create swap and approve instructions for Solana-native USDC and USDT token swaps with Swim's Hexapool.

## Example usage

```js
import {
  Connection,
  PublicKey,
  Transaction,
  Keypair,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  SwapDirection,
  createApproveAndSwapIxs,
  createPoolMath,
  fetchSwimPool,
} from "@swim-io/solana-usdc-usdt-swap";
import * as bip39 from "bip39";
import Decimal from "decimal.js";
import { derivePath } from "ed25519-hd-key";

// Initialize a Solana Connection
const solanaConnection = new Connection("<Solana RPC endpoint>");

// Gather required keys
const mnemonic = "<mnemonic phrase>";
const seed = await bip39.mnemonicToSeed(mnemonic, "<password if any>");
const path = `m/44'/501'/0'/0'`;
const userWallet = Keypair.fromSeed(derivePath(path, seed.toString("hex")).key);

console.log(`User wallet: ${userWallet.publicKey.toBase58()}`);

const delegateKeypair = Keypair.generate();
const usdcTokenAccountPublicKey = new PublicKey(
  "<user’s pre-existing USDC SPL token account address>",
);
const usdtTokenAccountPublicKey = new PublicKey(
  "<user’s pre-existing USDT SPL token account address>",
);

// Gather intended swap info
const direction = SwapDirection.UsdcToUsdt;
const inputAmount = new Decimal("1.234"); // whole units of USDC
const inputTokenIndex = direction;
const outputTokenIndex = 1 - direction;
const slippageFraction = 0.5 / 100; // 0.5%

// Fetch Swim Hexapool state and initialize pool math
const swimPool = await fetchSwimPool(solanaConnection);
const poolMath = createPoolMath(swimPool);

// Calculate expected output for current state
const inputAmounts = swimPool.tokenMintKeys.map((_, i) =>
  i === inputTokenIndex ? inputAmount : new Decimal(0),
);
const { stableOutputAmount } = poolMath.swapExactInput(
  inputAmounts,
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
const approveAndSwapIxs = createApproveAndSwapIxs(
  direction,
  inputAmount,
  minimumOutputAmount,
  [usdcTokenAccountPublicKey, usdtTokenAccountPublicKey],
  delegateKeypair.publicKey,
  userWallet.publicKey,
);

// Build a transaction and submit it to the Solana blockchain
const { blockhash, lastValidBlockHeight } =
  await solanaConnection.getLatestBlockhash();
const tx = new Transaction({
  blockhash,
  lastValidBlockHeight,
  feePayer: userWallet.publicKey,
});
tx.add(...approveAndSwapIxs);

const txId = await sendAndConfirmTransaction(solanaConnection, tx, [
  delegateKeypair,
  userWallet,
]);

console.log(`Transaction submitted: ${txId}`);
```

## Governance fee account

The swap transaction instruction requires the public key of the governance fee account since that account is referenced by the swap instruction processor. This account has been set to `9Yau6DnqYasBUKcyxQJQZqThvUnqZ32ZQuUCcC2AdT9P` initially, but is subject to change as the governance of Swim evolves. By default the instruction creation functions use the initial governance fee public key as a hardcoded value. However, this can be overridden in the event that it ever changes, eg:

```ts
const swimPool = await fetchSwimPool(solanaConnection);
const approveAndSwapIxs = createApproveAndSwapIxs(
  direction,
  inputAmount,
  minimumOutputAmount,
  [usdcTokenAccountPublicKey, usdtTokenAccountPublicKey],
  delegateKeypair.publicKey,
  userWallet.publicKey,
  swimPool.governanceFeeKey, // Pass the new key in here
);
```
