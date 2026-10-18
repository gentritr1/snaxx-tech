/* Renderer-owned mutable objects (materials, uniforms, cameras) are mutated
   inside useFrame on purpose; they never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { Color, DirectionalLight, Fog, PointLight, Vector3 } from 'three';
import { clamp01, sceneState, smoothstep } from '../sceneState';
import { SCENE_BG, SCENE_BG_WORLD, createGridMaterial, createHorizonMaterial } from '../shaders/materials';
import { gamesConfig } from '@/config';

const FOG_STUDIO = SCENE_BG;
const FOG_WORLD = SCENE_BG_WORLD;

// Where the single roaming "accent" light sits for each scene moment.
const HOLO_LIGHT = new Vector3(0, 0.6, -11.5);
const PORTAL_LIGHT = new Vector3(0, 0, -20.5);
const GAMES_X = [-7.5, -2.5, 2.5, 7.5];
const GAME_ACCENTS = gamesConfig.games.map((g) => new Color(g.accent));
const HOLO_COLOR = new Color('#58D6A6');
const PORTAL_COLOR = new Color('#F2B35B');

/**
 * Lighting, environment reflections, fog and the two world backdrops (the
 * counter grid and the far horizon). Everything is procedural: the
 * production CSP forbids fetching HDRIs.
 *
 * The scene always contains exactly the same five lights. three.js bakes the
 * light count into every lit shader, so adding or hiding a light mid-scroll
 * forces a recompile of every material and shows up as a visible stall; one
 * roaming accent light replaces the per-section lights instead.
 */
export function Atmosphere() {
  const fog = useRef<Fog>(null);
  const key = useRef<DirectionalLight>(null);
  const core = useRef<PointLight>(null);
  const accent = useRef<PointLight>(null);
  const grid = useMemo(() => createGridMaterial(), []);
  const horizon = useMemo(() => createHorizonMaterial(), []);
  const fogColor = useMemo(() => new Color(), []);
  const scratch = useMemo(() => ({ pos: new Vector3(), tmp: new Vector3(), color: new Color(), colorB: new Color() }), []);

  useFrame(({ clock }) => {
    const s = sceneState;
    const t = clock.elapsedTime;
    grid.uniforms.uTime.value = t;
    grid.uniforms.uWorld.value = s.world;
    horizon.uniforms.uWorld.value = s.world;

    if (fog.current) {
      fogColor.copy(FOG_STUDIO).lerp(FOG_WORLD, s.world);
      fog.current.color.copy(fogColor);
      fog.current.near = 24 - s.flow * 14;
      fog.current.far = 64 - s.flow * 20 + s.world * 10;
    }
    if (key.current) {
      key.current.position.set(6 + s.pointer.x * 2.5, 9 + s.pointer.y * 1.5, 7);
      key.current.intensity = 2.6 + s.energy * 0.6;
    }
    if (core.current) {
      const fade = 1 - smoothstep(0.5, 1, s.flow);
      // Sealed shell leaks little light; the exploded core glows fully.
      const open = 0.35 + 0.65 * clamp01(s.formation);
      core.current.intensity = s.energy * 5.5 * open * fade * (0.9 + Math.sin(t * 1.4) * 0.1);
    }
    if (accent.current) {
      // Blend the three possible focus points by how present each scene moment is.
      const wHolo = s.holo;
      const wPortal = smoothstep(2.4, 3, s.formation) * (1 - smoothstep(3.5, 4, s.formation)) + s.portal * 0.5;
      const wGames = s.gamesReveal;
      const total = wHolo + wPortal + wGames;
      if (total < 0.001) {
        accent.current.intensity = 0;
      } else {
        const { pos, tmp, color, colorB } = scratch;
        const gi = Math.max(0, Math.min(GAMES_X.length - 1.0001, s.gamesFocus));
        const g0 = Math.floor(gi);
        const gt = gi - g0;
        const gx = GAMES_X[g0] + (GAMES_X[g0 + 1] - GAMES_X[g0]) * gt;
        pos.set(0, 0, 0);
        pos.addScaledVector(HOLO_LIGHT, wHolo);
        pos.addScaledVector(PORTAL_LIGHT, wPortal);
        pos.addScaledVector(tmp.set(gx, 2.4, -36.8), wGames);
        pos.divideScalar(total);
        accent.current.position.copy(pos);
        color.setRGB(0, 0, 0);
        color.r += HOLO_COLOR.r * wHolo + PORTAL_COLOR.r * wPortal;
        color.g += HOLO_COLOR.g * wHolo + PORTAL_COLOR.g * wPortal;
        color.b += HOLO_COLOR.b * wHolo + PORTAL_COLOR.b * wPortal;
        colorB.copy(GAME_ACCENTS[g0]).lerp(GAME_ACCENTS[Math.min(g0 + 1, GAME_ACCENTS.length - 1)], gt);
        color.r += colorB.r * wGames;
        color.g += colorB.g * wGames;
        color.b += colorB.b * wGames;
        color.multiplyScalar(1 / total);
        accent.current.color.copy(color);
        accent.current.intensity = Math.min(1, total) * (24 + s.portal * 24);
      }
    }
  });

  return (
    <>
      <primitive attach="background" object={SCENE_BG} />
      <fog ref={fog} attach="fog" args={[SCENE_BG.clone(), 24, 64]} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#FFFFFF', '#E6D3B8', 0.9]} />
      <directionalLight ref={key} position={[6, 9, 7]} intensity={2.6} color="#FFF4E6" />
      <pointLight ref={core} position={[0, 0, 0]} intensity={0} color="#FFD9A0" decay={2} distance={9} />
      <pointLight ref={accent} position={[0, 0, -20]} intensity={0} color="#F2B35B" decay={2} distance={16} />

      <Environment resolution={256} frames={1} background={false}>
        <color attach="background" args={['#F1E6D4']} />
        <Lightformer form="rect" intensity={6} color="#FFFFFF" position={[0, 6, -4]} scale={[14, 1.6, 1]} rotation-x={Math.PI / 2.4} />
        <Lightformer form="rect" intensity={3.2} color="#FFF3E6" position={[-8, 2, 2]} scale={[6, 4, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={2.6} color="#FFE5C4" position={[8, 1, 2]} scale={[4, 3, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={1.8} color="#FFFFFF" position={[0, -7, 0]} scale={8} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} color="#FFE9D0" position={[0, 3, 9]} scale={[8, 2, 1]} />
      </Environment>

      {/* Counter grid — fades in once the camera has passed through the centre. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -3.6, -26]} material={grid} frustumCulled={false}>
        <planeGeometry args={[260, 260]} />
      </mesh>
      {/* Far horizon glow behind the games world. */}
      <mesh position={[0, 6, -78]} material={horizon} frustumCulled={false}>
        <planeGeometry args={[260, 110]} />
      </mesh>
    </>
  );
}
