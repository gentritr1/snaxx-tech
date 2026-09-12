/* Three objects are deliberately mutable inside the renderer, never React state. */
/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { dampProgress, type MotionDriver } from "./motion";
import { Canvas, useFrame, useThree, useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { EffectComposer, SMAA } from "@react-three/postprocessing";
import { kitDecoder } from "./kit";
import { JourneyContactShadows } from "./JourneyContactShadows";
import {
  Quaternion,
  Object3D,
  InstancedMesh,
  PerspectiveCamera,
  Group,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  MeshPhysicalMaterial,
  NoToneMapping,
  SRGBColorSpace,
  TextureLoader,
  TubeGeometry,
  Vector3,
  Float32BufferAttribute,
  InstancedBufferAttribute,
} from "three";
import {
  clamp,
  range,
  sampleCamera,
  sampleThread,
  threadCurve,
  tileClick,
  sampleFrame,
  tileParameter,
  planeParameter,
  globeCenter,
  pinAnchor,
  interiorStartT,
  exteriorEndT,
} from "./journey";

import matcapUrl from "./assets/Matcap_Clay.png";
import aoUrl from "./assets/AO_Clay.png";

type Props = {
  driver: RefObject<MotionDriver>;
  letters: string;
  onReady: () => void;
  onFailure: () => void;
};

function Scene({
  driver,
  onReady,
  onFailure,
  matcap,
  ao,
}: Props & { matcap: import("three").Texture; ao: import("three").Texture }) {
  const { camera, gl, size, invalidate } = useThree();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const shadowMoving = useRef(true);
  const kit = useGLTF("/models/red-thread-kit.glb", false, false, (loader) =>
    loader.setDRACOLoader(kitDecoder()),
  );
  const scene = useMemo(() => {
    matcap.colorSpace = SRGBColorSpace;
    ao.flipY = false;
    const clay = new MeshMatcapMaterial({ matcap });
    const occludedClay = clay.clone();
    occludedClay.onBeforeCompile = (shader) => {
      shader.uniforms.clayAO = { value: ao };
      shader.vertexShader = "varying vec2 clayUV;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n clayUV = uv;",
      );
      shader.fragmentShader =
        "varying vec2 clayUV; uniform sampler2D clayAO;\n" +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        "outgoingLight *= mix(1.0, texture2D(clayAO, clayUV).r, 0.9);\n#include <opaque_fragment>",
      );
    };
    const group = new Group();
    const kitMaterials = new Map<string, MeshMatcapMaterial>();
    function object(name: string, aoEnabled = false) {
      const source = kit.scene.getObjectByName(name);
      if (!source) throw new Error(`Missing kit object: ${name}`);
      const clone = source.clone(true);
      clone.traverse((child) => {
        if (child instanceof Mesh) {
          child.geometry = child.geometry.clone();
          if (
            name.startsWith("Tile_") ||
            ["Globe", "Graticule", "Pin", "Plane"].includes(name)
          )
            child.layers.enable(1);
          const original = Array.isArray(child.material)
            ? child.material[0]
            : child.material;
          const color =
            "color" in original
              ? (original.color as import("three").Color)
              : clay.color;
          const key = `${name}:${aoEnabled}:${color.getHexString()}`;
          if (!kitMaterials.has(key)) {
            const material = clay.clone();
            material.color.copy(color);
            if (aoEnabled)
              material.onBeforeCompile = occludedClay.onBeforeCompile;
            kitMaterials.set(key, material);
          }
          child.material = kitMaterials.get(key)!;
        }
      });
      return clone;
    }
    const tiles = ["F", "J", "A", "L", "E"].map((letter) =>
      object("Tile_" + letter, true),
    );
    group.add(...tiles);
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
      interior = { value: 0 },
      progress = { value: 0 };
    // Tube stays 6 CSS px (4 on phones) through the full camera dolly.
    threadMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.interior = interior;
      shader.uniforms.uProgress = progress;
      shader.uniforms.threadPixelRadius = pixelRadius;
      shader.uniforms.threadViewportHeight = viewportHeight;
      shader.vertexShader =
        "varying float threadT; attribute vec3 threadCenter; uniform float threadPixelRadius; uniform float threadViewportHeight;\n" +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `threadT = uv.x; float viewDepth = abs((modelViewMatrix * vec4(threadCenter, 1.0)).z);
        float radius = threadPixelRadius * 2.0 * viewDepth / (projectionMatrix[1][1] * threadViewportHeight);
        vec3 transformed = threadCenter + (position - threadCenter) * radius;
`,
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
        `#include <clipping_planes_fragment>\n if (uProgress <= 0.0 || threadT > uProgress || (interior > .5 && threadT < ${interiorStartT.toFixed(8)}) || (interior <= .5 && threadT > ${exteriorEndT.toFixed(8)})) discard;`,
      );
    };
    const thread = new Mesh(tube, threadMaterial);
    thread.frustumCulled = false;
    group.add(thread);
    const globe = new Group();
    globe.add(object("Globe", true), object("Graticule"));
    globe.position.copy(globeCenter);
    const pin = object("Pin");
    pin.position.copy(pinAnchor).sub(globeCenter);
    globe.add(pin);
    const plane = object("Plane", true);
    const horizon = object("Horizon");
    horizon.scale.setScalar(5);
    horizon.position.set(7, -12, -10);
    group.add(horizon);
    const arrow = object("Arrow");
    let arrowMesh: Mesh | undefined;
    arrow.traverse((child) => {
      if (child instanceof Mesh) arrowMesh = child;
    });
    if (!arrowMesh) throw new Error("Arrow kit mesh is missing");
    const arrowParameters = new InstancedBufferAttribute(
      new Float32Array(70),
      1,
    );
    arrowMesh.geometry.setAttribute("journeyParameter", arrowParameters);
    const arrowMaterial = clay.clone();
    arrowMaterial.onBeforeCompile = (shader) => {
      shader.vertexShader =
        "attribute float journeyParameter; varying float arrowT;\n" +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\n arrowT = journeyParameter;",
      );
      shader.fragmentShader = "varying float arrowT;\n" + shader.fragmentShader;
      // Riders on the exterior strand are occluded by the crossed globe surface.
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>\n if (arrowT < ${interiorStartT.toFixed(8)}) discard;`,
      );
    };
    const swarm = new InstancedMesh(arrowMesh.geometry, arrowMaterial, 70);
    swarm.frustumCulled = false;
    group.add(globe, plane, swarm);
    return {
      globe,
      horizon,
      pin,
      plane,
      swarm,
      arrowParameters,
      instance: new Object3D(),
      frame: new Quaternion(),
      tangent: new Vector3(),
      nextTangent: new Vector3(),
      group,
      tiles,
      tileFrames: tiles.map(() => new Quaternion()),
      tube,
      clay,
      threadMaterial,
      pixelRadius,
      viewportHeight,
      interior,
      progress,
      time: 0,
      idleWeight: 0,
      position: new Vector3(),
      target: new Vector3(),
      pinView: new Vector3(),
    };
  }, [kit, matcap, ao]);

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
    shadowMoving.current = moving && p < 0.64;
    if (moving) invalidate();
    else idleTimer.current = setTimeout(invalidate, 1000 / 30);
    sampleCamera(p, scene.position, scene.target, size.width <= 600);
    if (camera instanceof PerspectiveCamera) {
      camera.setViewOffset(
        size.width,
        size.height,
        (size.width > 600 ? -230 : 110) * range(p, 0.67, 0.72),
        (size.width > 600 ? 110 : 200) * (1 - range(p, 0.2, 0.3)) -
          (size.width > 600 ? 0 : 140) *
            range(p, 0.2, 0.3) *
            (1 - range(p, 0.45, 0.55)) -
          (size.width <= 600 ? 140 : 70) * range(p, 0.67, 0.72) -
          (size.width <= 600 ? 220 : 0) *
            range(p, 0.45, 0.55) *
            (1 - range(p, 0.65, 0.67)),
        size.width,
        size.height,
      );
    }
    camera.position.copy(scene.position);
    camera.lookAt(scene.target);
    camera.updateMatrixWorld();
    scene.pixelRadius.value = size.width <= 600 ? 2 : 3;
    scene.viewportHeight.value = size.height;
    scene.progress.value = p;
    scene.interior.value = range(p, 0.64, 0.67);
    scene.horizon.visible = p > 0.665;
    scene.globe.visible = p > 0.2 && p < 0.67;
    scene.globe.traverse((object) => {
      if (
        object instanceof Mesh &&
        object.material instanceof MeshMatcapMaterial
      ) {
        object.material.transparent = true;
        object.material.opacity = range(p, 0.2, 0.28);
      }
    });
    // Pin and plane arrive together with the globe; no delayed one-shot entry.
    scene.pin.scale.setScalar(1);
    scene.plane.visible = p > 0.2;
    const flightT = planeParameter(p);
    sampleThread(flightT, p, scene.plane.position);
    sampleFrame(flightT, scene.frame);
    scene.plane.quaternion.copy(scene.frame);
    threadCurve.getTangentAt(flightT, scene.tangent);
    threadCurve.getTangentAt(clamp(flightT + 0.003), scene.nextTangent);
    const curvature = scene.tangent.cross(scene.nextTangent).y;
    scene.plane.rotateX(
      Math.max(-Math.PI / 10, Math.min(Math.PI / 10, curvature * 12)),
    );
    scene.plane.position.y +=
      Math.sin(scene.time * Math.PI * 0.8) * 0.02 * scene.idleWeight;
    scene.plane.scale.setScalar(1);
    scene.swarm.visible = p >= 0.665;
    for (let i = 0; i < 70; i++) {
      const t = clamp(flightT - 0.012 * i);
      scene.arrowParameters.setX(i, t);
      sampleThread(t, p, scene.instance.position);
      sampleFrame(t, scene.instance.quaternion);
      scene.instance.translateY(Math.sin(i * 2.4) * 0.08);
      scene.instance.scale.setScalar(0.35 + 0.65 * (1 - i / 70));
      scene.instance.updateMatrix();
      scene.swarm.setMatrixAt(i, scene.instance.matrix);
    }
    scene.swarm.instanceMatrix.needsUpdate = true;
    scene.arrowParameters.needsUpdate = true;
    scene.tiles.forEach((tile, i) => {
      const t = tileParameter(p, i);
      sampleThread(t, p, tile.position);
      sampleFrame(t, scene.frame);
      scene.tileFrames[i].slerp(scene.frame, 1 - Math.exp((-dt * 60) / 6));
      tile.quaternion.copy(scene.tileFrames[i]);
      tile.rotateX(
        Math.sin(i * 1.7 + scene.time * Math.PI * 0.8) *
          0.02618 *
          scene.idleWeight,
      );
      tile.scale.setScalar(tileClick(p, i));
      tile.visible = p < 0.6;
    });
  });

  return (
    <>
      <color attach="background" args={["#F9F4EE"]} />
      <hemisphereLight args={["#ffffff", "#e7ddd3", 0.65]} />
      <directionalLight position={[-4, 7, 8]} intensity={3} />
      <JourneyContactShadows moving={shadowMoving} driver={driver} />
      <primitive object={scene.group} />
      <EffectComposer multisampling={0}>
        <SMAA />
      </EffectComposer>
    </>
  );
}

export default function ThreadCanvas(props: Props) {
  const [matcap, ao] = useLoader(TextureLoader, [matcapUrl, aoUrl]);
  return (
    <Canvas
      aria-hidden="true"
      dpr={[1, 2]}
      frameloop="demand"
      camera={{ position: [0, 0, 12], fov: 45, near: 0.02, far: 90 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: NoToneMapping,
        outputColorSpace: SRGBColorSpace,
      }}
    >
      <Scene {...props} matcap={matcap} ao={ao} />
    </Canvas>
  );
}
