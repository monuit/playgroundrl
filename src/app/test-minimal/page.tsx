'use client'

import { View } from '@/components/canvas/View'
import { PerspectiveCamera } from '@react-three/drei'

export default function TestMinimal() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <View className='absolute top-0 size-full'>
        {/* Simple test mesh - should be visible */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
        
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
      </View>

      <div style={{ 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        color: 'white',
        background: 'rgba(0,0,0,0.8)',
        padding: '10px',
        zIndex: 1000
      }}>
        <h1>Minimal Test Page</h1>
        <p>You should see a hot pink cube in the center.</p>
        <p>If not, the portal system is broken.</p>
      </div>
    </div>
  )
}
