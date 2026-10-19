/* Renderer-owned mutable objects (materials, uniforms, cameras) are mutated
   inside useFrame on purpose; they never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferAttribute,
  CatmullRomCurve3,
  Color,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  TubeGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp01, lerp, mulberry32, sceneState, smoothstep } from '../sceneState';
import { createFilamentMaterial, createPlasmaMaterial } from '../shaders/materials';
import type { Quality } from '../quality';

const EMBER = new Color('#F2B35B');

/** Glossy porcelain: the serving-ware of the confectionery engine. */
export const PORCELAIN = new MeshPhysicalMaterial({
  color: '#EADBC3',
  metalness: 0,
  roughness: 0.18,
  clearcoat: 1,
  clearcoatRoughness: 0.08,
  envMapIntensity: 1.1,
});

/** Tempered dark chocolate: deep, glossy, slightly warm. */
export const CHOCOLATE = new MeshPhysicalMaterial({
  color: '#2E1A10',
  metalness: 0,
  roughness: 0.3,
  clearcoat: 0.9,
  clearcoatRoughness: 0.14,
  envMapIntensity: 1,
});

/** Gold foil for rims and trims. */
export const GOLD = new MeshPhysicalMaterial({
  color: '#E2BF7A',
  metalness: 1,
  roughness: 0.24,
  envMapIntensity: 1.3,
});

// ---------------------------------------------------------------------------
// Centre: a glass shell around molten caramel. Dissolves during the fly-through.

export const GLASS = new MeshPhysicalMaterial({
  color: '#FFEBCB',
  transparent: true,
  opacity: 0.3,
  roughness: 0.03,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.02,
  envMapIntensity: 2.4,
  depthWrite: false,
});

