'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import type { LevelConfig } from '@/app/game/types_new';

interface SnowplowFleetL1Props {
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

function Rock({ x, y }: { x: number; y: number }) {
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

function SnowplowFleetL1Content({ level }: SnowplowFleetL1Props) {
  return (
    <>
      <color attach="background" args={['#e0e7ff']} />
      <ambientLight intensity={0.6} color="#f0f9ff" />
      <directionalLight position={[15, 22, 15]} intensity={0.8} color="#f5f5f5" />
      <GridFloor />

      {level.staticObstacles.map((obs, idx) => (
        <Rock key={`rock-${idx}`} x={obs.x} y={obs.y} />
      ))}

      {level.goalPositions.map((zone, idx) => (
        <TrafficZone key={`zone-${idx}`} x={zone.x} y={zone.y} />
      ))}

      <OrbitControls autoRotate autoRotateSpeed={2} minPolarAngle={0.35} maxPolarAngle={Math.PI - 0.35} />
    </>
  );
}

export function SnowplowFleetL1({ level }: SnowplowFleetL1Props) {
  return (
    <Canvas camera={{ position: [17, 24, 17], fov: 50 }}>
      <SnowplowFleetL1Content level={level} />
    </Canvas>
  );
}
