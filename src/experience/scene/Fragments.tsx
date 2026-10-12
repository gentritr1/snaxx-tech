/* Renderer-owned mutable objects (materials, uniforms, cameras) are mutated
   inside useFrame on purpose; they never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, InstancedMesh, Matrix4, MeshPhysicalMaterial, Quaternion, Vector3 } from 'three';
import { damp3 } from 'maath/easing';
import { mulberry32, sceneState } from '../sceneState';

interface Shard {
  radius: number;
  speed: number;
  phase: number;
  tilt: number;
  lift: number;
  scale: number;
  spin: Vector3;
}

/**
 * Floating geometric shards that orbit whatever the camera is looking at.
 * The group trails the scroll target so the same fragments accompany the
 * visitor from the core through the portal to the games.
 */
export function Fragments({ count }: { count: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const group = useRef<Group>(null);
  const shards = useMemo<Shard[]>(() => {
    const rnd = mulberry32(99);
    return Array.from({ length: count }, () => ({
      radius: 3.2 + rnd() * 3.6,
      speed: (0.04 + rnd() * 0.1) * (rnd() > 0.5 ? 1 : -1),
      phase: rnd() * Math.PI * 2,
      tilt: (rnd() - 0.5) * 1.4,
      lift: (rnd() - 0.5) * 2.6,
      scale: 0.035 + rnd() * 0.1,
      spin: new Vector3(rnd(), rnd(), rnd()).multiplyScalar(0.8),
    }));
  }, [count]);
  const material = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#8A93A6',
        metalness: 0.9,
        roughness: 0.22,
        clearcoat: 0.6,
        envMapIntensity: 1.4,
      }),
    [],
  );
  const scratch = useMemo(
    () => ({ m: new Matrix4(), p: new Vector3(), q: new Quaternion(), s: new Vector3(), e: new Vector3(), color: new Color() }),
    [],
  );

  useLayoutEffect(() => {
    const inst = mesh.current;
    if (!inst) return;
    const rnd = mulberry32(5);
    shards.forEach((_, i) => {
      const ember = rnd() > 0.82;
      scratch.color.set(ember ? '#F2B35B' : '#B9C1D1');
      inst.setColorAt(i, scratch.color);
    });
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  }, [shards, scratch]);

  useFrame(({ clock }, delta) => {
    const inst = mesh.current;
    const g = group.current;
    if (!inst || !g) return;
    const s = sceneState;
    const t = s.reducedMotion ? 0 : clock.elapsedTime * (1 - s.calm * 0.6);
    damp3(g.position, s.target, 0.9, Math.min(delta, 0.05));
    const { m, p, q, e } = scratch;
    for (let i = 0; i < shards.length; i++) {
      const sh = shards[i];
      const a = sh.phase + t * sh.speed;
      p.set(Math.cos(a) * sh.radius, sh.lift + Math.sin(a * 1.7) * 0.6, Math.sin(a) * sh.radius * Math.cos(sh.tilt));
      p.y += Math.sin(a) * sh.radius * Math.sin(sh.tilt);
      e.set(sh.spin.x * t, sh.spin.y * t, sh.spin.z * t);
      q.setFromEuler(new EulerLike(e.x, e.y, e.z));
      scratch.s.setScalar(sh.scale * (0.8 + s.energy * 0.2));
      m.compose(p, q, scratch.s);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]} material={material} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
      </instancedMesh>
    </group>
  );
}

// Tiny Euler stand-in so the hot loop allocates nothing per shard.
import { Euler } from 'three';
class EulerLike extends Euler {}
