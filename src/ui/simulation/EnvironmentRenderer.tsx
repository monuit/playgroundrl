'use client';

import { ComponentType, useMemo } from 'react';
import type { EnvironmentType, LevelType } from '@/app/game/types_new';
import { EnvironmentType as EnvEnum, LevelType as LevelEnum } from '@/app/game/types_new';
import {
  SwarmDronesDefinition,
  ReefGuardiansDefinition,
  WarehouseBotsDefinition,
  SnowplowFleetDefinition,
  type SwarmDronesRenderableState,
  type ReefGuardiansRenderableState,
  type WarehouseBotsRenderableState,
  type SnowplowFleetRenderableState,
} from '@/env';
import { BunnyGardenDefinition, type BunnyRenderableState } from '@/env/bunny_garden';

interface EnvironmentRendererProps {
  environment: EnvironmentType | null;
  level: LevelType | null;
}

const BUNNY_BOUNDS = 120;
const BUNNY_MAX_STEPS = 240;

const createBunnyDisplayState = (level: LevelType): BunnyRenderableState => {
  if (level === LevelEnum.LEVEL_1) {
    return {
      bounds: BUNNY_BOUNDS,
      bunny: {
        position: { x: -58, y: -36 },
        heading: Math.PI * 0.35,
        energy: 0.86,
      },
      carrots: [
        { id: 0, position: { x: -48, y: 48 }, value: 1, active: true },
        { id: 1, position: { x: -6, y: 24 }, value: 0.9, active: true },
        { id: 2, position: { x: 42, y: -12 }, value: 1.1, active: true },
        { id: 3, position: { x: 64, y: 52 }, value: 0.8, active: true },
      ],
      obstacles: [
        { id: 0, position: { x: -12, y: -6 }, radius: 26, height: 60 },
        { id: 1, position: { x: 18, y: 46 }, radius: 18, height: 38 },
        { id: 2, position: { x: -48, y: 12 }, radius: 22, height: 48 },
      ],
      trail: [
        { x: -88, y: -62 },
        { x: -76, y: -54 },
        { x: -68, y: -48 },
        { x: -64, y: -42 },
        { x: -60, y: -38 },
        { x: -58, y: -36 },
      ],
      steps: 42,
      maxSteps: BUNNY_MAX_STEPS,
      collected: 2,
      target: 6,
    };
  }

  return {
    bounds: BUNNY_BOUNDS,
    bunny: {
      position: { x: 32, y: -70 },
      heading: Math.PI * 0.65,
      energy: 0.58,
    },
    carrots: [
      { id: 0, position: { x: -68, y: 54 }, value: 1.1, active: true },
      { id: 1, position: { x: -6, y: 42 }, value: 0.9, active: true },
      { id: 2, position: { x: 70, y: 48 }, value: 1.2, active: true },
      { id: 3, position: { x: 52, y: -6 }, value: 0.95, active: true },
      { id: 4, position: { x: -12, y: -62 }, value: 1.05, active: true },
    ],
    obstacles: [
      { id: 0, position: { x: -26, y: -18 }, radius: 30, height: 72 },
      { id: 1, position: { x: 18, y: 36 }, radius: 20, height: 54 },
      { id: 2, position: { x: 60, y: 6 }, radius: 28, height: 66 },
      { id: 3, position: { x: -58, y: 4 }, radius: 18, height: 44 },
    ],
    trail: [
      { x: -6, y: -92 },
      { x: 6, y: -88 },
      { x: 16, y: -82 },
      { x: 24, y: -76 },
      { x: 30, y: -72 },
      { x: 32, y: -70 },
    ],
    steps: 128,
    maxSteps: BUNNY_MAX_STEPS,
    collected: 4,
    target: 8,
  };
};

const SWARM_GRID_SIZE = 18;
const SWARM_CELL_SIZE = 18;
const SWARM_MAX_STEPS = 900;

const gridIndex = (x: number, y: number) => y * SWARM_GRID_SIZE + x;

