import { useMemo, useRef, useState, useCallback } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Float, RoundedBox, Sparkles, Trail, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { playBurstPop } from '../utils/popSound';

const BLUE = '#2D8CFF';
const ORANGE = '#FF7A29';
const YELLOW = '#FFD166';
const WHITE = '#F5F5F5';

/* ------------------------------------------------------------------ */
/* Camera rig — gentle mouse parallax                                   */
/* ------------------------------------------------------------------ */
function CameraRig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 1.4, 0.045);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.15 + pointer.y * 0.8, 0.045);
    camera.lookAt(0, 0.2, 0);
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* Paper plane flying a loop, with twin brand-color ribbon trails       */
/* ------------------------------------------------------------------ */
function usePaperPlaneGeometry() {
  return useMemo(() => {
    const nose: [number, number, number] = [0, 0, 1.15];
    const tailTop: [number, number, number] = [0, 0.14, -0.72];
    const wingL: [number, number, number] = [-0.62, 0.36, -0.8];
    const wingR: [number, number, number] = [0.62, 0.36, -0.8];
    const keel: [number, number, number] = [0, -0.28, -0.52];
    const verts = new Float32Array([
      ...nose, ...wingL, ...tailTop, // left wing
      ...nose, ...tailTop, ...wingR, // right wing
      ...nose, ...tailTop, ...keel, // left keel
      ...nose, ...keel, ...tailTop, // right keel
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    g.computeVertexNormals();
    return g;
  }, []);
}

function FlightPath() {
  const geometry = usePaperPlaneGeometry();
  const plane = useRef<THREE.Group>(null!);
  const blueAnchor = useRef<THREE.Mesh>(null!);
  const orangeAnchor = useRef<THREE.Mesh>(null!);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.34;
    const R = 3.05;
    const a = t;
    const x = Math.cos(a) * R;
    const z = Math.sin(a) * R;
    const y = 0.55 + Math.sin(t * 1.6) * 0.35 + Math.sin(a * 2) * 0.22;

    plane.current.position.set(x, y, z);
    tmp.set(-Math.sin(a), 0.14 * Math.cos(a * 2), Math.cos(a)).normalize();
    plane.current.lookAt(tmp.clone().add(plane.current.position));
    plane.current.rotateZ(-0.5); // bank playfully into the turn

    // trail anchors sit just behind the wingtips
    const back = 0.55;
    const side = 0.16;
    blueAnchor.current.position.set(
      x + Math.cos(a) * side + Math.sin(a) * back,
      y - 0.02,
      z + Math.sin(a) * side - Math.cos(a) * back
    );
    orangeAnchor.current.position.set(
      x - Math.cos(a) * side + Math.sin(a) * back,
      y - 0.02,
      z - Math.sin(a) * side - Math.cos(a) * back
    );
  });

  return (
    <>
      <group ref={plane} scale={0.9}>
        <mesh geometry={geometry}>
          <meshStandardMaterial
            color={WHITE}
            roughness={0.35}
            metalness={0.05}
            side={THREE.DoubleSide}
            flatShading
          />
        </mesh>
      </group>
      <Trail width={1.15} length={4.5} color={BLUE} attenuation={(w) => w * w}>
        <mesh ref={blueAnchor}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </Trail>
      <Trail width={1.15} length={4.5} color={ORANGE} attenuation={(w) => w * w}>
        <mesh ref={orangeAnchor}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </Trail>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Floating ornaments                                                   */
/* ------------------------------------------------------------------ */
function useArrowGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.5, -0.12);
    s.lineTo(0.08, -0.12);
    s.lineTo(0.08, -0.3);
    s.lineTo(0.55, 0);
    s.lineTo(0.08, 0.3);
    s.lineTo(0.08, 0.12);
    s.lineTo(-0.5, 0.12);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.045,
      bevelSegments: 3,
    });
    g.center();
    return g;
  }, []);
}

function Arrow3D({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  color = BLUE,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
}) {
  const geometry = useArrowGeometry();
  return (
    <Float speed={2.2} rotationIntensity={0.7} floatIntensity={1.6}>
      <mesh geometry={geometry} position={position} rotation={rotation} scale={scale}>
        <meshPhysicalMaterial color={color} roughness={0.22} clearcoat={1} clearcoatRoughness={0.25} />
      </mesh>
    </Float>
  );
}

function FlareOrb({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <Float speed={2.6} rotationIntensity={0.4} floatIntensity={1.8}>
      <mesh position={position} scale={scale}>
        <sphereGeometry args={[0.3, 48, 48]} />
        <MeshDistortMaterial
          color={ORANGE}
          emissive="#FF5A00"
          emissiveIntensity={0.85}
          roughness={0.3}
          distort={0.38}
          speed={2.4}
        />
      </mesh>
    </Float>
  );
}

function Star3D({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <Float speed={3} rotationIntensity={1.2} floatIntensity={2}>
      <mesh position={position} scale={scale}>
        <octahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial color={YELLOW} emissive={YELLOW} emissiveIntensity={0.55} roughness={0.3} flatShading />
      </mesh>
    </Float>
  );
}

