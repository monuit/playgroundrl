'use client';

import { useRef } from 'react';
import type { Mesh } from 'three';
import type { DroneAgent } from '@/app/game/types_new';

interface DroneAgentProps {
  agent: DroneAgent;
}

export function DroneAgentComponent({ agent }: DroneAgentProps) {
  const groupRef = useRef<Mesh>(null);

  return (
    <group ref={groupRef} position={[agent.x - 12.5, 0.4, agent.y - 12.5]}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.35, 0.15, 0.35]} />
        <meshStandardMaterial color="#6366f1" emissive="#4f46e5" emissiveIntensity={0.2} />
      </mesh>

      {/* Front arm */}
      <mesh position={[0.25, 0, 0]}>
        <boxGeometry args={[0.35, 0.05, 0.05]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>

      {/* Back arm */}
      <mesh position={[-0.25, 0, 0]}>
        <boxGeometry args={[0.35, 0.05, 0.05]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>

      {/* Front left rotor */}
      <mesh position={[0.4, 0.08, 0.15]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>

      {/* Front right rotor */}
      <mesh position={[0.4, 0.08, -0.15]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>

      {/* Back left rotor */}
      <mesh position={[-0.4, 0.08, 0.15]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>

      {/* Back right rotor */}
      <mesh position={[-0.4, 0.08, -0.15]}>
        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>

      {/* Camera */}
      <mesh position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Battery indicator bar */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.06]} />
        <meshStandardMaterial
          color={agent.battery > 60 ? '#22c55e' : agent.battery > 30 ? '#f59e0b' : '#ef4444'}
          emissive={agent.battery > 60 ? '#16a34a' : agent.battery > 30 ? '#d97706' : '#dc2626'}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}