const createSwarmDisplayState = (level: LevelType): SwarmDronesRenderableState => {
  const visited = Array<boolean>(SWARM_GRID_SIZE * SWARM_GRID_SIZE).fill(false);
  const markVisited = (tiles: Array<[number, number]>) => {
    tiles.forEach(([x, y]) => {
      if (x >= 0 && y >= 0 && x < SWARM_GRID_SIZE && y < SWARM_GRID_SIZE) {
        visited[gridIndex(x, y)] = true;
      }
    });
  };

  if (level === LevelEnum.LEVEL_1) {
    markVisited([
      [9, 9],
      [9, 10],
      [10, 9],
      [8, 9],
      [9, 8],
      [10, 10],
    ]);
  } else {
    markVisited([
      [9, 9],
      [9, 10],
      [10, 9],
      [8, 9],
      [9, 8],
      [10, 10],
      [11, 10],
      [12, 10],
      [12, 11],
      [7, 8],
      [6, 8],
      [5, 7],
    ]);
  }

  const visitedCount = visited.filter(Boolean).length;
  const drones: SwarmDronesRenderableState['drones'] = Array.from({ length: 7 }, (_, id) => {
    const angle = (Math.PI * 2 * id) / 7;
    const radius = level === LevelEnum.LEVEL_1 ? 36 : 52;
    return {
      id,
      position: {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      },
      heading: angle + Math.PI / 2,
      battery: level === LevelEnum.LEVEL_1 ? 0.82 - id * 0.03 : 0.68 - id * 0.025,
      isPrimary: id === 0,
      returning: level === LevelEnum.LEVEL_2 && id % 3 === 0,
    };
  });

  const frontiers = level === LevelEnum.LEVEL_1
    ? [
        { x: 11, y: 9 },
        { x: 8, y: 11 },
        { x: 10, y: 12 },
      ]
    : [
        { x: 12, y: 8 },
        { x: 13, y: 10 },
        { x: 6, y: 7 },
        { x: 7, y: 12 },
        { x: 4, y: 9 },
      ];

  return {
    gridSize: SWARM_GRID_SIZE,
    cellSize: SWARM_CELL_SIZE,
    visited,
    drones,
    frontiers,
    base: { x: 0, y: 0 },
    steps: level === LevelEnum.LEVEL_1 ? 210 : 420,
    maxSteps: SWARM_MAX_STEPS,
    coverage: visitedCount / (SWARM_GRID_SIZE * SWARM_GRID_SIZE),
    collisions: level === LevelEnum.LEVEL_1 ? 0 : 2,
  };
};

const REEF_MAX_STEPS = 600;

const createReefDisplayState = (level: LevelType): ReefGuardiansRenderableState => {
  const fishes: ReefGuardiansRenderableState['fishes'] = Array.from({ length: 12 }, (_, id) => {
    const theta = (Math.PI * 2 * id) / 12;
    const radius = level === LevelEnum.LEVEL_1 ? 42 : 64;
    return {
      id,
      position: {
        x: Math.cos(theta) * radius,
        y: Math.sin(theta) * radius,
      },
      heading: theta + (id % 2 === 0 ? 0.3 : -0.2),
      schooling: level === LevelEnum.LEVEL_1 ? id !== 5 : id % 3 !== 0,
      energy: level === LevelEnum.LEVEL_1 ? 0.84 - id * 0.015 : 0.68 - id * 0.02,
    };
  });

  const predators = level === LevelEnum.LEVEL_1
    ? [
        { id: 0, position: { x: -68, y: 24 } },
        { id: 1, position: { x: 72, y: -18 } },
      ]
    : [
        { id: 0, position: { x: -84, y: 32 } },
        { id: 1, position: { x: 90, y: -48 } },
        { id: 2, position: { x: 12, y: 88 } },
      ];

  const algaeCount = level === LevelEnum.LEVEL_1 ? 12 : 18;
  const algae: ReefGuardiansRenderableState['algae'] = Array.from({ length: algaeCount }, (_, id) => {
    const theta = (Math.PI * 2 * id) / algaeCount;
    const radius = 96 + (id % 3) * 12;
    return {
      id,
      position: {
        x: Math.cos(theta) * radius,
        y: Math.sin(theta) * radius,
      },
      density: level === LevelEnum.LEVEL_1 ? 0.55 + (id % 4) * 0.08 : 0.7 + (id % 5) * 0.06,
    };
  });

  const centroid = fishes.reduce(
    (acc, fish) => ({ x: acc.x + fish.position.x, y: acc.y + fish.position.y }),
    { x: 0, y: 0 }
  );
  centroid.x /= fishes.length;
  centroid.y /= fishes.length;

  return {
    fishes,
    predators,
    algae,
    centroid,
    cohesion: level === LevelEnum.LEVEL_1 ? 0.62 : 0.44,
    steps: level === LevelEnum.LEVEL_1 ? 140 : 320,
    maxSteps: REEF_MAX_STEPS,
    energy: level === LevelEnum.LEVEL_1 ? 0.78 : 0.52,
    algaeCleared: level === LevelEnum.LEVEL_1 ? 18 : 42,
    predationEvents: level === LevelEnum.LEVEL_1 ? 1 : 4,
  };
};

