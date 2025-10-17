'use client'

import 'regenerator-runtime/runtime'
import { animated, config, useSpring, useSprings } from '@react-spring/three'
import { Center, Grid, RoundedBox } from '@react-three/drei'
import { Player } from './Player'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Group } from 'three'
import { Clone } from './Models/Clone'
import HologramMaterial from './HologramMaterial'
import Gum from './Models/Gum'
import useEnvironment from './store/useEnvironment'
import { Position, TileType, DefaultTile, GumTile, HologramTile, State } from '@/index.d'
import { Perf } from 'r3f-perf'
import useGameState from './store/useGameState'

import { createModelCpu, runModel, warmupModel } from './runModel'
import type { InferenceSession } from 'onnxruntime-web'

type Direction = 'left' | 'right' | 'up' | 'down'

export const NUM_AGENTS = 10
const TILE_COUNT = 625
const GRID_SIDE = Math.sqrt(TILE_COUNT)
const TILE_CENTER = (GRID_SIDE - 1) / 2
const TILE_SPACING = 1.1
const DIRECTIONS: Direction[] = ['left', 'up', 'right', 'down']
const clamp01 = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0
  }
  if (value <= 0) {
    return 0
  }
  if (value >= 1) {
    return 1
  }
  return value
}

const isBorderTile = (index: number) => {
  const x = index % GRID_SIDE
  const y = Math.floor(index / GRID_SIDE)
  return x < 1 || y < 1 || x >= GRID_SIDE - 1 || y >= GRID_SIDE - 1
}

