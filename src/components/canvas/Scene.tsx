'use client';

import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { r3f } from '@/lib/scene-portal';
import { ACESFilmicToneMapping } from 'three';

/**
 * Persistent Canvas component that renders all 3D content
 * This component should be mounted once at the root level
 * Content is portaled in via the r3f tunnel from anywhere in the app
 */
export default function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
      }}
      onCreated={(state) => {
        state.gl.toneMapping = ACESFilmicToneMapping;
        state.gl.toneMappingExposure = 1.0;
      }}
    >
      {/* This is where portaled content appears */}
      <r3f.Out />
      {/* Preload all assets */}
      <Preload all />
    </Canvas>
  );
}
