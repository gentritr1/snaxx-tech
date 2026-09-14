# Red Thread v3.3 runtime review

Draft review; **NOT APPROVED**. The feature flag remains off by default. The runtime now loads one viewport-specific GLB and scrubs its single baked `Journey` clip. Both 40-frame sheets and all five reference/runtime/50% comparisons per viewport are browser captures, not Blender replacements. All browser measurements are **UNVERIFIED on device**. The owner's physical-phone recording is missing.

Evidence release: https://github.com/gentritr1/snaxx-tech/releases/tag/red-thread-runtime-v33

## Implementation and provenance

- Source: `design/hero-world-within/journey-v32-claude/red-thread-journey.blend`, SHA256 `70efcd194c93bd083b7345a62717106454408750e3903cf9935a3928f1b49329`. Both saved scenes retain their original object transforms and timing. The prepared export copy is a release asset; the source blend was not overwritten.
- Desktop GLB 1,279,820 bytes; phone 914,632 bytes. Exact contract names, one `Journey` animation, duration 10 seconds, Draco. Phone selected below 768px; crossing that boundary remounts the scene. Horizontal camera fit preserves the authored framing.
- The staged reveal JSON contains `p:[0,.28,.66]`, `p_full:[0,.28,.31,.66]`, and four `t` values. Inferring a linear map would not reproduce the saved film. The export serializes the actual 241 Blender scalar keys and Bezier handles; runtime reads them from JSON. The original metadata remains under `sourceReveal`. Verification against 241 saved samples has maximum error 1.312e-9.
- `look_pass.py` temporarily changes the descent LOD, but render evaluation restores the saved action. The export therefore preserves the saved action instead of baking that transient assignment. Both LOD objects remain in the kit.
- Five sphere matcaps use staged Cycles/Metal, 64 samples, Standard view, staged clay and act lighting. Globe vertex red encodes land; green encodes object-local baked AO. Runtime uses separate ocean/land roughness matcaps and tint. Globe never uses the old atlas. Graticule is #E9E3DA; cord emission .32, coat .1, roughness .28, radius 9px/5px.
- Playback calls `mixer.setTime(p * duration)` on display refresh with damped follow and a .012 step cap. Copy and white-out use direct DOM updates, with no React state per frame. Scene rendering sleeps when settled or outside the hero. The un-pin hides the stage immediately.

`port-<viewport>-<p>.png` additionally compares staged Cycles / runtime / overlay. These are visual provenance checks, not numeric certification of port fidelity. At .08 and .78 the nearest 24fps staged samples are .07917 and .77917; each panel labels this difference. Material differences remain visible, particularly the descent shading.

## Review artifacts

- `contact-sheet-1440.png`, `contact-sheet-390.png`: 40 runtime frames, .000 through .975, .025 steps, 8×5.
- `match-1440-*.png`, `match-390-*.png`: all five requested three-panel comparisons. Original reference images are contained without registration; phone Word uses the previously prescribed .39 crop with offset -67,+146. Phone descent has no prescribed reference crop; contain preserves its content and is not an alignment proof. At 1.00 the comparison uses the staged empty endpoint because no named raster exists; this does not certify the Apps heading/underline placement.
- `desktop-framing.png`: five keys at 1024×768, 1440×900 and 1920×1080 from the same desktop clip.
- `colour-histogram-1440.png/json`, `colour-histogram-390.png/json`: five actual runtime keys, 16³ RGB buckets and channel plots.
- `runtime-evidence.zip`: raw screenshots, audits, traces, complete violation lists, per-frame colour samples, output logs, and file hashes.
- `unpin-1440.png`, `unpin-390.png`: native un-pin +40px; stage hidden and zero visible copy. Phone also exercises an immediate jump while damped progress is still near .092. This proves the hidden-stage path, not completion of a rendered p=1 pose.

## Measured gates and remaining work

The red-artwork diagnostic below measures unregistered edge distance after excluding DOM copy. It includes red pin/tile detail and does not isolate all globe/cord/plane/tile silhouettes. It has not established the full §13A acceptance test. No reference-match approval is claimed, and neither a port defect nor an inherited authoring defect is established by this proxy alone.

