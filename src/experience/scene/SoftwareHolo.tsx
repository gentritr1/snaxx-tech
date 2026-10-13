/* Renderer-owned mutable objects (materials, uniforms, cameras) are mutated
   inside useFrame on purpose; they never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Group, Mesh, ShaderMaterial } from 'three';
import { damp } from 'maath/easing';
import { sceneState, setHover, smoothstep } from '../sceneState';
import { createHoloMaterial } from '../shaders/materials';
import {
  createApprovalsTexture,
  createCalendarTexture,
  createDashboardTexture,
  createLabTexture,
  createStripTexture,
} from '../textures/ui';
import { softwareConfig } from '@/config';
import { isDomControlClick } from '@/lib/scroll';

const HOLO_CENTER: [number, number, number] = [0, 0.1, -14];

interface PanelSpec {
  id: string;
  width: number;
  height: number;
  position: [number, number, number];
  rotation: [number, number, number];
  delay: number;
  texture: () => ReturnType<typeof createDashboardTexture>;
  accent: string;
  productId: string;
}

function usePanels(): PanelSpec[] {
  return useMemo(() => {
    const offday = softwareConfig.products.find((p) => p.id === 'offday')?.accent ?? '#58D6A6';
    const lab = softwareConfig.products.find((p) => p.id === 'lab')?.accent ?? '#F2B35B';
    return [
      { id: 'dashboard', width: 4.6, height: 2.875, position: [0.35, 0.15, 0], rotation: [0, -0.04, 0], delay: 0, texture: () => createDashboardTexture(offday), accent: offday, productId: 'offday' },
      { id: 'calendar', width: 2.4, height: 1.6, position: [-3.2, 1.2, 0.8], rotation: [0.02, 0.42, 0], delay: 0.18, texture: () => createCalendarTexture(offday), accent: offday, productId: 'offday' },
      { id: 'approvals', width: 2.2, height: 1.47, position: [3.15, -0.95, 0.95], rotation: [0, -0.38, 0], delay: 0.3, texture: () => createApprovalsTexture(offday), accent: offday, productId: 'offday' },
      { id: 'strip', width: 3.5, height: 0.55, position: [0.6, -1.95, 0.55], rotation: [0.15, 0, 0], delay: 0.42, texture: () => createStripTexture(offday), accent: offday, productId: 'offday' },
      { id: 'lab', width: 2.0, height: 1.33, position: [-2.7, -1.4, 1.15], rotation: [0, 0.3, 0], delay: 0.5, texture: () => createLabTexture(lab), accent: lab, productId: 'lab' },
    ];
  }, []);
}

function Panel({ spec }: { spec: PanelSpec }) {
  const mesh = useRef<Mesh>(null);
  const material = useMemo(() => createHoloMaterial(spec.texture(), spec.accent), [spec]);
  const hover = useRef(0);

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hover.current = 1;
    setHover(spec.productId);
  };
  const onOut = () => {
    hover.current = 0;
    setHover(null);
  };

  useFrame(({ clock }, delta) => {
    const s = sceneState;
    const t = s.reducedMotion ? 0 : clock.elapsedTime;
    const m = material as ShaderMaterial;
    const reveal = smoothstep(spec.delay, spec.delay + 0.5, s.holo);
    m.uniforms.uTime.value = t;
    m.uniforms.uReveal.value = reveal;
    damp(m.uniforms.uHover, 'value', hover.current, 0.25, delta);
    const mesh_ = mesh.current;
    if (!mesh_) return;
    mesh_.visible = reveal > 0.001;
    const assemble = 1 - reveal;
    mesh_.position.set(
      spec.position[0],
      spec.position[1] + Math.sin(t * 0.7 + spec.delay * 9) * 0.05 - assemble * 0.6,
      spec.position[2] - assemble * 3.2,
    );
    mesh_.rotation.set(spec.rotation[0], spec.rotation[1] + assemble * 0.6, spec.rotation[2]);
    const lift = m.uniforms.uHover.value * 0.12;
    mesh_.position.z += lift;
  });

  return (
    <mesh
      ref={mesh}
      material={material}
      onPointerOver={onOver}
      onPointerOut={onOut}
      onClick={(e) => {
        if (isDomControlClick(e)) return;
        document.getElementById('software')?.scrollIntoView({ behavior: sceneState.reducedMotion ? 'auto' : 'smooth' });
      }}
    >
      <planeGeometry args={[spec.width, spec.height]} />
    </mesh>
  );
}

/** Holographic Offday interfaces that assemble out of the digital world. */
export function SoftwareHolo() {
  const panels = usePanels();
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    const s = sceneState;
    if (group.current) {
      group.current.visible = s.holo > 0.001;
      damp(group.current.rotation, 'y', s.pointer.x * 0.08, 0.4, delta);
      damp(group.current.rotation, 'x', -s.pointer.y * 0.05, 0.4, delta);
    }
  });

  return (
    <group ref={group} position={HOLO_CENTER}>
      {panels.map((spec) => (
        <Panel key={spec.id} spec={spec} />
      ))}
    </group>
  );
}
