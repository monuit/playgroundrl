'use client'

import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { config } from '@react-spring/three'
import { animated, useSpring, config as webConfig } from '@react-spring/web'
import { PerspectiveCamera, PresentationControls } from '@react-three/drei'
import { ArrowLeft, ArrowRight, Bot, Boxes, Fish, Rabbit, Snowflake } from 'lucide-react'
import dynamic from 'next/dynamic'
import Lights from './Lights'
import LevelOne from './LevelOne'
import useEnvironment from './store/useEnvironment'
import useGameState from './store/useGameState'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import LevelTwo from './LevelTwo'

const View = dynamic(() => import('@/components/canvas/View').then((mod) => mod.View), {
  ssr: false,
})

export default function Page() {
  const environment = useEnvironment()
  const gameState = useGameState()
  const lastLevelRef = useRef(gameState.currentLvl)

  const initialAnimation = useSpring({
    opacity: gameState.state === 'INITIAL' ? 1 : 0,
    transform: gameState.state === 'INITIAL' ? 'translateY(0)' : 'translateY(100%)',
    config: webConfig.wobbly,
  })

  const modelAnimation = useSpring({
    opacity: gameState.state != 'LOADING' ? 1 : 0,
    transform: gameState.state != 'LOADING' ? 'translateY(0)' : 'translateY(100%)',
    config: webConfig.wobbly,
  })

  const changingAnimation = useSpring({
    opacity: gameState.state === 'CHANGING' ? 1 : 0,
    transform: gameState.state === 'CHANGING' ? 'translateY(0)' : 'translateY(-100%)',
    config: webConfig.default,
  })

  const loadingModelAnimation = useSpring({
    opacity: gameState.state === 'LOADING_MODEL' ? 1 : 0,
    transform: gameState.state === 'LOADING_MODEL' ? 'translateY(0)' : 'translateY(-100%)',
    config: webConfig.default,
  })

  const playingAnimation = useSpring({
    opacity: gameState.state === 'RUNNING' ? 1 : 0,
    transform: gameState.state === 'RUNNING' ? 'translateY(0)' : 'translateY(-200%)',
    config: webConfig.wobbly,
  })

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    if (gameState.currentLvl !== lastLevelRef.current) {
      if (gameState.currentLvl === 1 && gameState.avatarMode !== 'bunny') {
        gameState.setAvatarMode('bunny')
      } else if (gameState.currentLvl === 2 && gameState.avatarMode !== 'drone') {
        gameState.setAvatarMode('drone')
      }
      lastLevelRef.current = gameState.currentLvl
    }
  }, [gameState.avatarMode, gameState.currentLvl, gameState.setAvatarMode, isMounted])

  if (!isMounted) {
    return null
  }

  return (
    <div>
      <View className='absolute top-0 size-full touch-none'>
        <PresentationControls
          enabled
          global
          cursor={false}
          speed={1}
          zoom={1}
          rotation={[Math.PI * 0.175, 0, 0]}
          polar={[-Math.PI / 16, Math.PI / 3]}
          azimuth={[-Infinity, Infinity]}
          config={config.slow}
        >
          {gameState.currentLvl === 1 ? <LevelOne /> : <LevelTwo />}
        </PresentationControls>

        <Lights />
        <PerspectiveCamera makeDefault position={[0, 0, 40]} />
      </View>

      {gameState.state === 'LOADING' && (
        <div className='bg-background z-50 absolute inset-0 flex justify-center items-center'>
          <p className='flex flex-row items-center gap-2'>
            Loading <Rabbit className='size-4' />
          </p>
        </div>
      )}

      <animated.div
        style={loadingModelAnimation}
        className='z-10 absolute top-16 text-center w-full flex items-center flex-col gap-4'
      >
        <p>Loading Policy Network</p>
      </animated.div>

      <animated.div
        style={initialAnimation}
        className='z-10 absolute top-16 text-center w-full flex items-center flex-col gap-4'
      >
        {gameState.state === 'INITIAL' && (
          <>
            <h1 className='text-4xl font-bold italic'>PlaygroundRL</h1>
            <div className='flex flex-row gap-2'>
              <Button className='flex flex-row gap-2 ' onClick={() => gameState.setState('CHANGING')} size='lg'>
                Run <Rabbit className='size-4' />
              </Button>
              <Link href='/docs'>
                <Button size='lg' className='flex flex-row gap-2' variant='outline'>
                  Docs
                </Button>
              </Link>
            </div>
          </>
        )}
      </animated.div>
      <animated.div
        style={playingAnimation}
        className='z-10 absolute top-16 text-center w-full flex items-center flex-col gap-4'
      >
        <h1 className=' font-bold italic text-4xl'>Find the reward</h1>
        <p>lvl. {gameState.currentLvl}</p>
      </animated.div>
      <animated.div
        style={changingAnimation}
        className='z-10 absolute top-16 text-center w-full flex items-center flex-col gap-4'
      >
        {gameState.state === 'CHANGING' && (
          <>
            <h1 className='text-4xl font-bold italic'>{gameState.changingText}</h1>
          </>
        )}
      </animated.div>

      <animated.div
        style={modelAnimation}
        className={'bottom-16 z-10 absolute text-center w-full flex justify-center flex-col items-center gap-4'}
      >
        <div className='flex flex-col items-center gap-3'>
          <div className='items-center flex flex-row gap-2'>
          <Button
            disabled={
              gameState.currentLvl === 1 || gameState.state === 'LOADING' || gameState.state === 'LOADING_MODEL'
            }
            size='sm'
            onClick={() => {
              gameState.setState('LOADING')
              gameState.setCurrentLvl(gameState.currentLvl - 1)
            }}
          >
            <ArrowLeft className='size-4' />
          </Button>
          Level {gameState.currentLvl}
          <Button
            disabled={
              gameState.currentLvl === 2 || gameState.state === 'LOADING' || gameState.state === 'LOADING_MODEL'
            }
            size='sm'
            onClick={() => {
              gameState.setState('LOADING')
              gameState.setCurrentLvl(gameState.currentLvl + 1)
            }}
          >
            <ArrowRight className='size-4' />
          </Button>
          </div>
          <div className='flex flex-wrap items-center justify-center gap-2'>
            <Button
              size='sm'
              variant={gameState.avatarMode === 'bunny' ? 'default' : 'outline'}
              aria-pressed={gameState.avatarMode === 'bunny'}
              onClick={() => gameState.setAvatarMode('bunny')}
            >
              <Rabbit className='size-4' />
              Bunnies
            </Button>
            <Button
              size='sm'
              variant={gameState.avatarMode === 'drone' ? 'default' : 'outline'}
              aria-pressed={gameState.avatarMode === 'drone'}
              onClick={() => gameState.setAvatarMode('drone')}
            >
              <Bot className='size-4' />
              Drones
            </Button>
            <Button
              size='sm'
              variant={gameState.avatarMode === 'reef' ? 'default' : 'outline'}
              aria-pressed={gameState.avatarMode === 'reef'}
              onClick={() => gameState.setAvatarMode('reef')}
            >
              <Fish className='size-4' />
              Reef
            </Button>
            {/* <Button
              size='sm'
              variant={gameState.avatarMode === 'warehouse' ? 'default' : 'outline'}
              aria-pressed={gameState.avatarMode === 'warehouse'}
              onClick={() => gameState.setAvatarMode('warehouse')}
            >
              <Boxes className='size-4' />
              Warehouse
            </Button>
            <Button
              size='sm'
              variant={gameState.avatarMode === 'snowplow' ? 'default' : 'outline'}
              aria-pressed={gameState.avatarMode === 'snowplow'}
              onClick={() => gameState.setAvatarMode('snowplow')}
            >
              <Snowflake className='size-4' />
              Snowplows
            </Button> */}
          </div>
        </div>
      </animated.div>
    </div>
  )
}
