'use client';

import { ComponentType, useMemo } from 'react';
import type { EnvironmentType, LevelType, LevelConfig } from '@/app/game/types_new';
import { EnvironmentType as EnvEnum, LevelType as LevelEnum } from '@/app/game/types_new';
import { BunnyGardenL1Scene } from '@/ui/levels/BunnyGardenL1';
import { BunnyGardenL2Scene } from '@/ui/levels/BunnyGardenL2';
import { SwarmDronesL1Scene } from '@/ui/levels/SwarmDronesL1';
import { SwarmDronesL2Scene } from '@/ui/levels/SwarmDronesL2';
import { ReefGuardiansL1Scene } from '@/ui/levels/ReefGuardiansL1';
import { ReefGuardiansL2Scene } from '@/ui/levels/ReefGuardiansL2';
import { WarehouseBotsL1Scene } from '@/ui/levels/WarehouseBotsL1';
import { WarehouseBotsL2Scene } from '@/ui/levels/WarehouseBotsL2';
import { SnowplowFleetL1Scene } from '@/ui/levels/SnowplowFleetL1';
import { SnowplowFleetL2Scene } from '@/ui/levels/SnowplowFleetL2';

type LevelSceneComponent = ComponentType<{ level: LevelConfig }>;

interface EnvironmentRendererProps {
  environment: EnvironmentType | null;
  level: LevelType | null;
}

// Default level configs for each environment
const DEFAULT_LEVEL_CONFIGS: Record<EnvironmentType, Record<LevelType, LevelConfig>> = {
  [EnvEnum.BUNNY_GARDEN]: {
    [LevelEnum.LEVEL_1]: {
      id: LevelEnum.LEVEL_1,
      name: 'Bunny Garden - Level 1',
      gridSize: 25,
      difficulty: 1,
      description: 'Simple navigation task',
      staticObstacles: [
        { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 5 },
        { x: 20, y: 10 }, { x: 21, y: 10 },
      ],
      goalPositions: [{ x: 22, y: 22 }],
      startPositions: [{ x: 2, y: 2 }],
    },
    [LevelEnum.LEVEL_2]: {
      id: LevelEnum.LEVEL_2,
      name: 'Bunny Garden - Level 2',
      gridSize: 25,
      difficulty: 2,
      description: 'Complex maze navigation',
      staticObstacles: [
        { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 5 },
        { x: 8, y: 10 }, { x: 9, y: 10 }, { x: 10, y: 10 },
        { x: 15, y: 15 }, { x: 16, y: 16 },
        { x: 20, y: 5 }, { x: 20, y: 6 }, { x: 20, y: 7 },
      ],
      goalPositions: [{ x: 22, y: 22 }],
      startPositions: [{ x: 2, y: 2 }],
    },
  },
  [EnvEnum.SWARM_DRONES]: {
    [LevelEnum.LEVEL_1]: {
      id: LevelEnum.LEVEL_1,
      name: 'Swarm Drones - Level 1',
      gridSize: 30,
      difficulty: 1,
      description: 'Open exploration space',
      staticObstacles: [],
      goalPositions: [],
      startPositions: [
        { x: 5, y: 5 },
        { x: 25, y: 5 },
        { x: 5, y: 25 },
        { x: 25, y: 25 },
      ],
    },
    [LevelEnum.LEVEL_2]: {
      id: LevelEnum.LEVEL_2,
      name: 'Swarm Drones - Level 2',
      gridSize: 30,
      difficulty: 2,
      description: 'Cluttered exploration',
      staticObstacles: [
        { x: 15, y: 15 }, { x: 15, y: 16 },
        { x: 14, y: 15 }, { x: 16, y: 15 },
      ],
      goalPositions: [],
      startPositions: [
        { x: 5, y: 5 },
        { x: 25, y: 5 },
        { x: 5, y: 25 },
        { x: 25, y: 25 },
      ],
    },
  },
  [EnvEnum.REEF_GUARDIANS]: {
    [LevelEnum.LEVEL_1]: {
      id: LevelEnum.LEVEL_1,
      name: 'Reef Guardians - Level 1',
      gridSize: 35,
      difficulty: 1,
      description: 'Open reef',
      staticObstacles: [],
      goalPositions: [],
      startPositions: [
        { x: 10, y: 10 },
        { x: 12, y: 10 },
        { x: 14, y: 10 },
        { x: 10, y: 12 },
        { x: 12, y: 12 },
        { x: 14, y: 12 },
      ],
    },
    [LevelEnum.LEVEL_2]: {
      id: LevelEnum.LEVEL_2,
      name: 'Reef Guardians - Level 2',
      gridSize: 35,
      difficulty: 2,
      description: 'Complex reef structures',
      staticObstacles: [
        { x: 25, y: 20 }, { x: 26, y: 20 },
        { x: 20, y: 25 }, { x: 21, y: 25 },
      ],
      goalPositions: [],
      startPositions: [
        { x: 10, y: 10 },
        { x: 12, y: 10 },
        { x: 14, y: 10 },
        { x: 10, y: 12 },
        { x: 12, y: 12 },
        { x: 14, y: 12 },
      ],
    },
  },
  [EnvEnum.WAREHOUSE_BOTS]: {
    [LevelEnum.LEVEL_1]: {
      id: LevelEnum.LEVEL_1,
      name: 'Warehouse Bots - Level 1',
      gridSize: 30,
      difficulty: 1,
      description: 'Simple delivery',
      staticObstacles: [
        { x: 15, y: 10 }, { x: 15, y: 11 },
        { x: 10, y: 15 }, { x: 11, y: 15 },
      ],
      goalPositions: [{ x: 25, y: 25 }],
      startPositions: [
        { x: 5, y: 5 },
        { x: 5, y: 7 },
        { x: 5, y: 9 },
      ],
    },
    [LevelEnum.LEVEL_2]: {
      id: LevelEnum.LEVEL_2,
      name: 'Warehouse Bots - Level 2',
      gridSize: 30,
      difficulty: 2,
      description: 'Multi-delivery chaos',
      staticObstacles: [
        { x: 15, y: 10 }, { x: 15, y: 11 },
        { x: 10, y: 15 }, { x: 11, y: 15 },
        { x: 20, y: 20 }, { x: 21, y: 20 },
      ],
      goalPositions: [
        { x: 25, y: 25 },
        { x: 10, y: 25 },
      ],
      startPositions: [
        { x: 5, y: 5 },
        { x: 5, y: 7 },
        { x: 5, y: 9 },
      ],
    },
  },
  [EnvEnum.SNOWPLOW_FLEET]: {
    [LevelEnum.LEVEL_1]: {
      id: LevelEnum.LEVEL_1,
      name: 'Snowplow Fleet - Level 1',
      gridSize: 40,
      difficulty: 1,
      description: 'Open roads',
      staticObstacles: [],
      goalPositions: [],
      startPositions: [
        { x: 5, y: 20 },
        { x: 35, y: 20 },
      ],
    },
    [LevelEnum.LEVEL_2]: {
      id: LevelEnum.LEVEL_2,
      name: 'Snowplow Fleet - Level 2',
      gridSize: 40,
      difficulty: 2,
      description: 'Congested streets',
      staticObstacles: [
        { x: 20, y: 15 }, { x: 20, y: 16 },
        { x: 20, y: 24 }, { x: 20, y: 25 },
      ],
      goalPositions: [],
      startPositions: [
        { x: 5, y: 20 },
        { x: 35, y: 20 },
      ],
    },
  },
};

