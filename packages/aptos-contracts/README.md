# Aptos contracts

### Install Aptos CLI

See https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli for installation instructions.

### Devnet account

In [.aptos/config.yaml](.aptos/config.yaml) you can find the devnet account details or by using the CLI.

```bash
aptos config show-profiles
{
  "Result": {
    "devnet": {
      "has_private_key": true,
      "public_key": "0xb067b7fa111734ac73a555b5233f8ae05ec27ad4adab197b943fe6da88027237",
      "account": "d53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616",
      "rest_url": "https://fullnode.devnet.aptoslabs.com/v1",
      "faucet_url": "https://faucet.devnet.aptoslabs.com/"
    }
  }
}
```

## Example of creating two coins, an LP and use the LiquidSwap pool

Note that most of these operations could be done via their "public" API (move entry functions) https://docs.liquidswap.com/smart-contracts#scripts
Also this was implemented before https://github.com/pontem-network/liquidswap/pull/82 so the functions' signatures could be a bit different.

### Fund with Faucet (for gas)

```bash
aptos account fund-with-faucet --account devnet --amount 20000000
{
  "Result": "Added 20000000 coins to account d53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616"
}
```

### Compile sources

```bash
aptos move compile --named-addresses account=devnet --save-metadata
{
  "Result": [
    "d53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins",
    "d53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::lp",
    "d53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::pool"
  ]
}
```

### Publish

```bash
aptos move publish --named-addresses account=devnet --profile devnet
package size 3550 bytes
{
  "Result": {
    "transaction_hash": "0xca1f586edf306ff66d0923954860d7b42684ca9577069bdb3ef5eac39a8ee282",
    "gas_used": 587,
    "gas_unit_price": 1,
    "sender": "d53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616",
    "sequence_number": 0,
    "success": true,
    "timestamp_us": 1663147450453804,
    "version": 28815262,
    "vm_status": "Executed successfully"
  }
}
```

### Mint coins to use for liquidity on the pool

First we need to initialize the coins with the owner account (`devnet`)

```bash
aptos move run \
--function-id devnet::coins::register_coins \
--profile devnet
{
  "Result": {
    "transaction_hash": "0x70ee1865eb4297f82537e629b96aefda19e4e6f736ef24829cec1f38cc21312a",
    "gas_used": 64,
    "gas_unit_price": 1,
    "sender": "d53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616",
    "sequence_number": 6,
    "success": true,
    "timestamp_us": 1663150797131768,
    "version": 29008384,
    "vm_status": "Executed successfully"
  }
}
```

Let's assume our wallet address is 0xa3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1 (`liquidity-provider` profile in [.aptos/config.yaml](.aptos/config.yaml)). We need to register a coin in our account before we can receive any. This can be done via a wallet (javascript SDK) or via the aptos cli by using an entry function of the [managed_coin](https://github.com/aptos-labs/aptos-core/blob/9ddae8cadb7f77357fda419eb7824d5293b0e8ad/aptos-move/framework/aptos-framework/sources/managed_coin.move#L96) module:

```bash

# First let's add some gas to our liquidity provider account.
aptos account fund-with-faucet --account liquidity-provider --amount 20000000

# Note that --type-args doesn't seem to interpolate aptos CLI profiles like --function-id above so we
# need to provide the actual address. In this case `0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT` where `0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616` is the address of our `devnet` profile.
aptos move run \
--function-id 0x1::managed_coin::register \
--type-args 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT \
--profile liquidity-provider
{
  "Result": {
    "transaction_hash": "0x63efa26bc14385889e855a3a20ee41488d932db6173972a4e09a8d73b8ecda3d",
    "gas_used": 48,
    "gas_unit_price": 1,
    "sender": "a3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1",
    "sequence_number": 1,
    "success": true,
    "timestamp_us": 1663152338145044,
    "version": 29119485,
    "vm_status": "Executed successfully"
  }
}

aptos move run \
--function-id 0x1::managed_coin::register \
--type-args 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD \
--profile liquidity-provider
{
  "Result": {
    "transaction_hash": "0x59dbd48abba517bdde9389775ed74349a0bf34fa357eaa435f778eda82cfaafa",
    "gas_used": 49,
    "gas_unit_price": 1,
    "sender": "a3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1",
    "sequence_number": 2,
    "success": true,
    "timestamp_us": 1663152547039962,
    "version": 29135240,
    "vm_status": "Executed successfully"
  }
}
```

Now we can mint some coins with our token admin account (`devnet`) and transfer them to `liquidity-provider`.