function Donut() {
  return (
    <Float speed={2} rotationIntensity={1.1} floatIntensity={1.4}>
      <mesh position={[2.7, -1.55, 0.9]} rotation={[0.9, 0.3, 0.2]}>
        <torusGeometry args={[0.36, 0.15, 18, 42]} />
        <meshPhysicalMaterial color={YELLOW} roughness={0.25} clearcoat={1} clearcoatRoughness={0.3} />
      </mesh>
    </Float>
  );
}

function Squiggle() {
  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      pts.push(new THREE.Vector3((t - 0.5) * 1.6, Math.sin(t * Math.PI * 3) * 0.22, Math.cos(t * Math.PI * 2) * 0.12));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.05, 10, false);
  }, []);
  return (
    <Float speed={2.4} rotationIntensity={0.8} floatIntensity={1.6}>
      <mesh geometry={geometry} position={[3.7, -0.85, -1.7]} rotation={[0.2, -0.5, 0.4]}>
        <meshPhysicalMaterial color={WHITE} roughness={0.3} clearcoat={0.8} />
      </mesh>
    </Float>
  );
}

function ToyBox({ onBurst }: { onBurst: () => void }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const squash = useRef(1);

  useFrame(() => {
    squash.current = THREE.MathUtils.lerp(squash.current, 1, 0.14);
    mesh.current.scale.setScalar(squash.current);
  });

  return (
    <Float speed={1.4} rotationIntensity={0.55} floatIntensity={0.9}>
      <RoundedBox
        ref={mesh}
        args={[1.7, 1.7, 1.7]}
        radius={0.3}
        smoothness={8}
        position={[0, 0.1, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          squash.current = 0.72;
          onBurst();
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <meshPhysicalMaterial
          color="#1C1C1E"
          roughness={0.18}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.2}
        />
      </RoundedBox>
    </Float>
  );
}

/* ------------------------------------------------------------------ */
/* Discovery hint — soft ripple rings around the toy box until clicked  */
/* ------------------------------------------------------------------ */
function HintRing({ dismissed, onGone }: { dismissed: boolean; onGone: () => void }) {
  const ringA = useRef<THREE.Mesh>(null!);
  const ringB = useRef<THREE.Mesh>(null!);
  const fade = useRef(1);
  const gone = useRef(false);

  useFrame(({ clock }, delta) => {
    if (dismissed) {
      fade.current = THREE.MathUtils.lerp(fade.current, 0, Math.min(1, delta * 7));
      if (fade.current < 0.02) {
        if (!gone.current) {
          gone.current = true;
          onGone();
        }
        return;
      }
    }
    const t = clock.elapsedTime * 0.62;
    const rings: Array<[THREE.Mesh, number]> = [
      [ringA.current, 0],
      [ringB.current, 0.5],
    ];
    for (const [mesh, phase] of rings) {
      const cycle = (t + phase) % 1;
      // shrink slightly while fading out so the ring feels "absorbed" by the box
      mesh.scale.setScalar(Math.max((1.12 + cycle * 1.15) * (0.65 + 0.35 * fade.current), 0.001));
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        Math.sin(cycle * Math.PI) * 0.62 * fade.current;
    }
  });

  // Two explicit rings (not a map over the ref objects) so ref values are
  // never touched during render — they're only read/written inside useFrame.
  return (
    <group position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ringA} raycast={() => null}>
        <ringGeometry args={[0.96, 1, 64]} />
        <meshBasicMaterial
          color={YELLOW}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={ringB} raycast={() => null}>
        <ringGeometry args={[0.96, 1, 64]} />
        <meshBasicMaterial
          color={YELLOW}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Confetti burst — mini arrows & flares popping out of the toy box     */
/* ------------------------------------------------------------------ */
interface BurstParticleData {
  id: number;
  kind: 'arrow' | 'orb';
  pos: [number, number, number];
  vel: THREE.Vector3;
  rotAxis: THREE.Vector3;
  rotSpeed: number;
  scale: number;
  life: number;
  matIndex: number;
}

let burstId = 0;

function spawnBurst(): BurstParticleData[] {
  const parts: BurstParticleData[] = [];
  for (let i = 0; i < 26; i++) {
    const kind = i % 2 === 0 ? 'arrow' : 'orb';
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 0.85 + 0.5,
      (Math.random() - 0.5) * 2
    ).normalize();
    const speed = 3.4 + Math.random() * 3.4;
    parts.push({
      id: ++burstId,
      kind,
      pos: [0, 0.75, 0],
      vel: dir.multiplyScalar(speed),
      rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      rotSpeed: 4 + Math.random() * 8,
      scale: kind === 'arrow' ? 0.45 + Math.random() * 0.3 : 0.7 + Math.random() * 0.5,
      life: 1.6 + Math.random() * 0.7,
      matIndex: Math.floor(Math.random() * 3),
    });
  }
  return parts;
}

function BurstParticle({
  data,
  geometry,
  material,
  onDead,
}: {
  data: BurstParticleData;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  onDead: (id: number) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  const age = useRef(0);
  const vel = useRef(data.vel);

  useFrame((_, delta) => {
    age.current += delta;
    const k = 1 - age.current / data.life;
    if (k <= 0) {
      onDead(data.id);
      return;
    }
    vel.current.y -= 5.2 * delta; // gravity
    vel.current.multiplyScalar(Math.max(1 - 0.45 * delta, 0)); // drag
    mesh.current.position.addScaledVector(vel.current, delta);
    mesh.current.rotation.x += data.rotAxis.x * data.rotSpeed * delta;
    mesh.current.rotation.y += data.rotAxis.y * data.rotSpeed * delta;
    mesh.current.rotation.z += data.rotAxis.z * data.rotSpeed * delta;
    mesh.current.scale.setScalar(Math.max(data.scale * Math.pow(k, 1.3), 0.001));
  });

  return (
    <mesh ref={mesh} geometry={geometry} material={material} position={data.pos} scale={data.scale} />
  );
}

/* ------------------------------------------------------------------ */
/* Full scene                                                           */
/* ------------------------------------------------------------------ */
export function HeroScene({ onInteract }: { onInteract?: () => void }) {
  // Thin out the persistent sparkle field on small screens (measured once at
  // mount — no resize churn). Halves the particle cost on phones.
  const isSmall = useMemo(
    () => typeof window !== 'undefined' && window.innerWidth < 640,
    []
  );
  const arrowGeo = useArrowGeometry();
  const orbGeo = useMemo(() => new THREE.SphereGeometry(0.16, 18, 18), []);
  const arrowMats = useMemo(
    () =>
      ['#2D8CFF', '#4DA3FF', '#FFD166'].map(
        (c) =>
          new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.25 })
      ),
    []
  );
  const orbMats = useMemo(
    () =>
      ['#FF7A29', '#FF5A00', '#FFB27A'].map(
        (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9, roughness: 0.3 })
      ),
    []
  );

  const [particles, setParticles] = useState<BurstParticleData[]>([]);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [hintGone, setHintGone] = useState(() => {
    try {
      return window.localStorage.getItem('snaxx-toybox-hint') === 'done';
    } catch {
      return false;
    }
  });
  const handleBurst = useCallback(() => {
    playBurstPop();
    setParticles((prev) => [...prev.slice(-36), ...spawnBurst()]);
    setHintDismissed(true);
    onInteract?.();
    try {
      window.localStorage.setItem('snaxx-toybox-hint', 'done');
    } catch {
      /* storage unavailable — hint simply reappears next visit */
    }
  }, [onInteract]);
  const handleDead = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <>
      <CameraRig />

      {/* lighting: neutral key + brand-colored rims */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 7, 4]} intensity={1.15} />
      <pointLight position={[-6.5, 2.5, 2.5]} intensity={42} color={BLUE} />
      <pointLight position={[6.5, -1.5, 3]} intensity={42} color={ORANGE} />
      <pointLight position={[0, 4, -4]} intensity={18} color="#FFFFFF" />

      <ToyBox onBurst={handleBurst} />
      {!hintGone && <HintRing dismissed={hintDismissed} onGone={() => setHintGone(true)} />}
      <FlightPath />

      {/* confetti bursts */}
      {particles.map((p) => (
        <BurstParticle
          key={p.id}
          data={p}
          geometry={p.kind === 'arrow' ? arrowGeo : orbGeo}
          material={p.kind === 'arrow' ? arrowMats[p.matIndex] : orbMats[p.matIndex]}
          onDead={handleDead}
        />
      ))}

      {/* orbiting toys */}
      <Arrow3D position={[-3.5, 1.7, -1.4]} rotation={[0.15, 0.35, 0.5]} scale={1.15} />
      <Arrow3D position={[3.6, 0.5, -0.9]} rotation={[-0.1, -0.5, -0.35]} scale={0.85} />
      <Arrow3D position={[-2.3, -1.5, 1.3]} rotation={[0.25, 0.2, 0.9]} scale={0.7} color="#4DA3FF" />
      <FlareOrb position={[3.15, 1.9, -1.3]} />
      <FlareOrb position={[-3.1, -0.7, -0.7]} scale={0.75} />
      <Star3D position={[-1.9, 2.5, -2.1]} />
      <Star3D position={[2.3, 2.9, -1.9]} scale={0.8} />
      <Star3D position={[0.5, -2.3, -1.5]} scale={0.9} />
      <Star3D position={[-3.9, 0.7, 0.5]} scale={0.7} />
      <Donut />
      <Squiggle />

      {/* magic dust */}
      <Sparkles count={isSmall ? 40 : 90} scale={[11, 6, 7]} size={2.4} speed={0.35} color="#9EC5FF" opacity={0.55} />
      <Sparkles count={isSmall ? 22 : 50} scale={[10, 5, 6]} size={2} speed={0.28} color="#FFB27A" opacity={0.45} />
    </>
  );
}
