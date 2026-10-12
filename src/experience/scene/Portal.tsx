/* Renderer-owned mutable objects (materials, uniforms, cameras) are mutated
   inside useFrame on purpose; they never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, InstancedMesh, Mesh, MeshPhysicalMaterial, Object3D, PointLight } from 'three';
import { mulberry32, sceneState, smoothstep } from '../sceneState';
import { createPortalMaterial } from '../shaders/materials';

const PORTAL_Z = -22;
const MAJOR = 3.45;
const MINOR = 0.34;
const SPRINKLES = 140;
const SPRINKLE_COLORS = ['#F2B35B', '#2F8CFF', '#FF7A29', '#14B8A6', '#58D6A6', '#E85D75', '#7C4DFF'];

/** Soft shortbread dough. */
const DOUGH = new MeshPhysicalMaterial({ color: '#E8B974', roughness: 0.62, metalness: 0, clearcoat: 0.08, envMapIntensity: 0.9 });

/** Chocolate glaze: covers the front face of the ring with a dripping edge. */
function createGlazeMaterial() {
  const mat = new MeshPhysicalMaterial({ color: '#5A2E18', roughness: 0.14, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4 });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying vec3 vObjNormal;\nvarying vec3 vObjPos;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvObjNormal = normal;\nvObjPos = position;',
    );
    shader.fragmentShader = `varying vec3 vObjNormal;\nvarying vec3 vObjPos;\n${shader.fragmentShader}`.replace(
      '#include <clipping_planes_fragment>',
      `#include <clipping_planes_fragment>
      float angle = atan(vObjPos.y, vObjPos.x);
      float drip = sin(angle * 23.0) * 0.1 + sin(angle * 41.0 + 1.3) * 0.05;
      if (vObjNormal.z < 0.12 + drip) discard;`,
    );
  };
  mat.customProgramCacheKey = () => 'donut-glaze';
  return mat;
}

/** The gateway between the studio and the games: a glazed donut with a caramel iris. */
export function Portal() {
  const group = useRef<Group>(null);
  const ring = useRef<Group>(null);
  const sprinkles = useRef<InstancedMesh>(null);
  const iris = useRef<Mesh>(null);
  const light = useRef<PointLight>(null);
  const material = useMemo(() => createPortalMaterial(), []);
  const glaze = useMemo(() => createGlazeMaterial(), []);
  const trackMaterial = useMemo(
    () => new MeshPhysicalMaterial({ color: '#2A1710', emissive: new Color('#F2B35B'), emissiveIntensity: 0, roughness: 0.3 }),
    [],
  );

  useLayoutEffect(() => {
    const inst = sprinkles.current;
    if (!inst) return;
    const rnd = mulberry32(77);
    const dummy = new Object3D();
    const color = new Color();
    for (let i = 0; i < SPRINKLES; i++) {
      const a = rnd() * Math.PI * 2;
      const b = 0.45 + rnd() * (Math.PI - 0.9); // front face of the torus only
      const ringR = MAJOR + (MINOR + 0.015) * Math.cos(b);
      dummy.position.set(Math.cos(a) * ringR, Math.sin(a) * ringR, (MINOR + 0.015) * Math.sin(b));
      dummy.lookAt(Math.cos(a) * MAJOR, Math.sin(a) * MAJOR, 0);
      dummy.rotateZ(rnd() * Math.PI);
      dummy.rotateX(Math.PI / 2);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      color.set(SPRINKLE_COLORS[Math.floor(rnd() * SPRINKLE_COLORS.length)]);
      inst.setColorAt(i, color);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const s = sceneState;
    const t = clock.elapsedTime;
    material.uniforms.uTime.value = s.reducedMotion ? 0 : t;
    material.uniforms.uOpen.value = s.portal;
    // The donut materialises as the chocolate pieces converge around it (formation 2→3).
    const presence = smoothstep(2.4, 3, s.formation) * (1 - smoothstep(3.5, 4, s.formation));
    const visible = presence > 0.01 || s.portal > 0.01;
    if (group.current) {
      group.current.visible = visible;
      group.current.scale.setScalar(0.65 + presence * 0.35);
    }
    if (ring.current) ring.current.rotation.z = s.reducedMotion ? 0 : t * 0.04;
    if (iris.current) iris.current.visible = s.portal > 0.005 && s.portal < 0.995;
    trackMaterial.emissiveIntensity = presence * (0.9 + s.portal * 1.4);
    if (light.current) light.current.intensity = presence * 30 + s.portal * 50;
  });

  return (
    <group ref={group} position={[0, 0, PORTAL_Z]}>
      <group ref={ring}>
        <mesh material={DOUGH}>
          <torusGeometry args={[MAJOR, MINOR, 40, 220]} />
        </mesh>
        <mesh material={glaze}>
          <torusGeometry args={[MAJOR, MINOR + 0.012, 40, 220]} />
        </mesh>
        <instancedMesh ref={sprinkles} args={[undefined, undefined, SPRINKLES]}>
          <capsuleGeometry args={[0.022, 0.1, 3, 8]} />
          <meshPhysicalMaterial color="#FFFFFF" roughness={0.3} clearcoat={1} clearcoatRoughness={0.1} />
        </instancedMesh>
        <mesh material={trackMaterial}>
          <torusGeometry args={[MAJOR - MINOR - 0.05, 0.02, 8, 200]} />
        </mesh>
      </group>
      <mesh ref={iris} material={material}>
        <planeGeometry args={[6.4, 6.4]} />
      </mesh>
      <pointLight ref={light} position={[0, 0, 0.5]} color="#F2B35B" intensity={0} distance={18} decay={2} />
      <pointLight position={[3, 4, 5]} color="#FFF4E6" intensity={60} distance={20} decay={2} />
    </group>
  );
}
