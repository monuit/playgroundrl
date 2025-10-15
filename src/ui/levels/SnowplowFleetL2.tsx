'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useRef } from 'react';
import type { Mesh } from 'three';
import type { LevelConfig } from '@/app/game/types_new';

interface SnowplowFleetL2Props {
  level: LevelConfig;
}

function GridFloor() {
  return (
    <Grid
      args={[25, 25]}
      cellSize={1}
      cellColor="#cbd5e1"
      sectionSize={5}
      sectionColor="#94a3b8"
      fadeDistance={30}
      fadeStrength={1}
      infiniteGrid
    />
  );
}

function StaticRock({ x, y }: { x: number; y: number }) {
  return (
    <mesh position={[x - 12.5, 0.5, y - 12.5]}>
      <boxGeometry args={[0.85, 0.9, 0.85]} />
      <meshStandardMaterial color="#475569" />
    </mesh>
  );
}

function TrafficZone({ x, y }: { x: number; y: number }) {
  return (
    <mesh position={[x - 12.5, 0.05, y - 12.5]}>
      <boxGeometry args={[1.5, 0.1, 1.5]} />
      <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
    </mesh>
  );
}

function MovingCar({ id, centerX, centerY }: { id: number; centerX: number; centerY: number }) {
  const ref = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() + id * 2;
    const cycle = Math.sin(t * 0.5);
    ref.current.position.z = (centerY - 12.5) + cycle * 3;
  });

  return (
    <mesh ref={ref} position={[centerX - 12.5, 0.35, centerY - 12.5]}>
      <boxGeometry args={[0.7, 0.5, 1.2]} />
      <meshStandardMaterial color={id % 2 === 0 ? '#dc2626' : '#2563eb'} emissive={id % 2 === 0 ? '#7f1d1d' : '#1e3a8a'} emissiveIntensity={0.2} />
    </mesh>
  );
}

function SnowplowFleetL2Content({ level }: SnowplowFleetL2Props) {
  const staticObstacles = level.staticObstacles.slice(0, Math.max(0, level.staticObstacles.length - 3));
  const carPositions = level.movingObstacles || [];

  return (
    <>
      <color attach="background" args={['#e0e7ff']} />
      <ambientLight intensity={0.6} color="#f0f9ff" />
      <directionalLight position={[15, 22, 15]} intensity={0.8} color="#f5f5f5" />
      <GridFloor />

      {staticObstacles.map((obs, idx) => (
        <StaticRock key={`rock-${idx}`} x={obs.x} y={obs.y} />
      ))}

      {level.goalPositions.map((zone, idx) => (
        <TrafficZone key={`zone-${idx}`} x={zone.x} y={zone.y} />
      ))}

      {carPositions.map((car: typeof carPositions[0], idx: number) => (
        <MovingCar key={`car-${idx}`} id={idx} centerX={car.x} centerY={car.y} />
      ))}

      <OrbitControls autoRotate autoRotateSpeed={2} minPolarAngle={0.35} maxPolarAngle={Math.PI - 0.35} />
    </>
  );
}

export function SnowplowFleetL2({ level }: SnowplowFleetL2Props) {
  return (
    <Canvas camera={{ position: [17, 24, 17], fov: 50 }}>
      <SnowplowFleetL2Content level={level} />
    </Canvas>
  );
}
