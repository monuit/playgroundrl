'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import type { LevelConfig } from '@/app/game/types_new';

interface ReefGuardiansL1Props {
  level: LevelConfig;
}

function GridFloor() {
  return (
    <Grid
      args={[25, 25]}
      cellSize={1}
      cellColor="#0d7377"
      sectionSize={5}
      sectionColor="#14919b"
      fadeDistance={30}
      fadeStrength={1}
      infiniteGrid
    />
  );
}

function Coral({ x, y }: { x: number; y: number }) {
  return (
    <mesh position={[x - 12.5, 0.5, y - 12.5]}>
      <boxGeometry args={[0.6, 1.2, 0.6]} />
      <meshStandardMaterial color="#ea580c" />
    </mesh>
  );
}

function Algae({ x, y }: { x: number; y: number }) {
  return (
    <mesh position={[x - 12.5, 0.5, y - 12.5]}>
      <sphereGeometry args={[0.35, 12, 12]} />
      <meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={0.3} />
    </mesh>
  );
}

function ReefGuardiansL1Content({ level }: ReefGuardiansL1Props) {
  return (
    <>
      <color attach="background" args={['#001a4d']} />
      <ambientLight intensity={0.5} color="#4dd0e1" />
      <directionalLight position={[10, 20, 10]} intensity={0.6} color="#80deea" />
      <GridFloor />

      {level.staticObstacles.map((obs, idx) => (
        <Coral key={`coral-${idx}`} x={obs.x} y={obs.y} />
      ))}

      {level.goalPositions.map((goal, idx) => (
        <Algae key={`algae-${idx}`} x={goal.x} y={goal.y} />
      ))}

      <OrbitControls autoRotate autoRotateSpeed={2} minPolarAngle={0.2} maxPolarAngle={Math.PI - 0.2} />
    </>
  );
}

export function ReefGuardiansL1({ level }: ReefGuardiansL1Props) {
  return (
    <Canvas camera={{ position: [16, 22, 16], fov: 50 }}>
      <ReefGuardiansL1Content level={level} />
    </Canvas>
  );
}

export { ReefGuardiansL1Content as ReefGuardiansL1Scene };
