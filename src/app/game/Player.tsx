/**
 * Player: Bunny agent with spring-based animation
 */
'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useSpring, a } from '@react-spring/three';
import { Group, AnimationMixer } from 'three';
import { useAgentsStore } from './store/agents';
import { TILE_SIZE } from './types';

interface PlayerProps {
  agentId: string;
}

export function Player({ agentId }: PlayerProps) {
  const groupRef = useRef<Group>(null);
  const mixerRef = useRef<AnimationMixer | null>(null);
  const lastPosRef = useRef<[number, number]>([0, 0]);

  const agent = useAgentsStore((state) =>
    state.agents.find((a) => a.id === agentId)
  );

  let gltf: any = null;
  try {
    gltf = useGLTF('/models/bunny.glb');
  } catch {
    gltf = null;
  }

  const [positionSpring, positionApi] = useSpring(() => ({
    x: agent?.x ?? 0,
    y: agent?.y ?? 0,
    config: { duration: 150 },
  }));

  useEffect(() => {
    if (!groupRef.current || !gltf?.animations?.length) return;

    mixerRef.current = new AnimationMixer(groupRef.current);
    const idleClip = gltf.animations.find((clip: any) =>
      clip.name.toLowerCase().includes('idle')
    );

    if (idleClip) {
      mixerRef.current.clipAction(idleClip).play();
    }

    return () => {
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
    };
  }, [gltf]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  useEffect(() => {
    if (!agent) return;

    const [prevX, prevY] = lastPosRef.current;
    if (agent.x !== prevX || agent.y !== prevY) {
      positionApi.start({ x: agent.x, y: agent.y });
      lastPosRef.current = [agent.x, agent.y];
    }
  }, [agent, positionApi]);

  if (!agent) return null;

  if (!gltf) {
    return (
      <mesh position={[agent.x * TILE_SIZE, 0.5, agent.y * TILE_SIZE]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshPhongMaterial color="#ff69b4" />
      </mesh>
    );
  }

  return (
    <a.group
      ref={groupRef}
      position={[
        positionSpring.x.get() * TILE_SIZE,
        0,
        positionSpring.y.get() * TILE_SIZE,
      ]}
      castShadow
      receiveShadow
    >
      <primitive object={gltf.scene} scale={0.5} />
    </a.group>
  );
}
