'use client';

import { Suspense, useMemo, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@/lib/r3f-canvas";
import { R3FProvider } from "@/lib/R3FProvider";
import { OrbitControls, PerspectiveCamera, Grid } from "@react-three/drei";
import { ENV_LOOKUP } from "@/env";
import type { LevelType } from "@/types/game";
import { LevelType as LevelEnum } from "@/types/game";
import { Button } from "@/components/ui/button";
import type { ActionSpace, EnvObservation } from "@/env/types";
import { cn } from "@/lib/utils";

const sanitizeState = <T,>(value: T, depth = 0, seen = new WeakSet<object>()): T => {
  if (depth > 8) {
    return value;
  }

  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return value;
    }
    if (Number.isNaN(value)) {
      return 0 as T;
    }
    if (value === Infinity || value === -Infinity) {
      return Math.sign(value) as unknown as T;
    }
    return 0 as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  if (seen.has(value as object)) {
    return value;
  }

  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeState(item, depth + 1, seen)) as unknown as T;
  }

  if (ArrayBuffer.isView(value)) {
    const ctor = (value as { constructor: { new (iterable: Iterable<number>): unknown } }).constructor;
    try {
      const sanitized = Array.from(value as unknown as Iterable<number>, (item) =>
        Number.isFinite(item) ? item : 0
      );
      return new ctor(sanitized) as T;
    } catch {
      return value;
    }
  }

  const result: Record<string, unknown> = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, entry]) => {
    result[key] = sanitizeState(entry, depth + 1, seen);
  });
  return result as T;
};

const observationToRenderable = (observation: EnvObservation | undefined): unknown => {
  if (!observation) {
    return undefined;
  }
  if (typeof observation === "object" && "metadata" in observation) {
    const metadata = (observation as { metadata?: unknown }).metadata;
    return metadata ?? observation;
  }
  return observation;
};

const sampleContinuousAction = (actionSpace: Extract<ActionSpace, { type: "box" }>, stepIndex: number) => {
  const totalSize = actionSpace.shape.reduce((acc, value) => acc * value, 1);
  const amplitude = 0.5;
  const base = Math.sin((stepIndex + 1) * 0.65) * amplitude;
  return Array.from({ length: totalSize }, (_, idx) => {
    const variation = Math.cos((stepIndex + idx) * 0.45) * amplitude * 0.4;
    const value = base + variation;
    return Math.max(actionSpace.low, Math.min(actionSpace.high, value));
  });
};

const sampleAction = (actionSpace: ActionSpace, stepIndex: number) => {
  if (actionSpace.type === "discrete") {
    if (!Number.isFinite(actionSpace.n) || actionSpace.n <= 0) {
      return 0;
    }
    return stepIndex % actionSpace.n;
  }
  return sampleContinuousAction(actionSpace, stepIndex);
};

const HERO_ENVIRONMENTS: Array<{ id: string; label: string }> = [
  { id: "lumen-bunny", label: "Bunny" },
  { id: "swarm-drones", label: "Drones" },
  { id: "reef-guardians", label: "Reef" },
  { id: "warehouse-bots", label: "Bots" },
  { id: "snowplow-fleet", label: "Plow" },
];

const validHeroEnvs = HERO_ENVIRONMENTS.filter((entry) => Boolean(ENV_LOOKUP[entry.id]));
const DEFAULT_ENVIRONMENT_ID = validHeroEnvs[0]?.id ?? HERO_ENVIRONMENTS[0]?.id ?? "";

const stateCache = new Map<string, unknown>();

const HERO_CONTROL_BASE =
  "h-7 rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] leading-none transition-all duration-200";
const HERO_CONTROL_ACTIVE =
  "border border-white/80 bg-white/95 text-slate-900 shadow-[0_8px_28px_rgba(15,23,42,0.45)]";
const HERO_CONTROL_INACTIVE =
  "border border-white/12 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white";