| Viewport | p | Maximum proxy distance | 3% limit | Excess |
| --- | ---: | ---: | ---: | ---: |
| 1440 | .08 | 82.76px | 43.20px | 39.56px |
| 1440 | .30 | 609.82px | 43.20px | 566.62px |
| 1440 | .55 | 431.43px | 43.20px | 388.23px |
| 1440 | .78 | 364.23px | 43.20px | 321.03px |
| 390 | .08 | 39.45px | 11.70px | 27.75px |
| 390 | .30 | 100.04px | 11.70px | 88.34px |
| 390 | .55 | 234.68px | 11.70px | 222.98px |
| 390 | .78 | 130.77px | 11.70px | 119.07px |

| Target | Result and shortfall | Estimated cost to close |
| --- | --- | --- |
| §13A all four silhouettes within 3% | Not certified; diagnostic excesses above. Staged/runtime panels expose material differences. | 2–4 hours for object-ID measurement and port isolation; any resulting source composition changes need owner direction, approximately 1–2 days of targeted authoring, export and review. No runtime repositioning added. |
| §8.25 copy clearance | 136 desktop candidates: 11 tiles, 5 globe, 3 plane, 117 arrows. Phone: 9 candidates: 5 plane, 4 globe. Seven degenerate phone arrow boxes excluded. Worst intersections 480×220px desktop, 342×212px phone. | 2–4 hours to complete visibility auditing, then approximately 4–8 hours of affected source/copy fitting if required and authorized. Outer globe remains subject to strict boxes; only Inner/Graticule have the §14 ID exception. |
| §8.25a silhouette ID pass | Not captured. Thread omitted from the current box audit, so this is not a complete clearance certificate. | Approximately 2–4 hours with a restored browser connection. |
| §8.26 middle third | Desktop any-mesh test has no candidates. Phone .20 misses by .053px; at .525 plane and globe are both below the viewport, nearest horizontally overlapping globe is 433.09px below the middle-third boundary. Protagonist-specific R6 test not certified. | Subpixel opening correction and targeted descent-camera/source review, approximately 2–4 hours plus owner review. |
| §8.27 mean saturation/value ≥.6 | Raw minimum mean S .439676 desktop / .453362 phone at .70: short .160324 / .146638. Prescribed DOM white-out desaturates the cord. No qualifying samples at .65/.675, plus phone .525. These are explicitly unavailable, not passing zeroes. | Resolve the covered-frame requirement with the owner; 1–2 hours to rerun sampling after the decision. Excluding covered frames is only a proposed exception, not applied to the acceptance result. |
| §8.28 one copy block | Zero exclusivity violations in both 40-frame sheets. | No observed miss. |
| §8.29 wheel smoothness | Numeric limits met in sampled spans; incomplete desktop travel prevents full-journey certification. See trace table. Refresh-rate count assumes 120Hz; hardware refresh not recorded by harness. | 30–60 minutes to repeat complete forward/reverse native wheel travel and record actual refresh rate once browser control is restored. |
| §8.30 un-pin | Both +40px captures show hidden stage and zero visible copy. Final extra guard for a single jump beyond the entire hero passes build/static review but was added after captures. | Approximately 15 minutes to recapture that edge case. |
| §8.31 physical phone feel | Owner's phone recording absent. Emulation is not a substitute. | Owner/device availability, approximately 15–30 minutes for recording and inspection. |
| Remaining v1/v2 gates | New reduced-motion still, physical Safari/Chrome traces, Fast 3G poster timing, CLS, five-second idle, route/CTA, context-loss/CSP, breakpoint/network and accessibility checks not rerun for this revision. Quantitative shortfalls unknown. | Approximately 2–4 hours of browser/device QA after access is restored, plus any fixes found. Historical evidence is not current certification. |

Uncovered mean minima are S .690191 / .689477 and V .730229 / .686835 (desktop / phone). This is a separately labelled diagnostic sample set, not a relaxed §8.27 pass. Hue-filtered projected centre samples reject presumed occluders; a complete object-ID colour audit remains outstanding.

| Trace (all UNVERIFIED on device) | Samples / 3s | p95 | Max Δp | Max lag | Observed p span |
| --- | ---: | ---: | ---: | ---: | --- |
| Desktop native wheel | 348 | 10.400ms | .006955 | .074473 | .012–.4701 |
| Phone viewport native wheel | 345 | 10.400ms | .012000 | .188350 | .012–.9375 |
| Desktop programmatic diagnostic | 360 | 10.300ms | .003748 | .036813 | .00012–.9586 |
| Phone programmatic diagnostic | 360 | 10.400ms | .004413 | .036974 | .00012–.9581 |

