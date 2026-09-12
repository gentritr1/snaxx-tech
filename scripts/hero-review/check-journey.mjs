import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const threeUrl = pathToFileURL(resolve('node_modules/three/build/three.module.js')).href;
const source = ts.transpile(readFileSync('src/sections/hero-thread/journey.ts', 'utf8'), {
  module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
}).replace('from "three"', `from ${JSON.stringify(threeUrl)}`);
const journey = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { Vector3 } = await import(threeUrl);
const position = new Vector3(), target = new Vector3();
const snapshots = [];
for (let i = 0; i <= 1000; i++) {
  const p = i / 1000;
  journey.sampleCamera(p, position, target);
  assert([...position.toArray(), ...target.toArray()].every(Number.isFinite));
  assert(position.distanceTo(target) > .01, `Camera direction degenerates at ${p}`);
  const point = journey.sampleThread(p, p, new Vector3());
  assert(point.toArray().every(Number.isFinite));
  snapshots.push([...position.toArray(), ...target.toArray(), ...point.toArray()]);
}
for (let i = 1000; i >= 0; i--) {
  const p = i / 1000;
  journey.sampleCamera(p, position, target);
  const point = journey.sampleThread(p, p, new Vector3());
  assert.deepEqual([...position.toArray(), ...target.toArray(), ...point.toArray()], snapshots[i]);
}
for (const p of journey.cameraKeys.slice(1, -1)) {
  const before = new Vector3(), after = new Vector3();
  journey.sampleCamera(p - 1e-8, before, target);
  journey.sampleCamera(p + 1e-8, after, target);
  assert(before.distanceTo(after) < 1e-4, `Camera jumps at ${p}`);
}
journey.sampleCamera(0, position, target);
const k0 = position.clone();
journey.sampleCamera(.1999, position, target);
assert(position.equals(k0), 'K0 must remain static');
const pin = journey.pinAnchor;
journey.sampleCamera(.45, position, target);
assert(Math.abs(position.distanceTo(pin) - 3.2 * journey.R) < 1e-8);
journey.sampleCamera(.65, position, target);
assert(Math.abs(position.distanceTo(pin) - 1.05 * journey.R) < 1e-8);
console.log('PASS: 1001 finite poses, 1001 exact reverse poses, all key boundaries continuous, static K0, pin-relative 3.2R → 1.05R dolly.');
