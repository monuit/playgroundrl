/**
 * Level 2: Static obstacles + animated moving obstacles
 */
'use client';

import { useMemo, useEffect } from 'react';
import { InstancedMesh, Matrix4 } from 'three';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useWorldStore, LEVEL_TWO } from './store/world';

interface LevelTwoProps {
  onMount?: () => void;
}

export function LevelTwo({ onMount }: LevelTwoProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const obstacleRefRef = useRef<InstancedMesh>(null);
  const movingObstacleRefs = useRef<InstancedMesh>(null);

  // Initialize world store with level data
  useEffect(() => {
    useWorldStore.getState().setLevel(LEVEL_TWO);
    onMount?.();
  }, [onMount]);

  // Floor tiles
  const floorInstances = useMemo(() => {
    const instances = [];
    for (let x = 0; x < LEVEL_TWO.gridSize; x++) {
      for (let y = 0; y < LEVEL_TWO.gridSize; y++) {
        const isStaticObstacle = LEVEL_TWO.staticObstacles.some(
          ([ox, oy]) => ox === x && oy === y
        );
        if (!isStaticObstacle) {
          instances.push({ x, y });
        }
      }
    }
    return instances;
  }, []);

  // Static obstacle instances
  const obstacleInstances = useMemo(() => LEVEL_TWO.staticObstacles, []);

  // Animate moving obstacles
  useFrame(({ clock }) => {
    if (!movingObstacleRefs.current || !LEVEL_TWO.movingObstacles) return;

    const worldStore = useWorldStore.getState();
    const t = clock.getElapsedTime();

    LEVEL_TWO.movingObstacles.forEach((obstacle, idx) => {
      // Oscillate between path bounds
      const [minX, maxX] = obstacle.pathX;
      const [minY, maxY] = obstacle.pathY;

      // Simple sinusoidal motion
      const progress =
        ((Math.sin((t + obstacle.phase) * obstacle.speed) + 1) / 2);

      const x = minX + (maxX - minX) * progress;
      const y = minY + (maxY - minY) * progress;

      // Update position in store
      worldStore.updateMovingObstacle(obstacle.id, x, y);

      // Update mesh transform
      if (movingObstacleRefs.current) {
        const matrix = new Matrix4();
        matrix.setPosition(x, 0, y);
        movingObstacleRefs.current.setMatrixAt(idx, matrix);
        movingObstacleRefs.current.instanceMatrix.needsUpdate = true;
      }
    });
  });

  return (
    <>
      {/* Floor mesh */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, floorInstances.length]}
        position={[0, -0.5, 0]}
      >
        <boxGeometry args={[1, 0.1, 1]} />
        <meshPhongMaterial color="#1a1f36" />
      </instancedMesh>

      {/* Static obstacles */}
      <instancedMesh
        ref={obstacleRefRef}
        args={[undefined, undefined, obstacleInstances.length]}
        position={[0, 0, 0]}
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial
          color="#ff006e"
          emissive="#ff006e"
          emissiveIntensity={0.3}
          wireframe={true}
        />
      </instancedMesh>

      {/* Moving obstacles - animated */}
      <instancedMesh
        ref={movingObstacleRefs}
        args={[undefined, undefined, LEVEL_TWO.movingObstacles?.length || 0]}
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial
          color="#00d9ff"
          emissive="#00d9ff"
          emissiveIntensity={0.4}
          wireframe={true}
        />
      </instancedMesh>

      {/* Goal tile */}
      <mesh
        position={[LEVEL_TWO.goalPosition[0], 0, LEVEL_TWO.goalPosition[1]]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 0.1, 1]} />
        <meshPhongMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
      </mesh>

      {/* Grid helper */}
      <gridHelper args={[25, 25, '#444444', '#222222']} position={[12.5, -0.05, 12.5]} />
    </>
  );
}
