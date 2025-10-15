'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimulationCanvasWrapper } from '@/ui/simulation/SimulationCanvasWrapper';
import { SimulationControls } from '@/ui/simulation/SimulationControls';
import { SimulationMetrics } from '@/ui/simulation/SimulationMetrics';
import { useSimulationStore } from '@/state/simulationStore';
import { cn } from '@/lib/utils';
import {
  getAllEnvironments,
  getEnvironmentDescription,
  getEnvironmentName,
  getLevelConfig,
} from '@/app/env';
import {
  EnvironmentType,
  LevelType,
  type LevelConfig,
} from '@/app/game/types_new';
import { BunnyGardenL1 } from '@/ui/levels/BunnyGardenL1';
import { BunnyGardenL2 } from '@/ui/levels/BunnyGardenL2';
import { SwarmDronesL1 } from '@/ui/levels/SwarmDronesL1';
import { SwarmDronesL2 } from '@/ui/levels/SwarmDronesL2';
import { ReefGuardiansL1 } from '@/ui/levels/ReefGuardiansL1';
import { ReefGuardiansL2 } from '@/ui/levels/ReefGuardiansL2';
import { WarehouseBotsL1 } from '@/ui/levels/WarehouseBotsL1';
import { WarehouseBotsL2 } from '@/ui/levels/WarehouseBotsL2';
import { SnowplowFleetL1 } from '@/ui/levels/SnowplowFleetL1';
import { SnowplowFleetL2 } from '@/ui/levels/SnowplowFleetL2';

type LevelSceneComponent = ComponentType<{ level: LevelConfig }>;

const LEVEL_SCENES: Record<EnvironmentType, Record<LevelType, LevelSceneComponent>> = {
  [EnvironmentType.BUNNY_GARDEN]: {
    [LevelType.LEVEL_1]: BunnyGardenL1,
    [LevelType.LEVEL_2]: BunnyGardenL2,
  },
  [EnvironmentType.SWARM_DRONES]: {
    [LevelType.LEVEL_1]: SwarmDronesL1,
    [LevelType.LEVEL_2]: SwarmDronesL2,
  },
  [EnvironmentType.REEF_GUARDIANS]: {
    [LevelType.LEVEL_1]: ReefGuardiansL1,
    [LevelType.LEVEL_2]: ReefGuardiansL2,
  },
  [EnvironmentType.WAREHOUSE_BOTS]: {
    [LevelType.LEVEL_1]: WarehouseBotsL1,
    [LevelType.LEVEL_2]: WarehouseBotsL2,
  },
  [EnvironmentType.SNOWPLOW_FLEET]: {
    [LevelType.LEVEL_1]: SnowplowFleetL1,
    [LevelType.LEVEL_2]: SnowplowFleetL2,
  },
};

const ENV_STYLES: Record<EnvironmentType, { badge: string; gradient: string; accent: string }> = {
  [EnvironmentType.BUNNY_GARDEN]: {
    badge: 'border-amber-400/40 bg-amber-500/20 text-amber-200',
    gradient: 'from-amber-500/10 to-yellow-400/5',
    accent: 'text-amber-200',
  },
  [EnvironmentType.SWARM_DRONES]: {
    badge: 'border-sky-400/40 bg-sky-500/20 text-sky-100',
    gradient: 'from-sky-500/10 to-indigo-500/5',
    accent: 'text-sky-200',
  },
  [EnvironmentType.REEF_GUARDIANS]: {
    badge: 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100',
    gradient: 'from-emerald-500/10 to-teal-500/5',
    accent: 'text-emerald-200',
  },
  [EnvironmentType.WAREHOUSE_BOTS]: {
    badge: 'border-slate-400/40 bg-slate-600/20 text-slate-100',
    gradient: 'from-slate-500/10 to-zinc-800/50',
    accent: 'text-slate-200',
  },
  [EnvironmentType.SNOWPLOW_FLEET]: {
    badge: 'border-blue-400/40 bg-blue-500/20 text-blue-100',
    gradient: 'from-blue-500/10 to-cyan-500/5',
    accent: 'text-blue-200',
  },
};

interface LevelPreviewProps {
  env: EnvironmentType;
  levelType: LevelType;
  config: LevelConfig;
  active: boolean;
  onSelect: () => void;
}

