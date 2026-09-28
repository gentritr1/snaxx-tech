# Red Thread kit

Authoring dependencies: Blender 5.2, Python `fonttools`, `brotli`, `numpy`, `scipy`, and `shapely`.

1. `python3 scripts/hero-authoring/prepare-glyphs.py` resolves the Bricolage 700 font contours into watertight cutters (OFL licence in the font directory).
2. `python3 scripts/hero-authoring/prepare-land.py`
3. `blender --background --factory-startup --python scripts/hero-authoring/build-kit.py`
4. Inspect `design/hero-world-within/kit/kit-report.json`, the AO atlas, matcap, and Blender render before copying the GLB to `public/models/` and the three runtime assets into Hero's assets directory.
5. `node scripts/hero-authoring/build-decoder.mjs` after changing Three versions. The static pure-JS worker preserves the existing CSP. The worker protocol and the loader integration must be tested together.

Natural Earth land boundaries: 110m, public domain, https://www.naturalearthdata.com/downloads/110m-physical-vectors/110m-land/ .

The `.blend` source, evidence, and reports belong in the PR review release, not the application tree. Image candidates in the design folder require design review before runtime import. Recessed letter geometry is authored as FJALË; changing the word requires a new kit export.
