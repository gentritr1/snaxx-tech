/* Renderer-owned mutable objects (materials, uniforms, cameras) are mutated
   inside useFrame on purpose; they never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, InstancedMesh, Mesh, MeshPhysicalMaterial, Object3D, PointLight } from 'three';
import { sceneState, smoothstep } from '../sceneState';
import { createPortalMaterial } from '../shaders/materials';
import { GUNMETAL, METAL } from './Core';

const PORTAL_Z = -22;
const NOTCHES = 72;

/** The gateway between the studio and the games world. */
export function Portal() {
  const group = useRef<Group>(null);
  const ring = useRef<Group>(null);
  const notches = useRef<InstancedMesh>(null);
  const iris = useRef<Mesh>(null);
  const light = useRef<PointLight>(null);
  const material = useMemo(() => createPortalMaterial(), []);
  const trackMaterial = useMemo(
    () => new MeshPhysicalMaterial({ color: '#1A1A1A', emissive: new Color('#F2B35B'), emissiveIntensity: 0, roughness: 0.3 }),
    [],
  );

  useLayoutEffect(() => {
    const inst = notches.current;
    if (!inst) return;
    const dummy = new Object3D();
    for (let i = 0; i < NOTCHES; i++) {
      const a = (i / NOTCHES) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 3.62, Math.sin(a) * 3.62, 0);
      dummy.rotation.set(0, 0, a);
      dummy.scale.set(1, i % 6 === 0 ? 1.8 : 1, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const s = sceneState;
    const t = clock.elapsedTime;
    material.uniforms.uTime.value = s.reducedMotion ? 0 : t;
    material.uniforms.uOpen.value = s.portal;
    // The ring materialises as the plates converge into it (formation 2→3).
    const presence = smoothstep(2.4, 3, s.formation) * (1 - smoothstep(3.5, 4, s.formation));
    const visible = presence > 0.01 || s.portal > 0.01;
    if (group.current) {
      group.current.visible = visible;
      group.current.scale.setScalar(0.65 + presence * 0.35);
    }
    if (ring.current) ring.current.rotation.z = s.reducedMotion ? 0 : t * 0.05;
    if (iris.current) iris.current.visible = s.portal > 0.005 && s.portal < 0.995;
    trackMaterial.emissiveIntensity = presence * (1.5 + s.portal * 2.5);
    if (light.current) light.current.intensity = presence * 20 + s.portal * 60;
  });

  return (
    <group ref={group} position={[0, 0, PORTAL_Z]}>
      <group ref={ring}>
        <mesh material={METAL}>
          <torusGeometry args={[3.45, 0.11, 24, 180]} />
        </mesh>
        <mesh material={trackMaterial}>
          <torusGeometry args={[3.28, 0.018, 8, 180]} />
        </mesh>
        <instancedMesh ref={notches} args={[undefined, undefined, NOTCHES]} material={GUNMETAL}>
          <boxGeometry args={[0.1, 0.16, 0.14]} />
        </instancedMesh>
      </group>
      <mesh ref={iris} material={material}>
        <planeGeometry args={[7.2, 7.2]} />
      </mesh>
      <pointLight ref={light} position={[0, 0, 0.5]} color="#F2B35B" intensity={0} distance={18} decay={2} />
    </group>
  );
}
