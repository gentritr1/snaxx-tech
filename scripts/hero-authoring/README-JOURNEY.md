# Journey V3 approval films

The application remains on the R3/R8 patch until the owner approves both films.
These scripts author and render assets; the app imports none of them.

## Inputs and outputs

The untracked design directory contains the V2 source kit, including
`kit/red-thread-kit.blend` and `kit/Matcap_Clay.png`. Run from the repository root.
Use Blender 5.2 and Python with Pillow and fontTools. FFmpeg encodes the films.

```sh
blender --background --factory-startup --python scripts/hero-authoring/author-journey.py -- --build
blender --background --factory-startup --python scripts/hero-authoring/export-journey.py
blender --background --factory-startup --python scripts/hero-authoring/render-journey.py
blender --background --factory-startup --python scripts/hero-authoring/audit-journey.py
python3 scripts/hero-authoring/compose-journey.py
```

The compositor creates TTF versions of the existing Bricolage 600, Geist regular,
and Geist Mono fonts in `/tmp/red-thread-film-fonts`. It uses real headline
text and the explicit sequential p windows, with paragraphs only on desktop.
The tinted rectangles are the separate reserve-zone review pass.

Outputs live in `design/hero-world-within/journey-v3/` and are uploaded as PR
release assets, not committed to the application. The two scenes share mesh
data. Internal object namespaces and action names are stripped during export.
The exporter reopens each written GLB and asserts the complete node-name set,
exactly one `Journey` animation, Draco compression, and the 1,600,000-byte limit.
It writes the actual check output to `kit-report.json`.

## Owner decisions included

- Separate desktop and phone scenes, horizontal sensor fit, one action each.
- Updated Act I and phone reserve zones, phone tile centres and globe centre.
- Exactly 70/35 baked Follow Path arrows; negative inside u means zero scale.
- The exported inside segment occupies at least 40% of the total arc length.
- The exact piecewise reveal map is stored beside the exported spline points.
- Review-only thread reveal, camera-parented white-out, copy and zone overlays.
- Neither review material/draw animation nor DOM placeholders enter Journey.

## Film proposals requiring owner review

Claude Fable 5.1 was consulted through the terminal at the owner's request.
Its answers are advisory; they do not approve these films.

A full 360-degree great circle returns to the left-limb start and cannot finish
on the front-right face. The film uses a single non-repeating 235.6-degree pass
at the prescribed 12-degree tilt: 124.4 degrees short of a complete revolution.
The wrap p window and the owner's exact outside reveal map are preserved.
The camera turn is previewed over .48–.50 after Act II clears; its radial dolly
still starts at .45. This proposes applying the plane's x≤760 constraint from
.49, a +.04p change to the literal .45 start, as advised by Claude. It must be
reviewed as a deviation, not silently adopted as the original requirement.

The pin spring retains omega 14 and zeta 0.6. Initial velocity 8.040487340577169
normalized units/second gives exactly 12% overshoot at 0.2259089171 seconds.
The last 0.005 of p settles the residual to the specified seated scale.

Phone K3 uses the advisor's 115-pixel plane composition centred near (308,410),
keeping the newly approved copy reserve. The descent retains the explicit
220-to-360-pixel target; any edge or reserve failures remain reportable.

Inside a sphere there is no silhouette limb. The horizon is therefore a soft
latitude light band on the plain backface wall. The camera looks 8 degrees
above the horizontal and the wall lies 1.35R away along its optical axis; the
band is authored to start at 80% of screen height. This review shader must be
reproduced in the runtime material after film approval.

## Limits of the preflight

`staging-preflight.json` projects all eight bounding-box corners and lists
potential overlaps. It does not subtract occlusion, and the inner sphere's
box encloses the camera even though its visible light band stays below copy.
These are conservative Blender measurements, not a claim that browser §8
passes. The complete overlap list and remaining dead-air samples are retained.

The films render frames 0–239 at 24 fps, exactly ten seconds. Frame 240 is
rendered separately as the p=1 endpoint still. Contact sheets contain the forty
prescribed samples 0, .025, …, .975. Device feel, the owner's physical phone
recording, runtime smoothness, and matching browser sheets remain gated on
film approval. Emulated browser measurements are UNVERIFIED on device.
