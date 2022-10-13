#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck >/dev/null && shellcheck "$0"

TMP_FILE="./tmp/wormholeTokenData.csv"

mkdir -p tmp
wget -O "$TMP_FILE" "https://raw.githubusercontent.com/certusone/wormhole-token-list/main/content/by_source.csv"

yarn ts-node --esm ./scripts/processWormholeTokenData.ts

rm "$TMP_FILE"
