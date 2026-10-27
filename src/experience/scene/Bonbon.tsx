/* Renderer-owned mutable objects (materials, nodes) are mutated inside
   useFrame on purpose; they never enter React state. */
/* eslint-disable react-hooks/immutability */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Color, Group, Mesh, MeshPhysicalMaterial, Object3D, type Interpolant, type KeyframeTrack } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import heroUrl from '@/assets/models/hero.glb?url';
import { clamp01, sceneState, smoothstep } from '../sceneState';

// The Blender hero (art/blender/hero): 36 chocolate panels in two halves, an
// amber core, two caramel bands. Its "Open" animation is sampled, not played:
// the scroll owns time, so the shell opens and closes with the page.

/** Unit-radius asset to the plate shell it replaces (r 1.58). */
const SCALE = 1.6;

// Linear values. They start from the Blender material library and are tuned on
// screen to reference 01B, measured in context (art/blender/hero/measure_masked.py,
// core chapter at 50%): caramel hue 21.4 / sat 0.78 / value 0.73 against
// 21.6 / 0.76 / 0.73, core 24.2 / 0.98 / 0.72 against 24.2 / 0.98 / 0.69. The site's
// white light panels washed both out: a full clear coat on the caramel (sat 0.71),
// and white mirror reflections across the core (sat capped near 0.91 however dark
// its body), so the core's reflection is weaker and amber-tinted. Emission unchanged.
const linear = (r: number, g: number, b: number) => new Color().setRGB(r, g, b);

function createMaterials() {
  return {
    Chocolate: new MeshPhysicalMaterial({ color: linear(0.045, 0.016, 0.007), roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.15 }),
    Caramel: new MeshPhysicalMaterial({ color: linear(0.22, 0.045, 0.004), roughness: 0.12, clearcoat: 0.5, clearcoatRoughness: 0.05 }),
    Amber: new MeshPhysicalMaterial({
      color: linear(0.18, 0.02, 0),
      roughness: 0.08,
      clearcoat: 0.4,
      clearcoatRoughness: 0.02,
      specularIntensity: 0.3,
      specularColor: linear(1, 0.45, 0.1),
      emissive: linear(1, 0.3, 0),
      emissiveIntensity: 0.12,
    }),
  };
}

// Set on every track at runtime (the glTF loader picks linear or cubic); missing from the types.
type SampledTrack = KeyframeTrack & { createInterpolant(): Interpolant };

interface Channel {
  node: Object3D;
  property: 'position' | 'scale';
  sample: Interpolant;
}

export default function Bonbon() {
  const gltf = useLoader(GLTFLoader, heroUrl);
  const spin = useRef<Group>(null);
  const phase = useRef(0);
  const materials = useMemo(() => createMaterials(), []);

  const rig = useMemo(() => {
    const replaced = new Set<MeshPhysicalMaterial>();
    gltf.scene.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const name = (o.material as MeshPhysicalMaterial).name as keyof typeof materials;
      if (materials[name] && o.material !== materials[name]) {
        replaced.add(o.material);
        o.material = materials[name];
      }
    });
    replaced.forEach((m) => m.dispose());
    const channels: Channel[] = gltf.animations.flatMap((clip) =>
      clip.tracks.map((track) => {
        const [nodeName, property] = track.name.split('.');
        return { node: gltf.scene.getObjectByName(nodeName)!, property: property as Channel['property'], sample: (track as SampledTrack).createInterpolant() };
      }),
    );
    const duration = Math.max(...gltf.animations.map((c) => c.duration));
    const core = gltf.scene.getObjectByName('Core')!;
    const ribbons = ['Ribbon_A', 'Ribbon_B'].map((n) => gltf.scene.getObjectByName(n)!);
    return { channels, duration, core, ribbons };
  }, [gltf, materials]);

  // The loader caches the parsed model for the page's life; drop it (and free
  // its GPU buffers) on unmount, or every Home -> legal -> Home trip would keep
  // the old renderer alive through its dispose listeners. Deferred a tick and
  // skipped if the component is back: React StrictMode (dev) replays this cleanup
  // on a component that stays mounted, and the model was refetched 4 times.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.setTimeout(() => {
        if (mounted.current) return;
        gltf.scene.traverse((o) => {
          if (o instanceof Mesh) o.geometry.dispose();
        });
        Object.values(materials).forEach((m) => m.dispose());
        useLoader.clear(GLTFLoader, heroUrl);
      }, 0);
    };
  }, [gltf, materials]);

  useFrame((_, delta) => {
    const s = sceneState;
    // Opens over the core chapter (formation 0 -> 1); the awakening starts it half open.
    const open = clamp01(s.formation + s.introFormation);
    const time = open * rig.duration;
    for (const c of rig.channels) c.node[c.property].fromArray(c.sample.evaluate(time) as Float32Array);

    // Core and bands melt away as the camera dives into the open shell along -z: whole at
    // the end of the core chapter (z 4.1), a small bead while the inside copy reads (1.4),
    // gone before the camera crosses the centre and for the rest of the page. (Distance
    // would grow again past the centre and bring the bands back behind the copy.)
    const keep = Math.max(0.0001, smoothstep(0.9, 3.0, s.cam.z));
    rig.core.scale.setScalar(keep);
    rig.core.visible = keep > 0.02;
    for (const r of rig.ribbons) {
      r.scale.multiplyScalar(keep);
      r.visible = keep > 0.02;
    }

    // A slow revolve, accumulated so energy changes never jump the angle.
    phase.current += Math.min(delta, 0.1) * 0.045 * (0.4 + s.energy);
    if (spin.current) {
      spin.current.rotation.y = s.reducedMotion ? 0 : phase.current;
      spin.current.visible = s.cam.z > -4 || s.formation < 1.8;
    }
  });

  return (
    <group ref={spin} scale={SCALE}>
      <primitive object={gltf.scene} />
    </group>
  );
}
