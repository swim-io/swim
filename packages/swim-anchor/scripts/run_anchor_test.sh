#!/usr/bin/env bash

echo "arg is $1"
test_files=""
prepare_oracle=true
if [ -z "$1" ]; then
  echo "Running all tests"
  test_files="sdk/tests/**/*.test.ts"
elif [ "$1" == "propeller" ]; then
    echo "Running only propeller tests"
    test_files="sdk/tests/propeller/*.test.ts"
elif [ "$1" == "pool" ]; then
    echo "Running only pool tests"
    prepare_oracle=false
    test_files="sdk/tests/twoPool/*.test.ts"
else
    echo "invalid argument: $1. exiting"
    exit 22
fi

echo "prepare_oracle: $prepare_oracle"

if $prepare_oracle; then
    echo "starting oracle"
    ./.switchboard/start-oracle.sh > /tmp/oracle.log 2>&1 &
    echo "waiting for oracle to finish"
    sleep 100
fi

yarn run ts-mocha -p ./sdk/tests/tsconfig.json -t 1000000 "$test_files" &
yarn_pid=$!
echo "Yarn PID: ${yarn_pid}"
wait $yarn_pid

if $prepare_oracle; then
    echo "shutting down oracle"
    docker-compose -f ./.switchboard/docker-compose.switchboard.yml down
fi