const WAREHOUSE_GRID_WIDTH = 10;
const WAREHOUSE_GRID_HEIGHT = 8;
const WAREHOUSE_CELL_SIZE = 22;
const WAREHOUSE_MAX_STEPS = 720;

const warehouseGridToWorld = (x: number, y: number) => {
  const originX = ((WAREHOUSE_GRID_WIDTH - 1) * WAREHOUSE_CELL_SIZE) / 2;
  const originY = ((WAREHOUSE_GRID_HEIGHT - 1) * WAREHOUSE_CELL_SIZE) / 2;
  return {
    x: x * WAREHOUSE_CELL_SIZE - originX,
    y: y * WAREHOUSE_CELL_SIZE - originY,
  };
};

const createWarehouseDisplayState = (level: LevelType): WarehouseBotsRenderableState => {
  const bots: WarehouseBotsRenderableState['bots'] = Array.from({ length: 6 }, (_, id) => {
    const gridX = id % 3 === 0 ? 1 : id % 3 === 1 ? 3 : 5;
    const gridY = 6 - Math.floor(id / 3);
    const position = warehouseGridToWorld(gridX, gridY);
    return {
      id,
      position,
      facing: (id % 4) as 0 | 1 | 2 | 3,
      battery: level === LevelEnum.LEVEL_1 ? 0.88 - id * 0.05 : 0.64 - id * 0.04,
      carrying: level === LevelEnum.LEVEL_2 && id % 2 === 0,
      docking: level === LevelEnum.LEVEL_1 ? id === 0 : id === 4,
    };
  });

  const shelves: WarehouseBotsRenderableState['shelves'] = Array.from({ length: 8 }, (_, id) => {
    const x = 2 + (id % 4) * 2;
    const y = 1 + Math.floor(id / 4) * 3;
    const position = { x, y };
    return {
      id,
      position,
      reserved: level === LevelEnum.LEVEL_2 && id % 3 === 0,
    };
  });

  const stations: WarehouseBotsRenderableState['stations'] = [
    { id: 0, position: { x: 8, y: 1 }, queue: level === LevelEnum.LEVEL_1 ? 1 : 3 },
    { id: 1, position: { x: 8, y: 4 }, queue: level === LevelEnum.LEVEL_1 ? 0 : 2 },
  ];

  const ordersInBacklog = level === LevelEnum.LEVEL_1 ? 2 : 7;
  const completed = level === LevelEnum.LEVEL_1 ? 6 : 18;
  const blockingEvents = level === LevelEnum.LEVEL_1 ? 1 : 5;

  return {
    gridWidth: WAREHOUSE_GRID_WIDTH,
    gridHeight: WAREHOUSE_GRID_HEIGHT,
    cellSize: WAREHOUSE_CELL_SIZE,
    bots,
    shelves,
    stations,
    ordersInBacklog,
    completed,
    steps: level === LevelEnum.LEVEL_1 ? 240 : 480,
    maxSteps: WAREHOUSE_MAX_STEPS,
    blockingEvents,
  };
};

const SNOW_GRID_SIZE = 14;
const SNOW_CELL_SIZE = 24;
const SNOW_MAX_STEPS = 720;
const SNOW_HALF = ((SNOW_GRID_SIZE - 1) * SNOW_CELL_SIZE) / 2;

const snowToWorld = (x: number, y: number) => ({
  x: x * SNOW_CELL_SIZE - SNOW_HALF,
  y: y * SNOW_CELL_SIZE - SNOW_HALF,
});

