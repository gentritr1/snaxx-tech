import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const compile = (path) => ts.transpile(readFileSync(path, 'utf8'), {
  module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
});
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const motionUrl = moduleUrl(compile('src/sections/hero-thread/motion.ts'));
const threeUrl = pathToFileURL(resolve('node_modules/three/build/three.module.js')).href;
const { sampleScalar, createThreadCurve } = await import(moduleUrl(
  compile('src/sections/hero-thread/journey.ts')
    .replace('from "three"', `from ${JSON.stringify(threeUrl)}`)
    .replace('from "./motion"', `from ${JSON.stringify(motionUrl)}`)));
for (const viewport of ['1440', '390']) {
  const data = JSON.parse(readFileSync(`public/models/journey-spline-${viewport}.json`, 'utf8'));
  let error = 0;
  for (const [p, start, end] of data.revealVerification) {
    error = Math.max(error, Math.abs(sampleScalar(data.reveal.start, p) - start), Math.abs(sampleScalar(data.reveal.end, p) - end));
  }
  assert(error < 2e-6, `Saved Blender scalar values differ by ${error}`);
  const curve = createThreadCurve(data);
  const snapshots = Array.from({length: 1001}, (_, i) => {
    const p = i / 1000;
    const values = [sampleScalar(data.reveal.start, p), sampleScalar(data.reveal.end, p), ...curve.getPoint(p).toArray()];
    assert(values.every(Number.isFinite));
    return values;
  });
  for (let i = 1000; i >= 0; i--) {
    const p = i / 1000;
    assert.deepEqual([sampleScalar(data.reveal.start, p), sampleScalar(data.reveal.end, p), ...curve.getPoint(p).toArray()], snapshots[i]);
  }
  assert.equal(data.pixelRadius, viewport === '1440' ? 9 : 5);
  console.log(`PASS ${viewport}: ${data.revealVerification.length} saved Blender reveal samples, max error=${error.toExponential(3)}; 1001 finite and exact reverse curve/reveal samples; radius=${data.pixelRadius}px.`);
}
// Independent interpolation cases prevent a serialized-value-only test.
const keys = [
  {p:0,value:0,left:[0,0],right:[.1,.8],interpolation:'BEZIER'},
  {p:1,value:1,left:[.9,.2],right:[1,1],interpolation:'BEZIER'},
];
assert(Math.abs(sampleScalar(keys, .5) - .5) < 1e-6);
assert(sampleScalar(keys, .1) > .2);
keys[0].interpolation = 'CONSTANT';assert.equal(sampleScalar(keys, .5), 0);
keys[0].interpolation = 'LINEAR';assert.equal(sampleScalar(keys, .5), .5);
console.log('PASS: nonlinear time handles, constant and linear interpolation.');
