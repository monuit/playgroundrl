import { GroupProps } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Color, MeshPhysicalMaterial, MeshStandardMaterial } from 'three'
import useEnvironment from '../store/useEnvironment'
import { DroneChassis } from './DroneChassis'

export default function Drone(props: GroupProps) {
  const agentIdx = useEnvironment((state) => state.currentAgentIdx)

  const materials = useMemo(() => {
    const palette = [
      '#22d3ee',
      '#f97316',
      '#a855f7',
      '#38bdf8',
      '#facc15',
      '#34d399',
      '#ef4444',
      '#f472b6',
      '#10b981',
      '#3b82f6',
    ]

    const baseHex = palette[agentIdx % palette.length] ?? '#38bdf8'
    const baseColor = new Color(baseHex)
    const glowColor = baseColor.clone().offsetHSL(0.05, 0.2, 0.1)
    const rotorColor = new Color('#1f2937')

    const bodyMaterial = new MeshStandardMaterial({
      color: baseColor,
      metalness: 0.6,
      roughness: 0.3,
    })

    const glassMaterial = new MeshPhysicalMaterial({
      color: baseColor.clone().lerp(new Color('#ffffff'), 0.6),
      transparent: true,
      opacity: 0.35,
      transmission: 0.9,
      roughness: 0.1,
      metalness: 0.1,
    })

    const lightMaterial = new MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor.clone().multiplyScalar(0.6),
      emissiveIntensity: 1.8,
      roughness: 0.4,
      metalness: 0.2,
    })

    const rotorMaterial = new MeshStandardMaterial({
      color: rotorColor,
      metalness: 0.85,
      roughness: 0.35,
    })

    return { bodyMaterial, glassMaterial, lightMaterial, rotorMaterial }
  }, [agentIdx])

  useEffect(() => {
    return () => {
      materials.bodyMaterial.dispose()
      materials.glassMaterial.dispose()
      materials.lightMaterial.dispose()
      materials.rotorMaterial.dispose()
    }
  }, [materials])

  return (
    <group scale={0.25} {...props} dispose={null}>
      <DroneChassis
        materials={{
          body: materials.bodyMaterial,
          glass: materials.glassMaterial,
          light: materials.lightMaterial,
          rotor: materials.rotorMaterial,
        }}
      />
    </group>
  )
}
