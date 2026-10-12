/* Renderer-owned mutable objects (materials, uniforms, cameras) are mutated
   inside useFrame on purpose; they never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { Color, Fog, PointLight, SpotLight } from 'three';
import { sceneState, smoothstep } from '../sceneState';
import { createGridMaterial, createHorizonMaterial } from '../shaders/materials';

const FOG_STUDIO = new Color('#0A0705');
const FOG_WORLD = new Color('#140B06');

/**
 * Lighting, environment reflections, fog and the two world backdrops (the
 * digital grid floor and the far horizon). Everything is procedural: the
 * production CSP forbids fetching HDRIs.
 */
export function Atmosphere() {
  const fog = useRef<Fog>(null);
  const key = useRef<SpotLight>(null);
  const rim = useRef<PointLight>(null);
  const core = useRef<PointLight>(null);
  const grid = useMemo(() => createGridMaterial(), []);
  const horizon = useMemo(() => createHorizonMaterial(), []);
  const fogColor = useMemo(() => new Color(), []);

  useFrame(({ clock }) => {
    const s = sceneState;
    const t = clock.elapsedTime;
    grid.uniforms.uTime.value = t;
    grid.uniforms.uWorld.value = s.world;
    horizon.uniforms.uWorld.value = s.world;

    if (fog.current) {
      fogColor.copy(FOG_STUDIO).lerp(FOG_WORLD, s.world);
      fog.current.color.copy(fogColor);
      fog.current.near = 10 - s.flow * 6;
      fog.current.far = 40 - s.flow * 14 + s.world * 10;
    }
    if (key.current) {
      key.current.position.x = 6 + s.pointer.x * 2.5;
      key.current.position.y = 9 + s.pointer.y * 1.5;
      key.current.intensity = 90 + s.energy * 50 - s.world * 50;
    }
    if (rim.current) {
      rim.current.intensity = 30 + s.world * 40;
    }
    if (core.current) {
      const fade = 1 - smoothstep(0.5, 1, s.flow);
      // Sealed shell leaks little light; the exploded core glows fully.
      const open = 0.35 + 0.65 * Math.min(1, Math.max(0, s.formation));
      core.current.intensity = s.energy * 5.5 * open * fade * (0.9 + Math.sin(t * 1.4) * 0.1);
    }
  });

  return (
    <>
      <color attach="background" args={['#0A0705']} />
      <fog ref={fog} attach="fog" args={['#0A0705', 10, 40]} />
      <ambientLight intensity={0.16} />
      <hemisphereLight args={['#4A3324', '#0A0705', 0.3]} />
      <spotLight
        ref={key}
        position={[6, 9, 7]}
        angle={0.55}
        penumbra={0.85}
        intensity={110}
        color="#FFE2BF"
        decay={2}
        distance={60}
      />
      <pointLight ref={rim} position={[-7, 3, -5]} intensity={24} color="#FFB37A" decay={2} distance={40} />
      <pointLight ref={core} position={[0, 0, 0]} intensity={0} color="#FFD9A0" decay={2} distance={9} />

      <Environment resolution={256} frames={1} background={false}>
        <Lightformer form="rect" intensity={5} color="#FFFFFF" position={[0, 6, -4]} scale={[14, 1.6, 1]} rotation-x={Math.PI / 2.4} />
        <Lightformer form="rect" intensity={2.6} color="#FFE9D2" position={[-8, 2, 2]} scale={[6, 4, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={2} color="#FFD9A8" position={[8, 1, 2]} scale={[4, 3, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={1.4} color="#FFFFFF" position={[0, -7, 0]} scale={8} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} color="#FFD2A6" position={[0, 3, 9]} scale={[8, 2, 1]} />
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
