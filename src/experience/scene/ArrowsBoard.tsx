import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { sceneState, smoothstep } from '../sceneState';
import { ARROWS_LEVEL } from './arrowsLevel';
import { GOLD } from './Core';

/*
 * Arrows, as the game actually plays: a picture drawn out of arrows (the real
 * Level 1 board). The next arrow whose lane is clear takes the game's violet
 * hint, then slides out along its own path like a snake, the way a tap fires
 * it. Once a loop a blocked arrow flashes the game's magenta and shakes (the
 * "lose a heart" moment). When the board is clear it pipes back in, in the
 * next snack skin from the game's Arrow Style book: Cinnamon Roll, Strawberry
 * Glazed, Candy Corn (colours from arrows-game/src/ui/skinSpecs.ts).
 */

interface Skin {
  name: string;
  board: string;
  /** Body colour, or three bands tail -> head (Candy Corn). */
  body: string | [string, string, string];
  /** The skin's rim layer: a darker outline that separates each arrow from the board. */
  rim: string;
  ribbon: string | null;
  swirl: string | null;
}

const SKINS: Skin[] = [
  { name: 'Cinnamon Roll', board: '#FFF7EA', body: '#E6AE71', rim: '#96603A', ribbon: '#FFF3DC', swirl: '#704127' },
  { name: 'Strawberry Glazed', board: '#FFF7EA', body: '#E6AE71', rim: '#96603A', ribbon: '#FF9EBB', swirl: '#704127' },
  { name: 'Candy Corn', board: '#F3EEFA', body: ['#FFD24A', '#FF8A2A', '#FFF8E8'], rim: '#8C7BB5', ribbon: null, swirl: null },
];
const HINT = new Color('#7B5BF5'); // Arrows' accent (Ink Night)
const BLOCKED = new Color('#F0468C'); // Arrows' heart / blocked flash

const { rows: ROWS, cols: COLS, arrows: ARROWS, order: ORDER } = ARROWS_LEVEL;
const BOARD = 2.4; // world units across the plaque's playing area
const CELL = BOARD / Math.max(ROWS, COLS);
const R = CELL * 0.19; // body radius (the skin's body width .33-.38 of a cell)
const PLAQUE_FACE = -R * 1.9; // z of the plaque's front face, behind the rim layer (rim reaches -R * 1.77)

// Timeline, seconds.
const PIPE_IN = 1.6;
const HOLD = 0.7;
const GAP = 0.17;
const HINT_LEAD = 0.24;
const SPEED = 24; // cells per second once it is flying
const ACCEL = 0.12; // seconds to reach full speed, like a flick
const OUTRO = 0.9;
const BLOCKED_AT = 9; // fire-order step at which a blocked arrow is tapped
const DELTA: Record<string, [number, number]> = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };

/** Board cell (row, col) to plaque-local x, y. */
const cx = (c: number) => (c - COLS / 2 + 0.5) * CELL;
const cy = (r: number) => (ROWS / 2 - r - 0.5) * CELL;

interface Track {
  /** Tail -> head points, extended past the head along the lane until well off the board. */
  pts: [number, number][];
  n: number;
  start: number;
  hintAt: number;
  travel: number;
  duration: number;
  segBase: number;
  jointBase: number;
}

