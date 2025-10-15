/**
 * NEW ARCHITECTURE: MULTI-ENVIRONMENT RL PLAYGROUND
 * ==================================================
 * 
 * This document outlines the complete redesign from single bunny maze
 * to 5 distinct multi-agent environments, each with PPO + DQN variants.
 */

// ════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT CATALOG
// ════════════════════════════════════════════════════════════════════════════

export const ENVIRONMENTS = {
  BUNNY_GARDEN: {
    id: 'bunny_garden',
    name: 'Bunny Garden',
    description: 'Gentle exploration with treat collection',
    agentType: 'bunny',
    agentCount: 1,
    obsType: 'position_based',
    actionSpace: 'discrete_4',
    algorithms: ['PPO', 'DQN'],
  },
  SWARM_DRONES: {
    id: 'swarm_drones',
    name: 'Swarm Drones',
    description: 'Tiny quadcopters exploring a neon maze',
    agentType: 'drone',
    agentCount: 4,
    obsType: 'lidar_rays',
    actionSpace: 'continuous_steering',
    algorithms: ['PPO', 'DQN'],
    obs: {
      localLidar: '8-16 rays',
      neighborOffsets: 'relative positions',
      battery: 'fuel level',
      tileVisited: 'coverage bit',
    },
    rewards: {
      firstTileCoverage: 1.0,
      collision: -1.0,
      frontierProximity: 0.1,
      fullCoverageBonus: 10.0,
    },
  },
  REEF_GUARDIANS: {
    id: 'reef_guardians',
    name: 'Reef Guardians',
    description: 'Fish herd algae grazers vs predators',
    agentType: 'fish',
    agentCount: 6,
    obsType: 'sector_based',
    actionSpace: 'steering_boost',
    algorithms: ['PPO', 'DQN'],
    obs: {
      sectors: 'algae density in sectors',
      predatorDirection: 'threat location',
      schoolCentroid: 'flock center',
      energy: 'movement budget',
    },
    rewards: {
      algaeReduced: 1.0,
      predationEvent: -1.0,
      schoolCohesion: 0.1,
      episodeBonus: 5.0,
    },
  },
  WAREHOUSE_BOTS: {
    id: 'warehouse_bots',
    name: 'Warehouse Bots',
    description: 'Kiva-style bots fetching shelves',
    agentType: 'bot',
    agentCount: 3,
    obsType: 'grid_occupancy',
    actionSpace: 'discrete_5',
    algorithms: ['PPO', 'DQN'],
    obs: {
      occupancyGrid: 'local 5x5',
      jobQueue: 'pending orders',
      neighborVelocities: 'collision avoidance',
      battery: 'charge level',
    },
    rewards: {
      orderCompleted: 10.0,
      waitTimePenalty: -0.1,
      blockingIntersection: -1.0,
      chargeReturn: 0.5,
    },
  },
  SNOWPLOW_FLEET: {
    id: 'snowplow_fleet',
    name: 'Snowplow Fleet',
    description: 'Clear city blocks in ongoing snow',
    agentType: 'plow',
    agentCount: 2,
    obsType: 'weather_grid',
    actionSpace: 'continuous_steering',
    algorithms: ['PPO', 'DQN'],
    obs: {
      snowDepth: 'local accumulation',
      trafficDensity: 'vehicle positions',
      plowAngle: 'blade orientation',
      saltLeft: 'supply remaining',
    },
    rewards: {
      laneCleared: 1.0,
      accident: -5.0,
      fuelOveruse: -0.1,
      saltOveruse: -0.05,
    },
  },
};

// ════════════════════════════════════════════════════════════════════════════
// ARCHITECTURE LAYERS
// ════════════════════════════════════════════════════════════════════════════

/*
┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 1: TYPE SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ • EnvironmentType enum (BUNNY_GARDEN, SWARM_DRONES, etc.)              │
│ • Agent<T> generic for agent-specific fields                           │
│ • Observation<T> for environment-specific obs                          │
│ • Action<T> for environment-specific actions                           │
│ • EnvironmentConfig with Level1/Level2 variants                        │
│ • AlgorithmType ('PPO' | 'DQN')                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 2: ENVIRONMENTS                                │
├─────────────────────────────────────────────────────────────────────────┤
│ • env/index.ts - environment registry + factory                        │
│ • env/bunny_garden.tsx - Level1/Level2 components                     │
│ • env/swarm_drones.tsx - L1/L2 components + lidar logic               │
│ • env/reef_guardians.tsx - L1/L2 + boid animation                     │
│ • env/warehouse_bots.tsx - L1/L2 + queue logic                        │
│ • env/snowplow_fleet.tsx - L1/L2 + weather simulation                 │
│ • env/types.ts - observation/action definitions per env               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 3: STATE MANAGEMENT                           │
├─────────────────────────────────────────────────────────────────────────┤
│ • store/environmentStore.ts - current env + level + config             │
│ • store/agentStores.ts - per-environment agent stores (keyed by env) │
│ • store/worldStores.ts - per-environment world (obstacles, etc.)      │
│ • All using Zustand with proper typing                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 4: GAME ENGINES                               │
├─────────────────────────────────────────────────────────────────────────┤
│ • algo/engines/ directory with per-environment engines                 │
│ • algo/engines/bunnyGardenEngine.ts                                   │
│ • algo/engines/swarmDronesEngine.ts                                   │
│ • algo/engines/reefGuardiansEngine.ts                                 │
│ • algo/engines/warehouseBotsEngine.ts                                 │
│ • algo/engines/snowplowFleetEngine.ts                                 │
│ • Each implements: buildObs(), computeReward(), applyAction()         │
│ • Each supports both PPO & DQN observation formats                    │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 5: INFERENCE SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────┤
│ • algo/inference.ts - polymorphic inference wrapper                    │
│ • algo/ppo_tfjs.ts / algo/dqn_tfjs.ts - existing TensorFlow           │
│ • algo/ppo_onnx.ts / algo/dqn_onnx.ts - ONNX versions (new)          │
│ • Handles variable obs shapes per environment                          │
│ • Batch inference across agents                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 6: 3D RENDERING                               │
├─────────────────────────────────────────────────────────────────────────┤
│ • Each env has Level1/Level2 renderer components                       │
│ • Level1: Simple static setup                                          │
│ • Level2: Dynamic elements (weather, traffic, etc.)                   │
│ • Shared patterns: InstancedMesh, useFrame, spring animations         │
│ • Per-agent 3D components (drone, fish, bot, plow, bunny)            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 7: TRAINING                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ • train/envs/ - gymnasium wrappers for each environment                │
│ • train/train_ppo.py - single PPO trainer (env selector)              │
│ • train/train_dqn.py - single DQN trainer (env selector)              │
│ • train/export_onnx.py - batch export all envs × both algorithms      │
│ • Output: public/models/{ENV}_{ALGORITHM}.onnx                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    LAYER 8: UI & ROUTING                               │
├─────────────────────────────────────────────────────────────────────────┤
│ • src/app/page.tsx - environment selector                              │
│ • src/app/game/page.tsx - dynamic renderer (picks env based on store) │
│ • src/app/game/layout.tsx - shared game layout                         │
│ • HUD responsive to current environment                                 │
└─────────────────────────────────────────────────────────────────────────┘
*/

