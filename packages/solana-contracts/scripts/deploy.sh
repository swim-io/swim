#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
command -v shellcheck >/dev/null && shellcheck "$0"

echo "arg is ${1-}"
cluster=$1
program_name=$2
program_keypair_file=$3
if [ -z "${3-}" ]; then
  echo "no program keypair file provided for $program_name exiting"
  exit 22
else
  keypair_address=$(solana address -k "$program_keypair_file")
  echo "deploying $program_name to $keypair_address on $cluster"
fi
