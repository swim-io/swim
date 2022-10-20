# Aptos contracts

### Install Aptos CLI

See https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli for installation instructions.

### Testnet account

Copy [Aptos testnet account](https://start.1password.com/open/i?a=PO5QNP2LDRCKVKP56IIAMR35JY&v=ag3qmycy4q3yrrwl2p457xu6oy&i=3acejkblqkxxefzwmk6v7q3gva&h=terok.1password.com) yaml file from 1password to `.aptos/config.yaml` in this directory.

If you need some gas, visit https://aptoslabs.com/testnet-faucet and import the testnet account into a wallet (try Martian).

```bash
$ aptos config show-profiles
{
  "Result": {
    "testnet": {
      "has_private_key": true,
      "public_key": "0xc3cdfb15b99a440d942d2a38d4ca568112e8740a404942792c13515647f6f5cf",
      "account": "8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2",
      "rest_url": "https://fullnode.testnet.aptoslabs.com"
    }
  }
}
```

## Example of creating one coin (as a stablecoin placeholder) and the LiquidSwap pool

### Compile sources

```bash
$ aptos move compile --named-addresses account=testnet --save-metadata
Compiling, may take a little while to download git dependencies...
INCLUDING DEPENDENCY AptosFramework
INCLUDING DEPENDENCY AptosStdlib
INCLUDING DEPENDENCY MoveStdlib
BUILDING Swim.io
{
  "Result": [
    "8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin"
  ]
}
```

### Publish

```bash
$ aptos move publish --named-addresses account=testnet --profile testnet
Compiling, may take a little while to download git dependencies...
INCLUDING DEPENDENCY AptosFramework
INCLUDING DEPENDENCY AptosStdlib
INCLUDING DEPENDENCY MoveStdlib
BUILDING Swim.io
package size 1416 bytes
Do you want to submit a transaction for a range of [167200 - 250800] Octas at a gas unit price of 100 Octas? [yes/no] >
yes
{
  "Result": {
    "transaction_hash": "0x4c0bfa7ed404eaf041cd9875bea98de87cec89bf09041dc2cbb7f2a5dcbeb890",
    "gas_used": 1672,
    "gas_unit_price": 100,
    "sender": "8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2",
    "sequence_number": 0,
    "success": true,
    "timestamp_us": 1666174938185145,
    "version": 287152429,
    "vm_status": "Executed successfully"
  }
}
```

### Initialize and mint our stablecoin to use for liquidity on the pool later

```bash
$ aptos move run \
--function-id testnet::test_coin::initialize \
--profile testnet
Do you want to submit a transaction for a range of [118900 - 178300] Octas at a gas unit price of 100 Octas? [yes/no] >
yes
{
  "Result": {
    "transaction_hash": "0xa2988fea705fe1aa8992f4671f9804a0950168df1cab83bc77574d51149b667d",
    "gas_used": 1198,
    "gas_unit_price": 100,
    "sender": "8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2",
    "sequence_number": 1,
    "success": true,
    "timestamp_us": 1666175155441650,
    "version": 287159440,
    "vm_status": "Executed successfully"
  }
}
```

### Create the LiquidSwap pool

So our fake stablecoin has an address of 0x8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin::USDC and the attested SwimUSD has an address of 0x246bfb8da92a72f29d0441138058a43970551734d68958281d59e23a4f2b19a0::coin::T (see [attestation app](./../../apps/attestation/README.md)).

We get the LiquidSwap address from https://github.com/pontem-network/liquidswap/blob/main/Move.toml (0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12) and we call their [entry function](https://docs.liquidswap.com/smart-contracts#scripts) named `register_pool`.

Before we do that, we need to sort the addresses of the two tokens in order to know which one to put first (see [coins sorting](https://docs.liquidswap.com/smart-contracts#coins-sorting)). So we [try](https://gist.github.com/borispovod/2809728c8959649d42c5cef15b4cedb7) their `is_sorted` function and it looks like the attested swimUSD needs to go first in the type arguments.

```
is_sorted("0x246bfb8da92a72f29d0441138058a43970551734d68958281d59e23a4f2b19a0::coin::T", "0x8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin::USDC")
true
```

At the time of this writing it seems there is a [bug](https://github.com/pontem-network/liquidswap/pull/118) on the `liquidswap::curves::Stable` so we will use the `liquidswap::curves::Uncorrelated` curve. See [Stable swaps](https://docs.liquidswap.com/protocol-overview#stable-swaps) for more info.

```
$ aptos move run \
--function-id 0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::scripts::register_pool \
--type-args 0x246bfb8da92a72f29d0441138058a43970551734d68958281d59e23a4f2b19a0::coin::T 0x8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin::USDC 0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated \
--profile testnet
Do you want to submit a transaction for a range of [287100 - 430600] Octas at a gas unit price of 100 Octas? [yes/no] >
yes
{
  "Result": {
    "transaction_hash": "0xe632a133dbc179afa9c0f80f61e64af9e63e46c9d582b577f11d39d154b1ad0a",
    "gas_used": 2871,
    "gas_unit_price": 100,
    "sender": "8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2",
    "sequence_number": 2,
    "success": true,
    "timestamp_us": 1666181541637966,
    "version": 287381898,
    "vm_status": "Executed successfully"
  }
}
```

So now if we check the `changes` tab in the explorer [https://explorer.aptoslabs.com/txn/0xe632a133dbc179afa9c0f80f61e64af9e63e46c9d582b577f11d39d154b1ad0a?network=testnet](https://explorer.aptoslabs.com/txn/0xe632a133dbc179afa9c0f80f61e64af9e63e46c9d582b577f11d39d154b1ad0a?network=testnet)

We see that our LP has this address `0x5a97986a9d031c4567e15b797be516910cfcb4156312482efc6a19c0a30c948::lp_coin::LP<0x246bfb8da92a72f29d0441138058a43970551734d68958281d59e23a4f2b19a0::coin::T, 0x8c9d3a36ae2c7a765826c126fe625f39e9110ea329a5693d874e875227a889c2::test_coin::USDC, 0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12::curves::Uncorrelated>`
under the [liquidswap_pool_account](https://github.com/pontem-network/liquidswap/blob/5fc2625652c15369d0ffc52f9024c180d6e72fea/Move.toml#L15).
