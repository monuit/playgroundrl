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

  // Get agent - always called
  const agent = useAgentsStore((state) =>
    state.agents.find((a) => a.id === agentId)
  );

  // Load bunny model - always called
  let gltf = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const loaded = useGLTF('/models/bunny.glb');
    gltf = loaded;
  } catch (error) {
    console.warn('Failed to load bunny model');
  }

  // Spring animations - always called
  const [positionSpring, positionApi] = useSpring(() => ({
    x: agent?.x ?? 0,
    y: agent?.y ?? 0,
    config: { duration: 150 },
  }));

  const [rotationSpring, rotationApi] = useSpring(() => ({
    rotY: 0,
    config: { duration: 100 },
  }));

  // Setup animation mixer
  useEffect(() => {
    if (!groupRef.current || !gltf || !gltf.animations || gltf.animations.length === 0) {
      return;
    }

    mixerRef.current = new AnimationMixer(groupRef.current);
    const idleAction = gltf.animations.find((clip) =>
      clip.name.toLowerCase().includes('idle')
    );
    if (idleAction) {
      mixerRef.current.clipAction(idleAction).play();
    }

    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [gltf?.animations]);

  // Update animation mixer on frame
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  // Update springs when agent position changes
  useEffect(() => {
    if (!agent) return;

    const [prevX, prevY] = lastPosRef.current;
    if (agent.x !== prevX || agent.y !== prevY) {
      positionApi.start({ x: agent.x, y: agent.y });
      rotationApi.start({
        rotY: Math.random() * 0.2 - 0.1,
        onRest: () => {
          rotationApi.start({ rotY: 0 });
        },
      });
      lastPosRef.current = [agent.x, agent.y];
    }
  }, [agent?.x, agent?.y, positionApi, rotationApi]);

  if (!agent) {
    return null;
  }

  // Fallback mesh if model didn't load
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
      position={positionSpring.x
        .to((x) => x * TILE_SIZE)
        .to((x) => [x, 0, positionSpring.y.get() * TILE_SIZE] as const)}
      rotation={rotationSpring.rotY.to((r) => [0, r, 0] as const)}
      castShadow
      receiveShadow
    >
      <primitive object={gltf.scene} scale={0.5} />
    </a.group>
  );
}
