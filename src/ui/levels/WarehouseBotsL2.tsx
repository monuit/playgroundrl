'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type { LevelConfig } from '@/app/game/types_new';

interface WarehouseBotsL2Props {
  level: LevelConfig;
}

function GridFloor() {
  return (
    <Grid
      args={[25, 25]}
      cellSize={1}
      cellColor="#9ca3af"
      sectionSize={5}
      sectionColor="#6b7280"
      fadeDistance={30}
      fadeStrength={1}
      infiniteGrid
    />
  );
}

function StaticObstacle({ x, y }: { x: number; y: number }) {
  return (
    <mesh position={[x - 12.5, 0.5, y - 12.5]}>
      <boxGeometry args={[0.9, 1, 0.9]} />
      <meshStandardMaterial color="#64748b" />
    </mesh>
  );
}

function Traffic({ x, y }: { x: number; y: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.04;
    }
  });

  return (
    <mesh ref={ref} position={[x - 12.5, 0.8, y - 12.5]}>
      <boxGeometry args={[1, 1.5, 0.4]} />
      <meshStandardMaterial color="#f59e0b" />
    </mesh>
  );
}

function DeliveryZone({ x, y }: { x: number; y: number }) {
  return (
    <mesh position={[x - 12.5, 0.05, y - 12.5]}>
      <boxGeometry args={[1.2, 0.1, 1.2]} />
      <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.4} />
    </mesh>
  );
}

function WarehouseBotsL2Content({ level }: WarehouseBotsL2Props) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[12, 18, 12]} intensity={0.8} />
      <GridFloor />

      {level.staticObstacles.map((obs, idx) => (
        <StaticObstacle key={`obs-${idx}`} x={obs.x} y={obs.y} />
      ))}

      {(level.movingObstacles || []).map((mov, idx) => (
        <Traffic key={`traffic-${idx}`} x={mov.x} y={mov.y} />
      ))}

      {level.goalPositions.map((zone, idx) => (
        <DeliveryZone key={`zone-${idx}`} x={zone.x} y={zone.y} />
      ))}

      <OrbitControls autoRotate autoRotateSpeed={2} minPolarAngle={0.4} maxPolarAngle={Math.PI - 0.4} />
    </>
  );
}

export function WarehouseBotsL2({ level }: WarehouseBotsL2Props) {
  return (
    <Canvas camera={{ position: [17, 23, 17], fov: 50 }}>
      <WarehouseBotsL2Content level={level} />
    </Canvas>
  );
}