export function EnvironmentRenderer({ environment, level }: EnvironmentRendererProps) {
  const { SceneComponent, levelConfig } = useMemo<{
    SceneComponent: LevelSceneComponent | null;
    levelConfig: LevelConfig | null;
  }>(() => {
    if (!environment || !level) {
      return { SceneComponent: null, levelConfig: null };
    }

    let Scene: LevelSceneComponent | null = null;
    switch (environment) {
      case EnvEnum.BUNNY_GARDEN:
        Scene = level === LevelEnum.LEVEL_1 ? BunnyGardenL1Scene : BunnyGardenL2Scene;
        break;
      case EnvEnum.SWARM_DRONES:
        Scene = level === LevelEnum.LEVEL_1 ? SwarmDronesL1Scene : SwarmDronesL2Scene;
        break;
      case EnvEnum.REEF_GUARDIANS:
        Scene = level === LevelEnum.LEVEL_1 ? ReefGuardiansL1Scene : ReefGuardiansL2Scene;
        break;
      case EnvEnum.WAREHOUSE_BOTS:
        Scene = level === LevelEnum.LEVEL_1 ? WarehouseBotsL1Scene : WarehouseBotsL2Scene;
        break;
      case EnvEnum.SNOWPLOW_FLEET:
        Scene = level === LevelEnum.LEVEL_1 ? SnowplowFleetL1Scene : SnowplowFleetL2Scene;
        break;
    }

    const config = DEFAULT_LEVEL_CONFIGS[environment]?.[level] || null;
    return { SceneComponent: Scene, levelConfig: config };
  }, [environment, level]);

  if (!SceneComponent || !levelConfig) {
    return (
      <div className="flex items-center justify-center w-full h-full text-slate-300">
        Select an environment and level to begin
      </div>
    );
  }

  return <SceneComponent level={levelConfig} />;
}
