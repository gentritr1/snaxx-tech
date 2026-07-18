import { useEffect, useRef, useState } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface ParallaxValues {
  x: number;
  y: number;
}

export function useMouseParallax(intensity = 40, inverted = false) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState<ParallaxValues>({ x: 0, y: 0 });

  useEffect(() => {
    const motionAllowed =
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!motionAllowed) return;

    let frameId: number | null = null;
    let active = true;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const animate = () => {
      if (!active) return;
      current.x += (target.x - current.x) * 0.1;
      current.y += (target.y - current.y) * 0.1;
      setParallax({ x: current.x, y: current.y });
      frameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const multiplier = inverted ? -1 : 1;
      target.x = ((event.clientX - centerX) / centerX) * intensity * multiplier;
      target.y = ((event.clientY - centerY) / centerY) * intensity * 0.5 * multiplier;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    frameId = requestAnimationFrame(animate);

    return () => {
      active = false;
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [intensity, inverted]);

  return { elementRef, parallax };
}

export function useServiceParallax() {
  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const motionAllowed =
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!motionAllowed) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      setMousePos({
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      });
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getTransform = (moveIntensity = 50, rotation = 6) => {
    const x = (mousePos.x - 0.5) * moveIntensity;
    const y = (mousePos.y - 0.5) * moveIntensity * 0.5;
    const rotate = (mousePos.x - 0.5) * rotation;

    return {
      transform: `translate(${x}%, ${y}%) rotate(${rotate}deg)`,
      transition: 'transform 0.3s cubic-bezier(0.455, 0.030, 0.515, 0.955)',
    };
  };

  return { containerRef, mousePos, getTransform };
}
