/* Three objects are deliberately mutable inside the renderer, never React state. */
/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CanvasTexture, Group, Mesh, MeshBasicMaterial, MeshMatcapMaterial, MeshPhysicalMaterial, NoToneMapping, PlaneGeometry, SRGBColorSpace, TextureLoader, TubeGeometry, Vector3, Float32BufferAttribute } from 'three';
import { clamp, range, sampleCamera, threadCurve, tileClick } from './journey';
import matcapUrl from './assets/clay-matcap.png';

type Props = { p: number; inView: boolean; letters: string; onReady: () => void; onFailure: () => void };

function Scene({ p, letters, onReady, onFailure, matcap }: Props & { matcap: import('three').Texture }) {
  const { camera, gl, size, invalidate } = useThree();
  const scene = useMemo(() => {
    matcap.colorSpace = SRGBColorSpace;
    const clay = new MeshMatcapMaterial({ matcap });
    const group = new Group();
    const tileGeometry = new RoundedBoxGeometry(1, 1, .35, 3, .12);
    const letterGeometry = new PlaneGeometry(.68, .68);
    const tiles = Array.from(letters).slice(0, 5).map((letter, i) => {
      const tile = new Group();
      const box = new Mesh(tileGeometry, clay); box.castShadow = true; tile.add(box);
      const bitmap = document.createElement('canvas'); bitmap.width = 256; bitmap.height = 256;
      const context = bitmap.getContext('2d')!;
      context.fillStyle = i === 4 ? '#D73626' : '#2A2D38'; context.font = '600 190px Arial'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(letter, 128, 139);
      const texture = new CanvasTexture(bitmap); texture.colorSpace = SRGBColorSpace;
      const glyph = new Mesh(letterGeometry, new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
      glyph.position.z = .181; tile.add(glyph); group.add(tile); return tile;
    });
    const tube = new TubeGeometry(threadCurve, 512, 1, 8, false);
    const centers = new Float32Array(tube.attributes.position.count * 3);
    for (let i = 0; i <= 512; i++) {
      const center = threadCurve.getPointAt(i / 512);
      for (let j = 0; j <= 8; j++) center.toArray(centers, (i * 9 + j) * 3);
    }
    tube.setAttribute('threadCenter', new Float32BufferAttribute(centers, 3));
    const threadMaterial = new MeshPhysicalMaterial({ color: '#D73626', clearcoat: 1, clearcoatRoughness: .15, roughness: .35 });
    const pixelRadius = { value: 3 }, viewportHeight = { value: 900 };
    // Tube stays 6 CSS px (4 on phones) through the full camera dolly.
    threadMaterial.onBeforeCompile = shader => {
      shader.uniforms.threadPixelRadius = pixelRadius; shader.uniforms.threadViewportHeight = viewportHeight;
      shader.vertexShader = 'attribute vec3 threadCenter; uniform float threadPixelRadius; uniform float threadViewportHeight;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `float viewDepth = abs((modelViewMatrix * vec4(threadCenter, 1.0)).z);
        float radius = threadPixelRadius * 2.0 * viewDepth / (projectionMatrix[1][1] * threadViewportHeight);
        vec3 transformed = threadCenter + (position - threadCenter) * radius;`);
    };
    const thread = new Mesh(tube, threadMaterial); thread.frustumCulled = false; group.add(thread);
    return { group, tiles, tube, clay, threadMaterial, pixelRadius, viewportHeight, position: new Vector3(), target: new Vector3() };
  }, [letters, matcap]);

  useEffect(() => { invalidate(); }, [p, size, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  useEffect(() => { onReady(); }, [onReady]);
  useEffect(() => () => {
    const geometries = new Set<import('three').BufferGeometry>();
    const materials = new Set<import('three').Material>();
    scene.group.traverse(object => { if (object instanceof Mesh) { geometries.add(object.geometry); for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material); } });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => { if (material instanceof MeshBasicMaterial) material.map?.dispose(); material.dispose(); });
  }, [scene]);

  useFrame(() => {
    sampleCamera(p, scene.position, scene.target);
    if (size.width <= 600) {
      // Narrow K0 needs the whole five-letter strand; orbit shifts below the copy.
      scene.position.z += (1 - range(p, .2, .45)) * 3;
      scene.target.y += (1 - range(p, .2, .45)) * 1.7;
    }
    camera.position.copy(scene.position); camera.lookAt(scene.target);
    scene.pixelRadius.value = size.width <= 600 ? 2 : 3; scene.viewportHeight.value = size.height;
    scene.tube.setDrawRange(0, Math.floor(p * 512) * 8 * 6);
    const slide = range(p, .2, .45);
    scene.tiles.forEach((tile, i) => {
      const t = clamp(.12 + i * .039 + slide * .22);
      threadCurve.getPointAt(t, tile.position);
      tile.quaternion.copy(camera.quaternion);
      tile.rotateZ(Math.sin(i * 1.7 + p * Math.PI * 2) * .026);
      tile.scale.setScalar((1 - slide * .6) * tileClick(p, i));
      tile.visible = p < .54;
    });
  });

  return <>
    <color attach="background" args={['#F9F4EE']} />
    <ambientLight intensity={1.4} /><directionalLight position={[-4, 7, 8]} intensity={3} />
    <primitive object={scene.group} />
  </>;
}

export default function ThreadCanvas(props: Props) {
  const matcap = useLoader(TextureLoader, matcapUrl);
  return <Canvas aria-hidden="true" dpr={[1, 2]} frameloop="demand" camera={{ position: [0, 0, 12], fov: 45, near: .02, far: 90 }} gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: NoToneMapping }}>
    <Scene {...props} matcap={matcap} />
  </Canvas>;
}
