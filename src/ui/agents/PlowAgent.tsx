'use client';

import { useRef } from 'react';
import type { Group } from 'three';
import type { PlowAgent } from '@/types/game';

interface PlowAgentProps {
  agent: PlowAgent;
}

export function PlowAgentComponent({ agent }: PlowAgentProps) {
  const groupRef = useRef<Group>(null);

  return (
    <group ref={groupRef} position={[agent.x - 12.5, 0.3, agent.y - 12.5]}>
      {/* Main cabin */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.4, 0.35, 0.5]} />
        <meshStandardMaterial color="#dc2626" emissive="#b91c1c" emissiveIntensity={0.15} />
      </mesh>

      {/* Cabin roof */}
      <mesh position={[0, 0.45, 0]}>
        <coneGeometry args={[0.25, 0.2, 4]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>

      {/* Front bumper */}
      <mesh position={[0, 0.1, 0.3]}>
        <boxGeometry args={[0.42, 0.15, 0.1]} />
        <meshStandardMaterial color="#4b5563" />
      </mesh>

      {/* Left front wheel */}
      <mesh position={[-0.25, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.15, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Right front wheel */}
      <mesh position={[0.25, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.15, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Left rear wheel */}
      <mesh position={[-0.25, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.15, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Right rear wheel */}
      <mesh position={[0.25, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.15, 16]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* Plow blade */}
      <mesh position={[0, 0.05, 0.35]} rotation={[0, agent.angle, 0]}>
        <boxGeometry args={[0.55, 0.12, 0.15]} />
        <meshStandardMaterial color="#6b7280" emissive="#374151" emissiveIntensity={0.2} />
      </mesh>

      {/* Salt spreader */}
      <mesh position={[0, 0.25, -0.3]}>
        <cylinderGeometry args={[0.12, 0.12, 0.25, 8]} />
        <meshStandardMaterial color="#c4b5fd" emissive="#a78bfa" emissiveIntensity={0.3} />
      </mesh>

      {/* Cabin window */}
      <mesh position={[0, 0.25, 0.22]}>
        <boxGeometry args={[0.2, 0.15, 0.02]} />
        <meshStandardMaterial color="#0369a1" emissive="#0284c7" emissiveIntensity={0.4} />
      </mesh>

      {/* Fuel indicator bar */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.06]} />
        <meshStandardMaterial
          color={agent.fuel > 0.6 ? '#22c55e' : agent.fuel > 0.3 ? '#f59e0b' : '#ef4444'}
          emissive={agent.fuel > 0.6 ? '#16a34a' : agent.fuel > 0.3 ? '#d97706' : '#dc2626'}
          emissiveIntensity={0.3}
        />
      </mesh>
    </group>
  );
}
