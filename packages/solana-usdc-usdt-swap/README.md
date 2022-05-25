# Solana USDC <-> USDT Swap

Minimalist package to create swap and approve instructions for Solana-native USDC and USDT token swaps with Swim's Hexapool.

## Example usage

```js
const web3 = require("@solana/web3.js");
const {
  SwapDirection,
  createApproveAndSwapIx,
  createSwapIx,
  hexaPool,
} = require("@swim-io/solana-usdc-usdt-swap");
const BN = require("bn.js");

const defaultPubkey = web3.PublicKey.default;

console.log("HEXAPOOL", hexaPool);

const swapIx = createSwapIx(
  SwapDirection.UsdtToUsdc,
  new BN("12345678901234567890"),
  new BN("2"),
  [defaultPubkey, defaultPubkey],
  defaultPubkey,
);

console.log("SWAP IX", swapIx);

const approveAndSwapIxs = createApproveAndSwapIx(
  SwapDirection.UsdcToUsdt,
  new BN("12345678901234567890"),
  new BN("2"),
  [defaultPubkey, defaultPubkey],
  defaultPubkey,
  defaultPubkey,
);

console.log("APPROVE AND SWAP IXS", approveAndSwapIxs);
```
