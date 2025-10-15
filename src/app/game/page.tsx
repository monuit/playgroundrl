/**
 * Game page with 3D canvas, levels, and game loop
 */
'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useGameStore } from './store/agents';
import { useWorldStore } from './store/world';
import { LevelOne } from './LevelOne';
import { LevelTwo } from './LevelTwo';
import { stepGame, resetGame, initializeSession } from './engine';
import { Hud } from './Hud';

export default function GamePage() {
  const gameStore = useGameStore();
  const worldStore = useWorldStore();
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize ONNX session
  useEffect(() => {
    initializeSession()
      .then(() => console.log('ONNX session ready'))
      .catch((err: Error) => console.error('Failed to initialize ONNX:', err));
  }, []);

  // Game loop - step every tickDuration ms
  useEffect(() => {
    if (gameStore.paused) {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }

    tickIntervalRef.current = setInterval(async () => {
      await stepGame();
      useGameStore.getState().incrementTick();
    }, gameStore.tickDuration);

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [gameStore.paused, gameStore.tickDuration]);

  const handleReset = () => {
    resetGame();
    gameStore.setLevel(gameStore.level);
  };

  const handleLevelChange = (levelId: 'level1' | 'level2') => {
    gameStore.setLevelById(levelId);
    worldStore.setLevel(gameStore.level);
    resetGame();
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-950 text-white">
      <div className="flex-1 relative">
        <Canvas camera={{ position: [12.5, 20, 15], near: 0.1, far: 1000 }}>
          {/* Lights */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 20, 10]} intensity={0.8} castShadow />

          {/* Camera */}
          <PerspectiveCamera makeDefault position={[12.5, 20, 15]} fov={50} />

          {/* Level rendering */}
          <Suspense fallback={null}>
            {gameStore.level.id === 'level1' && <LevelOne />}
            {gameStore.level.id === 'level2' && <LevelTwo />}
          </Suspense>

          {/* Controls */}
          <OrbitControls />
        </Canvas>
      </div>

      {/* HUD */}
      <Hud
        level={gameStore.level}
        tick={gameStore.tick}
        paused={gameStore.paused}
        onPauseToggle={() => gameStore.setPaused(!gameStore.paused)}
        onReset={handleReset}
        onLevelChange={handleLevelChange}
        onTickDurationChange={gameStore.setTickDuration}
      />
    </div>
  );
}
