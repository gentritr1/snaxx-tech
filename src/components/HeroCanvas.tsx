import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { HeroScene } from './HeroScene';

/**
 * Lazy-loaded r3f canvas. Kept in its own module so that three.js / drei /
 * fiber land in a separate chunk from the main entry bundle (legal-page and
 * no-WebGL visitors never download it).
 *
 * Reduced-motion handling lives here via the `frameloop` lever: when the user
 * prefers reduced motion we render the scene once ("demand") so it is fully
 * composed but perfectly still — this also freezes drei's internal animations
 * (Float / Sparkles / MeshDistort / Trail) which we could not gate otherwise.
 * A user click on the toy box briefly resumes the loop so the confetti burst
 * (user-initiated, allowed under reduced motion) can play, then settles back.
 */
export default function HeroCanvas({ reducedMotion }: { reducedMotion: boolean }) {
  const [interacting, setInteracting] = useState(false);
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

  const frameloop = reducedMotion && !interacting ? 'demand' : 'always';

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={frameloop}
      camera={{ position: [0, 1.15, 8.6], fov: 45 }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#131313']} />
      <fog attach="fog" args={['#131313', 12, 26]} />
      <HeroScene onInteract={handleInteract} />
    </Canvas>
  );
}
