/* Renderer-owned mutable objects (materials, uniforms, cameras) are mutated
   inside useFrame on purpose; they never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useMemo, useRef } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { damp } from 'maath/easing';
import { clamp01, sceneState, setHover, smoothstep } from '../sceneState';
import { createGlobeDotsMaterial } from '../shaders/materials';
import { createLetterTexture } from '../textures/ui';
import { gamesConfig, type GameItem } from '@/config';
import { CHOCOLATE, GOLD, PORCELAIN } from './Core';
import { isDomControlClick, scrollToGame } from '@/lib/scroll';

const ZERO = new Vector3(0, 0, 0);
const GAMES_Z = -38;
const GAMES_X = [-7.5, -2.5, 2.5, 7.5];
const GAMES_Y = -1.2;

function focusWeight(index: number) {
  const s = sceneState;
  return clamp01(1 - Math.abs(s.gamesFocus - index)) * s.gamesReveal;
}

// ---------------------------------------------------------------------------

function Exhibit({ game, index, children }: { game: GameItem; index: number; children: React.ReactNode }) {
  const group = useRef<Group>(null);
  const inner = useRef<Group>(null);
  const ringMaterial = useMemo(
    () => new MeshPhysicalMaterial({ color: '#111318', emissive: new Color(game.accent), emissiveIntensity: 0.2, roughness: 0.4 }),
    [game.accent],
  );
  const hover = useRef(0);

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hover.current = 1;
    setHover(game.id);
  };
  const onOut = () => {
    hover.current = 0;
    setHover(null);
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (isDomControlClick(e)) return;
    scrollToGame(index);
  };

  useFrame(({ clock }, delta) => {
    const s = sceneState;
    const t = s.reducedMotion ? 0 : clock.elapsedTime;
    const w = focusWeight(index);
    const reveal = smoothstep(0, 1, s.gamesReveal);
    if (group.current) {
      group.current.visible = reveal > 0.001;
      const sc = 0.6 + reveal * 0.4;
      group.current.scale.setScalar(sc);
      group.current.position.y = GAMES_Y - (1 - reveal) * 1.5;
    }
    if (inner.current) {
      const h = hover.current;
      damp(inner.current.scale, 'x', 1 + w * 0.12 + h * 0.05, 0.3, delta);
      inner.current.scale.y = inner.current.scale.x;
      inner.current.scale.z = inner.current.scale.x;
      inner.current.position.y = 1.15 + Math.sin(t * 0.9 + index) * 0.06;
    }
    ringMaterial.emissiveIntensity = 0.25 + w * 2.4 + hover.current * 0.8;
  });

  return (
    <group ref={group} position={[GAMES_X[index], GAMES_Y, GAMES_Z]}>
      {/* Serving plate */}
      <mesh material={PORCELAIN} position={[0, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.62, 0.16, 64]} />
      </mesh>
      <mesh material={GOLD} position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <torusGeometry args={[1.66, 0.03, 12, 96]} />
      </mesh>
      <mesh material={CHOCOLATE} position={[0, -0.14, 0]}>
        <cylinderGeometry args={[1.75, 1.8, 0.12, 64]} />
      </mesh>
      <mesh material={ringMaterial} position={[0, 0.09, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.42, 1.5, 96]} />
      </mesh>
      {/* Hover/click volume */}
      <mesh position={[0, 1.2, 0]} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick} visible={false}>
        <sphereGeometry args={[1.7, 12, 12]} />
      </mesh>
      <group ref={inner} position={[0, 1.15, 0]}>
        {children}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Arrows: a glossy blue candy dart with a stream of sugar glyphs behind it.