export default function LevelTwo() {
  const [policyNetwork, setPolicyNetwork] = useState<InferenceSession | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadModels = async () => {
      gameState.setState('LOADING_MODEL')
      try {
        const modelFile = await fetch('/model/actorlvl2.onnx')
        const modelBuffer = await modelFile.arrayBuffer()
        const session = await createModelCpu(modelBuffer)

        if (cancelled) return

        setPolicyNetwork(session)
        gameState.setState('INITIAL')

        const scheduleWarmup = () => {
          if (!cancelled) {
            warmupModel(session, 14)
          }
        }

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          ;(window as any).requestIdleCallback(scheduleWarmup)
        } else {
          setTimeout(scheduleWarmup, 0)
        }

        console.log('Model loaded successfully')
      } catch (error) {
        console.error('Error loading the model:', error)
      }
    }

    loadModels()

    return () => {
      cancelled = true
    }
  }, [])

  const AnimatedGrid = animated(Grid)
  const VISION_LENGTH = 1

  const [springs, _] = useSprings(TILE_COUNT, (i) => {
    const row = Math.floor(i / GRID_SIDE)
    const col = i % GRID_SIDE
    const distance = Math.sqrt((row - TILE_CENTER) ** 2 + (col - TILE_CENTER) ** 2)

    return {
      from: { scale: 0 },
      to: { scale: 1 },
      delay: distance * 50,
      config: config.gentle,
    }
  })

  const baseSpring = useSpring({
    from: { positionY: -3 },
    to: { positionY: -1.5 },
    config: config.gentle,
  })

  const player = useRef<Group>()
  const intervalIterRef = useRef(0)

  const environment = useEnvironment()
  const gameState = useGameState()

  const [mapResetCount, setMapResetCount] = useState(0)

  const agentTiles = useMemo(() => {
    const takenTiles: number[] = []
    for (let i = 0; i < NUM_AGENTS; i++) {
      let rand = Math.floor(Math.random() * TILE_COUNT)
      while (takenTiles.includes(rand) || isBorderTile(rand)) {
        rand = Math.floor(Math.random() * TILE_COUNT)
      }
      takenTiles.push(rand)
    }
    return takenTiles
  }, [mapResetCount])

  const tilePositions = useMemo(
    () =>
      Array.from({ length: TILE_COUNT }, (_, i) => [
        (i % GRID_SIDE) * TILE_SPACING,
        1,
        Math.floor(i / GRID_SIDE) * TILE_SPACING,
      ] as [number, number, number]),
    [],
  )

  const generateTileMap = () => {
    let holyTile = Math.floor(Math.random() * TILE_COUNT)
    while (isBorderTile(holyTile) || agentTiles.includes(holyTile)) {
      holyTile = Math.floor(Math.random() * TILE_COUNT)
    }

    environment.setTargetPosition({
      x: holyTile % GRID_SIDE,
      y: Math.floor(holyTile / GRID_SIDE),
    })

    const newTileMap: { type: TileType; position: Position }[] = new Array(TILE_COUNT)

    for (let i = 0; i < TILE_COUNT; i++) {
      const { tile } = generateTiles(i, agentTiles)
      const x = i % GRID_SIDE
      const y = Math.floor(i / GRID_SIDE)

      let type: TileType

      if (holyTile === i) {
        type = GumTile
      } else if (isBorderTile(i) || tile === 'HOLOGRAM') {
        type = HologramTile
      } else if (tile === 'GUM') {
        type = GumTile
      } else {
        type = DefaultTile
      }

      newTileMap[i] = {
        type,
        position: { x, y },
      }
    }

    return newTileMap
  }

  const [movement, movementApi] = useSprings(NUM_AGENTS, (i) => ({
    positionX: environment.agentEnvironment[i].positionX,
    positionZ: environment.agentEnvironment[i].positionZ,
    rotation: environment.agentEnvironment[i].rotation,
    config: config.gentle,
  }))

  // RESETS AGENT METRICS BEFORE NEXT MAP CHANGE
  const resetAgentMetrics = () => {
    for (let i = 0; i < NUM_AGENTS; i++) {
      environment.agentEnvironment[i].setCoins(0, i)
      environment.agentEnvironment[i].setFinished(false, i)
      environment.agentEnvironment[i].setPositionY(0.5, i)
      environment.agentEnvironment[i].setPosition(
        {
          x: agentTiles[i] % GRID_SIDE,
          y: Math.floor(agentTiles[i] / GRID_SIDE),
        },
        i,
      )
    }
  }

  // MOVE AGENT
  const move = (direction: Direction | undefined, agentIdx: number) => {
    if (!direction) {
      return
    }
    const agent = environment.agentEnvironment[agentIdx]
    const stride = GRID_SIDE

    if (agent.finished) return

    let nextTile, nextTileType, positionX, positionZ, rotation

    switch (direction) {
      case 'left':
        nextTile = agent.tileMap[agent.position.x - 1 + stride * agent.position.y]
        nextTileType = nextTile?.type

        if (!nextTileType || !nextTileType?.type) return

        agent.position.x -= 1
        positionX = agent.positionX - TILE_SPACING
        rotation = -Math.PI * 0.5
        if (nextTileType.type === 'HOLOGRAM') {
          agent.setPositionY(-0.9, agentIdx)
          agent.setFinished(true, agentIdx)
        } else if (nextTileType.type === 'GUM') {
          agent.setFinished(true, agentIdx)
          nextTile.type = DefaultTile
        }

        movementApi.start((i) => {
          if (i === agentIdx) {
            return {
              positionX,
              rotation,
            }
          }
          return {}
        })
        agent.setRotation(rotation, agentIdx)
        agent.setPositionX(positionX, agentIdx)
        break

      case 'right':
        nextTile = agent.tileMap[agent.position.x + 1 + stride * agent.position.y]
        nextTileType = nextTile?.type

        if (!nextTileType || !nextTileType?.type) return

        agent.position.x += 1
        positionX = agent.positionX + TILE_SPACING
        rotation = Math.PI * 0.5
        if (nextTileType.type === 'HOLOGRAM') {
          agent.setPositionY(-0.9, agentIdx)
          agent.setFinished(true, agentIdx)
        } else if (nextTileType.type === 'GUM') {
          agent.setFinished(true, agentIdx)
          nextTile.type = DefaultTile
        }

        movementApi.start((i) => {
          if (i === agentIdx) {
            return {
              positionX,
              rotation,
            }
          }
          return {}
        })
        agent.setRotation(rotation, agentIdx)
        agent.setPositionX(positionX, agentIdx)

        break

      case 'up':
        nextTile = agent.tileMap[agent.position.x + stride * (agent.position.y - 1)]
        nextTileType = nextTile?.type

        if (!nextTileType || !nextTileType?.type) return

        agent.position.y -= 1
        positionZ = agent.positionZ - TILE_SPACING
        rotation = Math.PI

        if (nextTileType.type === 'HOLOGRAM') {
          agent.setPositionY(-0.9, agentIdx)
          agent.setFinished(true, agentIdx)
        } else if (nextTileType.type === 'GUM') {
          agent.setFinished(true, agentIdx)
          nextTile.type = DefaultTile
        }

        movementApi.start((i) => {
          if (i === agentIdx) {
            return {
              positionZ,
              rotation,
            }
          }
          return {}
        })
        agent.setRotation(rotation, agentIdx)
        agent.setPositionZ(positionZ, agentIdx)
        break

      case 'down':
        nextTile = agent.tileMap[agent.position.x + stride * (agent.position.y + 1)]
        nextTileType = nextTile?.type

        if (!nextTileType || !nextTileType?.type) return

        agent.position.y += 1
        positionZ = agent.positionZ + TILE_SPACING
        rotation = 0

        if (nextTileType.type === 'HOLOGRAM') {
          agent.setPositionY(-0.9, agentIdx)
          agent.setFinished(true, agentIdx)
        } else if (nextTileType.type === 'GUM') {
          agent.setFinished(true, agentIdx)
          nextTile.type = DefaultTile
        }

        movementApi.start((i) => {
          if (i === agentIdx) {
            return {
              positionZ,
              rotation,
            }
          }
          return {}
        })
        agent.setRotation(rotation, agentIdx)
        agent.setPositionZ(positionZ, agentIdx)

        break
    }
  }

  // UPDATE MAP AND SET AGENT INITIAL POSITION
  useEffect(() => {
    movementApi.start(() => {
      return {
        positionX: 0,
        positionZ: 0,
        rotation: 0,
      }
    })

    const newTileMap = generateTileMap()

    for (let i = 0; i < NUM_AGENTS; i++) {
      environment.agentEnvironment[i].setPositionX(0, i)
      environment.agentEnvironment[i].setPositionZ(0, i)
      const clonedTileMap = structuredClone(newTileMap)
      environment.agentEnvironment[i].setTileMap(clonedTileMap, i)
      environment.agentEnvironment[i].setPosition(
        {
          x: agentTiles[i] % GRID_SIDE,
          y: Math.floor(agentTiles[i] / GRID_SIDE),
        },
        i,
      )

      environment.agentEnvironment[i].setStartingTile(agentTiles[i])
    }
  }, [agentTiles])

  useEffect(() => {
    let intervalId

    const moveAgents = async () => {
      if (!policyNetwork) return
      let numFinished = 0

      const states: (State & { vision: number[] })[] = []

      for (const agent of environment.agentEnvironment) {
        const agentPosition = agent.position

        const vision: number[] = []

        for (let i = -1; i < 2; i++) {
          for (let j = -1; j < 2; j++) {
            const x = agent.position.x + i
            const y = agent.position.y + j
            if (x < 0 || y < 0 || x >= GRID_SIDE || y >= GRID_SIDE) {
              vision.push(1)
              continue
            }
            const tile = agent.tileMap[y * GRID_SIDE + x]
            vision.push(tile?.type.type === 'HOLOGRAM' ? 1 : 0)
          }
        }

        const normalizedPosX = agentPosition.x / GRID_SIDE
        const normalizedPosY = agentPosition.y / GRID_SIDE
        const normalizedTargetX = environment.targetPosition.x / GRID_SIDE
        const normalizedTargetY = environment.targetPosition.y / GRID_SIDE

        states.push({
          vision,
          posX: normalizedPosX,
          posY: normalizedPosY,
          targetPosX: normalizedTargetX,
          targetPosY: normalizedTargetY,
          distance: Math.sqrt(
            Math.pow(normalizedTargetX - normalizedPosX, 2) + Math.pow(normalizedTargetY - normalizedPosY, 2),
          ),
        })
      }

      const inputData = states.map((state) => {
        const normalizedVision = state.vision.map((cell) => clamp01(cell))
        const normalizedPosX = clamp01(state.posX)
        const normalizedPosY = clamp01(state.posY)
        const normalizedTargetX = clamp01(state.targetPosX)
        const normalizedTargetY = clamp01(state.targetPosY)
        const normalizedDistance = clamp01(state.distance / Math.SQRT2)

        return [
          ...normalizedVision,
          normalizedPosX,
          normalizedPosY,
          normalizedTargetX,
          normalizedTargetY,
          normalizedDistance,
        ]
      })

      const [actions] = await runModel(policyNetwork, inputData, 14)
      for (let i = 0; i < NUM_AGENTS; i++) {
        if (environment.agentEnvironment[i].finished) {
          numFinished += 1
        } else {
          const rawAction = actions[i]
          if (!Number.isFinite(rawAction) && process.env.NODE_ENV !== 'production') {
            console.warn('[LevelTwo] Received non-finite action output, defaulting to 0.', rawAction)
          }
          const safeAction = Number.isFinite(rawAction) ? rawAction : 0
          const actionIdx = Math.max(0, Math.min(DIRECTIONS.length - 1, Math.round(safeAction)))
          const direction = DIRECTIONS[actionIdx]
          move(direction, i)
        }
      }

    if (intervalIterRef.current % 3 === 0) {
        const rand = []

        for (let i = 0; i < environment.agentEnvironment[environment.currentAgentIdx].tileMap.length; i++) {
          rand.push(Math.random())
        }

        const agentPositions = environment.agentEnvironment.map((agent) => agent.position)
        for (const agent of environment.agentEnvironment) {
          const tileMap = agent.tileMap
          let newTileMap = structuredClone(agent.tileMap)
          let i = 0
          for (const tile of tileMap) {
            if (
              tile.type.type === 'HOLOGRAM' &&
              tile.position.x < GRID_SIDE - 1 &&
              tile.position.y < GRID_SIDE - 1 &&
              tile.position.x > 0 &&
              tile.position.y > 0
            ) {
              let position = structuredClone(tile.position)
              position.x = position.x + (rand[i] < 0.25 ? -1 : rand[i] < 0.5 ? 1 : 0)
              position.y = position.y + (rand[i] > 0.75 ? -1 : rand[i] >= 0.5 ? 1 : 0)
              const futureTile = tileMap.filter(
                (tile) => tile.position.x === position.x && tile.position.y === position.y,
              )
              if (
                futureTile.length > 0 &&
                futureTile[0].type.type === 'DEFAULT' &&
                agentPositions.filter(
                  (agentPosition) => agentPosition.x === position.x && agentPosition.y === position.y,
                ).length === 0
              ) {
                newTileMap[i].type = DefaultTile
                newTileMap[position.x + position.y * GRID_SIDE].type = HologramTile
              }
            }
            i += 1
          }
          agent.setTileMap(newTileMap, agent.index)
        }
  }

      if (numFinished >= NUM_AGENTS * 0.8) {
        resetAgentMetrics()
        setMapResetCount((prevCount) => prevCount + 1)
        gameState.setState('CHANGING')
      }
      intervalIterRef.current += 1
    }

    if (gameState.state === 'RUNNING' && policyNetwork) {
      intervalId = setInterval(() => {
        moveAgents()
      }, 175)
    }

    return () => {
      clearInterval(intervalId)
    }
  }, [environment.agentEnvironment, gameState.state, policyNetwork])

  useEffect(() => {
    if (gameState.state === 'CHANGING') {
      const startGame = () => {
        gameState.setChangingText('READY?')
        setTimeout(() => {
          gameState.setChangingText('GO!')
          setTimeout(() => {
            gameState.setState('RUNNING')
          }, 400)
        }, 400)
      }
      startGame()
    }
  }, [gameState.state])

  return (
    <>
      {/* <Perf /> */}
      <Center top position-y={0.3}>
        {springs.map((props, i) => {
          const tile = environment?.agentEnvironment[environment.currentAgentIdx]?.tileMap[i]
          const tileType = tile?.type.type
          const agentIndexAtTile = agentTiles.indexOf(i)

          return (
            <Fragment key={i}>
              <animated.mesh
                scale={props.scale}
                key={i}
                position={tilePositions[i]}
                onPointerDown={(event) => {
                  if (agentIndexAtTile === -1) return
                  event.stopPropagation()
                  if (environment.currentAgentIdx !== agentIndexAtTile) {
                    environment.setCurrentAgentIdx(agentIndexAtTile)
                  }
                }}
              >
                {agentTiles.includes(i) ? (
                  agentTiles[environment.currentAgentIdx] === i ? (
                    <>
                      <Player
                        rotation-y={movement[environment.currentAgentIdx].rotation}
                        position-x={movement[environment.currentAgentIdx].positionX}
                        position-z={movement[environment.currentAgentIdx].positionZ}
                        position-y={environment.agentEnvironment[environment.currentAgentIdx].positionY}
                        ref={player}
                      />
                    </>
                  ) : (
                    <Clone movement={movement} i={i} />
                  )
                ) : null}
                {/*@ts-ignore */}
                <RoundedBox castShadow receiveShadow args={[1, 0.1, 1]}>
                  {tileType !== 'HOLOGRAM' ? (
                    <meshStandardMaterial
                      color={
                        Math.abs(
                          environment.agentEnvironment[environment.currentAgentIdx].position.x -
                            (i % GRID_SIDE),
                        ) <= VISION_LENGTH &&
                        Math.abs(
                          environment.agentEnvironment[environment.currentAgentIdx].position.y -
                            Math.floor(i / GRID_SIDE),
                        ) <= VISION_LENGTH
                          ? '#00ff00'
                          : tileType === 'BOMB'
                            ? '#FF3D33'
                            : '#3A3D5E'
                      }
                    />
                  ) : (
                    <HologramMaterial />
                  )}
                </RoundedBox>
                {tileType === 'GUM' ? <Gum /> : null}
              </animated.mesh>
            </Fragment>
          )
        })}
      </Center>
      {/*@ts-ignore */}
      <animated.mesh position-y={baseSpring.positionY} rotation-x={Math.PI * 0.5}>
        {/*@ts-ignore */}
        <RoundedBox receiveShadow args={[30, 30]}>
          <meshStandardMaterial color={'#212336'} />
        </RoundedBox>
      </animated.mesh>
      <AnimatedGrid
        position-y={baseSpring.positionY}
        args={[10.5, 10.5]}
        cellSize={0.6}
        cellThickness={1}
        cellColor={'#6f6f6f'}
        sectionSize={3.3}
        sectionThickness={1.5}
        sectionColor={'#3A3D5E'}
        fadeDistance={50}
        fadeStrength={1}
        infiniteGrid
      />
    </>
  )
}

const generateTiles = (i: number, agentTiles: number[]) => {
  const hologram = Math.random() > 0.85 && !agentTiles.includes(i)
  const tile = hologram ? 'HOLOGRAM' : 'DEFAULT'

  return {
    tile,
  }
}
