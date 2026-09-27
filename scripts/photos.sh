#!/bin/sh
# Pripraví fotky z fotky-originaly/*.jpg do src/assets/img/photos/ vo veľkostiach 640, 1280 a 2400 px (WebP).
#   npm run photos
# V HTML sa používajú cez srcset (640/1280) a data-full (2400 – lightbox).
set -e
cd "$(dirname "$0")/.."
mkdir -p src/assets/img/photos
ls fotky-originaly/*.jpg | xargs -P 6 -I{} sh -c '
  n=$(basename "{}" .jpg)
  for w in 640 1280 2400; do
    q=80; [ $w = 2400 ] && q=82
    magick "{}" -auto-orient -resize ${w}x -strip -quality $q "src/assets/img/photos/$n-$w.webp"
  done
  echo "✔ $n"'
