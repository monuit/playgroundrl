'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { LevelConfig } from '@/app/game/types_new';

interface BunnyGardenL1Props {
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
    <mesh position={[x - 12.5, 0.5, y - 12.5]}>
      <boxGeometry args={[0.8, 1, 0.8]} />
      <meshStandardMaterial color="#ef4444" />
    </mesh>
  );
}

function Goal({ x, y }: { x: number; y: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.05;
      ref.current.position.y = 0.5 + Math.sin(Date.now() * 0.003) * 0.3;
    }
  });

  return (
    <mesh ref={ref} position={[x - 12.5, 0.5, y - 12.5]}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
    </mesh>
  );
}

function BunnyGardenL1Content({ level }: BunnyGardenL1Props) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} />
      <GridFloor />

      {level.staticObstacles.map((obs, idx) => (
        <Obstacle key={`obs-${idx}`} x={obs.x} y={obs.y} />
      ))}

      {level.goalPositions.map((goal, idx) => (
        <Goal key={`goal-${idx}`} x={goal.x} y={goal.y} />
      ))}

      <OrbitControls autoRotate autoRotateSpeed={2} minPolarAngle={0.5} maxPolarAngle={Math.PI - 0.5} />
    </>
  );
}

export function BunnyGardenL1({ level }: BunnyGardenL1Props) {
  return (
    <Canvas camera={{ position: [15, 20, 15], fov: 50 }}>
      <BunnyGardenL1Content level={level} />
    </Canvas>
  );
}

export { BunnyGardenL1Content as BunnyGardenL1Scene };
