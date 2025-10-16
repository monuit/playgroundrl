'use client'

import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import { r3f } from '@/helpers/global'
import { ACESFilmicToneMapping } from 'three'
import { useEffect } from 'react'

export default function Scene({ ...props }) {
  useEffect(() => {
    console.log('🎬 Scene mounted with props:', props);
    
    // Check if canvas exists and log its state periodically
    const interval = setInterval(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        console.log('🎨 Canvas check:', {
          exists: true,
          width: canvas.width,
          height: canvas.height,
          style: canvas.style.cssText,
          visible: canvas.offsetWidth > 0 && canvas.offsetHeight > 0
        });
      } else {
        console.log('❌ No canvas found in DOM');
      }
    }, 2000);
    
    return () => {
      clearInterval(interval);
      console.log('🎬 Scene unmounted');
    };
  }, [props]);

  // Everything defined in here will persist between route changes, only children are swapped
  return (
    <Canvas 
      shadows 
      {...props} 
      onCreated={(state) => {
        state.gl.toneMapping = ACESFilmicToneMapping;
        console.log('✅ Canvas created!', {
          sceneChildren: state.scene.children.length,
          camera: state.camera.position,
          canvas: state.gl.domElement
        });
      }}
    >
      {/* Test mesh directly in Scene - MASSIVE cube right in front of camera */}
      <mesh position={[0, 0, -5]}>
        <boxGeometry args={[10, 10, 10]} />
        <meshBasicMaterial color="lime" />
      </mesh>
      <ambientLight intensity={2} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      <r3f.Out />
      <Preload all />
    </Canvas>
  )
}
