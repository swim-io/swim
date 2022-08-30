#!/usr/bin/env bash

echo "arg is $1"
if [ -z "$1" ]; then
  echo "Initializing pool on localnet"
  yarn run build:anchor
elif [ "$1" == "devnet" ]; then
  echo "Initializing pool on devnet"
  yarn run build:anchor-devnet
elif [ "$1" == "mainnet" ]; then
  echo "Initializing pool on mainnet"
  yarn run build:anchor-mainnet
else
  echo "invalid argument: $1. exiting"
  exit 22
fi

echo "Running initializePool.ts"
yarn run ts-node scripts/initializePool.ts
