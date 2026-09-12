# Red Thread review tools

Run the app on port 4301, then `python3 scripts/hero-review/serve.py` and open `http://localhost:4302/review.html?w=1440&h=900` (or `w=390&h=844`). `serve-failure.py` runs the blocked-scene proxy on 4303. These diagnostic proxies deliberately send uncompressed responses.

Review screenshots, audit JSON and recordings belong in `/tmp/red-thread-evidence` and GitHub release assets, never in the source tree. The v1 archive is attached to [the review-only release](https://github.com/gentritr1/snaxx-tech/releases/tag/red-thread-review-v1).

`measure-bundles.sh` runs the build and code checks. `check-journey.mjs` validates the journey. `colour-histogram.py` reads `/tmp/red-thread-evidence/desktop-K3.png` and prints a 16-colour histogram (Pillow required).
