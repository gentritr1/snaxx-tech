import { Suspense, useEffect, useMemo, useState, type RefObject } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor, Preload } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { QUALITY, detectTier, prefersReducedMotion, webglAvailable } from './quality';
import { sceneState } from './sceneState';
import { CameraRig } from './scene/CameraRig';
import { Atmosphere } from './scene/Atmosphere';
import { Core } from './scene/Core';
import { Fragments } from './scene/Fragments';
import { Particles } from './scene/Particles';
import { SoftwareHolo } from './scene/SoftwareHolo';
import { Portal } from './scene/Portal';
import { GamesWorld } from './scene/GamesWorld';
import { Effects } from './scene/Effects';

interface ExperienceProps {
  /** Element whose pointer events drive the 3D raycaster (the page root). */
  eventSource: RefObject<HTMLElement | null>;
  onReady: () => void;
}

/**
 * The fixed, full-viewport 3D stage behind the page. Decorative for
 * assistive tech (every word lives in the DOM); interactive for pointers.
 */
export default function Experience({ eventSource, onReady }: ExperienceProps) {
  const quality = useMemo(() => QUALITY[detectTier()], []);
  const [dpr, setDpr] = useState(() => Math.min(quality.dpr[1], typeof window !== 'undefined' ? window.devicePixelRatio : 1));
  const [lost, setLost] = useState(() => !webglAvailable());

  useEffect(() => {
    sceneState.reducedMotion = prefersReducedMotion();
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => {
      sceneState.reducedMotion = e.matches;
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (lost) onReady();
  }, [lost, onReady]);

  if (lost) {
    return <div className="experience-poster" aria-hidden="true" />;
  }

  return (
    <div className="experience-canvas" aria-hidden="true">
      <Canvas
        dpr={dpr}
        camera={{ fov: 40, near: 0.1, far: 140, position: [0, 0.5, 12.4] }}
        gl={{
          antialias: quality.multisampling === 0,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
          toneMapping: ACESFilmicToneMapping,
        }}
        eventSource={eventSource as RefObject<HTMLElement>}
        eventPrefix="client"
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            setLost(true);
          });
          onReady();
        }}
      >
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setDpr((d) => Math.max(quality.dpr[0], d - 0.25))}
          onIncline={() => setDpr((d) => Math.min(quality.dpr[1], d + 0.25))}
          onFallback={() => setDpr(quality.dpr[0])}
        />
        <Suspense fallback={null}>
          <CameraRig />
          <Atmosphere />
          <Core quality={quality} />
          <Fragments count={quality.fragments} />
          <Particles count={quality.particles} />
          <SoftwareHolo />
          <Portal />
          <GamesWorld />
          <Effects quality={quality} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
