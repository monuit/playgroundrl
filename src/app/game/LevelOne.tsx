/**
 * Level 1: Static obstacles only
 */
'use client';

import { useMemo } from 'react';
import { InstancedMesh } from 'three';
import { useRef, useEffect } from 'react';
import { useWorldStore } from './store/world';
import { LEVEL_ONE } from './store/world';

interface LevelOneProps {
  onMount?: () => void;
}

export function LevelOne({ onMount }: LevelOneProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const obstacleRefRef = useRef<InstancedMesh>(null);

  // Initialize world store with level data
  useEffect(() => {
    useWorldStore.getState().setLevel(LEVEL_ONE);
    onMount?.();
  }, [onMount]);

  // Floor tiles (instanced)
  const floorInstances = useMemo(() => {
    const instances = [];
    for (let x = 0; x < LEVEL_ONE.gridSize; x++) {
      for (let y = 0; y < LEVEL_ONE.gridSize; y++) {
        // Skip goal and obstacles for now
        const isObstacle = LEVEL_ONE.staticObstacles.some(
          ([ox, oy]) => ox === x && oy === y
        );
        if (!isObstacle) {
          instances.push({ x, y });
        }
      }
    }
    return instances;
  }, []);

  // Obstacle instances
  const obstacleInstances = useMemo(() => LEVEL_ONE.staticObstacles, []);

  return (
    <>
      {/* Floor mesh - thin box planes */}
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, floorInstances.length]}
        position={[0, -0.5, 0]}
      >
        <boxGeometry args={[1, 0.1, 1]} />
        <meshPhongMaterial color="#1a1f36" />
      </instancedMesh>

      {/* Obstacle mesh - hologram style */}
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

      {/* Goal tile */}
      <mesh
        position={[LEVEL_ONE.goalPosition[0], 0, LEVEL_ONE.goalPosition[1]]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 0.1, 1]} />
        <meshPhongMaterial color="#00d9ff" emissive="#00d9ff" emissiveIntensity={0.5} />
      </mesh>

      {/* Grid helper visualization */}
      <gridHelper args={[25, 25, '#444444', '#222222']} position={[12.5, -0.05, 12.5]} />
    </>
  );
}
