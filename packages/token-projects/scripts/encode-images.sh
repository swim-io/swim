#!/bin/bash
set -o errexit -o nounset -o pipefail
command -v shellcheck >/dev/null && shellcheck "$0"

image_dir="./src/images/"

rm -rf "$image_dir"
mkdir -p "$image_dir"

for image in ./images/*.svg; do
  image_data="data:image/svg+xml;base64,$(base64 <"$image" | tr -d '\r\n')"
  file_data="export default \"$image_data\";"
  image_name=$(basename "${image%.svg}")
  image_filename="$image_dir$image_name.ts"
  echo "$file_data" >"$image_filename"
done
