import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
const source = ts.transpile(readFileSync('src/sections/hero-thread/motion.ts', 'utf8'), { module: ts.ModuleKind.ESNext });
const { dampProgress } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
let p = 0, maxLag = 0;
for (let frame = 1; frame <= 180; frame++) {
  const target = frame / 180;
  const next = dampProgress(p, target, 1 / 60);
  assert(next >= p && next <= target, 'No overshoot during forward scroll');
  p = next; maxLag = Math.max(maxLag, target - p);
}
assert(maxLag < .06);
for (let frame = 0; frame < 180; frame++) {
  const next = dampProgress(p, .3, 1 / 60);
  assert(next <= p && next >= .3, 'Reversal must not overshoot'); p = next;
}
assert(Math.abs(p - .3) < 1e-10);
const oneStep = dampProgress(.2, .8, .1);
let sixSteps = .2;
for (let i = 0; i < 6; i++) sixSteps = dampProgress(sixSteps, .8, 1 / 60);
assert(Math.abs(oneStep - sixSteps) < 1e-12, 'Damping must be frame-rate independent');
console.log(`PASS: 180-step forward scrub, no overshoot on reversal, frame-rate independence; simulated max lag=${maxLag.toFixed(6)} (not a device measurement).`);
