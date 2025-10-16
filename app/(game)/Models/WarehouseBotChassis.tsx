import { GroupProps } from '@react-three/fiber'
import { Material } from 'three'

export type WarehouseBotMaterialSet = {
  body: Material
  trim: Material
  light: Material
  wheel: Material
}

export function WarehouseBotChassis({ materials, ...groupProps }: GroupProps & { materials: WarehouseBotMaterialSet }) {
  return (
    <group {...groupProps}>
      <mesh castShadow receiveShadow material={materials.body}>
        <boxGeometry args={[2.2, 0.6, 2.2]} />
      </mesh>
      <mesh position={[0, 0.45, 0]} material={materials.trim} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.3, 1.6]} />
      </mesh>
      <mesh position={[0, 0.75, 0]} material={materials.light}>
        <boxGeometry args={[1.1, 0.18, 1.1]} />
      </mesh>
      <mesh position={[0, 0.9, 0]} material={materials.trim}>
        <torusGeometry args={[0.95, 0.05, 16, 32]} />
      </mesh>
      <mesh position={[0.9, -0.35, 0.9]} material={materials.wheel}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 24]} />
      </mesh>
      <mesh position={[-0.9, -0.35, 0.9]} material={materials.wheel}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 24]} />
      </mesh>
      <mesh position={[0.9, -0.35, -0.9]} material={materials.wheel}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 24]} />
      </mesh>
      <mesh position={[-0.9, -0.35, -0.9]} material={materials.wheel}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 24]} />
      </mesh>
      <mesh position={[0, 0.5, 0]} material={materials.light}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 24]} />
      </mesh>
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.light}>
        <ringGeometry args={[0.4, 0.55, 24]} />
      </mesh>
      <mesh position={[0, 0.1, 1.1]} material={materials.light}>
        <boxGeometry args={[0.6, 0.2, 0.1]} />
      </mesh>
      <mesh position={[0, 0.1, -1.1]} material={materials.light}>
        <boxGeometry args={[0.6, 0.2, 0.1]} />
      </mesh>
    </group>
  )
}