function dartGeometry() {
  const g = new BufferGeometry();
  const nose = [0, 0, 1.25];
  const tail = [0, 0.02, -0.65];
  const left = [-0.95, -0.06, -0.72];
  const right = [0.95, -0.06, -0.72];
  const keel = [0, -0.38, -0.5];
  const verts = [
    ...nose, ...tail, ...left,
    ...nose, ...right, ...tail,
    ...nose, ...keel, ...tail,
    ...nose, ...tail, ...keel,
  ];
  g.setAttribute('position', new Float32BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return g;
}

function ArrowsExhibit({ accent }: { accent: string }) {
  const dart = useRef<Mesh>(null);
  const glyphs = useRef<InstancedMesh>(null);
  const COUNT = 48;
  const geometry = useMemo(() => dartGeometry(), []);
  const material = useMemo(
    () => new MeshPhysicalMaterial({ color: accent, metalness: 0.05, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.4 }),
    [accent],
  );
  const glyphMaterial = useMemo(
    () => new MeshPhysicalMaterial({ color: '#F6ECDC', metalness: 0, roughness: 0.35, clearcoat: 0.8, emissive: new Color(accent), emissiveIntensity: 0.3 }),
    [accent],
  );
  const curve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(-2.6, -1.1, 1.2),
        new Vector3(-1.7, -0.35, 0.7),
        new Vector3(-0.7, 0.3, 0.3),
        new Vector3(0.1, 0.32, 0.1),
      ]),
    [],
  );
  const seeds = useMemo(() => Array.from({ length: COUNT }, (_, i) => (i / COUNT + (i % 7) * 0.013) % 1), []);
  const scratch = useMemo(() => ({ m: new Matrix4(), p: new Vector3(), q: new Quaternion(), s: new Vector3(), tangent: new Vector3(), up: new Vector3(0, 1, 0), look: new Matrix4() }), []);

  useFrame(({ clock }) => {
    const s = sceneState;
    const t = s.reducedMotion ? 0 : clock.elapsedTime;
    if (dart.current) {
      dart.current.rotation.set(Math.sin(t * 0.8) * 0.08, 0.65, Math.sin(t * 1.1) * 0.22);
      dart.current.position.set(0.45, 0.35 + Math.sin(t * 1.3) * 0.05, 0.1);
    }
    const inst = glyphs.current;
    if (!inst) return;
    const { m, p, q, tangent, up, look } = scratch;
    for (let i = 0; i < COUNT; i++) {
      const u = (seeds[i] + t * 0.22) % 1;
      curve.getPointAt(u, p);
      curve.getTangentAt(u, tangent);
      p.x += Math.sin(u * 20 + i) * 0.12;
      p.y += Math.cos(u * 17 + i * 2) * 0.1;
      look.lookAt(tangent, ZERO, up);
      q.setFromRotationMatrix(look);
      const fade = smoothstep(0, 0.12, u) * (1 - smoothstep(0.85, 1, u));
      scratch.s.setScalar(0.13 * fade + 0.001);
      m.compose(p, q, scratch.s);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh ref={dart} geometry={geometry} material={material} scale={1.15} />
      <instancedMesh ref={glyphs} args={[undefined, undefined, COUNT]} material={glyphMaterial} frustumCulled={false}>
        <coneGeometry args={[0.6, 1.6, 3]} />
      </instancedMesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Block Destroy: a bar of chocolate squares; one row caramelises and clears.

function BlocksExhibit({ accent }: { accent: string }) {
  const SIZE = 6;
  const COUNT = SIZE * SIZE;
  const mesh = useRef<InstancedMesh>(null);
  const geometry = useMemo(() => {
    const g = new RoundedBoxGeometry(0.36, 0.36, 0.36, 2, 0.05);
    g.setAttribute('aHeat', new InstancedBufferAttribute(new Float32Array(COUNT), 1));
    return g;
  }, [COUNT]);
  const material = useMemo(() => {
    const mat = new MeshPhysicalMaterial({ color: '#3D2416', metalness: 0.02, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uHeatColor = { value: new Color(accent) };
      shader.vertexShader = `attribute float aHeat;\nvarying float vHeat;\n${shader.vertexShader}`.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvHeat = aHeat;',
      );
      shader.fragmentShader = `varying float vHeat;\nuniform vec3 uHeatColor;\n${shader.fragmentShader}`.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uHeatColor * vHeat * 3.0;',
      );
    };
    mat.customProgramCacheKey = () => `blocks-heat-${accent}`;
    return mat;
  }, [accent]);
  const dummy = useMemo(() => new Object3D(), []);

  useFrame(({ clock }) => {
    const inst = mesh.current;
    if (!inst) return;
    const s = sceneState;
    const t = s.reducedMotion ? 2.4 : clock.elapsedTime;
    const cycle = 2.6;
    const phase = (t % cycle) / cycle;
    const activeRow = Math.floor(t / cycle) % SIZE;
    const heatAttr = geometry.getAttribute('aHeat') as InstancedBufferAttribute;
    const gap = 0.44;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const i = r * SIZE + c;
        const active = r === activeRow;
        const ignite = active ? smoothstep(0.05, 0.45, phase) * (1 - smoothstep(0.7, 0.95, phase)) : 0;
        const pop = active ? smoothstep(0.78, 0.9, phase) : 0;
        const back = active ? smoothstep(0.95, 1, phase) : 0;
        const scale = 1 - pop + back;
        dummy.position.set((c - (SIZE - 1) / 2) * gap, (r - (SIZE - 1) / 2) * gap + ignite * 0.08, 0);
        dummy.rotation.set(0, 0, pop * 0.6);
        dummy.scale.setScalar(Math.max(0.001, scale) * (1 + ignite * 0.06));
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
        heatAttr.setX(i, ignite);
      }
    }
    inst.instanceMatrix.needsUpdate = true;
    heatAttr.needsUpdate = true;
  });

  return (
    <group rotation={[0.25, -0.35, 0]}>
      {/* The bar's base slab */}
      <mesh material={CHOCOLATE} position={[0, 0, -0.26]}>
        <boxGeometry args={[2.78, 2.78, 0.14]} />
      </mesh>
      <instancedMesh ref={mesh} args={[geometry, material, COUNT]} frustumCulled={false} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Geo Guesser: a candy planet, continents in teal sprinkles, with a dropping pin.

function fibonacciSphere(n: number, r: number) {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const theta = golden * i;
    out[i * 3] = Math.cos(theta) * rad * r;
    out[i * 3 + 1] = y * r;
    out[i * 3 + 2] = Math.sin(theta) * rad * r;
  }
  return out;
}

function graticule(r: number) {
  const pts: number[] = [];
  const seg = 72;
  for (let lat = -60; lat <= 60; lat += 30) {
    const phi = (lat * Math.PI) / 180;
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const b = ((i + 1) / seg) * Math.PI * 2;
      pts.push(Math.cos(phi) * Math.cos(a) * r, Math.sin(phi) * r, Math.cos(phi) * Math.sin(a) * r);
      pts.push(Math.cos(phi) * Math.cos(b) * r, Math.sin(phi) * r, Math.cos(phi) * Math.sin(b) * r);
    }
  }
  for (let lon = 0; lon < 180; lon += 30) {
    const l = (lon * Math.PI) / 180;
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const b = ((i + 1) / seg) * Math.PI * 2;
      pts.push(Math.cos(a) * Math.cos(l) * r, Math.sin(a) * r, Math.cos(a) * Math.sin(l) * r);
      pts.push(Math.cos(b) * Math.cos(l) * r, Math.sin(b) * r, Math.cos(b) * Math.sin(l) * r);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pts, 3));
  return g;
}

