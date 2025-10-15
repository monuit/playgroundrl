'use client';

import { useRef } from 'react';
import type { Mesh } from 'three';
import type { BunnyAgent } from '@/app/game/types_new';

interface BunnyAgentProps {
  agent: BunnyAgent;
}

export function BunnyAgentComponent({ agent }: BunnyAgentProps) {
  const groupRef = useRef<Mesh>(null);

  return (
    <group ref={groupRef} position={[agent.x - 12.5, 0.3, agent.y - 12.5]}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#f8a75c" emissive="#ea580c" emissiveIntensity={0.2} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.4, -0.25]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#f8a75c" emissive="#ea580c" emissiveIntensity={0.2} />
      </mesh>

      {/* Left Ear */}
      <mesh position={[-0.15, 0.75, -0.2]}>
        <coneGeometry args={[0.1, 0.25, 8]} />
        <meshStandardMaterial color="#f8a75c" />
      </mesh>

      {/* Right Ear */}
      <mesh position={[0.15, 0.75, -0.2]}>
        <coneGeometry args={[0.1, 0.25, 8]} />
        <meshStandardMaterial color="#f8a75c" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.1, 0.5, -0.45]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      <mesh position={[0.1, 0.5, -0.45]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Tail */}
      <mesh position={[0, -0.1, 0.4]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#f8a75c" />
      </mesh>

      {/* Energy indicator bar */}
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[0.6, 0.08, 0.08]} />
        <meshStandardMaterial
          color={agent.energy > 0.6 ? '#22c55e' : agent.energy > 0.3 ? '#f59e0b' : '#ef4444'}
          emissive={agent.energy > 0.6 ? '#16a34a' : agent.energy > 0.3 ? '#d97706' : '#dc2626'}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}
