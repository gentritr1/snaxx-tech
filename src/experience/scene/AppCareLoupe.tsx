/* Renderer-owned mutable objects (materials, uniforms) are mutated inside
   useFrame on purpose; they never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  SpotLight,
  TorusGeometry,
  Vector2,
  Vector3,
  type Material,
  type BufferGeometry,
} from 'three';
import { lerp, publishAppcare, sceneState, smoothstep, type FlawState } from '../sceneState';
import { GOLD, PORCELAIN } from './Core';

/*
 * AppCare's moment, ported from the Vitrine prototype the owner liked and set
 * in the confectionery world: a gold-rimmed loupe with a ring of warm
 * inspection lights travels over an example app on a porcelain stand. Inside
 * the lens the screen is optically magnified (true refraction, a little
 * barrel and colour fringe at the rim) and three hidden flaws glow. At each
 * flaw the loupe holds and pulls focus; the DOM list ticks Hidden -> Found.
 * Then the loupe slides off, the light floods the screen, the flaws are
 * mended one by one and nothing glows.
 *
 * The engine (path, dwell keys, refraction, mend timing) is the Vitrine
 * original; only materials, colours and the stage changed.
 */

/** Where the stand sits in the film: right of the software panels, outside
 *  the plate frame (which spans x -6.3..6.3 around z -14.9). */
export const APPCARE_STAGE = new Vector3(10, -0.15, -15.2);

// Screen texture layout, in canvas pixels (720 x 1480).
const TW = 720;
const TH = 1480;
// Where the loupe settles for each flaw: on the mark and its note together.
const FOCUS = [
  { cx: 360, cy: 904 }, // the bookings list
  { cx: 252, cy: 1086 }, // the payments key
  { cx: 548, cy: 1262 }, // the "Everyone" access chip
];
const SCREEN_W = 0.94;
const SCREEN_H = 1.94;
const LENS_R = 0.3;
const SANS = '"Geist", Arial, sans-serif';

const smooth = smoothstep;
const mix = lerp;
const damp = (current: number, target: number, lambda: number, dt: number) => current + (target - current) * (1 - Math.exp(-lambda * dt));

/** Piecewise easing through (x, y) keys; each segment eased with smoothstep. */
function keyed(keys: [number, number][], x: number) {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [x1, y1] = keys[i];
    const [x0, y0] = keys[i - 1];
    if (x <= x1) return mix(y0, y1, smooth(x0, x1, x));
  }
  return keys[keys.length - 1][1];
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