function Heart() {
  const plasma = useMemo(() => createPlasmaMaterial(), []);
  const glass = useRef<Mesh>(null);
  const inner = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const s = sceneState;
    const t = clock.elapsedTime;
    plasma.uniforms.uTime.value = t;
    plasma.uniforms.uEnergy.value = s.energy;
    const dissolve = smoothstep(0.1, 0.7, s.flow);
    const breathe = 1 + Math.sin(t * 1.3) * 0.015 * s.energy;
    const scale = Math.max(0.0001, 1 - dissolve) * breathe;
    if (glass.current) {
      glass.current.scale.setScalar(scale);
      glass.current.visible = scale > 0.02;
      glass.current.rotation.y = t * 0.05;
    }
    if (inner.current) {
      inner.current.scale.setScalar(scale * (0.5 + s.energy * 0.14));
      inner.current.visible = scale > 0.02;
      inner.current.rotation.y = -t * 0.12;
      inner.current.rotation.x = t * 0.07;
    }
  });

  return (
    <>
      {/* Glass shell. A true transmission material re-renders the whole scene
          into an offscreen buffer every frame; a clear-coated, slightly tinted
          translucent shell reads the same against the caramel for a fraction
          of the cost. */}
      <mesh ref={glass} material={GLASS}>
        <icosahedronGeometry args={[0.95, 4]} />
      </mesh>
      <mesh ref={inner} material={plasma}>
        <icosahedronGeometry args={[0.95, 4]} />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------------
// Filaments: caramel threads inside the shell, merged into one draw call.

function Filaments() {
  const geometry = useMemo(() => {
    const rnd = mulberry32(11);
    const randomDir = () =>
      new Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize();
    const tubes = [];
    for (let i = 0; i < 24; i++) {
      const points: Vector3[] = [];
      let p = randomDir().multiplyScalar(0.3);
      for (let k = 0; k < 6; k++) {
        p = p.clone().add(randomDir().multiplyScalar(0.5));
        if (p.length() > 1.45) p.setLength(1.45);
        points.push(p);
      }
      const curve = new CatmullRomCurve3(points, false, 'catmullrom', 0.6);
      const tube = new TubeGeometry(curve, 40, 0.011 + rnd() * 0.012, 6, false);
      const seed = new Float32Array(tube.attributes.position.count).fill(rnd());
      tube.setAttribute('aSeed', new BufferAttribute(seed, 1));
      tubes.push(tube);
    }
    return mergeGeometries(tubes, false)!;
  }, []);
  const material = useMemo(() => createFilamentMaterial(), []);
  const group = useRef<Group>(null);

  useFrame(({ clock }) => {
    const s = sceneState;
    const t = clock.elapsedTime;
    material.uniforms.uTime.value = t;
    material.uniforms.uEnergy.value = s.energy * (1 - smoothstep(0.55, 1, s.flow));
    if (group.current) {
      group.current.rotation.y = t * 0.08;
      group.current.rotation.z = Math.sin(t * 0.2) * 0.15;
      group.current.visible = s.flow < 0.98;
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Drizzle: glossy caramel ribbons wrapped around the bonbon. They unwind as
// the shell opens and fade once the camera is through the centre.

interface RibbonSpec {
  turns: number;
  radius: number;
  height: number;
  wobble: number;
  thickness: number;
  phase: number;
  speed: number;
  tilt: [number, number, number];
}

const RIBBONS: RibbonSpec[] = [
  { turns: 1.6, radius: 2.15, height: 2.2, wobble: 0.35, thickness: 0.075, phase: 0, speed: 0.11, tilt: [0.35, 0, 0.1] },
  { turns: 1.2, radius: 2.55, height: 1.4, wobble: 0.5, thickness: 0.06, phase: 2.1, speed: -0.08, tilt: [-0.5, 0.6, 0.3] },
  { turns: 0.9, radius: 2.95, height: 0.9, wobble: 0.3, thickness: 0.05, phase: 4.2, speed: 0.06, tilt: [1.0, -0.3, 0.15] },
];

// No clearcoat: on the thin ribbons' silhouette pixels the clearcoat
// Fresnel term reaches 1 and removes the whole base layer, leaving black
// speckles along every edge.
export const CARAMEL = new MeshStandardMaterial({
  color: '#D48A2A',
  metalness: 0,
  roughness: 0.12,
  envMapIntensity: 1.5,
});

function ribbonGeometry(spec: RibbonSpec) {
  const points: Vector3[] = [];
  const steps = 96;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = spec.phase + t * Math.PI * 2 * spec.turns;
    const r = spec.radius + Math.sin(t * 9.0 + spec.phase) * spec.wobble * 0.5;
    const y = (t - 0.5) * spec.height + Math.sin(t * 13.0 + spec.phase) * spec.wobble * 0.4;
    points.push(new Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
  }
  const curve = new CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  return new TubeGeometry(curve, 220, spec.thickness, 10, false);
}

function Ribbon({ spec, index }: { spec: RibbonSpec; index: number }) {
  const outer = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const geometry = useMemo(() => ribbonGeometry(spec), [spec]);
  // Angle accumulated frame by frame. elapsedTime x a scroll-driven rate
  // jumped the whole angle (up to ~70 deg in a frame) when the rate changed.
  const phase = useRef(0);

  useFrame(({ clock }, delta) => {
    const s = sceneState;
    const t = clock.elapsedTime;
    const rs = s.ringSpread + s.introRingSpread;
    phase.current += Math.min(delta, 0.1) * spec.speed * (0.5 + s.energy * 0.8 + rs * 0.5);
    if (spin.current) {
      spin.current.rotation.y = s.reducedMotion ? 0 : phase.current;
    }
    if (outer.current) {
      const p = s.reducedMotion ? 0 : t * 0.04 * (index + 1);
      outer.current.rotation.set(spec.tilt[0] + Math.sin(p) * 0.12, spec.tilt[1], spec.tilt[2] + Math.cos(p * 0.8) * 0.1);
      const spread = 1 + rs * (0.25 + index * 0.18);
      outer.current.scale.set(spread, 1 + rs * 0.6, spread);
      outer.current.visible = s.cam.z > -4 || s.formation < 1.8;
    }
  });

  return (
    <group ref={outer} rotation={spec.tilt}>
      <group ref={spin}>
        <mesh geometry={geometry} material={CARAMEL} />
      </group>
    </group>
  );
}

function Drizzle() {
  return (
    <group>
      {RIBBONS.map((spec, i) => (
        <Ribbon key={i} spec={spec} index={i} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Plates: hundreds of instanced chocolate shell pieces with five formations.

const FORMATIONS = 5;
const FRAME_CENTER = new Vector3(0, 0.1, -14.9);
const RING_CENTER = new Vector3(0, 0, -22);
const SKY_CENTER = new Vector3(0, 10, -40);

/** Point on a rounded rectangle perimeter, u in [0,1). */
function roundedRectPoint(u: number, hw: number, hh: number, r: number, out: Vector3) {
  const straightW = (hw - r) * 2;
  const straightH = (hh - r) * 2;
  const arc = (Math.PI / 2) * r;
  const total = straightW * 2 + straightH * 2 + arc * 4;
  let d = u * total;
  // top edge, left→right
  if (d < straightW) return out.set(-hw + r + d, hh, 0);
  d -= straightW;
  if (d < arc) {
    const a = Math.PI / 2 - d / r;
    return out.set(hw - r + Math.cos(a) * r, hh - r + Math.sin(a) * r, 0);
  }
  d -= arc;
  if (d < straightH) return out.set(hw, hh - r - d, 0);
  d -= straightH;
  if (d < arc) {
    const a = -d / r;
    return out.set(hw - r + Math.cos(a) * r, -hh + r + Math.sin(a) * r, 0);
  }
  d -= arc;
  if (d < straightW) return out.set(hw - r - d, -hh, 0);
  d -= straightW;
  if (d < arc) {
    const a = -Math.PI / 2 - d / r;
    return out.set(-hw + r + Math.cos(a) * r, -hh + r + Math.sin(a) * r, 0);
  }
  d -= arc;
  if (d < straightH) return out.set(-hw, -hh + r + d, 0);
  d -= straightH;
  const a = Math.PI - d / r;
  return out.set(-hw + r + Math.cos(a) * r, hh - r + Math.sin(a) * r, 0);
}

interface PlateLayout {
  positions: Float32Array[]; // per formation, n*3
  quaternions: Float32Array[]; // per formation, n*4
  scales: Float32Array; // n*3
  stagger: Float32Array; // n
  seeds: Float32Array; // n
}

function buildPlateLayout(n: number): PlateLayout {
  const rnd = mulberry32(2026);
  const positions = Array.from({ length: FORMATIONS }, () => new Float32Array(n * 3));
  const quaternions = Array.from({ length: FORMATIONS }, () => new Float32Array(n * 4));
  const scales = new Float32Array(n * 3);
  const stagger = new Float32Array(n);
  const seeds = new Float32Array(n);
  const pos = new Vector3();
  const q = new Quaternion();
  const m = new Matrix4();
  const up = new Vector3(0, 1, 0);
  const origin = new Vector3();
  const tmp = new Vector3();
  const axis = new Vector3();
  const golden = Math.PI * (3 - Math.sqrt(5));

  const write = (f: number, i: number) => {
    positions[f].set([pos.x, pos.y, pos.z], i * 3);
    quaternions[f].set([q.x, q.y, q.z, q.w], i * 4);
  };

  for (let i = 0; i < n; i++) {
    stagger[i] = rnd();
    seeds[i] = rnd();
    const sx = 0.7 + rnd() * 0.7;
    scales.set([sx, 0.75 + rnd() * 0.6, 1], i * 3);

    // 0 — sealed shell on a Fibonacci sphere.
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const dir = new Vector3(Math.cos(theta) * rad, y, Math.sin(theta) * rad);
    pos.copy(dir).multiplyScalar(1.58 + (rnd() - 0.5) * 0.04);
    m.lookAt(pos, origin, Math.abs(dir.y) > 0.95 ? new Vector3(1, 0, 0) : up);
    q.setFromRotationMatrix(m);
    write(0, i);

    // 1 — exploded: pushed out along the normal with a tangential swirl.
    tmp.copy(dir).cross(up).normalize();
    pos.copy(dir).multiplyScalar(2.9 + rnd() * 4.6).addScaledVector(tmp, (rnd() - 0.5) * 2.4);
    axis.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    q.multiply(new Quaternion().setFromAxisAngle(axis, (rnd() - 0.5) * 1.6));
    write(1, i);

    // 2 — frame around the software panels (three concentric layers).
    const layer = i % 3;
    roundedRectPoint((i / n + rnd() * 0.004) % 1, 5.4 + layer * 0.46, 3.4 + layer * 0.46, 1.1 + layer * 0.3, pos);
    pos.z = (rnd() - 0.5) * 0.5 - layer * 0.25;
    pos.add(FRAME_CENTER);
    q.setFromAxisAngle(new Vector3(0, 0, 1), rnd() * Math.PI * 2).multiply(
      new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), (rnd() - 0.5) * 0.4),
    );
    write(2, i);

    // 3 — portal ring.
    const ringLayer = i % 4;
    const angle = (i / n) * Math.PI * 2 * 7 + rnd() * 0.3;
    const rr = 4.05 + ringLayer * 0.2 + (rnd() - 0.5) * 0.1;
    pos.set(Math.cos(angle) * rr, Math.sin(angle) * rr, (rnd() - 0.5) * 0.5 - ringLayer * 0.12).add(RING_CENTER);
    q.setFromAxisAngle(new Vector3(0, 0, 1), angle + Math.PI / 2);
    write(3, i);

    // 4 — dispersed into the games sky.
    const sy = rnd() * 2 - 1;
    const sr = Math.sqrt(1 - sy * sy);
    const st = rnd() * Math.PI * 2;
    pos.set(Math.cos(st) * sr, Math.abs(sy) * 0.8 + 0.1, Math.sin(st) * sr).multiplyScalar(24 + rnd() * 18).add(SKY_CENTER);
    axis.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    q.setFromAxisAngle(axis, rnd() * Math.PI * 2);
    write(4, i);
  }
  return { positions, quaternions, scales, stagger, seeds };
}

function Plates({ count }: { count: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const layout = useMemo(() => buildPlateLayout(count), [count]);
  const geometry = useMemo(() => {
    const g = new RoundedBoxGeometry(0.32, 0.18, 0.05, 1, 0.02);
    g.setAttribute('aGlow', new InstancedBufferAttribute(new Float32Array(count), 1));
    return g;
  }, [count]);
  const material = useMemo(() => {
    const mat = new MeshStandardMaterial({
      color: '#3D2416',
      metalness: 0.05,
      roughness: 0.26,
      envMapIntensity: 1.0,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uGlowColor = { value: EMBER };
      shader.vertexShader = `attribute float aGlow;\nvarying float vGlow;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvGlow = aGlow;',
      );
      shader.fragmentShader = `varying float vGlow;\nuniform vec3 uGlowColor;\n${shader.fragmentShader}`.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uGlowColor * vGlow * 1.6;',
      );
    };
    mat.customProgramCacheKey = () => 'plates-glow';
    return mat;
  }, []);

  const previous = useMemo(() => new Float32Array(count * 3), [count]);
  // Accumulated like the ribbons: energy changes must not jump the angle.
  const shellPhase = useRef(0);
  const glow = useMemo(() => new Float32Array(count), [count]);
  const scratch = useMemo(
    () => ({
      pA: new Vector3(),
      pB: new Vector3(),
      qA: new Quaternion(),
      qB: new Quaternion(),
      qY: new Quaternion(),
      p: new Vector3(),
      q: new Quaternion(),
      s: new Vector3(),
      m: new Matrix4(),
      color: new Color(),
    }),
    [],
  );

  useLayoutEffect(() => {
    const inst = mesh.current;
    if (!inst) return;
    for (let i = 0; i < count; i++) {
      // Milk to dark chocolate across the shell.
      const tone = 0.45 + layout.seeds[i] * 0.5;
      scratch.color.setRGB(tone * 0.48, tone * 0.28, tone * 0.15);
      inst.setColorAt(i, scratch.color);
    }
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  }, [count, layout, scratch]);

  useFrame(({ clock }, delta) => {
    const inst = mesh.current;
    if (!inst) return;
    const s = sceneState;
    const t = clock.elapsedTime;
    const dt = Math.max(delta, 1e-3);
    const f = Math.max(0, Math.min(FORMATIONS - 1.0001, s.formation + s.introFormation));
    const fi = Math.floor(f);
    const ft = f - fi;
    const { pA, pB, qA, qB, qY, p, q, m } = scratch;
    shellPhase.current += Math.min(delta, 0.1) * 0.045 * (0.4 + s.energy);
    const spinShell = s.reducedMotion ? 0 : shellPhase.current;
    const spinExploded = s.reducedMotion ? 0 : t * 0.025;
    const glowAttr = geometry.getAttribute('aGlow') as InstancedBufferAttribute;

    for (let i = 0; i < count; i++) {
      const stagger = layout.stagger[i];
      const local = smoothstep(stagger * 0.45, stagger * 0.45 + 0.55, ft);
      pA.fromArray(layout.positions[fi], i * 3);
      qA.fromArray(layout.quaternions[fi], i * 4);
      pB.fromArray(layout.positions[fi + 1], i * 3);
      qB.fromArray(layout.quaternions[fi + 1], i * 4);

      // Shell and exploded formations slowly revolve around the core.
      if (fi <= 1) {
        const a = fi === 0 ? spinShell : spinExploded;
        qY.setFromAxisAngle(up, a);
        pA.applyQuaternion(qY);
        qA.premultiply(qY);
      }
      if (fi + 1 === 1) {
        qY.setFromAxisAngle(up, spinExploded);
        pB.applyQuaternion(qY);
        qB.premultiply(qY);
      }
      // Exploded plates drift a little so the cloud breathes.
      if (fi === 1 || fi + 1 === 1) {
        const drift = Math.sin(t * 0.6 + layout.seeds[i] * 20) * 0.12;
        if (fi === 1) pA.y += drift;
        else pB.y += drift;
      }

      p.copy(pA).lerp(pB, local);
      q.copy(qA).slerp(qB, local);

      const px = previous[i * 3], py = previous[i * 3 + 1], pz = previous[i * 3 + 2];
      const speed = Math.sqrt((p.x - px) ** 2 + (p.y - py) ** 2 + (p.z - pz) ** 2) / dt;
      previous[i * 3] = p.x;
      previous[i * 3 + 1] = p.y;
      previous[i * 3 + 2] = p.z;
      const idle = s.energy * (Math.sin(t * 1.7 + layout.seeds[i] * 60) > 0.992 ? 0.35 : 0);
      const target = clamp01(speed * 0.35) + idle;
      glow[i] = lerp(glow[i], target, Math.min(1, dt * 6));
      glowAttr.setX(i, glow[i]);

      scratch.s.fromArray(layout.scales, i * 3);
      m.compose(p, q, scratch.s);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
    glowAttr.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false} />
  );
}

const up = new Vector3(0, 1, 0);

// ---------------------------------------------------------------------------

export function Core({ quality }: { quality: Quality }) {
  return (
    <group>
      <Heart />
      <Filaments />
      <Drizzle />
      <Plates count={quality.plates} />
    </group>
  );
}
