#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck >/dev/null && shellcheck "$0"

prefixes=( "PLS" "LPT" "LPU" "TP1" "TP2" "TP3" "TP4" "TP5" "TP6" )

for prefix in "${prefixes[@]}"; do
  solana-keygen grind --starts-with "$prefix:1";
done
