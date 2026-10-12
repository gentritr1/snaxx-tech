import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { PageOverlay } from '@/components/PageOverlay';
import { HeroChapter } from '@/chapters/HeroChapter';
import { StoryChapter } from '@/chapters/StoryChapter';
import { SoftwareChapter } from '@/chapters/SoftwareChapter';
import { PortalChapter } from '@/chapters/PortalChapter';
import { GamesChapter } from '@/chapters/GamesChapter';
import { StudioChapter } from '@/chapters/StudioChapter';
import { ContactChapter } from '@/chapters/ContactChapter';
import { siteConfig, storyChapters } from '@/config';
import { createChoreography, playAwakening, type Choreography } from '@/experience/scroll';
import { prefersReducedMotion } from '@/experience/quality';
import { sceneState } from '@/experience/sceneState';

// The 3D stage is the heaviest code on the site; legal pages never load it.
const Experience = lazy(() => import('@/experience/Experience'));

export default function Home() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [awake, setAwake] = useState(false);
  const choreography = useRef<Choreography | null>(null);

  useEffect(() => {
    document.title = siteConfig.title;
    document.documentElement.dataset.surface = 'void';
    return () => {
      delete document.documentElement.dataset.surface;
    };
  }, []);

  const onSceneReady = useCallback(() => setSceneReady(true), []);

  // Boot: keep the overlay at least briefly, drop it once the stage is live
  // (or after a grace period if WebGL never reports in).
  useEffect(() => {
    const minimum = window.setTimeout(() => {
      if (sceneReady) setShowOverlay(false);
    }, 700);
    const grace = window.setTimeout(() => setShowOverlay(false), 7000);
    return () => {
      window.clearTimeout(minimum);
      window.clearTimeout(grace);
    };
  }, [sceneReady]);

  // The awakening starts the moment the overlay lifts.
  useEffect(() => {
    if (showOverlay) return;
    const stop = playAwakening(prefersReducedMotion());
    const t = window.setTimeout(() => setAwake(true), 120);
    return () => {
      stop();
      window.clearTimeout(t);
    };
  }, [showOverlay]);

  // Scroll choreography binds to the chapter sections as soon as they exist.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    choreography.current = createChoreography(root, prefersReducedMotion());
    document.fonts?.ready.then(() => choreography.current?.refresh());
    return () => {
      choreography.current?.kill();
      choreography.current = null;
    };
  }, []);

  useEffect(() => {
    if (sceneReady) choreography.current?.refresh();
  }, [sceneReady]);

  // Pointer parallax for fine pointers only.
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      sceneState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
      sceneState.pointer.active = true;
    };
    const onLeave = () => {
      sceneState.pointer.active = false;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={rootRef} id="home-root" className="relative min-h-screen bg-void text-ink">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Suspense fallback={null}>
        <Experience eventSource={rootRef} onReady={onSceneReady} />
      </Suspense>
      <PageOverlay isVisible={showOverlay} />
      <Navigation />
      <main id="main-content" data-route-focus tabIndex={-1} className="relative z-10 focus:outline-none">
        <HeroChapter awake={awake} />
        <StoryChapter chapter={storyChapters[0]} height="220vh" />
        <StoryChapter chapter={storyChapters[1]} height="180vh" />
        <SoftwareChapter />
        <PortalChapter />
        <GamesChapter />
        <StudioChapter />
        <ContactChapter />
      </main>
      <Footer />
    </div>
  );
}
