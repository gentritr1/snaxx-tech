// Run: node --test src/legal/geo-privacy.test.mjs (Node 23.6+ strips the .ts types).
// Facts checked against geoguesser-app v1.5.0 (305d2d7), the build live on Play.
import { test } from "node:test";
import assert from "node:assert/strict";
import { legalApps } from "./content.ts";

const geo = legalApps["geo-guesser-world-3d"];
const text = [...geo.privacy, ...geo.terms]
  .flatMap((s) => [s.title, ...(s.paragraphs ?? []), ...(s.list ?? []), ...(s.links ?? []).flatMap((l) => [l.label, l.description])])
  .join("\n");

test("Geo Guesser legal text matches the v1.5.0 app", () => {
  for (const stale of ["CARTO", "Leaflet", "not even to your own device", "three places"]) {
    assert.ok(!text.includes(stale), `still says "${stale}"`);
  }
  for (const fact of ["OpenFreeMap", "MapLibre", "four places", "personal best", "In-App Review"]) {
    assert.ok(text.includes(fact), `missing "${fact}"`);
  }
});

test("the page date moves when the policy changes", () => {
  assert.ok(geo.lastUpdated && geo.lastUpdated !== geo.effectiveDate, "lastUpdated must be set to the day this text goes live");
});
