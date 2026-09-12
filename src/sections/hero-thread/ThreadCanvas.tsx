/* Three objects are deliberately mutable inside the renderer, never React state. */
/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { dampProgress, type MotionDriver } from "./motion";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  CanvasTexture,
  Group,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  MeshPhysicalMaterial,
  NoToneMapping,
  PlaneGeometry,
  SRGBColorSpace,
  TextureLoader,
  TubeGeometry,
  Vector3,
  Float32BufferAttribute,
} from "three";
import {
  clamp,
  range,
  sampleCamera,
  sampleThread,
  threadCurve,
  tileClick,
} from "./journey";
import { createWorld, createFlight } from "./world";
import matcapUrl from "./assets/clay-matcap.png";

type Props = {
  driver: RefObject<MotionDriver>;
  letters: string;
  onReady: () => void;
  onFailure: () => void;
};

function Scene({
  driver,
  letters,
  onReady,
  onFailure,
  matcap,
}: Props & { matcap: import("three").Texture }) {
  const { camera, gl, size, invalidate } = useThree();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const floor = useRef<Mesh>(null);
  const scene = useMemo(() => {
    matcap.colorSpace = SRGBColorSpace;
    const clay = new MeshMatcapMaterial({ matcap });
    const group = new Group();
    const tileGeometry = new RoundedBoxGeometry(1, 1, 0.35, 3, 0.12);
    const letterGeometry = new PlaneGeometry(0.68, 0.68);
    const tiles = Array.from(letters)
      .slice(0, 5)
      .map((letter, i) => {
        const tile = new Group();
        const box = new Mesh(tileGeometry, clay);
        box.castShadow = true;
        tile.add(box);
        const bitmap = document.createElement("canvas");
        bitmap.width = 256;
        bitmap.height = 256;
        const context = bitmap.getContext("2d")!;
        context.fillStyle = i === 4 ? "#D73626" : "#2A2D38";
        context.font = "600 190px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(letter, 128, 139);
        const texture = new CanvasTexture(bitmap);
        texture.colorSpace = SRGBColorSpace;
        const glyph = new Mesh(
          letterGeometry,
          new MeshBasicMaterial({
            map: texture,
            transparent: true,
            depthWrite: false,
            depthTest: false,
          }),
        );
        glyph.position.z = 0.19;
        glyph.renderOrder = 2;
        tile.add(glyph);
        group.add(tile);
        return tile;
      });
    const tube = new TubeGeometry(threadCurve, 512, 1, 24, false);
    const centers = new Float32Array(tube.attributes.position.count * 3);
    for (let i = 0; i <= 512; i++) {
      const center = threadCurve.getPointAt(i / 512);
      for (let j = 0; j <= 24; j++) center.toArray(centers, (i * 25 + j) * 3);
    }
    tube.setAttribute("threadCenter", new Float32BufferAttribute(centers, 3));
    const threadMaterial = new MeshPhysicalMaterial({
      color: "#D73626",
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      roughness: 0.3,
      metalness: 0,
    });
    const pixelRadius = { value: 3 },
      viewportHeight = { value: 900 },
      wordDrop = { value: 0 },
      interior = { value: 0 },
      progress = { value: 0 };
    // Tube stays 6 CSS px (4 on phones) through the full camera dolly.
    threadMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.wordDrop = wordDrop;
      shader.uniforms.interior = interior;
      shader.uniforms.uProgress = progress;
      shader.uniforms.threadPixelRadius = pixelRadius;
      shader.uniforms.threadViewportHeight = viewportHeight;
      shader.vertexShader =
        "varying float threadT; uniform float wordDrop; attribute vec3 threadCenter; uniform float threadPixelRadius; uniform float threadViewportHeight;\n" +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `threadT = uv.x; float viewDepth = abs((modelViewMatrix * vec4(threadCenter, 1.0)).z);
        float radius = threadPixelRadius * 2.0 * viewDepth / (projectionMatrix[1][1] * threadViewportHeight);
        vec3 transformed = threadCenter + (position - threadCenter) * radius;
        transformed.y -= wordDrop * (1.0 - smoothstep(.28, .34, uv.x));`,
      );
    };
    const compileThread = threadMaterial.onBeforeCompile;
    threadMaterial.onBeforeCompile = (shader, renderer) => {
      compileThread(shader, renderer);
      shader.fragmentShader =
        "varying float threadT; uniform float interior; uniform float uProgress;\n" +
        shader.fragmentShader;
      // The surface crossing occludes the exterior strand, without changing its draw length.
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\n if (uProgress <= 0.0 || threadT > uProgress || (interior > .5 && threadT < .68)) discard;",
      );
    };
    const thread = new Mesh(tube, threadMaterial);
    thread.frustumCulled = false;
    group.add(thread);
    const world = createWorld(clay);
    group.add(world.globe);
    const flight = createFlight(clay);
    group.add(flight.plane, flight.swarm);
    return {
      ...world,
      ...flight,
      group,
      tiles,
      tube,
      clay,
      threadMaterial,
      pixelRadius,
      viewportHeight,
      wordDrop,
      interior,
      progress,
      time: 0,
      idleWeight: 0,
      position: new Vector3(),
      target: new Vector3(),
      pinView: new Vector3(),
    };
  }, [letters, matcap]);

  useEffect(() => {
    const state = driver.current;
    state.wake = () => {
      clearTimeout(idleTimer.current);
      if (state.inView) invalidate();
    };
    state.wake();
    return () => {
      clearTimeout(idleTimer.current);
      state.wake = () => {};
    };
  }, [driver, size, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  useEffect(() => {
    onReady();
  }, [onReady]);
  useEffect(
    () => () => {
      const geometries = new Set<import("three").BufferGeometry>();
      const materials = new Set<import("three").Material>();
      scene.group.traverse((object) => {
        if (object instanceof Mesh || object instanceof LineSegments) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            materials.add(material);
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => {
        if (material instanceof MeshBasicMaterial) material.map?.dispose();
        material.dispose();
      });
    },
    [scene],
  );

  useFrame((_, dt) => {
    const state = driver.current;
    if (!state.inView) return;
    state.p = dampProgress(state.p, state.targetP.current, dt);
    if (Math.abs(state.p - state.targetP.current) < 1e-7)
      state.p = state.targetP.current;
    const p = state.p;
    const moving = Math.abs(state.targetP.current - p) >= 0.0005;
    state.present(p, dt);
    scene.time += dt;
    scene.idleWeight +=
      ((moving || state.reviewStill ? 0 : 1) - scene.idleWeight) *
      (1 - Math.exp(-dt * 12));
    if (floor.current) floor.current.visible = p > 0.2 && p < 0.64;
    if (moving) invalidate();
    else idleTimer.current = setTimeout(invalidate, 1000 / 30);
    sampleCamera(p, scene.position, scene.target);
    if (size.width <= 600) {
      // Narrow K0 needs the whole five-letter strand; orbit shifts below the copy.
      scene.position.z +=
        (1 - range(p, 0.45, 0.65)) * (10 - 5 * range(p, 0.2, 0.3));
      scene.position.x += range(p, 0.2, 0.4) * (1 - range(p, 0.45, 0.65)) * 2.7;
      scene.target.x += range(p, 0.2, 0.4) * (1 - range(p, 0.45, 0.65)) * 2.7;
      scene.target.y -= (1 - range(p, 0.2, 0.3)) * 2.1;
      scene.target.y += range(p, 0.2, 0.4) * (1 - range(p, 0.45, 0.65)) * 3.4;
    }
    if (size.width <= 600) scene.target.x += 0.5 * range(p, 0.65, 0.75);
    camera.position.copy(scene.position);
    camera.lookAt(scene.target);
    camera.updateMatrixWorld();
    scene.pixelRadius.value = size.width <= 600 ? 2 : 3;
    scene.viewportHeight.value = size.height;
    scene.progress.value = p;
    const slide = range(p, 0.2, 0.45);
    scene.interior.value = range(p, 0.64, 0.67);
    scene.wordDrop.value = range(p, 0.2, 0.3) * 4;
    scene.globe.visible = p > 0.2 && p < 0.67;
    scene.globe.position.x = 7 + 7 * (1 - range(p, 0.2, 0.3));
    scene.globe.scale.setScalar(0.92 + 0.08 * range(p, 0.2, 0.3));
    scene.globe.rotation.z = (1 - range(p, 0.2, 0.4)) * -0.25;
    scene.pin
      .getWorldPosition(scene.pinView)
      .applyMatrix4(camera.matrixWorldInverse);
    const pinScale =
      ((size.width <= 600 ? 32 : 48) * 2 * Math.max(0.01, -scene.pinView.z)) /
      (camera.projectionMatrix.elements[5] * size.height * 0.7);
    scene.pin.scale.setScalar(range(p, 0.37, 0.4) * Math.min(1, pinScale));
    scene.plane.visible = p > 0.4;
    const descentT = 0.37 + 0.006 * range(p, 0.4, 0.65);
    const flightT =
      descentT * (1 - range(p, 0.65, 0.7)) + p * range(p, 0.65, 0.7);
    sampleThread(flightT, p, scene.plane.position);
    sampleThread(Math.min(1, flightT + 0.001), p, scene.tangent);
    scene.plane.lookAt(scene.tangent);
    scene.plane.position.y +=
      Math.sin(scene.time * Math.PI * 0.8) * 0.02 * scene.idleWeight;
    scene.plane.scale.setScalar(0.8 - 0.58 * range(p, 0.45, 0.7));
    scene.swarm.visible = p >= 0.65;
    for (let i = 0; i < 70; i++) {
      const t = clamp(flightT - 0.0016 * (i + 1));
      sampleThread(t, p, scene.instance.position);
      sampleThread(Math.min(1, t + 0.001), p, scene.tangent);
      scene.instance.lookAt(scene.tangent);
      scene.instance.rotateZ(Math.sin(i * 2.4) * 0.45);
      const spread = 0.1 + (0.45 * i) / 70;
      scene.instance.position.x += Math.sin(i * 2.4) * spread;
      scene.instance.position.y += Math.cos(i * 2.4) * spread;
      scene.instance.scale.setScalar(
        (0.12 + 0.18 * (1 - i / 70)) * range(p, 0.65, 0.7),
      );
      scene.instance.updateMatrix();
      scene.swarm.setMatrixAt(i, scene.instance.matrix);
    }
    scene.swarm.instanceMatrix.needsUpdate = true;
    scene.tiles.forEach((tile, i) => {
      const start = size.width <= 600 ? 0.134 + i * 0.032 : 0.12 + i * 0.039;
      const t = start * (1 - slide) + (0.37 + i * 0.015) * slide;
      sampleThread(t, p, tile.position);
      tile.quaternion.copy(camera.quaternion);
      tile.rotateZ(
        Math.sin(i * 1.7 + scene.time * Math.PI * 0.8) *
          0.02618 *
          scene.idleWeight,
      );
      tile.scale.setScalar(
        ((size.width <= 600 ? 1.2 : 1.45) * (1 - slide) + 0.4 * slide) *
          tileClick(p, i),
      );
      tile.visible = p < 0.54;
    });
  });

  return (
    <>
      <color attach="background" args={["#F9F4EE"]} />
      <ambientLight intensity={1.4} />
      <directionalLight
        position={[-4, 7, 8]}
        intensity={3}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.001}
      />
      <mesh
        ref={floor}
        visible={false}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[3, -2.25, 0]}
        receiveShadow
      >
        <planeGeometry args={[40, 40]} />
        <shadowMaterial transparent opacity={0.1} />
      </mesh>
      <primitive object={scene.group} />
    </>
  );
}

export default function ThreadCanvas(props: Props) {
  const matcap = useLoader(TextureLoader, matcapUrl);
  return (
    <Canvas
      shadows
      aria-hidden="true"
      dpr={[1, 2]}
      frameloop="demand"
      camera={{ position: [0, 0, 12], fov: 45, near: 0.02, far: 90 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: NoToneMapping,
      }}
    >
      <Scene {...props} matcap={matcap} />
    </Canvas>
  );
}