function LevelPreview({ env, levelType, config, active, onSelect }: LevelPreviewProps) {
  const SceneComponent = LEVEL_SCENES[env][levelType];
  const stats = useMemo(
    () => ({
      staticCount: config.staticObstacles.length,
      movingCount: config.movingObstacles?.length ?? 0,
      startCount: config.startPositions.length,
      goalCount: config.goalPositions.length,
    }),
    [config]
  );

  const envStyle = ENV_STYLES[env];

  return (
    <Card
      onClick={onSelect}
      className={cn(
        'group relative overflow-hidden rounded-3xl border bg-white/5 backdrop-blur transition-all duration-300',
        active
          ? 'border-cyan-400/60 shadow-[0_20px_80px_-40px_rgba(34,211,238,0.8)]'
          : 'border-white/10 hover:border-cyan-300/40 hover:bg-white/10'
      )}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge className={cn('rounded-full border px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em]', envStyle.badge)}>
            {levelType.replace('_', ' ')}
          </Badge>
          <span className="text-xs font-medium text-slate-300">Difficulty {config.difficulty}</span>
        </div>
        <CardTitle className="text-lg font-semibold text-white">{config.name}</CardTitle>
        <p className="text-sm text-slate-300">{config.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
          <SceneComponent level={config} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/80" />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="font-mono uppercase tracking-[0.25em] text-[0.55rem] text-slate-400">Static</p>
            <p className="text-sm font-semibold text-slate-100">{stats.staticCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="font-mono uppercase tracking-[0.25em] text-[0.55rem] text-slate-400">Moving</p>
            <p className="text-sm font-semibold text-slate-100">{stats.movingCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="font-mono uppercase tracking-[0.25em] text-[0.55rem] text-slate-400">Starts</p>
            <p className="text-sm font-semibold text-slate-100">{stats.startCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="font-mono uppercase tracking-[0.25em] text-[0.55rem] text-slate-400">Goals</p>
            <p className="text-sm font-semibold text-slate-100">{stats.goalCount}</p>
          </div>
        </div>
        <p className={cn('text-xs leading-relaxed text-slate-400', envStyle.accent)}>
          Tap to load this level into the live simulation canvas below.
        </p>
      </CardContent>
    </Card>
  );
}

export default function GamePage() {
  const environments = useMemo(() => getAllEnvironments(), []);
  const [metricsReady, setMetricsReady] = useState(false);

  const { environment, level, setEnvironment, setLevel } = useSimulationStore(
    useShallow((state) => ({
      environment: state.environment,
      level: state.level,
      setEnvironment: state.setEnvironment,
      setLevel: state.setLevel,
    }))
  );

  const [focusedEnv, setFocusedEnv] = useState<EnvironmentType>(environment);

  useEffect(() => {
    const timer = window.setTimeout(() => setMetricsReady(true), 180);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setFocusedEnv(environment);
  }, [environment]);

  const focusedName = getEnvironmentName(focusedEnv);
  const focusedDescription = getEnvironmentDescription(focusedEnv);

  const envStyle = ENV_STYLES[focusedEnv];

  const levelConfigs = useMemo(
    () => ({
      [LevelType.LEVEL_1]: getLevelConfig(focusedEnv, LevelType.LEVEL_1),
      [LevelType.LEVEL_2]: getLevelConfig(focusedEnv, LevelType.LEVEL_2),
    }),
    [focusedEnv]
  );

  const handleLevelSelect = (env: EnvironmentType, levelType: LevelType) => {
    if (env !== environment) {
      setEnvironment(env);
    }
    setLevel(levelType);
  };

  return (
    <main className="bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 top-[-35%] h-[360px] w-[360px] rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute right-[-25%] top-[25%] h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.65),rgba(2,6,23,0.9))]" aria-hidden />
        </div>
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-24 lg:py-28">
          <div className="max-w-3xl space-y-6">
            <Badge className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-slate-200">
              multi-level environments
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Inspect every Level 1 + Level 2 arena before you deploy a policy.
            </h1>
            <p className="text-lg text-slate-300">
              Each environment ships with handcrafted curriculum levels. Preview the layouts, obstacle mixes, and agent spawn patterns, then load them directly into the live simulation workspace below.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {environments.map((env) => {
              const isActive = env === focusedEnv;
              const { badge } = ENV_STYLES[env];
              return (
                <Button
                  key={env}
                  variant="outline"
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm capitalize transition-colors duration-200',
                    isActive
                      ? 'border-cyan-400/70 bg-cyan-500/10 text-white shadow-[0_12px_60px_-30px_rgba(56,189,248,0.7)]'
                      : cn('border-white/15 bg-white/5 text-slate-200 hover:border-cyan-300/60 hover:text-white', badge)
                  )}
                  onClick={() => setFocusedEnv(env)}
                >
                  {getEnvironmentName(env)}
                </Button>
              );
            })}
          </div>

          <div className={cn('overflow-hidden rounded-[32px] border border-white/10 p-6 shadow-[0_30px_120px_-45px_rgba(56,189,248,0.6)] backdrop-blur', `bg-gradient-to-br ${envStyle.gradient}`)}>
            <div className="mb-8 max-w-2xl space-y-3">
              <h2 className="text-2xl font-semibold text-white">{focusedName}</h2>
              <p className="text-sm text-slate-300">{focusedDescription}</p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <LevelPreview
                env={focusedEnv}
                levelType={LevelType.LEVEL_1}
                config={levelConfigs[LevelType.LEVEL_1]}
                active={environment === focusedEnv && level === LevelType.LEVEL_1}
                onSelect={() => handleLevelSelect(focusedEnv, LevelType.LEVEL_1)}
              />
              <LevelPreview
                env={focusedEnv}
                levelType={LevelType.LEVEL_2}
                config={levelConfigs[LevelType.LEVEL_2]}
                active={environment === focusedEnv && level === LevelType.LEVEL_2}
                onSelect={() => handleLevelSelect(focusedEnv, LevelType.LEVEL_2)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(8,47,73,0.4),rgba(2,6,23,0.95))]" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
            <SimulationCanvasWrapper className="min-h-[480px]" />
            <div className="flex flex-col gap-6">
              <SimulationControls />
              {metricsReady ? <SimulationMetrics /> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
