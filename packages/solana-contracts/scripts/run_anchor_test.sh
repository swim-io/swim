#!/usr/bin/env bash
set -o errexit -o nounset -o pipefail
command -v shellcheck >/dev/null && shellcheck "$0"

echo "arg is $1"
test_files=""
prepare_oracle=false
#clean_oracle=false
if [ -z "$1" ]; then
  echo "Running all tests"
  prepare_oracle=true
  test_files="*"
elif [ "$1" == "engine" ]; then
  echo "Running only engine tests"
#  prepare_oracle=true
  test_files=$1
elif [ "$1" == "propeller" ]; then
  echo "Running only propeller tests"
  test_files=$1
elif [ "$1" == "utils" ]; then
  echo "Running only utils tests"
  test_files=$1
elif [ "$1" == "pool" ]; then
  echo "Running only pool tests"
  test_files=$1
else
  echo "invalid argument: $1. exiting"
  exit 22
fi

echo "test_files: $test_files"

echo "prepare_oracle: $prepare_oracle"

# original
#if $prepare_oracle; then
#  echo "starting oracle"
#  ./.switchboard/start-oracle.sh >/tmp/oracle.log 2>&1 &
#  echo "waiting for oracle to finish"
#  sleep 75
#fi

#if $prepare_oracle; then
#    echo "Checking for existing oracle images"
#    switchboard_exists=$(docker-compose -f ./.switchboard/docker-compose.switchboard.yml images | grep "switchboard-oracle-1")
#    echo "switchboard_exists $switchboard_exists"
#    if [ -z "$switchboard_exists" ]; then
#        echo "creating & starting oracle from scratch"
#        # this just calls docker-compose w/ the switchboard docker-compose file
#        ./.switchboard/start-oracle.sh > /tmp/oracle.log 2>&1 &
#        echo "waiting for oracle to finish"
#        sleep 100
#    else
#        echo "oracle already exists. restarting"
#        docker-compose -f ./.switchboard/docker-compose.switchboard.yml stop
#        docker-compose -f ./.switchboard/docker-compose.switchboard.yml start > /tmp/oracle.log 2>&1 &
#        sleep 50
#    fi
#fi

#yarn run jest -c jest.config.js --verbose --detectOpenHandles "$test_files"
#yarn run jest -c jest.config.js --verbose --detectOpenHandles --forceExit "$test_files"
#yarn run jest -c jest.config.js --verbose --detectOpenHandles --forceExit --testPathPattern "$1.test.ts"
yarn run jest --verbose --detectOpenHandles --testPathPattern "$1.test.ts" &

yarn_pid=$!
echo "Yarn PID: ${yarn_pid}"
wait $yarn_pid
exit_code=$?
echo "exit_code: $exit_code"
#yarn run jest -i "$test_files" -c jest.config.js &
#yarn run ts-mocha -p ./tsconfig-dev.json -t 1000000 "$test_files" &
#yarn_pid=$!
#echo "Yarn PID: ${yarn_pid}"
#wait $yarn_pid

#if $prepare_oracle; then
#    echo "shutting down oracle"
#    docker-compose -f ./.switchboard/docker-compose.switchboard.yml stop
#    if $clean_oracle; then
#        echo "cleaning up oracle containers"
#        docker-compose -f ./.switchboard/docker-compose.switchboard.yml down
#    fi
#fi
#

#
#yarn run ts-mocha -p ./test/tsconfig.json -t 1000000 "$test_files" &
#yarn_pid=$!
#echo "Yarn PID: ${yarn_pid}"
#wait $yarn_pid
if $prepare_oracle; then
  echo "shutting down oracle"
  docker-compose -f ./.switchboard/docker-compose.switchboard.yml down
fi

echo "exit_code again: $exit_code"
exit $exit_code
