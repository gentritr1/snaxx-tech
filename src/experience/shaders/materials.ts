import { Color, DoubleSide, LinearSRGBColorSpace, NormalBlending, ShaderMaterial, Texture, Vector3 } from 'three';
import { simplex3 } from './noise.glsl';

/**
 * Scene background and fog, in linear light. The composer applies Khronos
 * Neutral tone mapping; these are its inverse of the brand cream #F7F0E4 and
 * of the games-world #F4E4CF, so the rendered background matches the page
 * (measured 246,240,228 top-centre). They sit above 1.0, which is why
 * Bloom's threshold is 1.6 (Effects.tsx).
 */
export const SCENE_BG = new Color().setRGB(1.3842, 1.294, 1.1473, LinearSRGBColorSpace);
export const SCENE_BG_WORLD = new Color().setRGB(1.1642, 0.9988, 0.8039, LinearSRGBColorSpace);

const EMBER = new Color('#F2B35B');
const EMBER_DEEP = new Color('#8A4A12');
const SILVER = new Color('#C9A27A');
const BLUE = new Color('#E08E6B');
const CHOCOLATE = new Color('#4A2614');

/** The molten caramel centre inside the glass shell: slow swirl with a fresnel rim. */
export function createPlasmaMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uColorA: { value: EMBER_DEEP.clone() },
      uColorB: { value: EMBER.clone() },
    },
    vertexShader: /* glsl */ `
      ${simplex3}
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vNoise;
      void main() {
        float n = snoise(position * 2.2 + uTime * 0.25);
        vNoise = n;
        vec3 displaced = position + normal * n * 0.07;
        vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      ${simplex3}
      uniform float uTime;
      uniform float uEnergy;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec3 vNormal;
      varying vec3 vView;
      varying float vNoise;
      void main() {
        // Clamp both ends: interpolated normals can make the dot product a hair
        // above 1, and pow() of a negative base is NaN, which Bloom smears into
        // a black square.
        float fres = pow(clamp(1.0 - dot(vNormal, vView), 0.0, 1.0), 2.2);
        float veins = fbm(vec3(vNormal * 3.5 + uTime * 0.15));
        float v = smoothstep(0.1, 0.6, veins + vNoise * 0.4);
        vec3 col = mix(uColorA, uColorB, v);
        float glow = (0.35 + v * 0.9 + fres * 1.6) * (0.2 + uEnergy * 2.6);
        gl_FragColor = vec4(col * glow, 1.0);
      }
    `,
  });
}