const buildSnowDepth = (intensity: number) =>
  Array.from({ length: SNOW_GRID_SIZE * SNOW_GRID_SIZE }, (_, idx) => {
    const x = idx % SNOW_GRID_SIZE;
    const y = Math.floor(idx / SNOW_GRID_SIZE);
    const centerDistance = Math.hypot(x - SNOW_GRID_SIZE / 2, y - SNOW_GRID_SIZE / 2);
    const gradient = Math.max(0.2, 1 - centerDistance / (SNOW_GRID_SIZE * 0.85));
    const variation = ((Math.sin(x * 1.7 + y * 2.1) + 1) / 2) * 0.35;
    return Number((intensity * gradient + variation * intensity * 0.6).toFixed(3));
  });

const createSnowplowDisplayState = (level: LevelType): SnowplowFleetRenderableState => {
  const intensity = level === LevelEnum.LEVEL_1 ? 0.55 : 0.85;
  const snowDepth = buildSnowDepth(intensity);

  const plows: SnowplowFleetRenderableState['plows'] = Array.from({ length: 4 }, (_, id) => {
    const tileX = 2 + id;
    const tileY = level === LevelEnum.LEVEL_1 ? 2 : 4;
    const position = snowToWorld(tileX, tileY);
    return {
      id,
      position,
      heading: id % 2 === 0 ? -Math.PI / 2 : Math.PI / 2,
      speed: level === LevelEnum.LEVEL_1 ? 6 + id : 8 + id,
      plowAngle: level === LevelEnum.LEVEL_1 ? 0 : id % 2 === 0 ? 0.3 : 0,
      salt: level === LevelEnum.LEVEL_1 ? 0.82 - id * 0.05 : 0.58 - id * 0.06,
      fuel: level === LevelEnum.LEVEL_1 ? 0.9 - id * 0.04 : 0.66 - id * 0.05,
    };
  });

  const vehicles: SnowplowFleetRenderableState['vehicles'] = Array.from({ length: 8 }, (_, id) => {
    const tileX = (id * 2) % SNOW_GRID_SIZE;
    const tileY = 1 + Math.floor((id * 2) / SNOW_GRID_SIZE) * 3;
    const position = snowToWorld(tileX, tileY);
    return {
      id,
      position,
      heading: id % 2 === 0 ? 0 : Math.PI,
    };
  });

  return {
    gridSize: SNOW_GRID_SIZE,
    cellSize: SNOW_CELL_SIZE,
    snowDepth,
    plows,
    vehicles,
    accidents: level === LevelEnum.LEVEL_1 ? 0 : 3,
    cleared: level === LevelEnum.LEVEL_1 ? 0.32 : 0.58,
    steps: level === LevelEnum.LEVEL_1 ? 180 : 360,
    maxSteps: SNOW_MAX_STEPS,
    weatherIntensity: intensity,
  };
};

export function EnvironmentRenderer({ environment, level }: EnvironmentRendererProps) {
  const { SceneComponent, state } = useMemo<{
    SceneComponent: ComponentType<{ state: unknown }> | null;
    state: unknown;
  }>(() => {
    if (!environment || !level) {
      return { SceneComponent: null, state: null };
    }

    switch (environment) {
      case EnvEnum.BUNNY_GARDEN:
        return {
          SceneComponent: BunnyGardenDefinition.Scene as ComponentType<{ state: unknown }>,
          state: createBunnyDisplayState(level),
        };
      case EnvEnum.SWARM_DRONES:
        return {
          SceneComponent: SwarmDronesDefinition.Scene as ComponentType<{ state: unknown }>,
          state: createSwarmDisplayState(level),
        };
      case EnvEnum.REEF_GUARDIANS:
        return {
          SceneComponent: ReefGuardiansDefinition.Scene as ComponentType<{ state: unknown }>,
          state: createReefDisplayState(level),
        };
      case EnvEnum.WAREHOUSE_BOTS:
        return {
          SceneComponent: WarehouseBotsDefinition.Scene as ComponentType<{ state: unknown }>,
          state: createWarehouseDisplayState(level),
        };
      case EnvEnum.SNOWPLOW_FLEET:
        return {
          SceneComponent: SnowplowFleetDefinition.Scene as ComponentType<{ state: unknown }>,
          state: createSnowplowDisplayState(level),
        };
      default:
        return { SceneComponent: null, state: null };
    }
  }, [environment, level]);

  if (!SceneComponent || !state) {
    return (
      <div className="flex items-center justify-center w-full h-full text-slate-300">
        Select an environment and level to begin
      </div>
    );
  }

  return <SceneComponent state={state} />;
}
