import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Frustum,
  Group,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Shape,
  Sphere,
  SphereGeometry,
  TorusGeometry,
  Vector2,
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
 * it. Once a loop an arrow is tapped while blocked: it lunges into its lane and
 * springs back, and the arrow in the way flashes the game's magenta (the "lose
 * a heart" moment; curves from arrows-game/src/ui/feedbackCurves.ts). When the
 * board is clear it pipes back in, in the next snack skin from the game's Arrow
 * Style book: Cinnamon Roll, Strawberry Glazed, Candy Corn (shipped values from
 * arrows-game/src/ui/skinSpecs.ts, after launchPolish).
 */

interface Skin {
  name: string;
  board: string;
  /** Body colour, or three bands tail -> head (Candy Corn's lengthBands). */
  body: string | [string, string, string];
  /** The skin's rim layer: a darker outline that separates each arrow from the board. */
  rim: string;
  ribbon: string | null;
  /** The tail's rolled face and its swirl (null: no tail knob). */
  swirl: string | null;
  /** Sprinkles along the body (Strawberry Glazed's spots). */
  sprinkles: string | null;
}

const SKINS: Skin[] = [
  { name: 'Cinnamon Roll', board: '#FFF7EA', body: '#E6AE71', rim: '#96603A', ribbon: '#FFF3DC', swirl: '#704127', sprinkles: null },
  { name: 'Strawberry Glazed', board: '#FFF7EA', body: '#E6AE71', rim: '#96603A', ribbon: '#FF9EBB', swirl: '#704127', sprinkles: '#6CC8F2' },
  { name: 'Candy Corn', board: '#F3EEFA', body: ['#FFD24A', '#FF8A2A', '#FFF8E8'], rim: '#8C7BB5', ribbon: null, swirl: null, sprinkles: null },
];
// The game's light-theme colours (the skins above are light boards).
const HINT = new Color('#6D4AEF'); // accent
const BLOCKED = new Color('#E4327D'); // heart
// The material is neutral so the hint and flash keep their hue; the skins get a
// little warmth on the CPU instead, which lands them near their own hex values
// under the studio light and Neutral tone mapping.
const WARM = new Color(1.1, 1, 0.77);

const { rows: ROWS, cols: COLS, arrows: ARROWS, order: ORDER } = ARROWS_LEVEL;
const BOARD = 2.1; // world units across the plaque's playing area
const CELL = BOARD / Math.max(ROWS, COLS);
const R = CELL * 0.2125; // body radius: the shipped body width .425 of a cell
const RIM = 0.48 / 0.425; // rim width .48 of a cell, relative to the body
const PLAQUE_FACE = -R * 1.9; // z of the plaque's front face, behind the rim layer (rim reaches -R * 1.58)

// Timeline, seconds.
const PIPE_IN = 1.6;
const HOLD = 0.7;
const GAP = 0.17;
const HINT_LEAD = 0.15; // < GAP, so only one arrow on the board is ever taking the hint
const SPEED = 24; // cells per second once it is flying
const ACCEL = 0.12; // seconds to reach full speed, like a flick
const OUTRO = 0.9;
const BLOCKED_AT = 9; // the tap lands half a gap after this fire-order step
const BUMP = 0.3; // BLOCKED_BUMP_MS
const FLASH = 0.65; // BLOCKER_FLASH_MS
const TAP = PIPE_IN + HOLD + BLOCKED_AT * GAP + GAP * 0.5;
const DELTA: Record<string, [number, number]> = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
const startOf = (step: number) => PIPE_IN + HOLD + step * GAP;

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
    const travel = toEdge + a.cells.length + 2;
    for (let k = 1; k <= travel; k++) pts.push([cx(hc + dc * k), cy(hr + dr * k)]);
    const start = startOf(fireStep.get(i) ?? 0);
    const t: Track = { pts, n: a.cells.length, start, hintAt: start - HINT_LEAD, travel, segBase, jointBase };
    segBase += a.cells.length - 1;
    jointBase += a.cells.length;
    return t;
  });
  const lastEnd = Math.max(...tracks.map((t) => t.start + ACCEL / 2 + t.travel / SPEED));
  return { tracks, segCount: segBase, jointCount: jointBase, loop: lastEnd + OUTRO };
}

