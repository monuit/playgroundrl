import { GroupProps, useFrame } from '@react-three/fiber'
import { useEffect, useMemo } from 'react'
import { AdditiveBlending, Color, DoubleSide, ShaderMaterial, Uniform } from 'three'
import { WarehouseBotChassis } from './WarehouseBotChassis'
import { vertex as HologramVertexShader } from '../shaders/hologram/vertex'
import { fragment as HologramFragmentShader } from '../shaders/hologram/fragment'

export default function CloneWarehouseBot(props: GroupProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: HologramVertexShader,
        fragmentShader: HologramFragmentShader,
        uniforms: {
          uTime: new Uniform(0),
          uColor: new Uniform(new Color('#60a5fa')),
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
      <WarehouseBotChassis
        materials={{
          body: material,
          trim: material,
          light: material,
          wheel: material,
        }}
      />
    </group>
  )
}