function GlobeExhibit({ accent, index }: { accent: string; index: number }) {
  const globe = useRef<Group>(null);
  const pin = useRef<Group>(null);
  const pulse = useRef<Mesh>(null);
  const pixelRatio = useThree((s) => s.viewport.dpr);
  const R = 1.0;
  const dots = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(fibonacciSphere(3000, R + 0.01), 3));
    return g;
  }, []);
  const dotsMaterial = useMemo(() => createGlobeDotsMaterial(accent), [accent]);
  const lines = useMemo(() => graticule(R + 0.004), []);
  const pinMaterial = useMemo(() => new MeshPhysicalMaterial({ color: accent, emissive: new Color(accent), emissiveIntensity: 1.2, roughness: 0.3 }), [accent]);
  const pulseMaterial = useMemo(() => new MeshPhysicalMaterial({ color: accent, emissive: new Color(accent), emissiveIntensity: 1.5, transparent: true, opacity: 0.6, roughness: 0.5 }), [accent]);

  useFrame(({ clock }) => {
    const s = sceneState;
    const t = s.reducedMotion ? 0 : clock.elapsedTime;
    const w = focusWeight(index);
    dotsMaterial.uniforms.uTime.value = t;
    dotsMaterial.uniforms.uFocus.value = w;
    dotsMaterial.uniforms.uPixelRatio.value = pixelRatio;
    if (globe.current) globe.current.rotation.y = t * 0.12;
    const cycle = 4;
    const phase = (t % cycle) / cycle;
    const drop = 1 - Math.pow(1 - smoothstep(0, 0.25, phase), 3);
    const bounce = Math.abs(Math.sin(smoothstep(0.25, 0.45, phase) * Math.PI)) * 0.08;
    if (pin.current) pin.current.position.y = R + 0.9 * (1 - drop) + bounce;
    if (pulse.current) {
      const p = smoothstep(0.25, 0.9, phase);
      pulse.current.scale.setScalar(1 + p * 2.2);
      pulseMaterial.opacity = (1 - p) * 0.7;
    }
  });

  return (
    <group rotation={[0.25, 0, -0.15]}>
      <group ref={globe}>
        <mesh>
          <sphereGeometry args={[R, 48, 48]} />
          <meshPhysicalMaterial color="#2E1A10" roughness={0.3} metalness={0} clearcoat={0.9} clearcoatRoughness={0.12} />
        </mesh>
        <points geometry={dots} material={dotsMaterial} />
        <lineSegments geometry={lines}>
          <lineBasicMaterial color="#6B4A2C" transparent opacity={0.45} />
        </lineSegments>
        {/* Pin on the surface, carried round by the globe. */}
        <group rotation={[0.4, 0.6, 0]}>
          <group ref={pin} position={[0, R, 0]}>
            <mesh material={pinMaterial} position={[0, 0.22, 0]}>
              <sphereGeometry args={[0.1, 20, 20]} />
            </mesh>
            <mesh material={pinMaterial} position={[0, 0.08, 0]} rotation-x={Math.PI}>
              <coneGeometry args={[0.06, 0.2, 16]} />
            </mesh>
          </group>
          <mesh ref={pulse} material={pulseMaterial} position={[0, R + 0.005, 0]} rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.1, 0.13, 48]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// FJALË: five biscuit tiles flipping to reveal the day's word.

