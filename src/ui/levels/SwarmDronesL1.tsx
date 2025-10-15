'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import type { LevelConfig } from '@/app/game/types_new';

interface SwarmDronesL1Props {
  level: LevelConfig;
}

function GridFloor() {
  return (
    <Grid
      args={[25, 25]}
      cellSize={1}
      cellColor="#6b7280"
      sectionSize={5}
      sectionColor="#1f2937"
      fadeDistance={30}
      fadeStrength={1}
      infiniteGrid
    />
  );
}

function Obstacle({ x, y }: { x: number; y: number }) {
  return (
    <mesh position={[x - 12.5, 1, y - 12.5]}>
      <boxGeometry args={[0.8, 2, 0.8]} />
      <meshStandardMaterial color="#ef4444" />
    </mesh>
  );
}

function Goal({ x, y }: { x: number; y: number }) {
  return (
    <mesh position={[x - 12.5, 1, y - 12.5]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.5} />
    </mesh>
  );
}

function SwarmDronesL1Content({ level }: SwarmDronesL1Props) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[15, 20, 15]} intensity={0.9} />
      <GridFloor />

      {level.staticObstacles.map((obs, idx) => (
        <Obstacle key={`obs-${idx}`} x={obs.x} y={obs.y} />
      ))}

      {level.goalPositions.map((goal, idx) => (
        <Goal key={`goal-${idx}`} x={goal.x} y={goal.y} />
      ))}

      <OrbitControls autoRotate autoRotateSpeed={3} minPolarAngle={0.3} maxPolarAngle={Math.PI - 0.3} />
    </>
  );
}

export function SwarmDronesL1({ level }: SwarmDronesL1Props) {
  return (
    <Canvas camera={{ position: [18, 25, 18], fov: 50 }}>
      <SwarmDronesL1Content level={level} />
    </Canvas>
  );
}

export { SwarmDronesL1Content as SwarmDronesL1Scene };
