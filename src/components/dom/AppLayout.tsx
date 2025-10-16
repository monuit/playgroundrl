'use client'

import { useRef, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false })

const Layout = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      ref={ref}
      className='dark bg-background text-foreground overflow-hidden'
      style={{
        position: 'relative',
        width: ' 100%',
        height: '100%',
      }}
    >
      {children}
      {mounted && (
        <Scene
          key="persistent-scene"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
          }}
          eventSource={ref}
          eventPrefix='client'
        />
      )}
    </div>
  )
}

export { Layout }
