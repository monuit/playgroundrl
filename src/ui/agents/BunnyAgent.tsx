'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { BunnyAgent } from '@/types/game';

// TODO: Replace primitive meshes with GLTF model when available
// import { useGLTF } from '@react-three/drei';
// useGLTF.preload('/models/bunny.glb');

interface BunnyAgentProps {
  agent: BunnyAgent;
}

export function BunnyAgentComponent({ agent }: BunnyAgentProps) {
  const groupRef = useRef<Group>(null);

  // Animate the bunny with a subtle bounce based on energy
  useFrame((state) => {
    if (groupRef.current) {
      const bounce = Math.sin(state.clock.elapsedTime * 3) * 0.05 * agent.energy;
      groupRef.current.position.y = 0.3 + bounce;
    }
  });

  // TODO: When GLTF model is available, use:
  // const { nodes, materials } = useGLTF('/models/bunny.glb');
  // return <primitive object={nodes.Bunny} material={materials.BunnyMaterial} ... />

  return (
    <group ref={groupRef} position={[agent.x - 12.5, 0.3, agent.y - 12.5]}>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial 
          color="#f8a75c" 
          emissive="#ea580c" 
          emissiveIntensity={0.2 * agent.energy}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.4, -0.25]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color="#f8a75c" 
          emissive="#ea580c" 
          emissiveIntensity={0.2 * agent.energy}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Left Ear */}
      <mesh position={[-0.15, 0.75, -0.2]} castShadow>
        <coneGeometry args={[0.1, 0.25, 8]} />
        <meshStandardMaterial 
          color="#f8a75c"
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>

      {/* Right Ear */}
      <mesh position={[0.15, 0.75, -0.2]} castShadow>
        <coneGeometry args={[0.1, 0.25, 8]} />
        <meshStandardMaterial 
          color="#f8a75c"
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.1, 0.5, -0.45]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial 
          color="#000000"
          emissive="#ffffff"
          emissiveIntensity={0.1}
        />
      </mesh>

      <mesh position={[0.1, 0.5, -0.45]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial 
          color="#000000"
          emissive="#ffffff"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Tail */}
      <mesh position={[0, -0.1, 0.4]} castShadow>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial 
          color="#f8a75c"
          roughness={0.6}
        />
      </mesh>

      {/* Energy indicator bar */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.6, 0.08, 0.08]} />
        <meshStandardMaterial
          color={agent.energy > 0.6 ? '#22c55e' : agent.energy > 0.3 ? '#f59e0b' : '#ef4444'}
          emissive={agent.energy > 0.6 ? '#16a34a' : agent.energy > 0.3 ? '#d97706' : '#dc2626'}
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}

