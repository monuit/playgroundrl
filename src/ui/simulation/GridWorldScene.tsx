"use client";

import { useEffect, useMemo, useRef } from "react";
import { Color, Matrix4, Quaternion, Vector3, type InstancedMesh } from "three";
import { Sparkles } from "@react-three/drei";
import type { GridRenderableState } from "@/lib/simulation/gridWorld";

interface GridWorldSceneProps {
  frame: GridRenderableState;
}

const tileSize = 1;

export function GridWorldScene({ frame }: GridWorldSceneProps) {
  const obstacleRef = useRef<InstancedMesh>(null);
  const rewardRef = useRef<InstancedMesh>(null);
  const agentRef = useRef<InstancedMesh>(null);

  const half = useMemo(() => (frame.size - 1) / 2, [frame.size]);

  const obstaclePositions = useMemo(() => {
    const positions: Array<[number, number]> = [];
    frame.tiles.forEach((tile, index) => {
      if (tile !== 1) {
        return;
      }
      const x = index % frame.size;
      const y = Math.floor(index / frame.size);
      positions.push([x, y]);
    });
    return positions;
  }, [frame.tiles, frame.size]);

  const rewardPositions = useMemo(
    () =>
      frame.rewards.map((reward) => [reward.x, reward.y, reward.value] as [number, number, number]),
    [frame.rewards]
  );

  const agentStates = useMemo(() => frame.agents.slice(0), [frame.agents]);

  useEffect(() => {
    const mesh = obstacleRef.current;
    if (!mesh) {
      return;
    }
    const matrix = new Matrix4();
    const position = new Vector3();
    obstaclePositions.forEach(([gridX, gridY], index) => {
      position.set((gridX - half) * tileSize, 0.35, (gridY - half) * tileSize);
      matrix.makeTranslation(position.x, position.y, position.z);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.count = obstaclePositions.length;
    mesh.instanceMatrix.needsUpdate = true;
  }, [obstaclePositions, half]);

  useEffect(() => {
    const mesh = rewardRef.current;
    if (!mesh) {
      return;
    }
    const matrix = new Matrix4();
    const position = new Vector3();
    const scale = new Vector3(0.5, 0.5, 0.5);
    const orientation = new Quaternion();
    rewardPositions.forEach(([gridX, gridY], index) => {
      position.set((gridX - half) * tileSize, 0.8, (gridY - half) * tileSize);
      matrix.compose(position, orientation, scale);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.count = rewardPositions.length;
    mesh.instanceMatrix.needsUpdate = true;
  }, [rewardPositions, half]);

  useEffect(() => {
    const mesh = agentRef.current;
    if (!mesh) {
      return;
    }
    const matrix = new Matrix4();
    const quaternion = new Quaternion();
    const position = new Vector3();
    const scale = new Vector3(0.65, 1.4, 0.65);
    const up = new Vector3(0, 1, 0);
    const color = new Color();
    agentStates.forEach((agent, index) => {
      position.set((agent.x - half) * tileSize, 0.9, (agent.y - half) * tileSize);
      quaternion.setFromAxisAngle(up, -agent.heading + Math.PI / 2);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
      color.set(agent.color ?? "#38bdf8");
      mesh.setColorAt(index, color);
    });
    mesh.count = agentStates.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [agentStates, half]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[frame.size * tileSize, frame.size * tileSize, frame.size, frame.size]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.05} />
      </mesh>
      <gridHelper
        args={[frame.size * tileSize, frame.size, "#334155", "#1e293b"]}
        position={[0, 0.01, 0]}
      />
      <instancedMesh
        ref={obstacleRef}
        args={[undefined, undefined, Math.max(1, obstaclePositions.length)]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.9, 0.8, 0.9]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.1} />
      </instancedMesh>
      <instancedMesh
        ref={rewardRef}
        args={[undefined, undefined, Math.max(1, rewardPositions.length)]}
        castShadow
      >
        <icosahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial color="#38bdf8" emissive="#22d3ee" emissiveIntensity={0.6} />
      </instancedMesh>
      <instancedMesh
        ref={agentRef}
        args={[undefined, undefined, Math.max(1, agentStates.length)]}
        castShadow
      >
        <coneGeometry args={[0.4, 1.2, 12]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.3} roughness={0.35} />
      </instancedMesh>
      <Sparkles
        size={1.8}
        count={frame.rewards.length * 8 + 32}
        scale={[frame.size, 6, frame.size]}
        speed={0.6}
        opacity={0.4}
      />
    </group>
  );
}
