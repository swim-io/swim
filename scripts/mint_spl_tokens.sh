#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck >/dev/null && shellcheck "$0"

DEV_USER="${DEV_USER:-8KDcYa3t5s46GKcBM9kYKfGuvFStSFAdX7KqJB3PPZvu}"
MINTS=(
  "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy"
  "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23"
)
TOKEN_ACCOUNTS=(
  "TuCEKdFrRARtL1oCfXQfDfz84bpY5vgBavnwR4Spzhd"
  "TuTBBzw1xR2RDYCoeb8xNKRLX1QcwjWgpSTPJhgoQJU"
)

# Create token mints
for i in "${!MINTS[@]}"; do
  mint=${MINTS[$i]}
  token_account=${TOKEN_ACCOUNTS[$i]}

  spl-token mint "$mint" 1000000000 "$token_account" \
  --fee-payer "./apps/ui/src/keys/wallet-accounts/$DEV_USER.json"
done