/** Flowing energy along the merged filament tubes (uv.x runs along each tube). */
export function createFilamentMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uEnergy: { value: 0 },
      uColor: { value: EMBER.clone() },
      uWhite: { value: new Color('#FFF4E0') },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      varying vec2 vUv;
      varying float vSeed;
      void main() {
        vUv = uv;
        vSeed = aSeed;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uEnergy;
      uniform vec3 uColor;
      uniform vec3 uWhite;
      varying vec2 vUv;
      varying float vSeed;
      void main() {
        float flow = fract(vUv.x * 2.0 - uTime * (0.35 + vSeed * 0.4) - vSeed);
        float pulse = smoothstep(0.72, 1.0, flow);
        float base = 0.08 + pulse * 1.0;
        vec3 col = mix(uColor * 0.55, uWhite, pulse * 0.8) * (0.6 + base * (0.3 + uEnergy * 1.6));
        float ends = smoothstep(0.0, 0.08, vUv.x) * (1.0 - smoothstep(0.92, 1.0, vUv.x));
        gl_FragColor = vec4(col, (0.55 + pulse * 0.45) * ends * min(uEnergy, 1.0));
      }
    `,
  });
}

/** GPU sugar-dust field: drift, fly-through streaming, portal pull and calm. */
export function createParticleMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uFlow: { value: 0 },
      uWorld: { value: 0 },
      uEnergy: { value: 0 },
      uPixelRatio: { value: 1 },
      uSilver: { value: SILVER.clone() },
      uEmber: { value: EMBER.clone() },
      uBlue: { value: BLUE.clone() },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aSeed;
      attribute float aSize;
      uniform float uTime;
      uniform float uFlow;
      uniform float uPixelRatio;
      varying float vTint;
      varying float vFade;
      void main() {
        vec3 p = position;
        float t = uTime;
        p += vec3(
          sin(t * 0.21 + aSeed.x * 6.2831) * 0.35,
          cos(t * 0.17 + aSeed.y * 6.2831) * 0.28,
          sin(t * 0.13 + aSeed.z * 6.2831) * 0.35
        );
        // Streaming past the camera during the fly-through.
        float stream = fract(aSeed.y + t * 0.09) * 44.0 - 22.0;
        p.z = mix(p.z, stream, uFlow);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float dist = -mv.z;
        vFade = smoothstep(0.6, 3.0, dist) * (1.0 - smoothstep(18.0, 30.0, dist));
        vTint = aSeed.z;
        gl_PointSize = aSize * uPixelRatio * (16.0 / max(dist, 0.5));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSilver;
      uniform vec3 uEmber;
      uniform vec3 uBlue;
      uniform float uWorld;
      uniform float uEnergy;
      varying float vTint;
      varying float vFade;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float disc = 1.0 - smoothstep(0.08, 0.5, d);
        vec3 accent = mix(uEmber, uBlue, uWorld);
        vec3 col = mix(uSilver, accent, step(0.72, vTint));
        float a = disc * vFade * (0.3 + 0.35 * min(uEnergy, 1.0));
        gl_FragColor = vec4(col, a);
      }
    `,
  });
}

/** Digital grid floor that fades in as the world turns digital. */
export function createGridMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uWorld: { value: 0 },
      uPortal: { value: new Vector3(0, 0, -22) },
      uLine: { value: new Color('#A8865E') },
      uAccent: { value: new Color('#D98A2B') },
    },
    vertexShader: /* glsl */ `
      varying vec3 vPos;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vPos = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uWorld;
      uniform vec3 uPortal;
      uniform vec3 uLine;
      uniform vec3 uAccent;
      varying vec3 vPos;
      float gridLine(vec2 p, float scale) {
        vec2 g = abs(fract(p * scale - 0.5) - 0.5) / fwidth(p * scale);
        return 1.0 - min(min(g.x, g.y), 1.0);
      }
      void main() {
        vec2 p = vPos.xz;
        float minor = gridLine(p, 1.0) * 0.35;
        float major = gridLine(p, 0.2) * 0.9;
        float d = distance(vPos.xz, uPortal.xz);
        float pulse = 1.0 - smoothstep(0.0, 0.06, abs(fract(d * 0.05 - uTime * 0.12) - 0.5) - 0.44);
        float fade = 1.0 - smoothstep(14.0, 46.0, d);
        float line = max(minor, major);
        vec3 col = uLine * line + uAccent * pulse * 0.35 * line;
        float a = (line * 0.3 + pulse * 0.1 * line) * fade * uWorld;
        gl_FragColor = vec4(col, a);
      }
    `,
  });
}