const buildSceneState = (environmentId: string, level: LevelType) => {
  const cacheKey = `${environmentId}:${level}`;
  if (stateCache.has(cacheKey)) {
    return stateCache.get(cacheKey);
  }

  const definition = ENV_LOOKUP[environmentId];
  if (!definition) {
    stateCache.set(cacheKey, undefined);
    return undefined;
  }

  try {
    const env = definition.create();
    const actionSpace = env.actionSpace;
    const stepsToSimulate = level === LevelEnum.LEVEL_2 ? 16 : 4;

    const initialObservation: EnvObservation | undefined = env.reset();
    let latest = initialObservation;

    for (let i = 0; i < stepsToSimulate; i += 1) {
      const action = sampleAction(actionSpace, i);
      const result = env.step(action);
      latest = result?.state ?? latest;
      if (result?.done) {
        latest = env.reset();
      }
    }

    const renderable = observationToRenderable(latest);
    const sanitized = sanitizeState(renderable);
    stateCache.set(cacheKey, sanitized);
    return sanitized;
  } catch (error) {
    console.warn(`Failed to construct preview state for environment ${environmentId}`, error);
    stateCache.set(cacheKey, undefined);
    return undefined;
  }
}

export function BunnyHero() {
  const [activeEnv, setActiveEnv] = useState<string>(DEFAULT_ENVIRONMENT_ID);
  const [activeLevel, setActiveLevel] = useState<LevelType>(LevelEnum.LEVEL_1);

  const definition = ENV_LOOKUP[activeEnv];
  const SceneComponent = definition?.Scene ?? null;

  const levelStates = useMemo(() => {
    if (!definition) {
      return {} as Record<LevelType, unknown>;
    }
    return {
      [LevelEnum.LEVEL_1]: buildSceneState(activeEnv, LevelEnum.LEVEL_1),
      [LevelEnum.LEVEL_2]: buildSceneState(activeEnv, LevelEnum.LEVEL_2),
    } as Record<LevelType, unknown>;
  }, [definition, activeEnv]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#050312]">
      <div className="pointer-events-auto absolute left-1/2 top-5 z-20 flex -translate-x-1/2 gap-1 rounded-full border border-white/10 bg-black/45 p-1 backdrop-blur-xl">
        {validHeroEnvs.map((env) => {
          const isActive = env.id === activeEnv;
          const label = ENV_LOOKUP[env.id]?.name ?? env.label;
          return (
            <Button
              key={env.id}
              size="sm"
              variant="ghost"
              className={cn(
                HERO_CONTROL_BASE,
                isActive ? HERO_CONTROL_ACTIVE : HERO_CONTROL_INACTIVE,
                "min-w-[72px]"
              )}
              onClick={() => {
                setActiveEnv(env.id);
                setActiveLevel(LevelEnum.LEVEL_1);
              }}
            >
              {label}
            </Button>
          );
        })}
      </div>

      <div className="pointer-events-auto absolute right-4 top-5 z-20 flex gap-1 rounded-full border border-white/10 bg-black/45 p-1 backdrop-blur-xl">
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            HERO_CONTROL_BASE,
            activeLevel === LevelEnum.LEVEL_1 ? HERO_CONTROL_ACTIVE : HERO_CONTROL_INACTIVE
          )}
          onClick={() => setActiveLevel(LevelEnum.LEVEL_1)}
        >
          Level 1
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            HERO_CONTROL_BASE,
            activeLevel === LevelEnum.LEVEL_2 ? HERO_CONTROL_ACTIVE : HERO_CONTROL_INACTIVE
          )}
          onClick={() => setActiveLevel(LevelEnum.LEVEL_2)}
        >
          Level 2
        </Button>
      </div>

      <R3FProvider>
        <Canvas
          className="absolute inset-0 h-full w-full"
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [14, 12, 26], fov: 45 }}
        >
          <color attach="background" args={["#050312"]} />
          <fog attach="fog" args={["#050312", 35, 80]} />

          <ambientLight intensity={0.35} />
          <directionalLight
            castShadow
            intensity={1.1}
            position={[24, 32, 14]}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <spotLight
            position={[-18, 18, -8]}
            angle={0.45}
            penumbra={0.4}
            intensity={0.6}
            color={new THREE.Color().setHSL(0.12, 0.6, 0.6)}
          />

          <Suspense fallback={null}>
            <group position={[0, -1.2, 0]}>
              <Grid
                args={[120, 120]}
                position={[0, -1.5, 0]}
                cellColor="#222836"
                sectionColor="#2a3245"
                fadeDistance={70}
              />
              {SceneComponent ? <SceneComponent state={levelStates[activeLevel] ?? {}} /> : null}
            </group>
          </Suspense>

          <PerspectiveCamera makeDefault position={[0, 12, 28]} fov={45} />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            autoRotate
            autoRotateSpeed={0.45}
            maxPolarAngle={Math.PI / 2.4}
            minPolarAngle={Math.PI / 3.4}
          />
        </Canvas>
      </R3FProvider>
    </div>
  );
}
