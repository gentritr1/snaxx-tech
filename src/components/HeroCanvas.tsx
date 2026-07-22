import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { HeroScene } from './HeroScene';

/**
 * Lazy-loaded r3f canvas. Kept in its own module so that three.js / drei /
 * fiber land in a separate chunk from the main entry bundle (legal-page and
 * no-WebGL visitors never download it).
 *
 * The `frameloop` lever serves two jobs:
 * - Reduced motion: render once ("demand") so the scene is fully composed but
 *   perfectly still — this also freezes drei's internal animations
 *   (Float / Sparkles / MeshDistort / Trail) which we could not gate otherwise.
 *   A toy-box click briefly resumes the loop so the confetti burst
 *   (user-initiated, allowed under reduced motion) can play, then settles back.
 * - Offscreen: when the hero is scrolled out of view the loop pauses entirely,
 *   so the GPU is idle while the visitor reads the rest of the page. Motion is
 *   driven by absolute clock time, so everything resumes in the correct phase.
 */
export default function HeroCanvas({ reducedMotion }: { reducedMotion: boolean }) {
  const [interacting, setInteracting] = useState(false);
  const [inView, setInView] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const kickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInteract = useCallback(() => {
    if (!reducedMotion) return;
    setInteracting(true);
    if (kickTimer.current) clearTimeout(kickTimer.current);
    // Longest confetti life is ~2.3s; resume the render loop a touch longer.
    kickTimer.current = setTimeout(() => setInteracting(false), 2800);
  }, [reducedMotion]);

  useEffect(() => () => {
    if (kickTimer.current) clearTimeout(kickTimer.current);
  }, []);

  // Pause rendering while the hero is offscreen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const frameloop = !inView || (reducedMotion && !interacting) ? 'demand' : 'always';

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        frameloop={frameloop}
        camera={{ position: [0, 1.15, 8.6], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#131313']} />
        <fog attach="fog" args={['#131313', 12, 26]} />
        <HeroScene onInteract={handleInteract} />
      </Canvas>
    </div>
  );
}
