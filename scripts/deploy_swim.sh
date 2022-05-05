#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck >/dev/null && shellcheck "$0"

# Note, default is devnet, use --url to point to localnet
solana airdrop 10000 6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J

solana program deploy ../pool/target/deploy/pool.so \
--program-id ./apps/ui/src/keys/swim-pool/Swm4BHkU3AQJ3k84ZLZUy6jwHXhXKHMqXL79UGgH1Vd.json \
-k ./apps/ui/src/keys/wallet-accounts/6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J.json
