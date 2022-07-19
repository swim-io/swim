# Solana Types

A package for serializing/deserializing Swim types relating to Solana.

## Installation

```sh
npm install @swim-io/solana-types
```

## Usage

```ts
import { PublicKey, Connection } from "@solana/web3.js";
import type { SwimPoolState } from "@swim-io/solana-types";
import { deserializeSwimPool } from "@swim-io/solana-types";

const connection = new Connection("endpoint", "wsEndpoint");
const accountInfo = await connection.getAccountInfo(
  new PublicKey(poolSpec.address),
);

if (accountInfo === null) {
  throw new Error("Cannot deserialize missing account info");
}

// The number of tokens in the pool affects the size of the serialized pool state
const numberOfTokens = 6;
const poolState: SwimPoolState = deserializeSwimPool(
  numberOfTokens,
  accountInfo.data,
);
```
