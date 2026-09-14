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
assert(Math.abs(p - .3) < 1e-7, 'Settle within runtime precision after 3 seconds');
for (const hz of [60, 120]) {
  let value = 0;
  for (let i = 0; i < hz * 4; i++) {
    const target = i < hz * 2 ? 1 : 0;
    const next = dampProgress(value, target, 1 / hz);
    assert(Math.abs(next - value) <= .012 + 1e-12);
    assert(next >= 0 && next <= 1);
    value = next;
  }
}
for (const dt of [0, 1 / 120, 1 / 60, .05, .1, 1, 10]) {
  assert(Math.abs(dampProgress(.2, 1, dt) - .2) <= .012 + 1e-12);
  assert(Math.abs(dampProgress(.8, 0, dt) - .8) <= .012 + 1e-12);
}
assert.equal(dampProgress(.2, 1, 0), .2);
console.log(`PASS: no overshoot, 60/120 Hz forward/reverse, max step ≤ .012 even after dropped frames; simulated 3s-scroll max lag=${maxLag.toFixed(6)}. UNVERIFIED on device.`);