The .012 limit is enforced by the damping function; lag reports its tradeoff. The phone raw floating-point maximum is .01200000000000001. Counts are within 10% of 360 under a 120Hz assumption. Renderer reports Apple M1 Pro via ANGLE Metal, not a phone GPU. Programmatic traces are not substituted for the requested wheel trace.

## Commands and output

Full unabridged available command output is in the evidence archive's `logs/`. Commands below ran from the branch root. `blender` denotes `/Applications/Blender.app/Contents/MacOS/Blender`, version 5.2.0 LTS. Preparation uses the staged source files described above.

```text
blender --background --factory-startup --python scripts/hero-authoring/prepare-runtime-journey.py
MATCAP BAKED: five 512x512 Cycles 64-sample variants
OBJECT AO BAKED: Globe and Globe_Smooth, local distance .5
METADATA EXPORTED: 1440/390, 1025 points, 241 exact reveal keys each

JOURNEY_OUTPUT=design/hero-world-within/journey-v33-runtime blender --background --factory-startup --python scripts/hero-authoring/export-journey.py
python3 scripts/hero-authoring/check-journey-glb.py public/models/red-thread-kit-1440.glb public/models/red-thread-kit-390.glb
1440: 1279820 bytes, 84 nodes, objectNames PASS, animations ["Journey"], duration 10, Draco PASS, budget PASS
390: 914632 bytes, 49 nodes, objectNames PASS, animations ["Journey"], duration 10, Draco PASS, budget PASS

blender --background --factory-startup --python scripts/hero-authoring/check-runtime-colours.py
Both decoded GLBs: Globe 41665 vertices, land [0,1], AO [.5647116899,1], oldAtlas false
Both decoded GLBs: Globe_Smooth 2737 vertices, land [0,0], AO [1,1], oldAtlas false

npm run build
2313 modules transformed; built in 5.39s; exit 0
Warnings: stale browsers data; lazy 3D chunk exceeds Vite's 500kB raw advisory.
npm run lint
eslint .; exit 0, no diagnostics
node scripts/hero-review/check-journey.mjs
PASS 1440/390: 241 saved samples, max reveal error 1.312e-9; 1001 finite/exact reverse samples; 9px/5px radius
PASS nonlinear time handles, constant and linear interpolation
node scripts/hero-review/check-motion.mjs
PASS no overshoot, 60/120Hz forward/reverse, max step ≤.012 after dropped frames
Simulated 3s scroll max lag .034329; UNVERIFIED on device
git diff --check
exit 0, no output

gzip -c /tmp/hero-v33-baseline/dist/assets/index-*.js | wc -c
98893
gzip -c dist/assets/index-*.js | wc -c
99280
gzip -c dist/assets/ThreadCanvas-*.js | wc -c
265730
```

Baseline is a clean build of `bbc2c394ed98ed45fae687b5d170a4a992d886b6` using the same installed dependencies. Entry gzip growth is 387 bytes (limit 10KB); 3D gzip is 265,730 bytes (limit 1MB). Default-off browser capture has no canvas and no matching Journey/ThreadCanvas/Matcap model resource requests.

```text
npm run preview -- --port 4312
python3 scripts/hero-review/serve.py --port 4313 --upstream 4312
Open /review-runtime.html?w=1440&h=900 or w=390&h=844
Native browser input seeks each contact-sheet/key p, then Audit exports DOM/geometry JSON.
Native browser wheel input records the three-second traces above.
PYTHONPATH=/tmp/red-thread-python python3 scripts/hero-review/compose-runtime-evidence.py
1440: copy violations 0; strict boxes 136; dead-air []
390: copy violations 0; strict boxes 9; dead-air [.20,.525]
```

Pillow, NumPy and SciPy are needed for offline evidence composition. Screenshots are the captured iframe viewport with the review toolbar excluded; no alignment or geometry warping is applied. Browser control became unavailable after the main captures, so missing checks are left outstanding. Final source hashes and the two post-capture changes are recorded in `file-provenance.json`.
