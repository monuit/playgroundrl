'use client';

import { View } from "@/components/canvas/View";

export default function TestPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <View className="absolute inset-0">
        {/* Simple test mesh */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
      </View>
      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', zIndex: 100 }}>
        Test Page - You should see a pink cube
      </div>
    </div>
  );
}
