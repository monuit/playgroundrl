"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls, Sparkles, useCursor } from "@react-three/drei";
import * as THREE from "three";

type Level = {
  id: number;
  name: string;
  description: string;
  position: [number, number, number];
  accent: string;
};

const LEVELS: Level[] = [
  {
    id: 0,
    name: "Level 1",
    description: "Gentle meadow with sparse carrots and a forgiving timer.",
    position: [-18, 2.5, -12],
    accent: "#38bdf8",
  },
  {
    id: 1,
    name: "Level 2",
    description: "Maze-like hedges demand smarter exploration.",
    position: [0, 2.5, 18],
    accent: "#a855f7",
  },
  {
    id: 2,
    name: "Level 3",
    description: "Long-horizon hunt with rare, high-value rewards.",
    position: [22, 2.5, -4],
    accent: "#facc15",
  },
];

const BUNNY_COUNT = 28;

type BunnyNode = {
  radius: number;
  speed: number;
  offset: number;
  height: number;
};

type RewardOrb = {
  offset: number;
  radius: number;
  speed: number;
  center: [number, number, number];
};

const buildBunnyNodes = () => {
  const nodes: BunnyNode[] = [];
  for (let i = 0; i < BUNNY_COUNT; i += 1) {
    nodes.push({
      radius: 6 + Math.random() * 22,
      speed: 0.3 + Math.random() * 0.8,
      offset: Math.random() * Math.PI * 2,
      height: 1.2 + Math.random() * 2.8,
    });
  }
  return nodes;
};

const buildRewardOrbs = () =>
  LEVELS.map(
    (level): RewardOrb => ({
      offset: Math.random() * Math.PI * 2,
      radius: 3 + Math.random() * 2,
      speed: 0.5 + Math.random() * 0.4,
      center: [level.position[0] * 0.9, 2.4, level.position[2] * 0.9],
    }),
  );

