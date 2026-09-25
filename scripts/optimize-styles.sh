#!/bin/sh
# Resize the camera folder Styles/ into src/assets/styles/<name>/01.jpg ...
# Keeps at most 4 photos per style, longest edge 1600px.
set -eu
cd "$(dirname "$0")/.."
rm -rf src/assets/styles
mkdir -p src/assets/styles
for dir in Styles/*/; do
  [ -d "$dir" ] || continue
  style=$(basename "$dir" | tr '[:upper:]' '[:lower:]')
  out="src/assets/styles/$style"
  mkdir -p "$out"
  i=1
  find "$dir" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.heic' -o -iname '*.png' \) | sort | head -4 | while read -r file; do
    n=$(printf '%02d' "$i")
    sips -s format jpeg -s formatOptions 72 -Z 1600 "$file" --out "$out/${n}.jpg" >/dev/null
    i=$((i + 1))
  done
done
echo "Wrote src/assets/styles"
