'use client';

import { useRef } from 'react';
import type { Mesh } from 'three';
import type { FishAgent } from '@/app/game/types_new';

interface FishAgentProps {
  agent: FishAgent;
}

export function FishAgentComponent({ agent }: FishAgentProps) {
  const groupRef = useRef<Mesh>(null);

  return (
    <group ref={groupRef} position={[agent.x - 12.5, 0.25, agent.y - 12.5]}>
      {/* Body */}
      <mesh position={[0, 0, 0]} rotation={[0, agent.y * 0.1, 0]}>
        <sphereGeometry args={[0.25, 16, 12]} scale={[1, 0.6, 0.6]} />
        <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={0.2} />
      </mesh>

      {/* Head */}
      <mesh position={[0.25, 0, 0]} rotation={[0, agent.y * 0.1, 0]}>
        <sphereGeometry args={[0.15, 12, 10]} />
        <meshStandardMaterial color="#06b6d4" />
      </mesh>

      {/* Tail - upper fin */}
      <mesh position={[-0.35, 0.15, 0]} rotation={[0, agent.y * 0.1, 0.2]}>
        <boxGeometry args={[0.15, 0.2, 0.05]} />
        <meshStandardMaterial color="#0891b2" />
      </mesh>

      {/* Tail - lower fin */}
      <mesh position={[-0.35, -0.15, 0]} rotation={[0, agent.y * 0.1, -0.2]}>
        <boxGeometry args={[0.15, 0.2, 0.05]} />
        <meshStandardMaterial color="#0891b2" />
      </mesh>

      {/* Left fin */}
      <mesh position={[0, 0.15, -0.2]} rotation={[0.3, agent.y * 0.1, 0]}>
        <boxGeometry args={[0.2, 0.15, 0.04]} />
        <meshStandardMaterial color="#067ecc" />
      </mesh>

      {/* Right fin */}
      <mesh position={[0, 0.15, 0.2]} rotation={[-0.3, agent.y * 0.1, 0]}>
        <boxGeometry args={[0.2, 0.15, 0.04]} />
        <meshStandardMaterial color="#067ecc" />
      </mesh>

      {/* Eye */}
      <mesh position={[0.35, 0.08, 0.08]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Energy indicator bar */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.04]} />
        <meshStandardMaterial
          color={agent.energy > 0.6 ? '#22c55e' : agent.energy > 0.3 ? '#f59e0b' : '#ef4444'}
          emissive={agent.energy > 0.6 ? '#16a34a' : agent.energy > 0.3 ? '#d97706' : '#dc2626'}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}
