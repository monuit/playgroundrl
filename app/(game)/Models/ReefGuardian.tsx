import { GroupProps } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { Color, MeshStandardMaterial } from 'three'
import useEnvironment from '../store/useEnvironment'
import { ReefGuardianBody } from './ReefGuardianBody'

export default function ReefGuardian(props: GroupProps) {
  const agentIdx = useEnvironment((state) => state.currentAgentIdx)

  const materials = useMemo(() => {
    const bodyPalette = ['#4ade80', '#38bdf8', '#8b5cf6', '#22d3ee', '#facc15', '#fb7185']
    const accentPalette = ['#0ea5e9', '#c084fc', '#fde047', '#34d399', '#f97316', '#f472b6']
    const baseColor = new Color(bodyPalette[agentIdx % bodyPalette.length] ?? '#38bdf8')
    const accentColor = new Color(accentPalette[agentIdx % accentPalette.length] ?? '#0ea5e9')

    const body = new MeshStandardMaterial({
      color: baseColor,
      metalness: 0.3,
      roughness: 0.6,
      emissive: baseColor.clone().multiplyScalar(0.15),
      emissiveIntensity: 0.7,
    })

    const fin = new MeshStandardMaterial({
      color: baseColor.clone().offsetHSL(0.08, 0.2, 0.1),
      metalness: 0.2,
      roughness: 0.4,
      transparent: true,
      opacity: 0.85,
    })

    const accent = new MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor.clone().multiplyScalar(0.25),
      emissiveIntensity: 1.3,
      metalness: 0.4,
      roughness: 0.45,
    })

    const eye = new MeshStandardMaterial({
      color: new Color('#0f172a'),
      metalness: 0.6,
      roughness: 0.2,
      emissive: new Color('#0ea5e9').multiplyScalar(0.2),
    })

    return { body, fin, accent, eye }
  }, [agentIdx])

  useEffect(() => {
    return () => {
      materials.body.dispose()
      materials.fin.dispose()
      materials.accent.dispose()
      materials.eye.dispose()
    }
  }, [materials])

  return (
    <group scale={0.22} {...props} dispose={null}>
      <ReefGuardianBody materials={materials} />
    </group>
  )
}
