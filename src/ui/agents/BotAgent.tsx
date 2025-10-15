'use client';

import { useRef } from 'react';
import type { Mesh } from 'three';
import type { BotAgent } from '@/types/game';

interface BotAgentProps {
  agent: BotAgent;
}

export function BotAgentComponent({ agent }: BotAgentProps) {
  const groupRef = useRef<Mesh>(null);

  return (
    <group ref={groupRef} position={[agent.x - 12.5, 0.25, agent.y - 12.5]}>
      {/* Main body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.35, 0.45, 0.35]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#7c3aed" emissiveIntensity={0.15} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.3, 0.25, 0.3]} />
        <meshStandardMaterial color="#8b5cf6" />
      </mesh>

      {/* Left wheel */}
      <mesh position={[-0.2, -0.05, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Right wheel */}
      <mesh position={[0.2, -0.05, -0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Back wheel */}
      <mesh position={[0, -0.05, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Screen/Display */}
      <mesh position={[0, 0.15, 0.18]}>
        <boxGeometry args={[0.25, 0.15, 0.02]} />
        <meshStandardMaterial color="#0f172a" emissive="#10b981" emissiveIntensity={0.5} />
      </mesh>

      {/* Carrying indicator */}
      {agent.carrying && (
        <mesh position={[0, 0, -0.2]}>
          <boxGeometry args={[0.3, 0.25, 0.15]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={0.2} />
        </mesh>
      )}

      {/* Battery indicator bar */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.4, 0.06, 0.06]} />
        <meshStandardMaterial
          color={agent.battery > 60 ? '#22c55e' : agent.battery > 30 ? '#f59e0b' : '#ef4444'}
          emissive={agent.battery > 60 ? '#16a34a' : agent.battery > 30 ? '#d97706' : '#dc2626'}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}