function buildTracks() {
  const fireStep = new Map<number, number>();
  ORDER.forEach((arrowIndex, step) => fireStep.set(arrowIndex, step));
  let segBase = 0;
  let jointBase = 0;
  const tracks: Track[] = ARROWS.map((a, i) => {
    const [dr, dc] = DELTA[a.dir];
    const pts: [number, number][] = a.cells.map(([r, c]) => [cx(c), cy(r)]);
    const [hr, hc] = a.cells[a.cells.length - 1];
    // Lane to the edge plus the arrow's own length, so the tail clears the board too.
    const toEdge = dr < 0 ? hr + 1 : dr > 0 ? ROWS - hr : dc < 0 ? hc + 1 : COLS - hc;
    const extra = toEdge + a.cells.length + 2;
    for (let k = 1; k <= extra; k++) pts.push([cx(hc + dc * k), cy(hr + dr * k)]);
    const step = fireStep.get(i) ?? 0;
    const start = PIPE_IN + HOLD + step * GAP;
    const travel = extra;
    const t: Track = {
      pts,
      n: a.cells.length,
      start,
      hintAt: start - HINT_LEAD,
      travel,
      duration: ACCEL / 2 + travel / SPEED,
      segBase,
      jointBase,
    };
    segBase += a.cells.length - 1;
    jointBase += a.cells.length;
    return t;
  });
  const lastEnd = Math.max(...tracks.map((t) => t.start + t.duration));
  return { tracks, segCount: segBase, jointCount: jointBase, loop: lastEnd + OUTRO };
}

/** The arrow tapped while blocked: the first one at BLOCKED_AT whose lane runs into a remaining arrow. */
function pickBlocked() {
  const remaining = new Set(ORDER.slice(BLOCKED_AT));
  const owner = new Map<string, number>();
  ARROWS.forEach((a, i) => a.cells.forEach(([r, c]) => owner.set(`${r},${c}`, i)));
  for (const i of ORDER.slice(BLOCKED_AT + 2)) {
    const a = ARROWS[i];
    const [dr, dc] = DELTA[a.dir];
    let [r, c] = a.cells[a.cells.length - 1];
    for (;;) {
      r += dr;
      c += dc;
      if (r < 0 || c < 0 || r >= ROWS || c >= COLS) break;
      const o = owner.get(`${r},${c}`);
      if (o !== undefined && o !== i && remaining.has(o)) return i;
    }
  }
  return -1;
}

/** Point at arc position u (in cells) along a unit-step polyline. */
function at(pts: [number, number][], u: number, out: Vector3) {
  const i = Math.max(0, Math.min(pts.length - 2, Math.floor(u)));
  const f = Math.min(1, Math.max(0, u - i));
  out.set(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f, 0);
  return out;
}

function headGeometry() {
  // The skin's 'tri' head: half-width .36, tip .43 past centre, back .42 behind it (cell units).
  const s = new Shape();
  s.moveTo(0, 0.43 * CELL);
  s.lineTo(0.36 * CELL, -0.42 * CELL);
  s.lineTo(-0.36 * CELL, -0.42 * CELL);
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: R * 1.1, bevelEnabled: true, bevelThickness: R * 0.45, bevelSize: R * 0.35, bevelSegments: 3 });
  g.translate(0, 0, -R * 0.55);
  return g;
}