/** The example app (a client's booking app, dark mode, warmed to sit in the scene). */
function drawApp(g: CanvasRenderingContext2D) {
  g.fillStyle = '#17110D';
  g.fillRect(0, 0, TW, TH);
  g.fillStyle = '#F1E7DA';
  g.font = `650 48px ${SANS}`;
  g.fillText('Harbour Bookings', 48, 132);
  g.fillStyle = '#9A8C7C';
  g.font = `500 26px ${SANS}`;
  g.fillText('Tuesday, 14 October', 48, 176);

  let x = 48;
  ['Today', 'Week', 'Clients'].forEach((c, i) => {
    g.font = `600 24px ${SANS}`;
    const w = g.measureText(c).width + 44;
    if (i === 0) {
      g.fillStyle = '#33271F';
      roundRect(g, x, 212, w, 50, 25);
      g.fill();
    }
    g.fillStyle = i === 0 ? '#F1E7DA' : '#9A8C7C';
    g.fillText(c, x + 22, 246);
    x += w + 10;
  });

  g.fillStyle = '#9A8C7C';
  g.font = `600 22px ${SANS}`;
  g.fillText('Bookings', 48, 316);
  const rows = [
    ['SC', 'Sunset cruise', '2 guests, +44 ••• ••• 218', '09:00'],
    ['KH', 'Kayak hire', '1 guest, +44 ••• ••• 904', '10:30'],
    ['HT', 'Harbour tour', '4 guests, +44 ••• ••• 377', '12:15'],
    ['SC', 'Sunset cruise', '3 guests, +44 ••• ••• 051', '14:00'],
    ['FT', 'Fishing trip', '2 guests, +44 ••• ••• 662', '16:45'],
  ];
  rows.forEach(([ini, title, sub, time], i) => {
    const y = 338 + i * 106;
    g.fillStyle = '#231A14';
    roundRect(g, 32, y, TW - 64, 92, 18);
    g.fill();
    g.fillStyle = '#3A2D24';
    g.beginPath();
    g.arc(88, y + 46, 26, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#E2D6C8';
    g.font = `600 20px ${SANS}`;
    g.textAlign = 'center';
    g.fillText(ini, 88, y + 53);
    g.textAlign = 'left';
    g.fillStyle = '#F1E7DA';
    g.font = `600 27px ${SANS}`;
    g.fillText(title, 132, y + 40);
    g.fillStyle = '#8E8070';
    g.font = `500 21px ${SANS}`;
    g.fillText(sub, 132, y + 72);
    g.fillStyle = '#F1E7DA';
    g.font = `600 25px ${SANS}`;
    g.textAlign = 'right';
    g.fillText(time, TW - 56, y + 54);
    g.textAlign = 'left';
  });

  g.fillStyle = '#9A8C7C';
  g.font = `600 22px ${SANS}`;
  g.fillText('Settings', 48, 930);
  g.fillStyle = '#231A14';
  roundRect(g, 32, 952, TW - 64, 120, 18);
  g.fill();
  g.fillStyle = '#F1E7DA';
  g.font = `600 26px ${SANS}`;
  g.fillText('Payments key', 60, 1000);
  g.fillStyle = '#8E8070';
  g.font = `500 24px ${SANS}`;
  g.fillText('sk_live_••••••••••••3f9a', 60, 1044);

  g.fillStyle = '#231A14';
  roundRect(g, 32, 1132, TW - 64, 110, 18);
  g.fill();
  g.fillStyle = '#F1E7DA';
  g.font = `600 26px ${SANS}`;
  g.fillText('Who can view bookings', 60, 1196);
  g.fillStyle = '#33271F';
  roundRect(g, 492, 1164, 140, 48, 24);
  g.fill();
  g.fillStyle = '#E2D6C8';
  g.font = `600 22px ${SANS}`;
  g.textAlign = 'center';
  g.fillText('Everyone', 562, 1196);
  g.textAlign = 'left';

  g.fillStyle = '#1D1611';
  g.fillRect(0, 1360, TW, 120);
  [0, 1, 2, 3].forEach((i) => {
    g.strokeStyle = i === 0 ? '#F1E7DA' : '#75685B';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(120 + i * 160, 1410, 16, 0, Math.PI * 2);
    g.stroke();
  });
}

/**
 * Invisible ink: each flaw drawn into its own colour channel (red, green,
 * blue), core plus a soft halo, so the shader can mend them one by one.
 */
function drawInk(g: CanvasRenderingContext2D) {
  g.fillStyle = '#000';
  g.fillRect(0, 0, TW, TH);
  g.globalCompositeOperation = 'lighter';
  const chan = ['255,0,0', '0,255,0', '0,0,255'];
  const pass = (i: number, draw: () => void) => {
    for (const [blur, alpha, width] of [
      [26, 0.55, 14],
      [8, 0.8, 7],
      [0, 1, 4],
    ] as const) {
      g.shadowBlur = blur;
      g.shadowColor = `rgba(${chan[i]},${alpha})`;
      g.strokeStyle = `rgba(${chan[i]},${alpha})`;
      g.fillStyle = `rgba(${chan[i]},${alpha})`;
      g.lineWidth = width;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      draw();
    }
  };
  // Two short lines per note, so each fits inside the loupe.
  g.font = `750 30px ${SANS}`;
  g.textAlign = 'center';
  pass(0, () => {
    roundRect(g, 22, 326, TW - 44, 552, 26);
    g.stroke();
    g.fillText('ANYONE CAN', 360, 918);
    g.fillText('READ THIS', 360, 952);
  });
  pass(1, () => {
    g.beginPath();
    g.ellipse(250, 1036, 230, 40, -0.02, 0, Math.PI * 2);
    g.stroke();
    g.fillText('SECRET KEY', 250, 1106);
    g.fillText('IN THE PAGE', 250, 1140);
  });
  pass(2, () => {
    g.beginPath();
    g.arc(562, 1188, 92, -0.2, Math.PI * 1.85);
    g.stroke();
    g.fillText('OPEN TO', 548, 1316);
    g.fillText('EVERYONE', 548, 1348);
  });
  g.textAlign = 'left';
  g.shadowBlur = 0;
  g.globalCompositeOperation = 'source-over';
}

function canvasTexture(draw: (g: CanvasRenderingContext2D) => void, srgb: boolean) {
  const c = document.createElement('canvas');
  c.width = TW;
  c.height = TH;
  const g = c.getContext('2d')!;
  draw(g);
  const t = new CanvasTexture(c);
  if (srgb) t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  // Redraw once Geist is in, so the app never keeps fallback glyphs.
  document.fonts?.ready.then(() => {
    g.clearRect(0, 0, TW, TH);
    draw(g);
    t.needsUpdate = true;
  });
  return t;
}

/** A phone glazed in dark chocolate, with a gold edge button. */
function phoneBody(geometries: BufferGeometry[], materials: Material[]) {
  const w = 1.0;
  const h = 2.06;
  const r = 0.15;
  const s = new Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const depth = 0.07;
  const bevel = 0.014;
  const geo = new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 10 });
  geo.translate(0, 0, -depth / 2);
  // Standard, not clearcoat: clearcoat blacks out silhouette pixels on thin bevels.
  const shell = new MeshStandardMaterial({ color: '#2E1A10', roughness: 0.26, metalness: 0.1, envMapIntensity: 1.2 });
  geometries.push(geo);
  materials.push(shell);
  const g = new Group();
  g.add(new Mesh(geo, shell));
  for (const [y, len] of [
    [0.52, 0.26],
    [0.2, 0.16],
  ]) {
    const bg = new BoxGeometry(0.02, len, 0.04);
    geometries.push(bg);
    const b = new Mesh(bg, GOLD);
    b.position.set(w / 2 + 0.012, y, 0);
    g.add(b);
  }
  g.userData.front = depth / 2 + bevel + 0.0015;
  return g;
}

