'use client';

import { ComponentType, useMemo } from 'react';
import type { LevelType } from '@/types/game';
import { LevelType as LevelEnum } from '@/types/game';
import { ENV_LOOKUP } from '@/env';
import type { ActionSpace, EnvObservation } from '@/env/types';

interface EnvironmentRendererProps {
  environment: string | null;
  level: LevelType | null;
}

const sanitizeState = <T,>(value: T, depth = 0, seen = new WeakSet<object>()): T => {
  if (depth > 8) {
    return value;
  }

  if (typeof value === 'number') {
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

  if (!value || typeof value !== 'object') {
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
  if (typeof observation === 'object' && 'metadata' in observation) {
    const metadata = (observation as { metadata?: unknown }).metadata;
    return metadata ?? observation;
  }
  return observation;
};

const sampleContinuousAction = (actionSpace: Extract<ActionSpace, { type: 'box' }>, stepIndex: number) => {
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
  if (actionSpace.type === 'discrete') {
    if (!Number.isFinite(actionSpace.n) || actionSpace.n <= 0) {
      return 0;
    }
    return stepIndex % actionSpace.n;
  }
  return sampleContinuousAction(actionSpace, stepIndex);
};

const stateCache = new Map<string, unknown>();

const buildSceneState = (environment: string, level: LevelType) => {
  const cacheKey = `${environment}:${level}`;
  if (stateCache.has(cacheKey)) {
    return stateCache.get(cacheKey);
  }

  const definition = ENV_LOOKUP[environment];
  if (!definition) {
    stateCache.set(cacheKey, undefined);
    return undefined;
  }

  try {
    const env = definition.create();
    const actionSpace = env.actionSpace;
    const stepsToSimulate = level === LevelEnum.LEVEL_2 ? 8 : 0;

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
    console.warn(`Failed to construct preview state for environment ${environment}`, error);
    stateCache.set(cacheKey, undefined);
    return undefined;
  }
};

export function EnvironmentRenderer({ environment, level }: EnvironmentRendererProps) {
  const { SceneComponent, state } = useMemo(() => {
    if (!environment || !level) {
      return { SceneComponent: null, state: undefined } as const;
    }

    const definition = ENV_LOOKUP[environment];
    if (!definition) {
      return { SceneComponent: null, state: undefined } as const;
    }

    const Scene = definition.Scene as ComponentType<{ state: unknown }>;
    const displayState = buildSceneState(environment, level);
    return { SceneComponent: Scene, state: displayState } as const;
  }, [environment, level]);

  if (!SceneComponent) {
    return null;
  }

  return <SceneComponent state={state ?? {}} />;
}
