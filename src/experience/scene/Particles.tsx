/* Renderer-owned mutable objects (materials, uniforms, cameras) are mutated
   inside useFrame on purpose; they never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { BufferAttribute, BufferGeometry } from 'three';
import { mulberry32, sceneState } from '../sceneState';
import { createParticleMaterial } from '../shaders/materials';

/** GPU particle field spanning the whole camera path. */
export function Particles({ count }: { count: number }) {
  const pixelRatio = useThree((s) => s.viewport.dpr);
  const material = useMemo(() => createParticleMaterial(), []);
  const geometry = useMemo(() => {
    const rnd = mulberry32(404);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rnd() - 0.5) * 32;
      positions[i * 3 + 1] = (rnd() - 0.5) * 18 + 1;
      positions[i * 3 + 2] = -58 + rnd() * 72;
      seeds[i * 3] = rnd();
      seeds[i * 3 + 1] = rnd();
      seeds[i * 3 + 2] = rnd();
      sizes[i] = 0.8 + rnd() * 2.4;
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new BufferAttribute(seeds, 3));
    g.setAttribute('aSize', new BufferAttribute(sizes, 1));
    return g;
  }, [count]);

  // Calm slows the drift by slowing this clock, not by scaling elapsed time
  // in the shader (which jumped every particle when calm changed).
  const drift = useRef(0);

  useFrame((_, delta) => {
    const s = sceneState;
    const u = material.uniforms;
    drift.current += Math.min(delta, 0.1) * (1 - s.calm * 0.7);
    u.uTime.value = s.reducedMotion ? 0 : drift.current;
    u.uFlow.value = s.flow;
    u.uWorld.value = s.world;
    u.uEnergy.value = Math.min(1, s.energy);
    u.uPixelRatio.value = pixelRatio;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