function Tile({ letter, accent, index, highlight }: { letter: string; accent: string; index: number; highlight: boolean }) {
  const group = useRef<Group>(null);
  const face = useMemo(() => createLetterTexture(letter, accent, highlight), [letter, accent, highlight]);
  const edgeMaterial = useMemo(
    () => new MeshPhysicalMaterial({ color: highlight ? accent : '#D9A25A', metalness: 0, roughness: highlight ? 0.3 : 0.65, clearcoat: highlight ? 0.8 : 0.1, emissive: new Color(accent), emissiveIntensity: 0 }),
    [accent, highlight],
  );
  const spacing = 0.82;

  useFrame(({ clock }) => {
    const s = sceneState;
    const t = s.reducedMotion ? 10 : clock.elapsedTime;
    const cycle = 7;
    const local = (t % cycle) - index * 0.28;
    const flip = smoothstep(0, 0.9, local) * (1 - smoothstep(5.2, 6, local));
    const eased = flip < 0.5 ? 2 * flip * flip : 1 - Math.pow(-2 * flip + 2, 2) / 2;
    if (group.current) {
      group.current.rotation.x = Math.PI * (1 - eased);
      group.current.position.y = Math.sin(eased * Math.PI) * 0.25;
    }
    edgeMaterial.emissiveIntensity = highlight ? eased * 0.9 : 0;
  });

  return (
    <group position={[(index - 2) * spacing, 0, 0]}>
      <group ref={group}>
        <mesh material={edgeMaterial}>
          <boxGeometry args={[0.7, 0.7, 0.14]} />
        </mesh>
        <mesh position={[0, 0, 0.0715]}>
          <planeGeometry args={[0.68, 0.68]} />
          <meshBasicMaterial map={face} transparent toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function FjaleExhibit({ accent }: { accent: string }) {
  const letters = ['F', 'J', 'A', 'L', 'Ë'];
  return (
    <group rotation={[0.15, 0.15, 0]} position={[0, 0.1, 0]}>
      {letters.map((l, i) => (
        <Tile key={l + i} letter={l} accent={accent} index={i} highlight={i === 0 || i === 2 || i === 4} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------

export function GamesWorld() {
  return (
    <group>
      {gamesConfig.games.map((game, i) => (
        <Exhibit key={game.id} game={game} index={i}>
          {game.id === 'arrows' && <ArrowsExhibit accent={game.accent} />}
          {game.id === 'block-destroy' && <BlocksExhibit accent={game.accent} />}
          {game.id === 'geo-guesser' && <GlobeExhibit accent={game.accent} index={i} />}
          {game.id === 'fjale' && <FjaleExhibit accent={game.accent} />}
        </Exhibit>
      ))}
    </group>
  );
}
