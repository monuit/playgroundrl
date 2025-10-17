import { GroupProps } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Color, MeshStandardMaterial } from 'three'
import useEnvironment from '../store/useEnvironment'
import { WarehouseBotChassis } from './WarehouseBotChassis'

export default function WarehouseBot(props: GroupProps) {
  const agentIdx = useEnvironment((state) => state.currentAgentIdx)

  const materials = useMemo(() => {
    const bodyPalette = ['#1f2937', '#111827', '#0f172a']
    const trimPalette = ['#38bdf8', '#f97316', '#a855f7', '#22d3ee']
    const glowPalette = ['#22d3ee', '#fbbf24', '#f472b6', '#38bdf8']

    const baseColor = new Color(bodyPalette[agentIdx % bodyPalette.length])
    const trimColor = new Color(trimPalette[agentIdx % trimPalette.length])
    const glowColor = new Color(glowPalette[agentIdx % glowPalette.length])

    const body = new MeshStandardMaterial({
      color: baseColor,
      metalness: 0.65,
      roughness: 0.28,
      emissive: baseColor.clone().multiplyScalar(0.18),
      emissiveIntensity: 0.7,
    })

    const trim = new MeshStandardMaterial({
      color: trimColor,
      emissive: trimColor.clone().multiplyScalar(0.65),
      emissiveIntensity: 1.4,
      metalness: 0.5,
      roughness: 0.22,
    })

    const light = new MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor.clone().multiplyScalar(1.2),
      emissiveIntensity: 2.8,
      metalness: 0.35,
      roughness: 0.22,
      transparent: true,
      opacity: 0.88,
    })

    const wheel = new MeshStandardMaterial({
      color: new Color('#020617'),
      metalness: 0.45,
      roughness: 0.55,
    })

    return { body, trim, light, wheel }
  }, [agentIdx])

  useEffect(() => {
    return () => {
      materials.body.dispose()
      materials.trim.dispose()
      materials.light.dispose()
      materials.wheel.dispose()
    }
  }, [materials])

  return (
    <group scale={0.22} {...props} dispose={null}>
      <WarehouseBotChassis materials={materials} />
    </group>
  )
}