/**
 * The blocked tap: an arrow still on the board at TAP whose lane runs into another
 * arrow still on the board (the first one in its lane is the blocker, like
 * BoardLogic.blockerOf). Neither may take the hint before its own feedback ends.
 */
function pickBlocked() {
  const remaining = new Set(ORDER.slice(BLOCKED_AT + 1)); // steps up to BLOCKED_AT have fired by TAP
  const owner = new Map<string, number>();
  ARROWS.forEach((a, i) => a.cells.forEach(([r, c]) => owner.set(`${r},${c}`, i)));
  for (let step = BLOCKED_AT + 1; step < ORDER.length; step++) {
    const tapped = ORDER[step];
    if (startOf(step) - HINT_LEAD < TAP + BUMP) continue;
    const a = ARROWS[tapped];
    const [dr, dc] = DELTA[a.dir];
    let [r, c] = a.cells[a.cells.length - 1];
    let blocker = -1;
    while (blocker < 0) {
      r += dr;
      c += dc;
      if (r < 0 || c < 0 || r >= ROWS || c >= COLS) break;
      const o = owner.get(`${r},${c}`);
      if (o !== undefined && o !== tapped && remaining.has(o)) blocker = o;
    }
    if (blocker >= 0 && startOf(ORDER.indexOf(blocker)) - HINT_LEAD >= TAP + FLASH) return { tapped, blocker };
  }
  return { tapped: -1, blocker: -1 };
}

/** Point at arc position u (in cells) along a unit-step polyline. */
function at(pts: [number, number][], u: number, out: Vector3) {
  const i = Math.max(0, Math.min(pts.length - 2, Math.floor(u)));
  const f = Math.min(1, Math.max(0, u - i));
  out.set(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f, 0);
  return out;
}

function headGeometry() {
  // The shipped 'rounded' head: half-width .44, tip .46 past centre, back .42 behind it, corners .10
  // (cell units). The outline is drawn .04 cell inside that, and the bevel brings it back out.
  const p = [new Vector2(0, 0.42), new Vector2(0.4, -0.38), new Vector2(-0.4, -0.38)].map((v) => v.multiplyScalar(CELL));
  const r = 0.1 * CELL;
  const s = new Shape();
  p.forEach((v, i) => {
    const from = v.clone().add(p[(i + 2) % 3].clone().sub(v).setLength(r));
    const to = v.clone().add(p[(i + 1) % 3].clone().sub(v).setLength(r));
    if (i === 0) s.moveTo(from.x, from.y);
    else s.lineTo(from.x, from.y);
    s.quadraticCurveTo(v.x, v.y, to.x, to.y);
  });
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth: R * 1.1, curveSegments: 4, bevelEnabled: true, bevelThickness: R * 0.45, bevelSize: 0.04 * CELL, bevelSegments: 2 });
  g.translate(0, 0, -R * 0.55);
  return g;
}

/** Instance colour: the base, eased toward the hint violet and the blocked magenta. */
function tint(out: Color, base: Color, hint: number, flash: number) {
  out.copy(base);
  if (hint > 0) out.lerp(HINT, hint * 0.85);
  if (flash > 0) out.lerp(BLOCKED, flash * 0.9);
  return out;
}

const SPRINKLE_TILT = [0.7, -0.5, 0.2].map((a) => new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), a));

