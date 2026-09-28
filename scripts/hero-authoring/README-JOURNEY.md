# Journey V3.1 approval films

The application stays on the shipped R3/R8 patch, with the hero flag off by
default. No Journey assets or new playback choreography are imported by the app.
The owner rejected the first films. V3.1 is a new review candidate, not approval.

## Reproduce

Run from the repository root with Blender 5.2, Python/Pillow/fontTools/SciPy,
and FFmpeg. The original source kit remains in `design/hero-world-within/kit`.
The output directory is deliberately separate from the rejected V3 films.

```sh
export JOURNEY_OUTPUT=design/hero-world-within/journey-v31-v2
blender --background --factory-startup --python scripts/hero-authoring/author-journey.py -- --build
blender --background --factory-startup --python scripts/hero-authoring/render-journey.py -- --settings-only
blender --background --factory-startup --python scripts/hero-authoring/render-object-ids.py
blender --background --factory-startup --python scripts/hero-authoring/audit-film-geometry.py
blender --background --factory-startup --python scripts/hero-authoring/audit-journey.py
blender --background --factory-startup --python scripts/hero-authoring/export-journey.py
python3 scripts/hero-authoring/compose-journey.py
python3 scripts/hero-authoring/compare-journey.py "$JOURNEY_OUTPUT"
python3 scripts/hero-authoring/summarize-film-evidence.py "$JOURNEY_OUTPUT"
```

The two scenes share mesh data and each has one Journey action for the exported
objects. Camera lenses are fixed, use horizontal sensor fit, and do not require
an unsupported glTF focal-length animation. Rider poses, scales, camera tracking
and the entry pre-roll are baked. The namespace-stripping exporter reopens both
GLBs and checks exact names, one `Journey` clip, Draco and the byte budget.

The render script applies the review lighting and shadow receivers without
changing Journey poses. Eevee Next has no legacy GTAO scene switch: the AO node
uses distance .6 and factor 1. The AO atlas is applied only to its actual bake
recipients: Tile_*, Globe and Plane. Other objects use local AO. The kit clay is
Principled, with the specified roughness and subsurface values. The enclosing
review wall uses an unlit luminance gradient to hold the specified .94→1 range.
Interior lights do not cast shadows through the enclosing shell. Studio fill
power and size follow scene distance so the long lenses do not leave objects
unlit. The cord remains coated red with an emissive floor.

The thread draw, per-point review thickness, white-out, copy, reserve overlays,
lighting and ground receivers are review-only. The compositor covers the cut
fully by p=.64, fades the stage by p=1, and shows the Apps underline. Review-only
objects and material animation are excluded from the exported Journey clip.

## V3.1 decisions and remaining acceptance

- Full one-turn helix, pitch .35R, followed by an exit toward the launch region.
- Descent camera fits the fixed pin and globe; its free orbit is selected offline
  to put the previous cord behind the globe or outside the crop. The descent's
  depth profile fits the reference plane position to the existing p timing.
- Phone opening arc is 30px lower. Desktop sag and tile tilt follow rt-word.
- The reference image determines globe framing. This changes the former phone
  250px-radius target; the measured image is recorded in the comparison report.
- §13C supersedes negative-u hiding. A visible local domain [-.63,1] maps onto
  the inside segment through `(u+.63)/1.63`. Plane timing and arrow spacing stay
  unchanged. The same map is recorded in the spline metadata. Camera tracking,
  the 4% dolly, rider offsets and 70/35 instances are authored into Journey.
- Folded clay Arrow geometry replaces the old tetrahedron, retaining .5-unit
  length and the triangle budget. No runtime geometry construction is added.
- Screen offsets separate leading arrows from the Plane. The phone's last five
  riders form a separated lower-left tail, then join the prescribed exit. These
  review poses exceed the old .08-unit jitter limit; they are an explicit staging
  deviation, not proof that the original offset formula meets §13C unchanged.

Comparisons are unregistered, labelled with their reference transform and sample
p. The 24fps films use the closest frames to .08 and .78; p=1 is a separate exact
endpoint still. A red-edge check alone does not prove the full silhouette gate.
Object-ID renders preserve occlusion; strict boxes remain for every object other
than Globe_Inner and Graticule, as §14 requires. IDs of an enclosing opaque sphere
cover the viewport; that fact must not be mistaken for a visible horizon outline.
Four additional unique-instance ID frames count actually visible arrows. The
241-frame frustum count is a separate geometric test and does not prove visibility.

Timing still takes precedence: the p=.30 reference contains the later pin/plane
and completed wrap. The descent reference contains cord ahead of the linear
outside reveal. These discrepancies must remain explicit in the PR, alongside
any measured misses. Do not claim the 3% gate passes without the evidence.

Only films and review PNG/JSON/log evidence are published. Blender sources, GLBs
and source archives stay local. Device performance and browser contact sheets
remain gated on film approval. Render/emulation results are UNVERIFIED on device.
