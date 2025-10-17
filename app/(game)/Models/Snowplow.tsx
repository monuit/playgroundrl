import { GroupProps } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Color, MeshStandardMaterial } from 'three'
import useEnvironment from '../store/useEnvironment'
import { SnowplowRig } from './SnowplowRig'

export default function Snowplow(props: GroupProps) {
  const agentIdx = useEnvironment((state) => state.currentAgentIdx)

  const materials = useMemo(() => {
    const bodyColors = ['#0f172a', '#1e293b', '#111827']
    const cabinPalette = ['#38bdf8', '#f97316', '#facc15', '#f472b6']
    const plowPalette = ['#f97316', '#facc15', '#fb7185']
    const beaconPalette = ['#fbbf24', '#f472b6', '#38bdf8']

    const bodyColor = new Color(bodyColors[agentIdx % bodyColors.length])
    const cabinColor = new Color(cabinPalette[agentIdx % cabinPalette.length])
    const plowColor = new Color(plowPalette[agentIdx % plowPalette.length])
    const beaconColor = new Color(beaconPalette[agentIdx % beaconPalette.length])

    const body = new MeshStandardMaterial({
      color: bodyColor,
      metalness: 0.55,
      roughness: 0.28,
      emissive: bodyColor.clone().multiplyScalar(0.22),
      emissiveIntensity: 0.65,
    })

    const cabin = new MeshStandardMaterial({
      color: cabinColor,
      emissive: cabinColor.clone().multiplyScalar(0.55),
      emissiveIntensity: 1.8,
      metalness: 0.35,
      roughness: 0.2,
      transparent: true,
      opacity: 0.9,
    })

    const plow = new MeshStandardMaterial({
      color: plowColor,
      metalness: 0.5,
      roughness: 0.25,
      emissive: plowColor.clone().multiplyScalar(0.35),
      emissiveIntensity: 1.4,
    })

    const light = new MeshStandardMaterial({
      color: beaconColor,
      emissive: beaconColor.clone().multiplyScalar(1.2),
      emissiveIntensity: 3,
      roughness: 0.18,
      transparent: true,
      opacity: 0.92,
    })

    const wheel = new MeshStandardMaterial({
      color: new Color('#0b1120'),
      metalness: 0.48,
      roughness: 0.52,
    })

    return { body, cabin, plow, light, wheel }
  }, [agentIdx])

  useEffect(() => {
    return () => {
      materials.body.dispose()
      materials.cabin.dispose()
      materials.plow.dispose()
      materials.light.dispose()
      materials.wheel.dispose()
    }
  }, [materials])

  return (
    <group scale={0.2} {...props} dispose={null}>
      <SnowplowRig materials={materials} />
    </group>
  )
}
