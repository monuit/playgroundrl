import { GroupProps } from '@react-three/fiber'
import { Material, Vector3Tuple } from 'three'

export type DroneMaterialSet = {
  body: Material
  glass: Material
  light: Material
  rotor: Material
}

interface DroneChassisProps extends GroupProps {
  materials: DroneMaterialSet
}

const rotorOffsets: Vector3Tuple[] = [
  [1.1, 0.05, 1.1],
  [-1.1, 0.05, 1.1],
  [1.1, 0.05, -1.1],
  [-1.1, 0.05, -1.1],
]

export function DroneChassis({ materials, ...groupProps }: DroneChassisProps) {
  return (
    <group {...groupProps}>
      <group position={[0, -0.05, 0]}>
        <mesh castShadow receiveShadow material={materials.body}>
          <cylinderGeometry args={[0.95, 0.95, 0.32, 48]} />
        </mesh>
        <mesh castShadow position={[0, 0.28, 0]} material={materials.glass}>
          <sphereGeometry args={[0.45, 32, 32]} />
        </mesh>
        <mesh castShadow position={[0, -0.25, 0]} material={materials.light}>
          <sphereGeometry args={[0.32, 32, 32]} />
        </mesh>
        {rotorOffsets.map(([x, y, z], index) => {
          const angle = Math.atan2(z, x)
          const length = Math.sqrt(x * x + z * z)

          return (
            <group key={`rotor-${index}`} position={[x, y, z]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={materials.rotor} castShadow receiveShadow>
                <cylinderGeometry args={[0.22, 0.22, 0.08, 32]} />
              </mesh>
              <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.light}>
                <cylinderGeometry args={[0.1, 0.02, 0.05, 24]} />
              </mesh>
              <mesh
                position={[-x / 2, -0.06, -z / 2]}
                rotation={[0, -angle, 0]}
                material={materials.body}
                castShadow
                receiveShadow
              >
                <boxGeometry args={[length * 1.1, 0.12, 0.22]} />
              </mesh>
            </group>
          )
        })}
        <mesh castShadow position={[0, -0.45, 0]} material={materials.body}>
          <torusGeometry args={[0.45, 0.05, 16, 48]} />
        </mesh>
      </group>
    </group>
  )
}

export const DRONE_ROTOR_OFFSETS = rotorOffsets
