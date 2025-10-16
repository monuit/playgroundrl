import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, Uniform } from 'three'
import { ReefGuardianBody } from './ReefGuardianBody'
import { vertex as HologramVertexShader } from '../shaders/hologram/vertex'
import { fragment as HologramFragmentShader } from '../shaders/hologram/fragment'

export default function CloneReefGuardian(props: GroupProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: HologramVertexShader,
        fragmentShader: HologramFragmentShader,
        uniforms: {
          uTime: new Uniform(0),
          uColor: new Uniform(new Color('#4ade80')),
        },
        transparent: true,
        side: DoubleSide,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    []
  )

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta
  })

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  return (
    <group scale={0.22} {...props} dispose={null}>
      <ReefGuardianBody
        materials={{
          body: material,
          fin: material,
          accent: material,
          eye: material,
        }}
      />
    </group>
  )
}
