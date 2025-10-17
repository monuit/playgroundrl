import React from 'react'
import { GroupProps } from '@react-three/fiber'
import type { Mesh, Vector3Tuple } from 'three'

type DroneMaterial = NonNullable<Mesh['material']>

export type DroneMaterialSet = {
  body: DroneMaterial
  glass: DroneMaterial
  light: DroneMaterial
  rotor: DroneMaterial
}

const MaterialAttachment = ({ material }: { material: DroneMaterial }) => (
  <primitive object={material} attach='material' />
)

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
        <mesh castShadow receiveShadow>
          <MaterialAttachment material={materials.body} />
          <cylinderGeometry args={[0.95, 0.95, 0.32, 48]} />
        </mesh>
        <mesh castShadow position={[0, 0.28, 0]}>
          <MaterialAttachment material={materials.glass} />
          <sphereGeometry args={[0.45, 32, 32]} />
        </mesh>
        <mesh castShadow position={[0, -0.25, 0]}>
          <MaterialAttachment material={materials.light} />
          <sphereGeometry args={[0.32, 32, 32]} />
        </mesh>
        {rotorOffsets.map(([x, y, z], index) => {
          const angle = Math.atan2(z, x)
          const length = Math.sqrt(x * x + z * z)

          return (
            <group key={`rotor-${index}`} position={[x, y, z]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                <MaterialAttachment material={materials.rotor} />
                <cylinderGeometry args={[0.22, 0.22, 0.08, 32]} />
              </mesh>
              <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <MaterialAttachment material={materials.light} />
                <cylinderGeometry args={[0.1, 0.02, 0.05, 24]} />
              </mesh>
              <mesh
                position={[-x / 2, -0.06, -z / 2]}
                rotation={[0, -angle, 0]}
                castShadow
                receiveShadow
              >
                <MaterialAttachment material={materials.body} />
                <boxGeometry args={[length * 1.1, 0.12, 0.22]} />
              </mesh>
            </group>
          )
        })}
        <mesh castShadow position={[0, -0.45, 0]}>
          <MaterialAttachment material={materials.body} />
          <torusGeometry args={[0.45, 0.05, 16, 48]} />
        </mesh>
      </group>
    </group>
  )
}

export const DRONE_ROTOR_OFFSETS = rotorOffsets