// ════════════════════════════════════════════════════════════════════════════
// FILE TREE (NEW STRUCTURE)
// ════════════════════════════════════════════════════════════════════════════

const NEW_FILE_STRUCTURE = `
src/
├── app/
│   ├── page.tsx (environment selector)
│   ├── game/
│   │   ├── page.tsx (dynamic renderer)
│   │   ├── layout.tsx
│   │   ├── Hud.tsx (dynamic UI)
│   │   ├── store/
│   │   │   ├── environmentStore.ts
│   │   │   ├── agentStores.ts (per-env)
│   │   │   └── worldStores.ts (per-env)
│   │   ├── envs/
│   │   │   ├── index.ts (registry)
│   │   │   ├── types.ts
│   │   │   ├── bunny_garden.tsx
│   │   │   ├── swarm_drones.tsx
│   │   │   ├── reef_guardians.tsx
│   │   │   ├── warehouse_bots.tsx
│   │   │   ├── snowplow_fleet.tsx
│   │   │   └── agents/
│   │   │       ├── BunnyAgent.tsx
│   │   │       ├── DroneAgent.tsx
│   │   │       ├── FishAgent.tsx
│   │   │       ├── BotAgent.tsx
│   │   │       └── PlowAgent.tsx
│   │   └── types.ts (core types)
│   └── algo/
│       ├── engines/
│       │   ├── index.ts
│       │   ├── bunnyGardenEngine.ts
│       │   ├── swarmDronesEngine.ts
│       │   ├── reefGuardiansEngine.ts
│       │   ├── warehouseBotsEngine.ts
│       │   └── snowplowFleetEngine.ts
│       ├── inference.ts (polymorphic wrapper)
│       ├── ppo_tfjs.ts (existing)
│       ├── dqn_tfjs.ts (existing)
│       ├── ppo_onnx.ts (new)
│       ├── dqn_onnx.ts (new)
│       ├── types.ts
│       └── schedules.ts
└── train/
    ├── envs/
    │   ├── __init__.py
    │   ├── bunny_garden_env.py
    │   ├── swarm_drones_env.py
    │   ├── reef_guardians_env.py
    │   ├── warehouse_bots_env.py
    │   └── snowplow_fleet_env.py
    ├── train_ppo.py (flexible)
    ├── train_dqn.py (flexible)
    ├── export_onnx.py
    └── requirements.txt
`;

// ════════════════════════════════════════════════════════════════════════════
// KEY DESIGN PRINCIPLES
// ════════════════════════════════════════════════════════════════════════════

const DESIGN_PRINCIPLES = `
1. GRID CONSISTENCY
   - All environments: 25×25 grid, TILE_SIZE=1
   - Observation vectors normalized to this scale
   - Level1/Level2 increase complexity, not grid size

2. POLYMORPHIC ENGINES
   - Each engine implements same interface (buildObs, computeReward, applyAction)
   - Engine can be queried at runtime: which algorithm? what shapes?
   - Makes inference system trivial: engine.getObsShape() → setup tensor

3. PER-ENVIRONMENT STORES
   - useAgentStore['swarm_drones'] vs useAgentStore['warehouse_bots']
   - useWorldStore['swarm_drones'] vs useWorldStore['warehouse_bots']
   - Zustand keyed by environment ID

4. ALGORITHM FLEXIBILITY
   - PPO & DQN both available for each environment
   - Python: single trainer script, --env and --algorithm flags
   - Frontend: env selector → algorithm selector → model path
   - Models: public/models/{ENV}_{ALGORITHM}.onnx

5. RENDERING PATTERNS
   - Level1Component + Level2Component per environment
   - Shared Spring animation, InstancedMesh patterns
   - Per-agent 3D components (reusable)
   - Post-effects applied globally, not per-env

6. DATA CONTRACTS
   - Each environment specifies observation shape
   - Each environment specifies action space
   - Documented in env/types.ts with examples
   - Train/inference must match exactly
`;

export { NEW_FILE_STRUCTURE, DESIGN_PRINCIPLES };
