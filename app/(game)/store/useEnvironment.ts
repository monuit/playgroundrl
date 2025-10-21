import { create } from 'zustand'
import { EnvironmentState, Position, TileType } from '@/index.d'
import { createMovementSanitizers } from '../movementSanitizer'

const NUM_AGENTS = 10
const TILE_COUNT = 625
const TILE_SPACING = 1.1
const GRID_SIDE = Math.sqrt(TILE_COUNT)

const { sanitizeValue, sanitizeRotation, sanitizeTileCoordinate, sanitizeTileIndex, worldBound } = createMovementSanitizers({
  gridSide: GRID_SIDE,
  tileSpacing: TILE_SPACING,
  context: 'EnvironmentStore',
})

const sanitizeHeight = (value: number, fallback: number) => {
  const safeFallback = Number.isFinite(fallback) ? fallback : 0.5
  if (!Number.isFinite(value)) {
    return safeFallback
  }
  return Math.max(-10, Math.min(10, value))
}

const sanitizeSteps = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return Number.isFinite(fallback) ? fallback : 0
  }
  return Math.max(0, Math.floor(value))
}

const sanitizeCoins = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return Number.isFinite(fallback) ? fallback : 0
  }
  return Math.max(0, Math.floor(value))
}

const sanitizeAgentIndex = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return Number.isFinite(fallback) ? fallback : 0
  }
  const clamped = Math.max(0, Math.min(NUM_AGENTS - 1, Math.floor(value)))
  return clamped
}

const useEnvironment = create<EnvironmentState>()((set) => ({
  TILE_COUNT,
  targetPosition: { x: 0, y: 0 },
  setTargetPosition: (targetPosition: { x: number; y: number }) =>
    set((state) => ({
      ...state,
      targetPosition: {
        x: sanitizeTileCoordinate('targetX', targetPosition.x, state.targetPosition.x),
        y: sanitizeTileCoordinate('targetY', targetPosition.y, state.targetPosition.y),
      },
    })),
  agentEnvironment: [...Array(NUM_AGENTS)].map((_, i) => ({
    position: { x: 0, y: 0 },
    tileMap: [],
    steps: 100,
    coins: 0,
    index: i,
    startingTile: 0,
    positionX: 0,
    positionZ: 0,
    positionY: 0.5,
    rotation: 0,
    finished: false,
    setPositionY: (positionY: number, i: number) =>
      set((state) => ({
        agentEnvironment: state.agentEnvironment.map((agent, idx) =>
          idx === i
            ? { ...agent, positionY: sanitizeHeight(positionY, agent.positionY) }
            : agent,
        ),
      })),
    setStartingTile: (startingTile: number) =>
      set((state) => ({
        agentEnvironment: state.agentEnvironment.map((agent, idx) =>
          idx === i ? { ...agent, startingTile: sanitizeTileIndex('startingTile', startingTile, agent.startingTile) } : agent,
        ),
      })),
    setPositionX: (positionX: number, i: number) =>
      set((state) => ({
        agentEnvironment: state.agentEnvironment.map((agent, idx) =>
          idx === i
            ? {
                ...agent,
                positionX: sanitizeValue('positionX', positionX, agent.positionX, -worldBound, worldBound),
              }
            : agent,
        ),
      })),
    setPositionZ: (positionZ: number, i: number) =>
      set((state) => ({
        agentEnvironment: state.agentEnvironment.map((agent, idx) =>
          idx === i
            ? {
                ...agent,
                positionZ: sanitizeValue('positionZ', positionZ, agent.positionZ, -worldBound, worldBound),
              }
            : agent,
        ),
      })),
    setRotation: (rotation: number, i: number) =>
      set((state) => ({
        agentEnvironment: state.agentEnvironment.map((agent, idx) =>
          idx === i ? { ...agent, rotation: sanitizeRotation(rotation, agent.rotation) } : agent,
        ),
      })),
    setFinished: (finished: boolean, i: number) =>
      set((state) => ({
        agentEnvironment: state.agentEnvironment.map((agent, idx) => (idx === i ? { ...agent, finished } : agent)),
      })),
    setSteps: (steps: number, i: number) =>
      set((state) => ({
        agentEnvironment: state.agentEnvironment.map((agent, idx) =>
          idx === i ? { ...agent, steps: sanitizeSteps(steps, agent.steps) } : agent,
        ),
      })),
    setPosition: (position: Position, i: number) =>
      set((state) => ({
        agentEnvironment: state.agentEnvironment.map((agent, idx) =>
          idx === i
            ? {
                ...agent,
                position: {
                  x: sanitizeTileCoordinate('tileX', position.x, agent.position.x),
                  y: sanitizeTileCoordinate('tileY', position.y, agent.position.y),
                },
              }
            : agent,
        ),
      })),
    setTileMap: (tileMap: { type: TileType; position: Position }[], i: number) =>
      set((state) => ({
        agentEnvironment: state.agentEnvironment.map((agent, idx) => (idx === i ? { ...agent, tileMap } : agent)),
      })),
    setCoins: (coins: number, i: number) =>
      set((state) => ({
        agentEnvironment: state.agentEnvironment.map((agent, idx) =>
          idx === i ? { ...agent, coins: sanitizeCoins(coins, agent.coins) } : agent,
        ),
      })),
  })),
  setAgentEnvironment: (agentEnvironment, i) =>
    set((state) => ({
      agentEnvironment: state.agentEnvironment.map((agent, idx) =>
        idx === i
          ? {
              ...agent,
              ...agentEnvironment,
              positionX: sanitizeValue('positionX', agentEnvironment.positionX ?? agent.positionX, agent.positionX, -worldBound, worldBound),
              positionZ: sanitizeValue('positionZ', agentEnvironment.positionZ ?? agent.positionZ, agent.positionZ, -worldBound, worldBound),
              rotation: sanitizeRotation(agentEnvironment.rotation ?? agent.rotation, agent.rotation),
              positionY: sanitizeHeight(agentEnvironment.positionY ?? agent.positionY, agent.positionY),
              position: {
                x: sanitizeTileCoordinate('tileX', agentEnvironment.position?.x ?? agent.position.x, agent.position.x),
                y: sanitizeTileCoordinate('tileY', agentEnvironment.position?.y ?? agent.position.y, agent.position.y),
              },
              steps: sanitizeSteps(agentEnvironment.steps ?? agent.steps, agent.steps),
              coins: sanitizeCoins(agentEnvironment.coins ?? agent.coins, agent.coins),
              startingTile: sanitizeTileIndex('startingTile', agentEnvironment.startingTile ?? agent.startingTile, agent.startingTile),
            }
          : agent,
      ),
    })),
  currentAgentIdx: 0,
  setCurrentAgentIdx: (currentAgentIdx) =>
    set((state) => ({ currentAgentIdx: sanitizeAgentIndex(currentAgentIdx, state.currentAgentIdx) })),
}))

export default useEnvironment
