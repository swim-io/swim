#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck >/dev/null && shellcheck "$0"

DEV_USER="${DEV_USER:-6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J}"

solana airdrop 1000 "$DEV_USER"
