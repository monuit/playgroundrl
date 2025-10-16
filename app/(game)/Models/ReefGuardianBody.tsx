import { GroupProps } from '@react-three/fiber'
import { Material } from 'three'

export type ReefGuardianMaterialSet = {
  body: Material
  fin: Material
  accent: Material
  eye: Material
}

export function ReefGuardianBody({ materials, ...groupProps }: GroupProps & { materials: ReefGuardianMaterialSet }) {
  return (
    <group {...groupProps}>
      <group rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow receiveShadow material={materials.body}>
          <sphereGeometry args={[1.1, 32, 32]} />
        </mesh>
        <mesh position={[-1.6, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.fin} castShadow receiveShadow>
          <coneGeometry args={[0.55, 1.4, 16]} />
        </mesh>
        <mesh position={[0.4, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} material={materials.fin} castShadow receiveShadow>
          <coneGeometry args={[0.35, 0.8, 16]} />
        </mesh>
        <mesh position={[0.4, -0.55, 0]} rotation={[0, 0, -Math.PI / 2]} material={materials.fin} castShadow receiveShadow>
          <coneGeometry args={[0.35, 0.8, 16]} />
        </mesh>
        <mesh position={[0.95, 0.3, 0.45]} material={materials.eye}>
          <sphereGeometry args={[0.12, 12, 12]} />
        </mesh>
        <mesh position={[0.95, -0.3, 0.45]} material={materials.eye}>
          <sphereGeometry args={[0.12, 12, 12]} />
        </mesh>
        <mesh position={[0.2, 0, 0]} material={materials.accent}>
          <torusGeometry args={[0.9, 0.08, 12, 28]} />
        </mesh>
        <mesh position={[-1, 0.25, 0]} rotation={[0, Math.PI / 2.5, 0]} material={materials.accent}>
          <cylinderGeometry args={[0.08, 0.02, 1.15, 12]} />
        </mesh>
        <mesh position={[-1, -0.25, 0]} rotation={[0, -Math.PI / 2.5, 0]} material={materials.accent}>
          <cylinderGeometry args={[0.08, 0.02, 1.15, 12]} />
        </mesh>
      </group>
    </group>
  )
}