/** Holographic UI panel: texture + edge glow, scanlines, sweep and reveal. */
export function createHoloMaterial(map: Texture, accent: string) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: NormalBlending,
    uniforms: {
      uMap: { value: map },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uHover: { value: 0 },
      uAccent: { value: new Color(accent) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uTime;
      uniform float uReveal;
      uniform float uHover;
      uniform vec3 uAccent;
      varying vec2 vUv;
      void main() {
        vec4 tex = texture2D(uMap, vUv);
        float rows = 18.0;
        float row = floor((1.0 - vUv.y) * rows) / rows;
        float jitter = fract(sin(row * 91.7) * 43758.5) * 0.12;
        float mask = smoothstep(0.0, 0.08, uReveal * 1.25 - row - jitter);
        float slide = (1.0 - mask) * 0.0;
        float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float border = 1.0 - smoothstep(0.0, 0.012, edge);
        float scan = 0.985 + 0.015 * sin(vUv.y * 420.0 + uTime * 3.0);
        float sweepPos = fract(uTime * 0.11) * 1.6 - 0.3;
        float sx = (vUv.x - sweepPos) * 9.0;
        float sweep = exp(-sx * sx) * 0.18;
        vec3 col = mix(tex.rgb * scan, uAccent * (1.1 + uHover * 0.6), border) + vec3(sweep * 0.6);
        float alpha = (tex.a * (0.94 + uHover * 0.06) + border) * mask;
        gl_FragColor = vec4(col + slide, alpha);
      }
    `,
  });
}

/** Portal iris: swirling chocolate and caramel that opens from the centre. */
export function createPortalMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    blending: NormalBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpen: { value: 0 },
      uColorA: { value: CHOCOLATE.clone() },
      uColorB: { value: new Color('#E3A24C') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv - 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${simplex3}
      uniform float uTime;
      uniform float uOpen;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      varying vec2 vUv;
      void main() {
        float r = length(vUv) * 2.0;
        float a = atan(vUv.y, vUv.x);
        float swirl = fbm(vec3(cos(a) * 1.5 + r * 2.5, sin(a) * 1.5 - uTime * 0.6, r * 3.0 + uTime * 0.2));
        float iris = uOpen * 0.92;
        float band = smoothstep(iris - 0.06, iris + 0.04, r) * (1.0 - smoothstep(0.93, 1.0, r));
        float inner = (1.0 - smoothstep(iris, iris + 0.2, r)) * 1.6;
        float n = smoothstep(-0.2, 0.8, swirl);
        vec3 col = mix(uColorA, uColorB, n * 0.8 + inner * 0.2);
        float glow = 0.75 + inner * 0.6 * uOpen;
        float alpha = band * (0.85 + n * 0.15);
        gl_FragColor = vec4(col * glow, alpha);
      }
    `,
  });
}

/** Distant horizon glow behind the games world. */
export function createHorizonMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uWorld: { value: 0 },
      uTop: { value: SCENE_BG.clone() },
      uGlow: { value: new Color('#F5D7B0') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uWorld;
      uniform vec3 uTop;
      uniform vec3 uGlow;
      varying vec2 vUv;
      void main() {
        // x * x, not pow(x, 2.0): pow of a negative base is undefined in GLSL
        // and returns NaN on some GPUs.
        float by = (vUv.y - 0.42) * 5.0;
        float cx = (vUv.x - 0.5) * 2.4;
        float band = exp(-by * by);
        float centre = exp(-cx * cx);
        vec3 col = mix(uTop, uGlow, band * centre);
        gl_FragColor = vec4(col, (band * centre * 0.9) * uWorld);
      }
    `,
  });
}

/** Procedural globe dots: continents from 3D noise, no map data needed. */
export function createGlobeDotsMaterial(accent: string) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uFocus: { value: 0 },
      uPixelRatio: { value: 1 },
      uColor: { value: new Color(accent) },
    },
    vertexShader: /* glsl */ `
      ${simplex3}
      uniform float uPixelRatio;
      varying float vLand;
      varying float vLight;
      void main() {
        vec3 n = normalize(position);
        float land = fbm(n * 2.3 + vec3(3.1, 7.7, 1.3));
        vLand = smoothstep(0.02, 0.12, land);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 vn = normalize(normalMatrix * n);
        vLight = 0.35 + 0.65 * max(dot(vn, normalize(vec3(0.4, 0.6, 1.0))), 0.0);
        gl_PointSize = 2.6 * uPixelRatio * (12.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uFocus;
      varying float vLand;
      varying float vLight;
      void main() {
        if (vLand < 0.5) discard;
        vec2 c = gl_PointCoord - 0.5;
        float disc = 1.0 - smoothstep(0.2, 0.5, length(c));
        gl_FragColor = vec4(uColor * (1.1 + uFocus * 1.4) * vLight, disc * 0.95);
      }
    `,
  });
}
