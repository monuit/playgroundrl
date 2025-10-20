import React, { useEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { Mesh, MeshStandardMaterial } from 'three'
import { GroupProps } from '@react-three/fiber'

export function GlassBucket(props: GroupProps) {
  const { nodes } = useGLTF('/models/glassbucket.glb')

  const geometry = useMemo(() => (nodes.imagetostl_mesh0 as unknown as Mesh).geometry, [nodes])
  const material = useMemo(
    () => new MeshStandardMaterial({ opacity: 0.75, transparent: true, color: '#3A3D5E' }),
    [],
  )

  useEffect(() => () => material.dispose(), [material])

  return (
    <group {...props} dispose={null}>
      <mesh
        /*@ts-ignore */
        castShadow
        position={[0, 0.38, 0]}
      >
        <primitive object={geometry} attach='geometry' />
        <primitive object={material} attach='material' />
      </mesh>
    </group>
  )
}

useGLTF.preload('/models/glassbucket.glb')
