import { GroupProps } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Color, MeshStandardMaterial } from 'three'
import useEnvironment from '../store/useEnvironment'
import { WarehouseBotChassis } from './WarehouseBotChassis'

export default function WarehouseBot(props: GroupProps) {
  const agentIdx = useEnvironment((state) => state.currentAgentIdx)

  const materials = useMemo(() => {
    const bodyPalette = ['#1f2937', '#0f172a', '#111827']
    const trimPalette = ['#f97316', '#38bdf8', '#a855f7', '#22d3ee']
    const baseColor = new Color(bodyPalette[agentIdx % bodyPalette.length])
    const trimColor = new Color(trimPalette[agentIdx % trimPalette.length])

    const body = new MeshStandardMaterial({
      color: baseColor,
      metalness: 0.7,
      roughness: 0.35,
    })

    const trim = new MeshStandardMaterial({
      color: baseColor.clone().offsetHSL(0, 0, 0.1),
      metalness: 0.6,
      roughness: 0.25,
    })

    const light = new MeshStandardMaterial({
      color: trimColor,
      emissive: trimColor.clone().multiplyScalar(0.8),
      emissiveIntensity: 2,
      metalness: 0.4,
      roughness: 0.3,
    })

    const wheel = new MeshStandardMaterial({
      color: new Color('#111827'),
      metalness: 0.4,
      roughness: 0.6,
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
