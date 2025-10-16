'use client';

import { Canvas } from '@react-three/fiber';
import { Preload, View } from '@react-three/drei';
import { r3f } from '@/lib/scene-portal';
import { ACESFilmicToneMapping } from 'three';
import { useEffect } from 'react';

/**
 * Persistent Canvas component that renders all 3D content
 * This component should be mounted once at the root level
 * Content is portaled in via the r3f tunnel from anywhere in the app
 */
export default function Scene() {
  useEffect(() => {
    console.log('🎬 Scene component mounted');
    return () => console.log('🎬 Scene component unmounted');
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      <Canvas
        shadows
        frameloop="always"
        dpr={[1, 2]}
        gl={{ antialias: true }}
        style={{
          width: '100%',
          height: '100%',
        }}
      onCreated={(state) => {
        state.gl.toneMapping = ACESFilmicToneMapping;
        state.gl.toneMappingExposure = 1.0;
        console.log('🎨 Canvas created', state);
        console.log('🎨 Canvas scene children:', state.scene.children);
        console.log('🎨 Canvas DOM element:', state.gl.domElement);
        const computedStyle = window.getComputedStyle(state.gl.domElement);
        console.log('🎨 Canvas z-index:', computedStyle.zIndex);
        console.log('🎨 Canvas display:', computedStyle.display);
        console.log('🎨 Canvas visibility:', computedStyle.visibility);
        console.log('🎨 Canvas opacity:', computedStyle.opacity);
        console.log('🎨 Canvas position:', computedStyle.position);
        
        // Check parent container
        const parent = state.gl.domElement.parentElement;
        console.log('🎨 Parent element:', parent);
        const parentStyle = parent ? window.getComputedStyle(parent) : null;
        if (parentStyle) {
          console.log('🎨 Parent z-index:', parentStyle.zIndex);
          console.log('🎨 Parent display:', parentStyle.display);
          console.log('🎨 Parent visibility:', parentStyle.visibility);
        }
        
        // Log every frame to see if scene is updating
        const interval = setInterval(() => {
          console.log('🔄 Frame rendered, scene children count:', state.scene.children.length);
        }, 2000);
        setTimeout(() => clearInterval(interval), 10000);
      }}
    >
      {/* Test mesh - should be visible if rendering works */}
      <mesh position={[0, 0, -5]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="red" />
      </mesh>
      <ambientLight intensity={1} />
      
      {/* This is where portaled content appears */}
      <View.Port />
      <r3f.Out />
      {/* Preload all assets */}
      <Preload all />
    </Canvas>
    </div>
  );
}
