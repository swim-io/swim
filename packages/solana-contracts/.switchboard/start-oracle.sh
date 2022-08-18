#!/usr/bin/env bash

script_dir=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

docker-compose -f  "$script_dir"/docker-compose.switchboard.yml up
      