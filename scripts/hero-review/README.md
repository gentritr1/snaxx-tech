# Red Thread review tools

The current baked-Journey runtime uses `review-runtime.html` and `review-runtime.js`. See [the v3.3 runtime report](RUNTIME-V33-REPORT.md) for reproduction commands, current evidence, and outstanding gates. The older harness below remains available for historical comparisons.

Run a production preview on port 4301, then `python3 scripts/hero-review/serve.py`. Open `http://localhost:4302/review.html?w=1440&h=900` or `w=390&h=844`. These diagnostic proxies send uncompressed responses. `serve-failure.py` runs the blocked-scene proxy on 4303.

- Keyframe buttons seek native scroll; Freeze idle removes intentional motion for comparisons. Wait three seconds after each seek before capturing. The iframe is exactly the requested viewport; exclude the 42 px review toolbar from screenshots.
- Arm wheel starts a three-second measurement on the next scroll event. Scroll through the complete journey in those three seconds. The summary reports sample count, p95 and maximum follow lag. The expandable raw performance marks are exportable JSON. Incomplete travel or fewer than 170 samples cannot establish the phone target.
- Trace 3s drives native scroll programmatically. It is a diagnostic, not wheel or device evidence.
- Record 10s drives five seconds down and five seconds back up for a viewport recording. A browser capture of it does not replace the owner's real-phone recording.
- Check idle counts every iframe animation callback over five seconds at the footer. Check CTAs, routes, theme, renderer information and context loss expose their results in the toolbar.

`measure-bundles.sh` runs the build and code checks. `check-journey.mjs` checks the exported scalar reveal against saved Blender samples and verifies finite/reversible curve evaluation. `check-motion.mjs` checks the damped integrator.

`colour-histogram.py <desktop-K3.png>` prints the 16-colour histogram (Pillow required). `make-comparisons.py <evidence-directory> <design-directory>` pairs captured viewports with supplied artboards; it never edits the source artwork. Its inputs use `desktop-K0-raw.png` / `mobile-K0-raw.png` through K4, `artboard-K0-raw.png` through K4, the three mobile artboards, and `reduced-motion.png`.

For the one-second poster target, use `VITE_HERO_VARIANT=thread npm run build`. This emits home-only static first-paint markup and a poster preload. The normal build remains flag-off; `?hero=thread` alone does not include those build-time assets. Test and report both modes. Restore the normal build after measuring the rollout build.

Screenshots, audit JSON, `.blend` files and recordings belong in `/tmp/red-thread-v2-evidence` and GitHub release assets, never in the application tree. The [v1 archive](https://github.com/gentritr1/snaxx-tech/releases/tag/red-thread-review-v1) is historical. The [v2 release](https://github.com/gentritr1/snaxx-tech/releases/tag/red-thread-review-v2) contains current evidence and image candidates. New image candidates require the brief's design approval before runtime import.