// Shared GLSL: the rounded screen mask and the glowing ink colour (caramel, not UV violet).
const SCREEN_GLSL = /* glsl */ `
  uniform sampler2D uUI; uniform sampler2D uInk; uniform vec3 uMend; uniform float uAspect;
  float roundedMask(vec2 uv){
    vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
    vec2 b = vec2(uAspect, 1.0) * 0.5 - 0.062;
    float d = length(max(abs(p) - b, 0.0)) - 0.062;
    return 1.0 - smoothstep(-0.002, 0.002, d);
  }
  vec3 inkColour(vec2 uv, out float glow){
    vec3 ink = texture2D(uInk, uv).rgb;
    glow = dot(ink, vec3(1.0) - uMend);
    return mix(vec3(1.0, 0.56, 0.16), vec3(1.0, 0.9, 0.7), smoothstep(0.7, 1.0, glow));
  }
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;

interface Built {
  root: Group;
  device: Group;
  screen: Mesh;
  loupe: Group;
  screenMat: ShaderMaterial;
  lensMat: ShaderMaterial;
  ledMat: MeshBasicMaterial;
  spill: SpotLight;
  shared: { uMend: { value: Vector3 } };
  path: CatmullRomCurve3;
  focusT: number[];
  dispose: () => void;
}

function build(): Built {
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const keep = <G extends BufferGeometry>(g: G) => (geometries.push(g), g);
  const own = <M extends Material>(m: M) => (materials.push(m), m);

  const root = new Group();
  root.position.copy(APPCARE_STAGE);

  // Porcelain cake stand instead of the museum plinth.
  const plate = new Mesh(keep(new CylinderGeometry(1.05, 1.0, 0.06, 64)), PORCELAIN);
  plate.position.y = -1.18;
  const stem = new Mesh(keep(new CylinderGeometry(0.12, 0.16, 0.5, 32)), PORCELAIN);
  stem.position.y = -1.46;
  const foot = new Mesh(keep(new CylinderGeometry(0.55, 0.62, 0.06, 64)), PORCELAIN);
  foot.position.y = -1.72;
  const ledge = new Mesh(keep(new BoxGeometry(0.9, 0.05, 0.16)), GOLD);
  ledge.position.set(0, -1.1, 0.12);
  root.add(plate, stem, foot, ledge);

  const device = new Group();
  device.position.set(0, -0.06, 0);
  device.rotation.set(-0.12, -0.2, 0);
  root.add(device);
  const body = phoneBody(geometries, materials);
  device.add(body);
  const support = new Mesh(keep(new BoxGeometry(0.05, 1.1, 0.05)), GOLD);
  support.position.set(0, -0.62, -0.32);
  support.rotation.x = 0.5;
  root.add(support);

  const uiTex = canvasTexture(drawApp, true);
  const inkTex = canvasTexture(drawInk, false);
  const shared = { uUI: { value: uiTex }, uInk: { value: inkTex }, uMend: { value: new Vector3() }, uAspect: { value: SCREEN_W / SCREEN_H } };

  // The screen: dim, with the loupe's ring light pooling on it.
  const screenMat = own(
    new ShaderMaterial({
      transparent: true,
      uniforms: { ...shared, uC: { value: new Vector3(99, 99, 99) }, uPool: { value: 0.34 }, uOn: { value: 0 }, uWash: { value: 0 } },
      vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: /* glsl */ `${SCREEN_GLSL}
        uniform vec3 uC; uniform float uPool; uniform float uOn; uniform float uWash;
        varying vec2 vUv; varying vec3 vW;
        void main(){
          float m = roundedMask(vUv);
          if (m < 0.01) discard;
          vec3 ui = texture2D(uUI, vUv).rgb;
          float d = distance(vW, uC) / uPool;
          // a soft pool with a brighter rim, the way a ring light lands
          float pool = (smoothstep(1.0, 0.55, d) * 0.75 + smoothstep(0.18, 0.0, abs(d - 0.92)) * 0.35) * uOn;
          float lit = max(pool, uWash);
          vec3 col = ui * 0.45;
          col += ui * vec3(1.0, 0.78, 0.5) * lit * 0.5 + vec3(0.9, 0.5, 0.14) * lit * 0.1;
          float glow; vec3 ink = inkColour(vUv, glow);
          col += ink * glow * lit * 1.1;
          col += vec3(1.0, 0.78, 0.45) * step(0.9965, hash(floor(vUv * vec2(160.0, 330.0)))) * lit * 0.4;
          col += smoothstep(0.35, 0.0, abs(vUv.x * 0.8 - vUv.y + 0.55)) * 0.03;
          gl_FragColor = vec4(col, m);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
  const screen = new Mesh(keep(new PlaneGeometry(SCREEN_W, SCREEN_H)), screenMat);
  screen.position.z = body.userData.front as number;
  device.add(screen);
  // Cover glass: a faint reflection only. The original's 2.2x env intensity
  // suited a dark room; in the cream world it washed the screen out.
  const cover = new Mesh(
    keep(new PlaneGeometry(SCREEN_W + 0.03, SCREEN_H + 0.03)),
    own(new MeshPhysicalMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.04, roughness: 0.22, metalness: 0, envMapIntensity: 0.25, depthWrite: false })),
  );
  cover.position.z = screen.position.z + 0.002;
  cover.renderOrder = 2;
  device.add(cover);

  // The loupe: a lens that refracts the screen beneath it.
  const loupe = new Group();
  root.add(loupe);
  const lensMat = own(
    new ShaderMaterial({
      uniforms: {
        ...shared,
        uS0: { value: new Vector3() },
        uN: { value: new Vector3() },
        uC: { value: new Vector3() },
        uMag: { value: 1.5 },
        uScreenInv: { value: new Matrix4() },
        uR: { value: LENS_R },
        uOn: { value: 0 },
        uSize: { value: new Vector2(SCREEN_W, SCREEN_H) },
      },
      vertexShader: 'varying vec3 vW; varying vec2 vL; void main(){ vL = position.xy; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: /* glsl */ `${SCREEN_GLSL}
        uniform vec3 uS0; uniform vec3 uN; uniform vec3 uC; uniform float uMag; uniform mat4 uScreenInv; uniform float uR; uniform float uOn; uniform vec2 uSize;
        varying vec3 vW; varying vec2 vL;
        vec2 screenUv(vec3 p){ return (uScreenInv * vec4(p, 1.0)).xy / uSize + 0.5; }
        void main(){
          float r = length(vL) / uR;
          if (r > 1.0) discard;
          vec3 dir = normalize(vW - cameraPosition);
          float t = dot(uS0 - cameraPosition, uN) / dot(dir, uN);
          vec3 P = cameraPosition + dir * t;
          vec3 d = P - uC;
          float barrel = 1.0 + 0.16 * r * r;
          float fringe = 0.018 * r * r;
          vec2 uvG = screenUv(uC + d * barrel / uMag);
          vec2 uvR = screenUv(uC + d * barrel / (uMag * (1.0 + fringe)));
          vec2 uvB = screenUv(uC + d * barrel / (uMag * (1.0 - fringe)));
          float m = roundedMask(uvG) * step(0.0, uvG.x) * step(uvG.x, 1.0) * step(0.0, uvG.y) * step(uvG.y, 1.0);
          vec3 ui = vec3(texture2D(uUI, uvR).r, texture2D(uUI, uvG).g, texture2D(uUI, uvB).b);
          vec3 col = mix(vec3(0.09, 0.06, 0.04), ui * 0.6 + ui * vec3(1.0, 0.78, 0.5) * 0.55 * uOn + vec3(0.9, 0.5, 0.14) * 0.08 * uOn, m);
          float glow; vec3 ink = inkColour(uvG, glow);
          col += ink * glow * 1.05 * uOn * m;
          col += vec3(1.0, 0.78, 0.45) * step(0.996, hash(floor(uvG * vec2(160.0, 330.0)))) * 0.45 * uOn * m;
          // glass: darker toward the rim, a crescent highlight, a thin bright edge
          col *= mix(1.0, 0.55, smoothstep(0.78, 1.0, r));
          float crescent = smoothstep(0.55, 0.95, r) * smoothstep(0.2, 0.9, dot(normalize(vL + 1e-4), vec2(-0.62, 0.78)));
          col += vec3(1.0, 0.97, 0.9) * crescent * 0.09;
          col += vec3(1.0) * smoothstep(0.96, 0.995, r) * 0.07;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
  );
  const lens = new Mesh(keep(new CircleGeometry(LENS_R, 96)), lensMat);
  lens.renderOrder = 3;
  loupe.add(lens);
  const lensGlass = new Mesh(
    keep(new CircleGeometry(LENS_R, 96)),
    own(new MeshPhysicalMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.14, roughness: 0, metalness: 0, envMapIntensity: 2.6, depthWrite: false })),
  );
  lensGlass.position.z = 0.004;
  lensGlass.renderOrder = 4;
  loupe.add(lensGlass);
  // Gold foil rim and arm, chocolate collar: the loupe belongs to this kitchen.
  const rim = new Mesh(keep(new TorusGeometry(LENS_R + 0.016, 0.022, 16, 128)), GOLD);
  loupe.add(rim);
  const collar = new Mesh(
    keep(new CylinderGeometry(LENS_R + 0.03, LENS_R + 0.03, 0.05, 96, 1, true)),
    own(new MeshStandardMaterial({ color: '#3D2416', roughness: 0.4, metalness: 0.2, side: DoubleSide })),
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.z = -0.03;
  loupe.add(collar);
  const ledMat = own(new MeshBasicMaterial({ color: new Color('#FFB45C') }));
  const ledGeo = keep(new SphereGeometry(0.009, 10, 8));
  const LEDS = 18;
  for (let i = 0; i < LEDS; i++) {
    const a = (i / LEDS) * Math.PI * 2;
    const led = new Mesh(ledGeo, ledMat);
    led.position.set(Math.cos(a) * (LENS_R + 0.012), Math.sin(a) * (LENS_R + 0.012), -0.058);
    loupe.add(led);
  }
  const arm = new Group();
  loupe.add(arm);
  const armBar = new Mesh(keep(new CylinderGeometry(0.018, 0.018, 1.4, 16)), GOLD);
  armBar.position.set(0, 0.7, 0);
  arm.add(armBar);
  const knuckle = new Mesh(keep(new SphereGeometry(0.034, 20, 14)), GOLD);
  arm.add(knuckle);
  arm.position.set(LENS_R * 0.72, LENS_R * 0.72, -0.01);
  arm.rotation.set(0.35, 0, -0.72);

  const spill = new SpotLight('#FFB45C', 0, 0, 0.5, 0.8, 0);
  root.add(spill, spill.target);

  // The loupe's path in screen space; it passes each flaw in order.
  const sl = (x: number, y: number) => new Vector3(x, y, 0);
  const toLocal = (f: { cx: number; cy: number }) => sl((f.cx / TW - 0.5) * SCREEN_W, (0.5 - f.cy / TH) * SCREEN_H);
  const focus = FOCUS.map(toLocal);
  const path = new CatmullRomCurve3([sl(-0.75, 1.3), sl(-0.1, 0.7), focus[0], sl(-0.18, -0.08), focus[1], focus[2], sl(0.85, -1.35)], false, 'centripetal');
  const focusT = focus.map((f) => {
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i <= 600; i++) {
      const d = path.getPoint(i / 600).distanceTo(f);
      if (d < bd) {
        bd = d;
        best = i / 600;
      }
    }
    return best;
  });

  return {
    root,
    device,
    screen,
    loupe,
    screenMat,
    lensMat,
    ledMat,
    spill,
    shared,
    path,
    focusT,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      uiTex.dispose();
      inkTex.dispose();
    },
  };
}