```bash
aptos move run \
--function-id devnet::coins::mint_coin \
--args address:0xa3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1 u64:100000 \
--type-args 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT \
--profile devnet
{
  "Result": {
    "transaction_hash": "0x6097373feb1bde41d7ee94e9f368ff9a7da693698d3a94bc5154a3120f9c92e9",
    "gas_used": 43,
    "gas_unit_price": 1,
    "sender": "d53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616",
    "sequence_number": 9,
    "success": true,
    "timestamp_us": 1663157069115085,
    "version": 29487579,
    "vm_status": "Executed successfully"
  }
}


aptos move run \
--function-id devnet::coins::mint_coin \
--args address:0xa3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1 u64:100000 \
--type-args 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD \
--profile devnet
{
  "Result": {
    "transaction_hash": "0x8adecfee665101ef735e16fba086b9e411ee539ad5145076684c275e686fe44f",
    "gas_used": 44,
    "gas_unit_price": 1,
    "sender": "d53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616",
    "sequence_number": 10,
    "success": true,
    "timestamp_us": 1663157125272865,
    "version": 29492389,
    "vm_status": "Executed successfully"
  }
}
```

To verify that our `liquidity-provider` account has successfully received the coins we will use the Typescript SDK to check its balance.

```bash
cd scripts
npm install
ACCOUNT=0xa3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1 \
COIN_TYPE=0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD \
npm run balance

Balance for coin 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD: 100000

ACCOUNT=0xa3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1 \
COIN_TYPE=0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT \
npm run balance

Balance for coin 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT: 100000
```

### Create pool (with the admin account `devnet`)

```bash
aptos move run \
--function-id devnet::pool::create_pool \
--profile devnet
{
  "Result": {
    "transaction_hash": "0x0f465e5d1e05dc4629ff0d02123d7bb65bf2ed9b8e1b4c8d4596ea2f7908b8e4",
    "gas_used": 234,
    "gas_unit_price": 1,
    "sender": "d53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616",
    "sequence_number": 11,
    "success": true,
    "timestamp_us": 1663160385926503,
    "version": 29776209,
    "vm_status": "Executed successfully"
  }
}
```

### Add liquidity (with the liquidity account `liquidity-provider`)

```bash
aptos move run \
--function-id devnet::pool::add_liquidity_from_liquidity_account2 \
--args address:0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616 u64:2000 u64:2000 \
--profile liquidity-provider
{
  "Result": {
    "transaction_hash": "0x3253a469cec330f83d4aa41f58dd0eb14cf9255f9ba06b29ddea63cdcce34252",
    "gas_used": 238,
    "gas_unit_price": 1,
    "sender": "a3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1",
    "sequence_number": 5,
    "success": true,
    "timestamp_us": 1663162226191758,
    "version": 29922051,
    "vm_status": "Executed successfully"
  }
}
```

Now let's check our `liquidity-provider` account balances again.

```bash
ACCOUNT=0xa3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1 \
COIN_TYPE=0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD \
npm run balance

Balance for coin 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD: 98000

ACCOUNT=0xa3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1 \
COIN_TYPE=0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT \
npm run balance

Balance for coin 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT: 98000

ACCOUNT=0xa3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1 \
COIN_TYPE='0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::lp::LP<0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT, 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD>' \
npm run balance

Balance for coin 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::lp::LP<0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT, 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD>: 1000

```

### Swap

```bash
aptos move run \
--function-id devnet::pool::swap_exact_coin_for_coin \
--type-args 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD '0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::lp::LP<0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT, 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD>' \
--args address:0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616 u64:1000 u64:10 \
--profile liquidity-provider
{
  "Result": {
    "transaction_hash": "0x0e191f5b02363ecf3ed5b4b9dcd5d6e10e9e71f8599b0e83c025bf5d23e67dbc",
    "gas_used": 249,
    "gas_unit_price": 1,
    "sender": "a3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1",
    "sequence_number": 6,
    "success": true,
    "timestamp_us": 1663241728317318,
    "version": 35093645,
    "vm_status": "Executed successfully"
  }
}
```

Now let's check the balances of our `liquidity-provider` user

```bash
ACCOUNT=0xa3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1 \
COIN_TYPE=0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD \
npm run balance

=== Balance ===
Balance for coin 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD: 98665

ACCOUNT=0xa3e520c1a4245a0ee161f9cee7999cd5fa856c5432d30a9ce7aef6ecce4bccb1 \
COIN_TYPE=0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT \
npm run balance
Balance for coin 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT: 97000
```

So we paid 1000 USDT for 665 SwimUSD.

We can also inspect the pool internal state by checking the account resources

```bash
aptos account list --account devnet | jq '.Result[9]'
{
  "0x43417434fd869edee76cca2a4d2301e528a1551b1d719b75c350c3c97d15b8b9::liquidity_pool::LiquidityPool<0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT, 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD, 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::lp::LP<0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::USDT, 0xd53d76a19f03caa8d5ab95c78a22e0d36908f1a43d1d1131321474fa79b8f616::coins::SwimUSD>>": {
    "coin_x_reserve": {
      "value": "2999"
    },
    "coin_y_reserve": {
      "value": "1335"
    },
    "curve_type": 2,
    "last_block_timestamp": "1663241728",
    "last_price_x_cumulative": "1466553047348056772495730",
    "last_price_y_cumulative": "1466553047348056772495730",
    "lp_burn_cap": {
      "dummy_field": false
    },
    "lp_mint_cap": {
      "dummy_field": false
    },
    "x_scale": "0",
    "y_scale": "0"
  }
}
```