export function ArrowsBoard() {
  const { tracks, segCount, jointCount, loop } = useMemo(() => buildTracks(), []);
  const blocked = useMemo(() => pickBlocked(), []);

  const parts = useMemo(() => {
    // Material colour well below 1 (and a little warm) tempers the bright,
    // neutral studio light and Neutral tone mapping's shoulder, so the skins land
    // near their own hex values on screen (measured median body (225,172,126)
    // against Cinnamon Roll's (230,174,113)) instead of washing out to peach.
    const pastry = new MeshStandardMaterial({ color: new Color(0.33, 0.3, 0.23), roughness: 0.55, metalness: 0, envMapIntensity: 0.7 });
    const rimMat = new MeshStandardMaterial({ color: new Color(0.65, 0.65, 0.65), roughness: 0.7, metalness: 0, envMapIntensity: 0.5 });
    const gloss = new MeshStandardMaterial({ color: new Color(0.85, 0.85, 0.85), roughness: 0.3, metalness: 0, envMapIntensity: 0.9 });
    const plaque = new MeshStandardMaterial({ color: SKINS[0].board, roughness: 0.6, metalness: 0, envMapIntensity: 0.45 });
    const seg = new CylinderGeometry(R, R, 1, 14, 1);
    const joint = new SphereGeometry(R, 14, 10);
    const head = headGeometry();
    const tail = new CylinderGeometry(0.265 * CELL, 0.265 * CELL, R * 2.1, 20).rotateX(Math.PI / 2);
    const swirl = new TorusGeometry(0.15 * CELL, 0.035 * CELL, 6, 20);
    const ribbon = new CylinderGeometry(R * 0.3, R * 0.3, 1, 8, 1);
    const board = new RoundedBoxGeometry(BOARD + CELL * 1.6, BOARD + CELL * 1.6, 0.07, 3, 0.05);
    return { pastry, rimMat, gloss, plaque, seg, joint, head, tail, swirl, ribbon, board };
  }, []);
  useEffect(
    () => () => {
      Object.values(parts).forEach((p) => p.dispose());
    },
    [parts],
  );

  const segs = useRef<InstancedMesh>(null);
  const joints = useRef<InstancedMesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const tails = useRef<InstancedMesh>(null);
  const swirls = useRef<InstancedMesh>(null);
  const ribbons = useRef<InstancedMesh>(null);
  const rimSegs = useRef<InstancedMesh>(null);
  const rimJoints = useRef<InstancedMesh>(null);
  const rimHeads = useRef<InstancedMesh>(null);
  const st = useRef({ clock: 0, cycle: -1 });
  const k = useMemo(
    () => ({
      m: new Matrix4(),
      q: new Quaternion(),
      s: new Vector3(),
      a: new Vector3(),
      b: new Vector3(),
      mid: new Vector3(),
      dir: new Vector3(),
      up: new Vector3(0, 1, 0),
      zero: new Matrix4().makeScale(0, 0, 0),
      c: new Color(),
      base: [new Color(), new Color(), new Color()],
      ribbon: new Color(),
      swirl: new Color(),
      rim: new Color(),
    }),
    [],
  );

  useFrame((_, delta) => {
    const s = sceneState;
    if (s.gamesReveal < 0.001) return;
    const v = st.current;
    if (!s.reducedMotion) v.clock += Math.min(delta, 0.1);
    // Reduced motion: the full board in Cinnamon Roll, still.
    const time = s.reducedMotion ? PIPE_IN + HOLD * 0.5 : v.clock % loop;
    const cycle = s.reducedMotion ? 0 : Math.floor(v.clock / loop);
    const skin = SKINS[cycle % SKINS.length];

    if (cycle !== v.cycle) {
      v.cycle = cycle;
      parts.plaque.color.set(skin.board).multiplyScalar(0.86);
      k.rim.set(skin.rim);
      if (Array.isArray(skin.body)) skin.body.forEach((c, i) => k.base[i].set(c));
      else k.base.forEach((c) => c.set(skin.body as string));
      k.ribbon.set(skin.ribbon ?? '#FFFFFF');
      k.swirl.set(skin.swirl ?? '#FFFFFF');
    }

    const S = segs.current;
    const J = joints.current;
    const H = heads.current;
    const T = tails.current;
    const W = swirls.current;
    const B = ribbons.current;
    const RS = rimSegs.current;
    const RJ = rimJoints.current;
    const RH = rimHeads.current;
    if (!S || !J || !H || !T || !W || !B || !RS || !RJ || !RH) return;
    const { m, q, a, b, mid, dir, up, c } = k;

    tracks.forEach((tr, i) => {
      // Pipe in: each arrow grows from nothing, staggered across the board.
      const grow = smoothstep(0, 0.45, (time - (i / tracks.length) * (PIPE_IN - 0.45)) / 1);
      // Fly out: accelerate from rest, then cruise, along the arrow's own path.
      const tt = Math.max(0, time - tr.start);
      const off = Math.min(tr.travel, tt < ACCEL ? (0.5 * SPEED * tt * tt) / ACCEL : 0.5 * SPEED * ACCEL + SPEED * (tt - ACCEL));
      const gone = off >= tr.travel - 0.01;
      // Fade the scale as the body leaves the plaque, so nothing pops at the edge.
      const leaving = 1 - smoothstep(tr.travel - tr.n - 1.5, tr.travel - 0.5, off);
      const scale = gone ? 0 : grow * leaving;

      // Colour: base (or Candy Corn thirds), violet hint before firing, magenta when tapped while blocked.
      const hint = time > tr.hintAt && time < tr.start + 0.12 ? smoothstep(tr.hintAt, tr.hintAt + 0.12, time) : 0;
      let flash = 0;
      let shake = 0;
      if (i === blocked) {
        const bt = PIPE_IN + HOLD + BLOCKED_AT * GAP + GAP * 0.5;
        const e = time - bt;
        if (e > 0 && e < 0.45) {
          flash = Math.sin((e / 0.45) * Math.PI);
          shake = Math.sin(e * 70) * (1 - e / 0.45) * CELL * 0.18;
        }
      }
      const shakeAxis = ARROWS[i].dir === 'U' || ARROWS[i].dir === 'D' ? 0 : 1;

      const colourFor = (j: number) => {
        const band = Array.isArray(skin.body) ? Math.min(2, Math.floor((j / Math.max(1, tr.n)) * 3)) : 0;
        c.copy(k.base[band]);
        if (hint > 0) c.lerp(HINT, hint * 0.85);
        if (flash > 0) c.lerp(BLOCKED, flash * 0.9);
        return c;
      };

      for (let j = 0; j < tr.n; j++) {
        at(tr.pts, j + off, a);
        if (shakeAxis === 0) a.x += shake;
        else a.y += shake;
        m.compose(a, q.identity(), k.s.setScalar(scale));
        J.setMatrixAt(tr.jointBase + j, m);
        J.setColorAt(tr.jointBase + j, colourFor(j));
        a.z -= R * 0.45;
        m.compose(a, q.identity(), k.s.setScalar(scale * 1.32));
        RJ.setMatrixAt(tr.jointBase + j, m);
        a.z += R * 0.45;
        if (j < tr.n - 1) {
          at(tr.pts, j + 1 + off, b);
          if (shakeAxis === 0) b.x += shake;
          else b.y += shake;
          dir.subVectors(b, a);
          const len = dir.length();
          mid.addVectors(a, b).multiplyScalar(0.5);
          q.setFromUnitVectors(up, dir.normalize());
          m.compose(mid, q, k.s.set(scale, len * scale, scale));
          S.setMatrixAt(tr.segBase + j, m);
          S.setColorAt(tr.segBase + j, colourFor(j));
          mid.z -= R * 0.45;
          m.compose(mid, q, k.s.set(scale * 1.32, len * scale, scale * 1.32));
          RS.setMatrixAt(tr.segBase + j, m);
          mid.z += R * 0.45;
          // Highlight ribbon along the top of the body.
          if (skin.ribbon && scale > 0) {
            mid.z += R * 0.78;
            m.compose(mid, q, k.s.set(scale, len * scale * 0.82, scale));
            B.setMatrixAt(tr.segBase + j, m);
            c.copy(k.ribbon);
            if (hint > 0) c.lerp(HINT, hint * 0.5);
            B.setColorAt(tr.segBase + j, c);
          } else B.setMatrixAt(tr.segBase + j, k.zero);
        }
      }

      // Head: at the last body point, pointing along the path's tangent there.
      at(tr.pts, tr.n - 1 + off, a);
      at(tr.pts, tr.n - 1 + off + 0.25, b);
      if (shakeAxis === 0) a.x += shake;
      else a.y += shake;
      dir.subVectors(b, a);
      if (dir.lengthSq() < 1e-8) {
        const [dr, dc] = DELTA[ARROWS[i].dir];
        dir.set(dc, -dr, 0);
      }
      q.setFromUnitVectors(up, dir.normalize());
      m.compose(a, q, k.s.setScalar(scale));
      H.setMatrixAt(i, m);
      H.setColorAt(i, colourFor(tr.n - 1));
      a.z -= R * 0.45;
      m.compose(a, q, k.s.set(scale * 1.2, scale * 1.2, scale));
      RH.setMatrixAt(i, m);

      // Tail: the rolled end with its swirl (Cinnamon Roll / Strawberry Glazed).
      at(tr.pts, off, a);
      if (shakeAxis === 0) a.x += shake;
      else a.y += shake;
      const tailScale = tr.n > 1 ? scale : 0;
      m.compose(a, q.identity(), k.s.setScalar(tailScale));
      T.setMatrixAt(i, m);
      T.setColorAt(i, colourFor(0));
      if (skin.swirl && tailScale > 0) {
        a.z += R * 1.08;
        m.compose(a, q.identity(), k.s.setScalar(tailScale));
        W.setMatrixAt(i, m);
        W.setColorAt(i, k.swirl);
      } else W.setMatrixAt(i, k.zero);
    });

    // The rim keeps the skin colour under the hint and flash, so the tinted body reads against it.
    for (const mesh of [RS, RJ, RH]) {
      for (let n = 0; n < mesh.count; n++) mesh.setColorAt(n, k.rim);
    }
    for (const mesh of [S, J, H, T, W, B, RS, RJ, RH]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  // Instance colours must exist before the first frame sets them.
  const initColours = (mesh: InstancedMesh | null) => {
    if (!mesh) return;
    for (let i = 0; i < mesh.count; i++) mesh.setColorAt(i, new Color('#E6AE71'));
  };

  return (
    // Upright like an easel menu board, tipped back a little toward the light.
    <group rotation-x={-0.12} position={[0, 0.05, 0]}>
      {/* The plaque's face sits just behind the rim, so the arrows stand proud of it. */}
      <mesh geometry={parts.board} material={parts.plaque} position-z={PLAQUE_FACE - 0.035} />
      <mesh material={GOLD} position-z={PLAQUE_FACE - 0.06}>
        <boxGeometry args={[BOARD + CELL * 2.2, BOARD + CELL * 2.2, 0.04]} />
      </mesh>
      <instancedMesh ref={(m) => { segs.current = m; initColours(m); }} args={[parts.seg, parts.pastry, segCount]} frustumCulled={false} />
      <instancedMesh ref={(m) => { joints.current = m; initColours(m); }} args={[parts.joint, parts.pastry, jointCount]} frustumCulled={false} />
      <instancedMesh ref={(m) => { heads.current = m; initColours(m); }} args={[parts.head, parts.pastry, tracks.length]} frustumCulled={false} />
      <instancedMesh ref={(m) => { tails.current = m; initColours(m); }} args={[parts.tail, parts.pastry, tracks.length]} frustumCulled={false} />
      <instancedMesh ref={(m) => { swirls.current = m; initColours(m); }} args={[parts.swirl, parts.gloss, tracks.length]} frustumCulled={false} />
      <instancedMesh ref={(m) => { ribbons.current = m; initColours(m); }} args={[parts.ribbon, parts.gloss, segCount]} frustumCulled={false} />
      <instancedMesh ref={(m) => { rimSegs.current = m; initColours(m); }} args={[parts.seg, parts.rimMat, segCount]} frustumCulled={false} />
      <instancedMesh ref={(m) => { rimJoints.current = m; initColours(m); }} args={[parts.joint, parts.rimMat, jointCount]} frustumCulled={false} />
      <instancedMesh ref={(m) => { rimHeads.current = m; initColours(m); }} args={[parts.head, parts.rimMat, tracks.length]} frustumCulled={false} />
    </group>
  );
}
