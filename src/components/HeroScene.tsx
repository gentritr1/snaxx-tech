import { useMemo, useRef, useState, useCallback, type ReactNode } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Float, RoundedBox, Sparkles, Trail, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { playBurstPop, playMiniPop } from '../utils/popSound';

const BLUE = '#2D8CFF';
const ORANGE = '#FF7A29';
const YELLOW = '#FFD166';
const WHITE = '#F5F5F5';

/* ------------------------------------------------------------------ */
/* Scene bus — tiny shared state so every toy reacts to play            */
/* ------------------------------------------------------------------ */
const bus = {
  /** 0..1.6, spikes on bursts — plane flies faster and rocks its wings */
  excitement: 0,
  /** performance.now()/1000 timestamp until which party mode runs */
  partyUntil: 0,
  /** recent burst timestamps, for the 5-click party combo */
  recentBursts: [] as number[],
  /** pointer projected onto the z=0 plane, drives magnetic ornaments */
  pointerWorld: new THREE.Vector3(999, 999, 0),
};

/* ------------------------------------------------------------------ */
/* Camera rig — gentle mouse parallax + pointer tracking for the bus    */
/* ------------------------------------------------------------------ */
function CameraRig() {
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const zPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  useFrame(({ camera, pointer }) => {
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 1.4, 0.045);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.15 + pointer.y * 0.8, 0.045);
    camera.lookAt(0, 0.2, 0);
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(zPlane, bus.pointerWorld);
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* Magnetic anchor — ornaments shy away from the cursor, then drift back*/
/* ------------------------------------------------------------------ */
function MagneticAnchor({
  base,
  children,
  radius = 2.1,
  strength = 0.42,
}: {
  base: [number, number, number];
  children: ReactNode;
  radius?: number;
  strength?: number;
}) {
  const group = useRef<THREE.Group>(null!);
  const offset = useRef(new THREE.Vector3());
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    tmp.set(base[0] - bus.pointerWorld.x, base[1] - bus.pointerWorld.y, 0);
    const d = tmp.length();
    if (d < radius && d > 1e-4) {
      target.copy(tmp.normalize().multiplyScalar((1 - d / radius) * strength));
    } else {
      target.set(0, 0, 0);
    }
    offset.current.lerp(target, Math.min(1, delta * 4.5));
    group.current.position.copy(offset.current);
  });

  return <group ref={group}>{children}</group>;
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
  const phase = useRef(2.5);

  useFrame((_, delta) => {
    // excitement from bursts makes the plane zip faster for a while
    phase.current += delta * 0.34 * (1 + bus.excitement * 1.6);
    const t = phase.current;
    const R = 3.05;
    const a = t;
    const x = Math.cos(a) * R;
    const z = Math.sin(a) * R;
    const y = 0.55 + Math.sin(t * 1.6) * 0.35 + Math.sin(a * 2) * 0.22;

    plane.current.position.set(x, y, z);
    tmp.set(-Math.sin(a), 0.14 * Math.cos(a * 2), Math.cos(a)).normalize();
    plane.current.lookAt(tmp.clone().add(plane.current.position));
    // bank into the turn; rocks its wings playfully while excited
    plane.current.rotateZ(-0.5 - Math.sin(t * 5.2) * 0.85 * Math.min(bus.excitement, 1));

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
/* Shooting stars — occasional quiet streaks across the back of the sky */
/* ------------------------------------------------------------------ */
interface StreakData {
  id: number;
  pos: [number, number, number];
  vel: THREE.Vector3;
  life: number;
  angle: number;
}

let streakId = 0;

function ShootingStars() {
  const [streaks, setStreaks] = useState<StreakData[]>([]);
  const nextAt = useRef(performance.now() / 1000 + 5);

  useFrame(() => {
    const now = performance.now() / 1000;
    if (now < nextAt.current) return;
    nextAt.current = now + 6 + Math.random() * 8;
    const fromLeft = Math.random() > 0.5;
    const vel = new THREE.Vector3(
      (5.5 + Math.random() * 2) * (fromLeft ? 1 : -1),
      -(0.9 + Math.random() * 0.8),
      0
    );
    const pos: [number, number, number] = [
      fromLeft ? -7.5 : 7.5,
      2.6 + Math.random() * 2.2,
      -3.5 - Math.random() * 2,
    ];
    setStreaks((s) => [
      ...s.slice(-1),
      { id: ++streakId, pos, vel, life: 1.5, angle: Math.atan2(vel.y, vel.x) },
    ]);
  });

  return (
    <>
      {streaks.map((s) => (
        <Streak
          key={s.id}
          data={s}
          onDead={(id) => setStreaks((x) => x.filter((p) => p.id !== id))}
        />
      ))}
    </>
  );
}

function Streak({ data, onDead }: { data: StreakData; onDead: (id: number) => void }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const age = useRef(0);

  useFrame((_, delta) => {
    age.current += delta;
    const k = age.current / data.life;
    if (k >= 1) {
      onDead(data.id);
      return;
    }
    mesh.current.position.addScaledVector(data.vel, delta);
    (mesh.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(k * Math.PI) * 0.75;
  });

  return (
    <mesh ref={mesh} position={data.pos} rotation={[0, 0, data.angle]} raycast={() => null}>
      <boxGeometry args={[1.7, 0.022, 0.022]} />
      <meshBasicMaterial
        color="#CFE4FF"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
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

/* ------------------------------------------------------------------ */
/* Toy box — hover anticipation, hold-to-charge mega burst              */
/* ------------------------------------------------------------------ */
function ToyBox({ onBurst }: { onBurst: (mega: boolean) => void }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const squash = useRef(1);
  const hoverT = useRef(0);
  const charge = useRef(0);
  const pressStart = useRef<number | null>(null);
  const hovered = useRef(false);

  useFrame(({ clock }, delta) => {
    const target =
      pressStart.current != null
        ? Math.min((performance.now() / 1000 - pressStart.current) / 0.85, 1)
        : 0;
    charge.current = THREE.MathUtils.lerp(charge.current, target, Math.min(1, delta * 16));
    hoverT.current = THREE.MathUtils.lerp(hoverT.current, hovered.current ? 1 : 0, Math.min(1, delta * 9));
    squash.current = THREE.MathUtils.lerp(squash.current, 1, 0.14);

    mesh.current.scale.setScalar(squash.current * (1 + hoverT.current * 0.06 + charge.current * 0.1));
    // excited wobble while charging a mega burst
    mesh.current.rotation.z = charge.current ** 2 * Math.sin(clock.elapsedTime * 34) * 0.07;
    mesh.current.rotation.x = charge.current ** 2 * Math.sin(clock.elapsedTime * 27) * 0.05;
    // warm rim glow rising with anticipation
    mat.current.emissiveIntensity = hoverT.current * 0.05 + charge.current * 0.25;
  });

  const release = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (pressStart.current == null) return;
    const held = performance.now() / 1000 - pressStart.current;
    pressStart.current = null;
    const mega = held > 0.55;
    squash.current = mega ? 0.58 : 0.72;
    onBurst(mega);
  };

  return (
    <Float speed={1.4} rotationIntensity={0.55} floatIntensity={0.9}>
      <RoundedBox
        ref={mesh}
        args={[1.7, 1.7, 1.7]}
        radius={0.3}
        smoothness={8}
        position={[0, 0.1, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          pressStart.current = performance.now() / 1000;
        }}
        onPointerUp={release}
        onPointerOver={(e) => {
          e.stopPropagation();
          hovered.current = true;
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          hovered.current = false;
          pressStart.current = null; // cancel the charge if the pointer slips off
          document.body.style.cursor = 'auto';
        }}
      >
        <meshPhysicalMaterial
          ref={mat}
          color="#1C1C1E"
          roughness={0.18}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.2}
          emissive={ORANGE}
          emissiveIntensity={0}
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

  return (
    <group position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ringA} raycast={() => null}>
        <ringGeometry args={[0.96, 1, 64]} />
        <meshBasicMaterial color={YELLOW} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={ringB} raycast={() => null}>
        <ringGeometry args={[0.96, 1, 64]} />
        <meshBasicMaterial color={YELLOW} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Confetti burst — mini arrows, flares & stars popping out of the box  */
/* ------------------------------------------------------------------ */
type BurstKind = 'arrow' | 'orb' | 'star';

interface BurstParticleData {
  id: number;
  kind: BurstKind;
  pos: [number, number, number];
  vel: THREE.Vector3;
  rotAxis: THREE.Vector3;
  rotSpeed: number;
  scale: number;
  life: number;
  matIndex: number;
}

let burstId = 0;

function spawnBurst(count = 26, power = 1): BurstParticleData[] {
  const parts: BurstParticleData[] = [];
  for (let i = 0; i < count; i++) {
    const kind: BurstKind = i % 5 === 4 ? 'star' : i % 2 === 0 ? 'arrow' : 'orb';
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 0.85 + 0.5,
      (Math.random() - 0.5) * 2
    ).normalize();
    const speed = (3.4 + Math.random() * 3.4) * power;
    parts.push({
      id: ++burstId,
      kind,
      pos: [0, 0.75, 0],
      vel: dir.multiplyScalar(speed),
      rotAxis: new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      rotSpeed: 4 + Math.random() * 8,
      scale:
        kind === 'arrow'
          ? 0.45 + Math.random() * 0.3
          : kind === 'star'
            ? 0.5 + Math.random() * 0.4
            : 0.7 + Math.random() * 0.5,
      life: (1.6 + Math.random() * 0.7) * (power > 1.2 ? 1.25 : 1),
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
/* Party director — runs the 5-click combo: auto mini-bursts + sparkle  */
/* ------------------------------------------------------------------ */
function PartyDirector({
  onPartyBurst,
  onPartyChange,
}: {
  onPartyBurst: () => void;
  onPartyChange: (on: boolean) => void;
}) {
  const nextPop = useRef(0);
  const wasParty = useRef(false);

  useFrame((_, delta) => {
    const now = performance.now() / 1000;
    const party = now < bus.partyUntil;
    if (party !== wasParty.current) {
      wasParty.current = party;
      onPartyChange(party);
    }
    bus.excitement = THREE.MathUtils.lerp(bus.excitement, party ? 1.2 : 0, Math.min(1, delta * 2.2));
    if (party && now >= nextPop.current) {
      nextPop.current = now + 0.45;
      onPartyBurst();
    }
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Full scene                                                           */
/* ------------------------------------------------------------------ */
export function HeroScene({ onInteract }: { onInteract?: () => void }) {
  const isSmall = useMemo(
    () => typeof window !== 'undefined' && window.innerWidth < 640,
    []
  );
  const arrowGeo = useArrowGeometry();
  const orbGeo = useMemo(() => new THREE.SphereGeometry(0.16, 18, 18), []);
  const starGeo = useMemo(() => new THREE.OctahedronGeometry(0.16, 0), []);
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
  const starMats = useMemo(
    () =>
      ['#FFD166', '#FFE3A3', '#D08700'].map(
        (c) =>
          new THREE.MeshStandardMaterial({
            color: c,
            emissive: c,
            emissiveIntensity: 0.7,
            roughness: 0.3,
            flatShading: true,
          })
      ),
    []
  );

  const [particles, setParticles] = useState<BurstParticleData[]>([]);
  const [partyOn, setPartyOn] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [hintGone, setHintGone] = useState(() => {
    try {
      return window.localStorage.getItem('snaxx-toybox-hint') === 'done';
    } catch {
      return false;
    }
  });

  const handleBurst = useCallback(
    (mega: boolean) => {
      playBurstPop(mega);
      onInteract?.(); // lets HeroCanvas resume the render loop under reduced motion
      setParticles((prev) => [
        ...prev.slice(mega ? -70 : -36),
        ...spawnBurst(mega ? 64 : 26, mega ? 1.4 : 1),
      ]);
      setHintDismissed(true);
      try {
        window.localStorage.setItem('snaxx-toybox-hint', 'done');
      } catch {
        /* storage unavailable — hint simply reappears next visit */
      }
      // 5 bursts within 3 seconds kicks off party mode
      const now = performance.now() / 1000;
      bus.recentBursts = bus.recentBursts.filter((t) => now - t < 3);
      bus.recentBursts.push(now);
      if (bus.recentBursts.length >= 5 && now >= bus.partyUntil) {
        bus.partyUntil = now + 3.5;
      }
      bus.excitement = Math.max(bus.excitement, mega ? 1.6 : 1);
    },
    [onInteract]
  );

  const handlePartyBurst = useCallback(() => {
    playMiniPop();
    setParticles((prev) => [...prev.slice(-48), ...spawnBurst(12, 0.85)]);
  }, []);

  const handleDead = useCallback((id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return (
    <>
      <CameraRig />
      <PartyDirector onPartyBurst={handlePartyBurst} onPartyChange={setPartyOn} />

      {/* lighting: neutral key + brand-colored rims */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 7, 4]} intensity={1.15} />
      <pointLight position={[-6.5, 2.5, 2.5]} intensity={42} color={BLUE} />
      <pointLight position={[6.5, -1.5, 3]} intensity={42} color={ORANGE} />
      <pointLight position={[0, 4, -4]} intensity={18} color="#FFFFFF" />

      <ToyBox onBurst={handleBurst} />
      {!hintGone && <HintRing dismissed={hintDismissed} onGone={() => setHintGone(true)} />}
      <FlightPath />
      <ShootingStars />

      {/* confetti bursts */}
      {particles.map((p) => (
        <BurstParticle
          key={p.id}
          data={p}
          geometry={p.kind === 'arrow' ? arrowGeo : p.kind === 'star' ? starGeo : orbGeo}
          material={
            p.kind === 'arrow' ? arrowMats[p.matIndex] : p.kind === 'star' ? starMats[p.matIndex] : orbMats[p.matIndex]
          }
          onDead={handleDead}
        />
      ))}

      {/* orbiting toys — each one shy of the cursor */}
      <MagneticAnchor base={[-3.5, 1.7, -1.4]}>
        <Arrow3D position={[-3.5, 1.7, -1.4]} rotation={[0.15, 0.35, 0.5]} scale={1.15} />
      </MagneticAnchor>
      <MagneticAnchor base={[3.6, 0.5, -0.9]}>
        <Arrow3D position={[3.6, 0.5, -0.9]} rotation={[-0.1, -0.5, -0.35]} scale={0.85} />
      </MagneticAnchor>
      <MagneticAnchor base={[-2.3, -1.5, 1.3]}>
        <Arrow3D position={[-2.3, -1.5, 1.3]} rotation={[0.25, 0.2, 0.9]} scale={0.7} color="#4DA3FF" />
      </MagneticAnchor>
      <MagneticAnchor base={[3.15, 1.9, -1.3]}>
        <FlareOrb position={[3.15, 1.9, -1.3]} />
      </MagneticAnchor>
      <MagneticAnchor base={[-3.1, -0.7, -0.7]}>
        <FlareOrb position={[-3.1, -0.7, -0.7]} scale={0.75} />
      </MagneticAnchor>
      <MagneticAnchor base={[-1.9, 2.5, -2.1]}>
        <Star3D position={[-1.9, 2.5, -2.1]} />
      </MagneticAnchor>
      <MagneticAnchor base={[2.3, 2.9, -1.9]}>
        <Star3D position={[2.3, 2.9, -1.9]} scale={0.8} />
      </MagneticAnchor>
      <MagneticAnchor base={[0.5, -2.3, -1.5]}>
        <Star3D position={[0.5, -2.3, -1.5]} scale={0.9} />
      </MagneticAnchor>
      <MagneticAnchor base={[-3.9, 0.7, 0.5]}>
        <Star3D position={[-3.9, 0.7, 0.5]} scale={0.7} />
      </MagneticAnchor>
      <MagneticAnchor base={[2.7, -1.55, 0.9]}>
        <Donut />
      </MagneticAnchor>
      <MagneticAnchor base={[3.7, -0.85, -1.7]}>
        <Squiggle />
      </MagneticAnchor>

      {/* magic dust */}
      <Sparkles count={isSmall ? 40 : 90} scale={[11, 6, 7]} size={2.4} speed={0.35} color="#9EC5FF" opacity={0.55} />
      <Sparkles count={isSmall ? 22 : 50} scale={[10, 5, 6]} size={2} speed={0.28} color="#FFB27A" opacity={0.45} />

      {/* party mode: golden celebration while the combo runs */}
      {partyOn && (
        <>
          <Sparkles count={isSmall ? 70 : 150} scale={[10, 6, 6]} size={3.6} speed={1.7} color={YELLOW} opacity={0.85} />
          <pointLight position={[0, 2.6, 1.6]} intensity={26} color={YELLOW} />
        </>
      )}
    </>
  );
}
