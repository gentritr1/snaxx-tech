/* Renderer-owned mutable objects never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  AnimationMixer, Box3, Color, DirectionalLight, Group, Object3D, PlaneGeometry, ShadowMaterial, Vector3, FileLoader, Float32BufferAttribute, LoopOnce, Mesh,
  MeshBasicMaterial, MeshMatcapMaterial, MeshPhysicalMaterial, NoToneMapping,
  PerspectiveCamera, SRGBColorSpace, TextureLoader, TubeGeometry,
  VSMShadowMap, type Material, type Texture,
} from "three";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { measureJourney } from "./review";
import { JourneyContactShadows } from "./JourneyContactShadows";
import { kitDecoder } from "./kit";
import { dampProgress, type MotionDriver } from "./motion";
import { createThreadCurve, sampleScalar, type JourneyData } from "./journey";
import matcapUrl from "./assets/Matcap_Clay.png";
import oceanUrl from "./assets/Matcap_Clay_Ocean.png";
import landUrl from "./assets/Matcap_Clay_Land.png";
import outsideUrl from "./assets/Matcap_Clay_Outside.png";
import insideUrl from "./assets/Matcap_Clay_Inside.png";
import aoUrl from "./assets/AO_Clay.png";

type Props = {
  driver: RefObject<MotionDriver>;
  phone: boolean;
  onReady: () => void;
  onFailure: (reason?: string) => void;
};

function Scene({ driver, onReady, onFailure, kit, data, textures }: Props & {
  kit: Pick<GLTF, "scene" | "animations">; data: JourneyData; textures: Texture[];
}) {
  const { gl, size, set, invalidate } = useThree();
  const scene = useMemo(() => {
    if (kit.animations.length !== 1 || kit.animations[0].name !== "Journey")
      throw new Error("Expected exactly one baked Journey clip");
    const [matcap, ocean, land, ao, outside, inside] = textures;
    for (const texture of [matcap, ocean, land, outside, inside]) texture.colorSpace = SRGBColorSpace;
    ao.flipY = false;
    const root = kit.scene.clone(true);
    const camera = root.getObjectByName("Camera");
    if (!(camera instanceof PerspectiveCamera)) throw new Error("Journey camera missing");
    const materials: Material[] = [];
    // The staged camera-facing K0 receiver also occludes the route behind it.
    const backdrop = new Group();
    const backdropGeometry = new PlaneGeometry(200, 200);
    const backdropMaterial = new MeshBasicMaterial({ color: "#FEFBF8" });
    const shadowMaterial = new ShadowMaterial({ opacity: .32, depthWrite: false });
    const backdropBase = new Mesh(backdropGeometry, backdropMaterial);
    const backdropShadow = new Mesh(backdropGeometry, shadowMaterial);
    backdropShadow.position.z = .001;backdropShadow.receiveShadow = true;
    backdrop.add(backdropBase, backdropShadow);root.add(backdrop);
    materials.push(backdropMaterial, shadowMaterial);
    const sun = new DirectionalLight("#ffffff", 2);
    const sunTarget = new Object3D();sun.target = sunTarget;
    sun.shadow.mapSize.set(1024, 1024);sun.shadow.radius = 4;sun.shadow.blurSamples = 8;
    Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, near: .1, far: 250 });
    sun.shadow.normalBias = .02;sun.shadow.bias = -.0001;
    root.add(sun, sunTarget);
    const tile = root.getObjectByName("Tile_A")!;
    const lightDirection = new Vector3(-10, 12, 12).normalize();
    const tiles = root.children.filter(object => object.name.startsWith("Tile_"));
    const offset = new Vector3();
    const clayCache = new Map<string, MeshMatcapMaterial>();
    const uniforms = {
      start: { value: 0 }, end: { value: 0 }, radius: { value: data.pixelRadius },
      height: { value: 900 }, width: { value: 1440 },
      bufferHeight: { value: 900 }, bufferWidth: { value: 1440 },
    };
    function clay(original: Material, name: string) {
      const globe = name === "Globe";
      const atlas = name.startsWith("Tile_") || name === "Plane";
      const color = name === "Graticule" ? new Color("#E9E3DA")
        : name.startsWith("Arrow") ? new Color("#EFEAE2")
        : globe ? new Color("#ffffff")
        : "color" in original ? (original.color as Color) : new Color("#ffffff");
      const key = `${globe}:${atlas}:${color.getHexString()}`;
      const cached = clayCache.get(key);
      if (cached) return cached;
      const material = new MeshMatcapMaterial({ matcap, color, vertexColors: globe });
      material.customProgramCacheKey = () => key;
      material.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
          "vec4 matcapColor = texture2D( matcap, uv );",
          "uv = (uv - 0.5) * (2.0 / 2.08) + 0.5;\nvec4 matcapColor = texture2D( matcap, uv );");
        if (globe) {
          shader.uniforms.landMatcap = { value: land };
          shader.uniforms.oceanMatcap = { value: ocean };
          shader.uniforms.landTint = { value: new Color("#FBF8F2") };
          shader.uniforms.oceanTint = { value: new Color("#F3EDE4") };
          shader.fragmentShader = "uniform sampler2D landMatcap; uniform sampler2D oceanMatcap; uniform vec3 landTint; uniform vec3 oceanTint;\n" + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "");
          shader.fragmentShader = shader.fragmentShader.replace(
            "vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;",
            `float landWeight = clamp(vColor.r, 0.0, 1.0);
             vec3 roughClay = mix(texture2D(oceanMatcap, uv).rgb, texture2D(landMatcap, uv).rgb, landWeight);
             vec3 outgoingLight = diffuseColor.rgb * roughClay * mix(oceanTint, landTint, landWeight) * vColor.g;`);
        } else if (atlas) {
          shader.uniforms.clayAO = { value: ao };
          shader.vertexShader = "varying vec2 clayUV;\n" + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nclayUV = uv;");
          shader.fragmentShader = "varying vec2 clayUV; uniform sampler2D clayAO;\n" + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", "outgoingLight *= mix(1.0, texture2D(clayAO, clayUV).r, .55);\n#include <opaque_fragment>");
        }
      };
      clayCache.set(key, material);materials.push(material);return material;
    }
    root.traverse((object) => {
      if (!(object instanceof Mesh) || object.name === "Thread" || object === backdropBase || object === backdropShadow) return;
      object.frustumCulled = false;
      if (object.name !== "Globe_Inner") object.layers.enable(1);
      object.castShadow = object.name.startsWith("Tile_");
      if (object.name === "Globe_Inner") {
        const material = new MeshBasicMaterial({ color: "#F9F4EE" });
        material.onBeforeCompile = (shader) => {
          shader.uniforms.viewportHeight = uniforms.bufferHeight;
          shader.uniforms.viewportWidth = uniforms.bufferWidth;
          shader.fragmentShader = "uniform float viewportHeight; uniform float viewportWidth;\n" + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>",
            `float x = gl_FragCoord.x / viewportWidth;
             float y = gl_FragCoord.y / viewportHeight + .48 * (x - .5) * (x - .5);
             outgoingLight *= mix(.94, 1.0, clamp(y / .2, 0.0, 1.0));\n#include <opaque_fragment>`);
        };
        object.material = material;materials.push(material);
      } else {
        object.material = Array.isArray(object.material)
          ? object.material.map((material) => clay(material, object.name))
          : clay(object.material, object.name);
      }
    });
    const thread = root.getObjectByName("Thread");
    if (!(thread instanceof Mesh)) throw new Error("Journey Thread mesh missing");
    const curve = createThreadCurve(data);
    const segments = data.points.length - 1, radial = 12;
    const tube = new TubeGeometry(curve, segments, 1, radial, false);
    const centres = new Float32Array(tube.attributes.position.count * 3);
    for (let i = 0; i <= segments; i++) {
      const centre = curve.getPointAt(i / segments);
      for (let j = 0; j <= radial; j++) centre.toArray(centres, (i * (radial + 1) + j) * 3);
    }
    tube.setAttribute("threadCenter", new Float32BufferAttribute(centres, 3));
    const cord = new MeshPhysicalMaterial({ color: "#D73626", emissive: "#D73626", emissiveIntensity: .32,
      roughness: .28, clearcoat: .1, clearcoatRoughness: .3, metalness: 0, envMapIntensity: 0 });
    cord.onBeforeCompile = (shader) => {
      shader.uniforms.threadStart = uniforms.start;shader.uniforms.threadEnd = uniforms.end;
      shader.uniforms.threadRadius = uniforms.radius;shader.uniforms.viewportHeight = uniforms.height;
      shader.vertexShader = "attribute vec3 threadCenter; varying float threadT; uniform float threadRadius; uniform float viewportHeight;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>",
        `threadT = uv.x;
         float depth = -(modelViewMatrix * vec4(threadCenter, 1.0)).z;
         float radius = max(.0000055, threadRadius * 2.0 * depth / (projectionMatrix[1][1] * viewportHeight));
         vec3 transformed = threadCenter + (position - threadCenter) * radius;`);
      shader.fragmentShader = "varying float threadT; uniform float threadStart; uniform float threadEnd;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\nif (threadEnd <= 0.0 || threadT < threadStart || threadT > threadEnd) discard;");
    };
    thread.geometry = tube;thread.material = cord;thread.frustumCulled = false;materials.push(cord);
    const mixer = new AnimationMixer(root);
    const action = mixer.clipAction(kit.animations[0]);
    action.setLoop(LoopOnce, 1);action.clampWhenFinished = true;action.play();
    const horizontal = Math.tan(camera.fov * Math.PI / 360) * (data.referenceSize[0] / data.referenceSize[1]);
    return { root, camera, mixer, action, horizontal, uniforms, tube, materials, backdrop, backdropGeometry, sun, sunTarget, tile, lightDirection, offset, clayCache, matcaps: [matcap, outside, inside], tiles, shadowFit: false };
  }, [kit, data, textures]);
  const ready = useRef(false);
  useEffect(() => {
    gl.shadowMap.type = VSMShadowMap;
    set({ camera: scene.camera });
    scene.camera.aspect = size.width / size.height;
    scene.camera.fov = 2 * Math.atan(scene.horizontal / scene.camera.aspect) * 180 / Math.PI;
    scene.camera.updateProjectionMatrix();
    scene.uniforms.height.value = size.height;
    scene.uniforms.width.value = size.width;
    scene.uniforms.bufferHeight.value = size.height * gl.getPixelRatio();
    scene.uniforms.bufferWidth.value = size.width * gl.getPixelRatio();
    const state = driver.current;
    state.wake = () => { if (state.inView) invalidate(); };
    invalidate();
    return () => { state.wake = () => {}; };
  }, [scene, size, set, invalidate, driver, gl]);
  useEffect(() => {
    const hero = gl.domElement.closest<HTMLElement>("#hero");
    const measure = () => {
      if (hero) hero.dataset.geometryAudit = JSON.stringify(measureJourney(scene.root, scene.camera, data, driver.current.p, size.width, size.height));
    };
    hero?.addEventListener("hero:measure", measure);
    return () => hero?.removeEventListener("hero:measure", measure);
  }, [gl, scene, data, driver, size]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault();onFailure("WebGL context lost"); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  useEffect(() => () => {
    scene.mixer.stopAllAction();scene.mixer.uncacheRoot(scene.root);
    scene.backdropGeometry.dispose();scene.sun.shadow.dispose();
    scene.tube.dispose();scene.materials.forEach((material) => material.dispose());
  }, [scene]);
  useFrame((_, dt) => {
    const state = driver.current;
    if (!state.inView) return;
    state.p = dampProgress(state.p, state.targetP.current, dt);
    if (Math.abs(state.p - state.targetP.current) < 1e-7) state.p = state.targetP.current;
    const p = state.p;
    scene.action.paused = false;
    scene.mixer.setTime(p * data.duration);
    scene.root.updateMatrixWorld(true);
    scene.backdrop.visible = p <= .20;
    scene.backdrop.quaternion.copy(scene.camera.quaternion);
    scene.offset.set(0, 0, -scene.tile.scale.x * .195).applyQuaternion(scene.camera.quaternion);
    scene.backdrop.position.copy(scene.tile.position).add(scene.offset);
    scene.sun.intensity = p < .20 ? 2 : p < .67 ? 2.2 : 3.2;
    for (const material of scene.clayCache.values()) material.matcap = scene.matcaps[p < .20 ? 0 : p < .67 ? 1 : 2];
    scene.sun.castShadow = p <= .20;
    scene.sunTarget.position.copy(scene.tile.position);
    scene.offset.copy(scene.lightDirection).applyQuaternion(scene.camera.quaternion).multiplyScalar(100);
    scene.sun.position.copy(scene.tile.position).add(scene.offset);
    scene.root.updateMatrixWorld(true);
    if (p <= .20 && !scene.shadowFit) {
      // Fit the shadow map to the authored tile group, avoiding coarse texels
      // in the phone scene. This changes the receiver resolution, not its pose.
      scene.sun.shadow.updateMatrices(scene.sun);
      const bounds = new Box3();
      for (const tile of scene.tiles) bounds.union(new Box3().setFromObject(tile));
      const lightBounds = new Box3();
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z])
        lightBounds.expandByPoint(new Vector3(x,y,z).applyMatrix4(scene.sun.shadow.camera.matrixWorldInverse));
      Object.assign(scene.sun.shadow.camera, {left:lightBounds.min.x - 1, right:lightBounds.max.x + 1, bottom:lightBounds.min.y - 1, top:lightBounds.max.y + 1});
      scene.sun.shadow.camera.updateProjectionMatrix();scene.shadowFit = true;
    }
    scene.uniforms.start.value = sampleScalar(data.reveal.start, p);
    scene.uniforms.end.value = sampleScalar(data.reveal.end, p);
    scene.root.visible = state.targetP.current < 1;
    state.present(p, dt);
    if (!ready.current) { ready.current = true;onReady(); }
    if (Math.abs(state.p - state.targetP.current) > 1e-7) invalidate();
  }, -1);
  return <>
    <color attach="background" args={["#FEFBF8"]} />
    {/* Constant world radiance .45 integrates to pi * .45 irradiance. */}
    <hemisphereLight args={["#ffffff", "#ffffff", Math.PI * .45]} />
    <primitive object={scene.root} />
    <JourneyContactShadows driver={driver} />
  </>;
}

export default function ThreadCanvas(props: Props) {
  // Resolve assets before mounting Canvas: suspending a live Canvas disposes
  // its context and can race the resumed scene's context-loss listener.
  const variant = props.phone ? "390" : "1440";
  const kit = useGLTF(`/models/red-thread-kit-${variant}.glb`, false, false,
    (loader) => loader.setDRACOLoader(kitDecoder()));
  const json = useLoader(FileLoader, `/models/journey-spline-${variant}.json`);
  const data = useMemo(() => JSON.parse(json as string) as JourneyData, [json]);
  const textures = useLoader(TextureLoader, [matcapUrl, oceanUrl, landUrl, aoUrl, outsideUrl, insideUrl]);
  return <Canvas shadows aria-hidden="true" dpr={[1, 2]} frameloop="demand"
    gl={{ logarithmicDepthBuffer: true, antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: NoToneMapping, outputColorSpace: SRGBColorSpace }}>
    <Scene {...props} kit={kit} data={data} textures={textures} />
  </Canvas>;
}
