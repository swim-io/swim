#!/usr/bin/env bash

echo "starting oracle"
./.switchboard/start-oracle.sh > /tmp/oracle.log 2>&1 &
echo "waiting for oracle to finish"
sleep 100
yarn run ts-mocha -p ./sdk/tests/tsconfig.json -t 1000000 sdk/tests/**/*.ts &
yarn_pid=$!
echo "Yarn PID: ${yarn_pid}"
wait $yarn_pid
echo "shutting down oracle"
docker-compose -f ./.switchboard/docker-compose.switchboard.yml down