export function ArrowsBoard() {
  const { tracks, segCount, jointCount, loop } = useMemo(() => buildTracks(), []);
  const pick = useMemo(() => pickBlocked(), []);

  const parts = useMemo(() => {
    // Material colour well below 1 tempers the bright, neutral studio light and
    // Neutral tone mapping's shoulder, so the instance colours land near their hex.
    const pastry = new MeshStandardMaterial({ color: new Color(0.3, 0.3, 0.3), roughness: 0.55, metalness: 0, envMapIntensity: 0.7 });
    const rimMat = new MeshStandardMaterial({ color: new Color(0.65, 0.65, 0.65), roughness: 0.7, metalness: 0, envMapIntensity: 0.5 });
    const gloss = new MeshStandardMaterial({ color: new Color(0.85, 0.85, 0.85), roughness: 0.3, metalness: 0, envMapIntensity: 0.9 });
    const plaque = new MeshStandardMaterial({ color: SKINS[0].board, roughness: 0.6, metalness: 0, envMapIntensity: 0.45 });
    // Segments end inside the joints, so they need no caps; joints only show their front half.
    const seg = new CylinderGeometry(R, R, 1, 12, 1, true);
    const joint = new SphereGeometry(R, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2);
    const head = headGeometry();
    const tail = new CylinderGeometry(0.265 * CELL, 0.265 * CELL, R * 2.1, 20).rotateX(Math.PI / 2);
    const swirl = new TorusGeometry(0.15 * CELL, 0.035 * CELL, 6, 20);
    const ribbon = new CylinderGeometry(R * 0.23, R * 0.23, 1, 6, 1);
    const sprinkle = new CylinderGeometry(0.03 * CELL, 0.03 * CELL, 0.14 * CELL, 5, 1);
    const board = new RoundedBoxGeometry(BOARD + CELL * 1.6, BOARD + CELL * 1.6, 0.07, 3, 0.05);
    return { pastry, rimMat, gloss, plaque, seg, joint, head, tail, swirl, ribbon, sprinkle, board };
  }, []);
  useEffect(
    () => () => {
      Object.values(parts).forEach((p) => p.dispose());
    },
    [parts],
  );

  const group = useRef<Group>(null);
  const segs = useRef<InstancedMesh>(null);
  const joints = useRef<InstancedMesh>(null);
  const heads = useRef<InstancedMesh>(null);
  const caps = useRef<InstancedMesh>(null);
  const tails = useRef<InstancedMesh>(null);
  const swirls = useRef<InstancedMesh>(null);
  const ribbons = useRef<InstancedMesh>(null);
  const sprinkles = useRef<InstancedMesh>(null);
  const rimSegs = useRef<InstancedMesh>(null);
  const rimJoints = useRef<InstancedMesh>(null);
  const rimHeads = useRef<InstancedMesh>(null);
  const st = useRef({ clock: 0, cycle: -1 });
  const k = useMemo(
    () => ({
      m: new Matrix4(),
      q: new Quaternion(),
      q2: new Quaternion(),
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
      sprinkle: new Color(),
      board: new Color(),
      frustum: new Frustum(),
      sphere: new Sphere(new Vector3(), BOARD * 1.2),
    }),
    [],
  );

  useFrame(({ camera }, delta) => {
    const s = sceneState;
    const g = group.current;
    if (s.gamesReveal < 0.001 || !g) return;
    // Off screen (the Games sky before the camera reaches this plate): skip the
    // ~600 instance updates and the draw.
    k.frustum.setFromProjectionMatrix(k.m.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    g.getWorldPosition(k.sphere.center);
    g.visible = k.frustum.intersectsSphere(k.sphere);
    if (!g.visible) return;

    const v = st.current;
    if (!s.reducedMotion) v.clock += Math.min(delta, 0.1);
    // Reduced motion: the full board in Cinnamon Roll, still.
    const time = s.reducedMotion ? PIPE_IN + HOLD * 0.5 : v.clock % loop;
    const cycle = s.reducedMotion ? 0 : Math.floor(v.clock / loop);
    const skin = SKINS[cycle % SKINS.length];

    const S = segs.current;
    const J = joints.current;
    const H = heads.current;
    const C = caps.current;
    const T = tails.current;
    const W = swirls.current;
    const B = ribbons.current;
    const P = sprinkles.current;
    const RS = rimSegs.current;
    const RJ = rimJoints.current;
    const RH = rimHeads.current;
    if (!S || !J || !H || !C || !T || !W || !B || !P || !RS || !RJ || !RH) return;
    const { m, q, q2, a, b, mid, dir, up, c } = k;

    if (cycle !== v.cycle) {
      // A new skin; the board is empty here (the outro), so nothing visible changes at once.
      const first = v.cycle < 0;
      v.cycle = cycle;
      k.board.set(skin.board).multiplyScalar(0.86);
      if (first) parts.plaque.color.copy(k.board);
      if (Array.isArray(skin.body)) skin.body.forEach((hex, n) => k.base[n].set(hex).multiply(WARM));
      else k.base.forEach((col) => col.set(skin.body as string).multiply(WARM));
      k.ribbon.set(skin.ribbon ?? '#FFFFFF');
      k.swirl.set(skin.swirl ?? '#FFFFFF');
      k.sprinkle.set(skin.sprinkles ?? '#FFFFFF');
      // The rim keeps the skin colour under the hint and flash, so the tinted body reads against it.
      c.set(skin.rim);
      for (const mesh of [RS, RJ, RH]) {
        for (let n = 0; n < mesh.count; n++) mesh.setColorAt(n, c);
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
      for (let n = 0; n < P.count; n++) P.setColorAt(n, k.sprinkle);
      if (P.instanceColor) P.instanceColor.needsUpdate = true;
      // Candy Corn's nested head caps: orange, then white innermost.
      for (let n = 0; n < tracks.length; n++) {
        C.setColorAt(n * 2, k.base[1]);
        C.setColorAt(n * 2 + 1, k.base[2]);
      }
    }
    parts.plaque.color.lerp(k.board, 1 - Math.exp(-delta * 4));
    const bands = Array.isArray(skin.body);
    const tailKnob = skin.swirl !== null;

    tracks.forEach((tr, i) => {
      // Pipe in: each arrow grows from nothing, staggered across the board.
      const grow = smoothstep(0, 0.45, time - (i / tracks.length) * (PIPE_IN - 0.45));
      // Fly out: accelerate from rest, then cruise, along the arrow's own path.
      const tt = Math.max(0, time - tr.start);
      const off = Math.min(tr.travel, tt < ACCEL ? (0.5 * SPEED * tt * tt) / ACCEL : 0.5 * SPEED * ACCEL + SPEED * (tt - ACCEL));
      const gone = off >= tr.travel - 0.01;
      // Fade the scale as the body leaves the plaque, so nothing pops at the edge.
      const leaving = 1 - smoothstep(tr.travel - tr.n - 1.5, tr.travel - 0.5, off);
      const scale = gone ? 0 : grow * leaving;

      // Violet hint just before it fires, easing back to the skin once it is flying.
      const hint = smoothstep(tr.hintAt, tr.hintAt + 0.06, time) * (1 - smoothstep(tr.start, tr.start + 0.15, time));
      // The blocked tap: the tapped arrow lunges along its exit axis and eases from
      // magenta back to its skin; the arrow in its way holds magenta, then fades.
      let bump = 0;
      let flash = 0;
      const e = time - TAP;
      if (i === pick.tapped && e > 0 && e < BUMP) {
        const kk = e / BUMP;
        bump = 0.5 * Math.sin(Math.PI * kk) * Math.exp(-2 * kk) * CELL;
        flash = 1 - kk;
      } else if (i === pick.blocker && e > 0 && e < FLASH) {
        flash = 1 - smoothstep(0.4, 1, e / FLASH);
      }
      const [dr, dc] = DELTA[ARROWS[i].dir];
      const bx = dc * bump;
      const by = -dr * bump;

      for (let j = 0; j < tr.n; j++) {
        const base = k.base[bands ? Math.min(2, Math.floor((j / tr.n) * 3)) : 0];
        at(tr.pts, j + off, a);
        a.x += bx;
        a.y += by;
        m.compose(a, q.identity(), k.s.setScalar(scale));
        J.setMatrixAt(tr.jointBase + j, m);
        J.setColorAt(tr.jointBase + j, tint(c, base, hint, flash));
        a.z -= R * 0.45;
        m.compose(a, q, k.s.setScalar(scale * RIM));
        RJ.setMatrixAt(tr.jointBase + j, m);
        if (j === tr.n - 1) continue;
        a.z += R * 0.45;
        at(tr.pts, j + 1 + off, b);
        b.x += bx;
        b.y += by;
        dir.subVectors(b, a);
        const len = dir.length();
        mid.addVectors(a, b).multiplyScalar(0.5);
        q.setFromUnitVectors(up, dir.normalize());
        const n = tr.segBase + j;
        m.compose(mid, q, k.s.set(scale, len, scale));
        S.setMatrixAt(n, m);
        S.setColorAt(n, c);
        mid.z -= R * 0.45;
        m.compose(mid, q, k.s.set(scale * RIM, len, scale * RIM));
        RS.setMatrixAt(n, m);
        mid.z += R * 0.45;
        // Highlight ribbon along the top of the body.
        if (skin.ribbon && scale > 0) {
          mid.z += R * 0.8;
          m.compose(mid, q, k.s.set(scale, len * 0.82, scale));
          B.setMatrixAt(n, m);
          B.setColorAt(n, tint(c, k.ribbon, hint * 0.6, flash * 0.6));
          mid.z -= R * 0.8;
        } else B.setMatrixAt(n, k.zero);
        // Sprinkles: three per cell, set a little to one side of the ribbon.
        for (let p = 0; p < 3; p++) {
          if (!skin.sprinkles || scale <= 0) {
            P.setMatrixAt(n * 3 + p, k.zero);
            continue;
          }
          at(tr.pts, j + off + (p + 0.5) / 3, b);
          b.x += bx - dir.y * 0.085 * CELL * (p === 1 ? -1 : 1);
          b.y += by + dir.x * 0.085 * CELL * (p === 1 ? -1 : 1);
          b.z = R * 0.85;
          m.compose(b, q2.copy(q).multiply(SPRINKLE_TILT[p]), k.s.setScalar(scale));
          P.setMatrixAt(n * 3 + p, m);
        }
      }

      // Head: at the last body point, pointing along the path's tangent there.
      at(tr.pts, tr.n - 1 + off, a);
      at(tr.pts, tr.n - 1 + off + 0.25, b);
      a.x += bx;
      a.y += by;
      b.x += bx;
      b.y += by;
      dir.subVectors(b, a);
      if (dir.lengthSq() < 1e-8) dir.set(dc, -dr, 0);
      q.setFromUnitVectors(up, dir.normalize());
      m.compose(a, q, k.s.setScalar(scale));
      H.setMatrixAt(i, m);
      // Candy Corn's head is the outer, yellow cap; the others match the body at the head.
      H.setColorAt(i, tint(c, k.base[0], hint, flash));
      for (let n = 0; n < 2; n++) {
        if (!bands || scale <= 0) {
          C.setMatrixAt(i * 2 + n, k.zero);
          continue;
        }
        // Nested caps .29 and .155 of a cell wide inside the .425 head, each a little prouder.
        const f = n === 0 ? 0.29 / 0.425 : 0.155 / 0.425;
        b.copy(a);
        b.z += R * (0.12 + n * 0.12);
        m.compose(b, q, k.s.set(scale * f, scale * f, scale));
        C.setMatrixAt(i * 2 + n, m);
      }
      a.z -= R * 0.45;
      m.compose(a, q, k.s.set(scale * 1.15, scale * 1.15, scale));
      RH.setMatrixAt(i, m);

      // Tail: the rolled end with its swirl (Cinnamon Roll / Strawberry Glazed).
      at(tr.pts, off, a);
      a.x += bx;
      a.y += by;
      const tailScale = tr.n > 1 && tailKnob ? scale : 0;
      m.compose(a, q.identity(), k.s.setScalar(tailScale));
      T.setMatrixAt(i, m);
      T.setColorAt(i, tint(c, k.base[0], hint, flash));
      if (tailScale > 0) {
        a.z += R * 1.08;
        m.compose(a, q, k.s.setScalar(tailScale));
        W.setMatrixAt(i, m);
        W.setColorAt(i, k.swirl);
      } else W.setMatrixAt(i, k.zero);
    });

    for (const mesh of [S, J, H, C, T, W, B, P, RS, RJ, RH]) mesh.instanceMatrix.needsUpdate = true;
    for (const mesh of [S, J, H, C, T, W, B]) if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  // Instance colours must exist before the first frame sets them; the next frame recolours everything.
  const initColours = (mesh: InstancedMesh | null) => {
    if (!mesh) return;
    for (let i = 0; i < mesh.count; i++) mesh.setColorAt(i, WHITE);
    st.current.cycle = -1;
  };

  return (
    // Upright like an easel menu board, tipped back a little toward the light,
    // standing clear of the serving plate.
    <group ref={group} rotation-x={-0.12} position={[0, 0.3, 0]}>
      {/* The plaque's face sits just behind the rim, so the arrows stand proud of it. */}
      <mesh geometry={parts.board} material={parts.plaque} position-z={PLAQUE_FACE - 0.035} />
      <mesh material={GOLD} position-z={PLAQUE_FACE - 0.06}>
        <boxGeometry args={[BOARD + CELL * 2.2, BOARD + CELL * 2.2, 0.04]} />
      </mesh>
      <instancedMesh ref={(m) => { segs.current = m; initColours(m); }} args={[parts.seg, parts.pastry, segCount]} frustumCulled={false} />
      <instancedMesh ref={(m) => { joints.current = m; initColours(m); }} args={[parts.joint, parts.pastry, jointCount]} frustumCulled={false} />
      <instancedMesh ref={(m) => { heads.current = m; initColours(m); }} args={[parts.head, parts.pastry, tracks.length]} frustumCulled={false} />
      <instancedMesh ref={(m) => { caps.current = m; initColours(m); }} args={[parts.head, parts.pastry, tracks.length * 2]} frustumCulled={false} />
      <instancedMesh ref={(m) => { tails.current = m; initColours(m); }} args={[parts.tail, parts.pastry, tracks.length]} frustumCulled={false} />
      <instancedMesh ref={(m) => { swirls.current = m; initColours(m); }} args={[parts.swirl, parts.gloss, tracks.length]} frustumCulled={false} />
      <instancedMesh ref={(m) => { ribbons.current = m; initColours(m); }} args={[parts.ribbon, parts.gloss, segCount]} frustumCulled={false} />
      <instancedMesh ref={(m) => { sprinkles.current = m; initColours(m); }} args={[parts.sprinkle, parts.gloss, segCount * 3]} frustumCulled={false} />
      <instancedMesh ref={(m) => { rimSegs.current = m; initColours(m); }} args={[parts.seg, parts.rimMat, segCount]} frustumCulled={false} />
      <instancedMesh ref={(m) => { rimJoints.current = m; initColours(m); }} args={[parts.joint, parts.rimMat, jointCount]} frustumCulled={false} />
      <instancedMesh ref={(m) => { rimHeads.current = m; initColours(m); }} args={[parts.head, parts.rimMat, tracks.length]} frustumCulled={false} />
    </group>
  );
}

const WHITE = new Color('#FFFFFF');
