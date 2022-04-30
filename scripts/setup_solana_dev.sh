#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck >/dev/null && shellcheck "$0"

DEV_USER="6sbzC1eH4FTujJXWj51eQe25cYvr4xfXbJ1vAj7j2k5J"
MINTS=(
  "USCAD1T3pV246XwC5kBFXpEjuudS1zT1tTNYhxby9vy"
  "USTPJc7bSkXxRPP1ZdxihfxtfgWNrcRPrE4KEC6EK23"
  "SWMPqjB9AAtpCbatAEEGK67wNBCN1HDW6VypX7E5r9g"
)
TOKEN_ACCOUNTS=(
  "BBtg88Fo2JPs9DE2PxSieezKsvzoNWwCu6eWU3tBzLm1"
  "3f77zu2FHFXdXjYZ8E8LPQq4cU67yYkRw3xvDG6P27Jy"
  "ENADJnkeiAVqPZ2FVCYzCccNvhCFoNa9Fz9o68nJfp68"
)

# Create token mints
for i in "${!MINTS[@]}"; do
  mint=${MINTS[$i]}
  token_account=${TOKEN_ACCOUNTS[$i]}

  spl-token create-token "./src/keys/spl-tokens/$mint.json" \
  --fee-payer "./src/keys/wallet-accounts/$DEV_USER.json" \
  --decimals 6

  spl-token create-account "./src/keys/spl-tokens/$mint.json" \
  --owner "./src/keys/wallet-accounts/$DEV_USER.json" \
  --fee-payer "./src/keys/wallet-accounts/$DEV_USER.json"

  # Mint 1,000,000,000 units of each
  spl-token mint "$mint" 1000000000 "$token_account" \
  --fee-payer "./src/keys/wallet-accounts/$DEV_USER.json"
done
