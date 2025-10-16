import { GroupProps } from '@react-three/fiber'
import { Material } from 'three'

export type SnowplowMaterialSet = {
  body: Material
  cabin: Material
  plow: Material
  light: Material
  wheel: Material
}

export function SnowplowRig({ materials, ...groupProps }: GroupProps & { materials: SnowplowMaterialSet }) {
  return (
    <group {...groupProps}>
      <mesh position={[0, 0.4, 0]} material={materials.body} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.8, 1.6]} />
      </mesh>
      <mesh position={[-0.6, 1.1, 0]} material={materials.cabin} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1, 1.4]} />
      </mesh>
      <mesh position={[-1.1, 1.6, 0]} material={materials.light}>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
      </mesh>
      <mesh position={[1.5, 0.2, 0]} rotation={[0, 0, -Math.PI / 3]} material={materials.plow} castShadow receiveShadow>
        <boxGeometry args={[0.3, 1.6, 1.8]} />
      </mesh>
      <mesh position={[1.25, 0.55, 0]} rotation={[0, 0, -Math.PI / 3]} material={materials.plow}>
        <boxGeometry args={[0.2, 1.4, 1.5]} />
      </mesh>
      <mesh position={[-1, -0.1, 0.8]} rotation={[0, 0, Math.PI / 2]} material={materials.wheel} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.6, 24]} />
      </mesh>
      <mesh position={[0.8, -0.1, 0.8]} rotation={[0, 0, Math.PI / 2]} material={materials.wheel} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.6, 24]} />
      </mesh>
      <mesh position={[-1, -0.1, -0.8]} rotation={[0, 0, Math.PI / 2]} material={materials.wheel} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.6, 24]} />
      </mesh>
      <mesh position={[0.8, -0.1, -0.8]} rotation={[0, 0, Math.PI / 2]} material={materials.wheel} castShadow receiveShadow>
        <cylinderGeometry args={[0.45, 0.45, 0.6, 24]} />
      </mesh>
      <mesh position={[-0.6, 1.4, 0.65]} material={materials.light}>
        <sphereGeometry args={[0.15, 12, 12]} />
      </mesh>
      <mesh position={[-0.6, 1.4, -0.65]} material={materials.light}>
        <sphereGeometry args={[0.15, 12, 12]} />
      </mesh>
    </group>
  )
}