// Scroll -> path position. Each flaw gets a dwell (the loupe holds still).
const DWELL: [number, number][] = [
  [0.19, 0.27],
  [0.36, 0.44],
  [0.52, 0.6],
];
const CENTRE = new Vector3(0.02, -0.08, 0);

export function AppCareLoupe() {
  const b = useMemo(() => build(), []);
  useEffect(() => b.dispose, [b]);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  const sweepKeys = useMemo<[number, number][]>(
    () => [
      [0.06, 0],
      [DWELL[0][0], b.focusT[0]],
      [DWELL[0][1], b.focusT[0] + 0.004],
      [DWELL[1][0], b.focusT[1]],
      [DWELL[1][1], b.focusT[1] + 0.004],
      [DWELL[2][0], b.focusT[2]],
      [DWELL[2][1], b.focusT[2] + 0.004],
      [0.66, 0.93],
    ],
    [b],
  );
  const st = useRef({ p: 0, lastKey: '', seen: false, flickerStart: -1 });
  const scratch = useMemo(
    () => ({ local: new Vector3(), C: new Vector3(), N: new Vector3(), up: new Vector3(), right: new Vector3(), S0: new Vector3(), mend: new Vector3(), probe: new Vector3() }),
    [],
  );

  useFrame(({ clock }, delta) => {
    const s = sceneState;
    const dt = Math.min(delta, 0.1);
    const time = clock.elapsedTime;
    const reduce = s.reducedMotion;
    const v = st.current;
    // Toggle the meshes, never the spotlight: three only counts lights in
    // visible groups, so hiding it would change the light count and recompile
    // every lit material in the scene the moment the stand reappears.
    const show = s.appcareVis > 0.001;
    for (const child of b.root.children) if (child !== b.spill && child !== b.spill.target) child.visible = show;
    if (!show) {
      b.spill.intensity = 0;
      return;
    }
    v.p = reduce ? s.appcare : damp(v.p, s.appcare, 8, dt);
    const p = v.p;

    // Ring lights power on with a short stutter, once.
    let on = smooth(0.02, 0.06, p);
    if (!v.seen && on > 0.3) {
      v.seen = true;
      if (!reduce) v.flickerStart = time;
    }
    if (v.flickerStart >= 0) {
      const ft = time - v.flickerStart;
      if (ft < 0.3) on *= ft < 0.05 ? 0.5 : ft < 0.09 ? 0.1 : ft < 0.16 ? 0.8 : ft < 0.2 ? 0.3 : 1;
      else v.flickerStart = -1;
    }

    const { local, C, N, up, right, S0, mend, probe } = scratch;

    // Portrait phones: fit the stand (phone top to stand foot) between the nav
    // and the top of the copy, measured from the DOM. A fixed scale clipped the
    // copy on short phones and let the stand cover the status line.
    const portrait = size.width < size.height;
    if (portrait && s.appcareCopyTop > 0) {
      const top = 68 + 14;
      const bottom = s.appcareCopyTop - 10;
      const screenY = (y: number) => {
        probe.set(0, y, 0);
        b.root.localToWorld(probe).project(camera);
        return ((1 - probe.y) / 2) * size.height;
      };
      for (let i = 0; i < 2; i++) {
        b.root.updateMatrixWorld();
        const yTop = screenY(1.0);
        const yBottom = screenY(-1.75);
        const k = (bottom - top) / Math.max(1, yBottom - yTop);
        b.root.scale.setScalar(Math.min(0.9, Math.max(0.3, b.root.scale.x * Math.min(1.25, Math.max(0.8, k)))));
        b.root.updateMatrixWorld();
        const mid = (screenY(1.0) + screenY(-1.75)) / 2;
        const dist = camera.position.distanceTo(b.root.position);
        const worldPerPx = (2 * dist * Math.tan(((camera as unknown as { fov: number }).fov * Math.PI) / 360)) / size.height;
        b.root.position.y += (mid - (top + bottom) / 2) * worldPerPx;
      }
    } else if (b.root.scale.x !== 1 || b.root.position.y !== APPCARE_STAGE.y) {
      b.root.scale.setScalar(1);
      b.root.position.copy(APPCARE_STAGE);
    }
    const sc = b.root.scale.x;
    const sweep = keyed(sweepKeys, p);
    const lift = smooth(0.64, 0.74, p);
    b.path.getPoint(Math.min(sweep, 0.999), local);
    local.lerp(CENTRE, smooth(0.62, 0.7, p));
    mend.set(smooth(0.72, 0.76, p), smooth(0.77, 0.81, p), smooth(0.82, 0.86, p));
    // Focus pull: magnification rises while the loupe holds on a flaw.
    let hold = 0;
    for (const [a, z] of DWELL) hold = Math.max(hold, smooth(a - 0.02, a + 0.02, p) * (1 - smooth(z - 0.01, z + 0.03, p)));
    const mag = mix(1.35, 1.7, hold);

    b.root.updateMatrixWorld();
    C.copy(local).applyMatrix4(b.screen.matrixWorld);
    S0.setFromMatrixPosition(b.screen.matrixWorld);
    N.set(0, 0, 1).transformDirection(b.screen.matrixWorld);
    up.set(0, 1, 0).transformDirection(b.screen.matrixWorld);
    right.set(1, 0, 0).transformDirection(b.screen.matrixWorld);

    // The loupe hovers over the screen, then slides off sideways along the
    // screen plane, the way a hand slides a loupe off a print.
    const hover = mix(0.2, 0.45, lift) * sc;
    const world = b.loupe.parent!;
    const pos = C.clone().addScaledVector(N, hover).addScaledVector(up, lift * 0.7 * sc).addScaledVector(right, lift * 2.4 * sc);
    b.loupe.position.copy(world.worldToLocal(pos));
    b.loupe.quaternion.copy(b.device.quaternion);
    b.loupe.visible = lift < 0.999;
    const tilt = reduce ? 0 : Math.sin(time * 0.8) * 0.01 * (1 - hold);
    b.loupe.rotateX(tilt);
    b.loupe.rotateY(tilt * 0.6);

    const lu = b.lensMat.uniforms;
    lu.uS0.value.copy(S0);
    lu.uN.value.copy(N);
    lu.uC.value.copy(C);
    lu.uMag.value = mag;
    lu.uScreenInv.value.copy(b.screen.matrixWorld).invert();
    lu.uOn.value = on;
    b.shared.uMend.value.copy(mend);

    const su = b.screenMat.uniforms;
    su.uC.value.copy(C);
    su.uPool.value = mix(0.36, 0.5, hold * 0.3);
    su.uOn.value = on * (1 - lift);
    su.uWash.value = smooth(0.68, 0.76, p) * 0.9;
    // The lights run hot (luminance above the 1.32 bloom threshold) so they read as light, not paint.
    b.ledMat.color.setRGB(mix(0.3, 2.6, on), mix(0.2, 1.7, on), mix(0.1, 0.6, on));

    b.spill.position.copy(world.worldToLocal(pos.clone().addScaledVector(N, 0.3)));
    b.spill.target.position.copy(world.worldToLocal(C.clone()));
    b.spill.intensity = (1.6 * on * (1 - lift) + 1.2 * smooth(0.68, 0.76, p)) * Math.min(1, s.appcareVis);

    const states: FlawState[] = b.focusT.map((t, i) => (mend.getComponent(i) > 0.5 ? 'mended' : sweep >= t - 0.006 ? 'found' : 'hidden'));
    const allClear = p > 0.88;
    const k = states.join() + allClear;
    if (k !== v.lastKey) {
      v.lastKey = k;
      publishAppcare(states, allClear);
    }
  });

  return <primitive object={b.root} />;
}
