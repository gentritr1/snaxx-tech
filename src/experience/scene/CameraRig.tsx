/* Renderer-owned mutable objects (materials, uniforms, cameras) are mutated
   inside useFrame on purpose; they never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Vector3 } from 'three';
import { damp, damp3 } from 'maath/easing';
import { sceneState } from '../sceneState';

const INTRO_CAM = new Vector3(1.8, 0.9, 4.2);

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Follows the scroll-driven camera keyframes with critically damped motion
 * and layers a spring-damped pointer parallax on top. The awakening blends
 * from a close "inside the shell" start to the first scroll keyframe.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const aspect = useThree((s) => s.viewport.aspect);
  const pointer = useRef({ x: 0, y: 0 });
  const goal = useMemo(() => new Vector3(), []);
  const look = useMemo(() => new Vector3(), []);
  const lookGoal = useMemo(() => new Vector3(), []);
  const camKey = useMemo(() => new Vector3(), []);
  const targetKey = useMemo(() => new Vector3(), []);
  const primed = useRef(false);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = sceneState;

    damp(pointer.current, 'x', s.pointer.active ? s.pointer.x : 0, 0.5, dt);
    damp(pointer.current, 'y', s.pointer.active ? s.pointer.y : 0, 0.5, dt);

    const k = s.reducedMotion ? 1 : easeOutCubic(s.intro);
    camKey.set(s.cam.x, s.cam.y, s.cam.z);
    targetKey.set(s.target.x, s.target.y, s.target.z);
    goal.copy(INTRO_CAM).lerp(camKey, k);
    const landscape = aspect >= 1;
    if (!landscape) {
      // Portrait viewports see a narrower slice of the scene: step back.
      goal.sub(targetKey).multiplyScalar(1.32).add(targetKey);
    }
    const parallax = 1 - s.flow * 0.6;
    goal.x += pointer.current.x * 0.5 * parallax;
    goal.y += pointer.current.y * 0.28 * parallax;

    lookGoal.copy(targetKey);
    lookGoal.x += landscape ? s.shiftX : 0;
    lookGoal.y += landscape ? 0 : s.shiftY;
    lookGoal.x += pointer.current.x * 0.18;
    lookGoal.y += pointer.current.y * 0.12;

    if (!primed.current) {
      camera.position.copy(goal);
      look.copy(lookGoal);
      primed.current = true;
      if (import.meta.env.DEV) {
        (window as unknown as { __snaxx?: unknown }).__snaxx = { sceneState: s, camera, look };
      }
    } else {
      damp3(camera.position, goal, 0.28, dt);
      damp3(look, lookGoal, 0.3, dt);
    }
    camera.lookAt(look);
    // Gentle roll with the pointer sells the "handheld" feel without nausea.
    camera.rotation.z += pointer.current.x * -0.012;

    // Portrait viewports get a wider lens so wide compositions still fit.
    const fovGoal = s.fov + (landscape ? 0 : 14);
    if (Math.abs(camera.fov - fovGoal) > 0.01) {
      camera.fov += (fovGoal - camera.fov) * Math.min(1, dt * 3);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