const BunnySwarm = ({ activeLevel }: { activeLevel: number }) => {
  const swarm = useRef<THREE.InstancedMesh>(null);
  const temp = useMemo(() => new THREE.Object3D(), []);
  const nodes = useMemo(() => buildBunnyNodes(), []);

  useFrame(({ clock }) => {
    if (!swarm.current) {
      return;
    }
    const time = clock.getElapsedTime();
    nodes.forEach((node, index) => {
      const targetLevel = LEVELS[(index + activeLevel) % LEVELS.length];
      const baseAngle = time * node.speed + node.offset;
      const radius = node.radius + Math.sin(baseAngle * 0.6) * 2;
      const x = Math.cos(baseAngle) * radius + targetLevel.position[0] * 0.2;
      const z = Math.sin(baseAngle) * radius + targetLevel.position[2] * 0.2;
      const y = 1 + Math.sin(baseAngle * 1.8) * node.height;

      temp.position.set(x, y, z);
      temp.rotation.set(Math.sin(baseAngle) * 0.6, baseAngle, Math.cos(baseAngle) * 0.3);
      const pulse = 0.6 + (index % 3 === 0 ? 0.35 : 0.2) + Math.sin(baseAngle * 2) * 0.08;
      temp.scale.setScalar(pulse);
      temp.updateMatrix();
      swarm.current!.setMatrixAt(index, temp.matrix);
    });
    swarm.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={swarm} args={[undefined, undefined, nodes.length]}>
      <octahedronGeometry args={[0.9, 0]} />
      <meshStandardMaterial color="#f0f9ff" emissive="#38bdf8" emissiveIntensity={0.45} />
    </instancedMesh>
  );
};

const RewardRing = () => {
  const group = useRef<THREE.Group>(null);
  const rewards = useMemo(() => buildRewardOrbs(), []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (!group.current) {
      return;
    }
    rewards.forEach((reward, index) => {
      const mesh = group.current!.children[index];
      const angle = time * reward.speed + reward.offset;
      const radius = reward.radius + Math.sin(angle * 0.5) * 1.8;
      mesh.position.set(
        reward.center[0] + Math.cos(angle) * radius,
        reward.center[1] + Math.sin(angle * 2) * 1.2,
        reward.center[2] + Math.sin(angle) * radius,
      );
      mesh.rotation.y = angle;
    });
  });

  return (
    <group ref={group}>
      {rewards.map((reward, index) => (
        <mesh key={index}>
          <torusGeometry args={[1.2, 0.32, 16, 48]} />
          <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
};

const LevelMarker = ({
  level,
  active,
  onSelect,
}: {
  level: Level;
  active: boolean;
  onSelect: (id: number) => void;
}) => {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  useFrame(({ clock }) => {
    if (!ref.current) {
      return;
    }
    const t = clock.getElapsedTime();
    const bob = Math.sin(t * 1.5 + level.id) * 0.6;
    ref.current.position.set(level.position[0], level.position[1] + bob, level.position[2]);
    const targetScale = active ? 1.2 : 1;
    const scale = THREE.MathUtils.lerp(ref.current.scale.x, targetScale, 0.08);
    ref.current.scale.setScalar(scale);
  });

  return (
    <group
      ref={ref}
      onPointerEnter={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerLeave={(event) => {
        event.stopPropagation();
        setHovered(false);
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect(level.id);
      }}
    >
      <mesh castShadow>
        <cylinderGeometry args={[1.6, 1.8, 3, 24]} />
        <meshStandardMaterial
          color={level.accent}
          emissive={level.accent}
          emissiveIntensity={active ? 0.8 : 0.4}
        />
      </mesh>
      <mesh position={[0, 2.2, 0]} castShadow>
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.6} />
      </mesh>
      <Html position={[0, 3.6, 0]} center>
        <div className="rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-100 shadow-[0_10px_40px_-24px_rgba(56,189,248,0.8)] backdrop-blur">
          {level.name}
        </div>
      </Html>
    </group>
  );
};

const Board = () => {
  const grid = useMemo(() => {
    const helper = new THREE.GridHelper(64, 32, "#1e3a8a", "#1e40af");
    const material = helper.material as THREE.Material & { opacity: number; transparent: boolean };
    material.opacity = 0.35;
    material.transparent = true;
    return helper;
  }, []);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh receiveShadow position={[0, -0.35, 0]}>
        <boxGeometry args={[70, 2, 70]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[64, 64, 32, 32]} />
        <meshStandardMaterial color="#111c33" wireframe />
      </mesh>
      <primitive object={grid} position={[0, 0.02, 0]} />
      <mesh position={[0, 0.2, 0]} receiveShadow>
        <planeGeometry args={[64, 64]} />
        <meshStandardMaterial color="#1e293b" opacity={0.35} transparent />
      </mesh>
    </group>
  );
};

const PlaygroundScene = ({
  activeLevel,
  onSelect,
}: {
  activeLevel: number;
  onSelect: (id: number) => void;
}) => (
  <group>
    <Sparkles
      count={240}
      speed={0.4}
      size={6}
      scale={[80, 50, 80]}
      opacity={0.28}
      color="#38bdf8"
    />
    <Board />
    <RewardRing />
    <BunnySwarm activeLevel={activeLevel} />
    {LEVELS.map((level) => (
      <LevelMarker key={level.id} level={level} active={level.id === activeLevel} onSelect={onSelect} />
    ))}
    <ambientLight intensity={0.65} color="#cbd5f5" />
    <directionalLight position={[20, 40, 22]} intensity={1.4} castShadow color="#a855f7" />
    <directionalLight position={[-32, 36, -28]} intensity={0.9} color="#38bdf8" />
  </group>
);

const PlaygroundCanvas = ({
  activeLevel,
  onSelect,
}: {
  activeLevel: number;
  onSelect: (id: number) => void;
}) => (
  <Canvas camera={{ position: [0, 40, 76], fov: 36 }} shadows>
    <color attach="background" args={["#020617"]} />
    <PlaygroundScene activeLevel={activeLevel} onSelect={onSelect} />
    <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI / 3} />
  </Canvas>
);

export const HeroPlayground = () => {
  const [activeLevel, setActiveLevel] = useState<number>(0);
  const level = LEVELS.find((entry) => entry.id === activeLevel) ?? LEVELS[0];

  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_0_120px_-38px_rgba(56,189,248,0.7)]">
      <PlaygroundCanvas activeLevel={activeLevel} onSelect={setActiveLevel} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4">
        <div className="flex items-center justify-center gap-2">
          {LEVELS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`pointer-events-auto rounded-full border px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] transition ${
                entry.id === activeLevel
                  ? "border-cyan-400/60 bg-cyan-500/20 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-cyan-400/50 hover:text-white"
              }`}
              onClick={() => setActiveLevel(entry.id)}
            >
              {entry.name}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-center text-xs text-slate-200 backdrop-blur">
          {level.description}
        </div>
      </div>
    </div>
  );
};

export default HeroPlayground;
