#!/bin/sh
set -eu
npm run build
gzip -c dist/assets/ThreadCanvas-*.js | wc -c
gzip -c dist/assets/index-*.js | wc -c
shasum -a 256 dist/assets/index-*.js
npm run lint
npx tsc -b
node scripts/hero-review/check-journey.mjs
