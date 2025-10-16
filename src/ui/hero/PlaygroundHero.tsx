'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ENV_LOOKUP } from "@/env";
import type { ActionSpace, Env, EnvObservation } from "@/env/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Info,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

const DEFAULT_WARMUP_STEPS = 18;
const DEFAULT_RUN_INTERVAL = 280;

type Vector3Tuple = [number, number, number];

type HeroEnvConfig = {
  id: string;
  label: string;
  tagline: string;
  accent: {
    primary: string;
    secondary: string;
  };
  camera: {
    position: Vector3Tuple;
    fov: number;
  };
  scene: {
    scale: number;
    position?: Vector3Tuple;
    rotation?: Vector3Tuple;
  };
  warmupSteps?: number;
  interval?: number;
  docsUrl?: string;
};

const HERO_ENVIRONMENTS: HeroEnvConfig[] = [
  {
    id: "lumen-bunny",
    label: "Lumen Valley",
    tagline: "Curriculum-tuned agents harvesting luminous energy blooms.",
    accent: { primary: "#38bdf8", secondary: "#f472b6" },
    camera: {
      position: [18, 16, 28],
      fov: 42,
    },
    scene: {
      scale: 0.05,
      position: [0, -6, 0],
    },
    warmupSteps: 28,
    interval: 240,
    docsUrl: "/docs/env/bunny-garden",
  },
];

type HeroEnvId = (typeof HERO_ENVIRONMENTS)[number]["id"];

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace("#", "");
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => char + char)
          .join("")
      : sanitized.padEnd(6, "0");
  const parsed = Number.parseInt(normalized, 16);
  if (Number.isNaN(parsed)) {
    return `rgba(56, 189, 248, ${alpha})`;
  }
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

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

const observationToRenderable = (observation: EnvObservation | undefined) => {
  if (!observation) {
    return undefined;
  }
  if (typeof observation === "object" && "metadata" in observation) {
    const metadata = (observation as { metadata?: unknown }).metadata;
    return metadata ?? observation;
  }
  return observation;
};

const sampleContinuousAction = (
  actionSpace: Extract<ActionSpace, { type: "box" }>,
  stepIndex: number
) => {
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

const buildFallbackState = (envDefinition: (typeof ENV_LOOKUP)[string] | undefined) => {
  if (!envDefinition) {
    return null;
  }
  try {
    const env = envDefinition.create();
    const obs = env.reset();
    const renderable = observationToRenderable(obs);
    const sanitized = sanitizeState(renderable);
    return sanitized ?? null;
  } catch {
    return null;
  }
};

export function PlaygroundHero() {
  const defaultEnvId = HERO_ENVIRONMENTS[0]?.id ?? "";
  const [activeEnvId, setActiveEnvId] = useState<HeroEnvId>(defaultEnvId);
  const [running, setRunning] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [sceneState, setSceneState] = useState<unknown>(null);

  const envRef = useRef<Env | null>(null);
  const stepIndexRef = useRef(0);
  const animationTimerRef = useRef<number | null>(null);

  const activeConfig = useMemo(() => {
    return HERO_ENVIRONMENTS.find((env) => env.id === activeEnvId) ?? HERO_ENVIRONMENTS[0];
  }, [activeEnvId]);

  const envDefinition = activeConfig ? ENV_LOOKUP[activeConfig.id] : undefined;
  const SceneComponent = envDefinition?.Scene;
  const fallbackState = useMemo(
    () => buildFallbackState(envDefinition),
    [envDefinition]
  );

  const backgroundStyle = useMemo(
    () => ({
      background: `radial-gradient(circle at 20% 20%, ${hexToRgba(activeConfig.accent.primary, 0.28)}, transparent 52%), radial-gradient(circle at 78% 85%, ${hexToRgba(activeConfig.accent.secondary, 0.22)}, transparent 58%), #030615`,
    }),
    [activeConfig.accent.primary, activeConfig.accent.secondary]
  );

  const resetEnvironment = useCallback(() => {
    if (animationTimerRef.current !== null) {
      window.clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    if (!envDefinition) {
      envRef.current = null;
      setSceneState(null);
      return;
    }

    try {
      const env = envDefinition.create();
      envRef.current = env;
      stepIndexRef.current = 0;
      let latest = env.reset();
      const warmupSteps = activeConfig.warmupSteps ?? DEFAULT_WARMUP_STEPS;

      for (let i = 0; i < warmupSteps; i += 1) {
        const action = sampleAction(env.actionSpace, stepIndexRef.current);
        stepIndexRef.current += 1;
        const result = env.step(action);
        latest = result?.state ?? latest;
        if (result?.done) {
          latest = env.reset();
          stepIndexRef.current = 0;
        }
      }

      const renderable = observationToRenderable(latest);
      const sanitized = sanitizeState(renderable);
      setSceneState(sanitized ?? null);
    } catch (error) {
      console.error("Failed to initialize hero environment", error);
      envRef.current = null;
      setSceneState(null);
    }
  }, [activeConfig.warmupSteps, envDefinition]);

  useEffect(() => {
    setRunning(false);
    resetEnvironment();
    return () => {
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [resetEnvironment]);

  useEffect(() => {
    if (!running) {
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
      return undefined;
    }

    const interval = activeConfig.interval ?? DEFAULT_RUN_INTERVAL;
    animationTimerRef.current = window.setInterval(() => {
      const env = envRef.current;
      if (!env) {
        return;
      }
      const action = sampleAction(env.actionSpace, stepIndexRef.current);
      stepIndexRef.current += 1;
      const result = env.step(action);
      let latest = result?.state;
      if (result?.done) {
        latest = env.reset();
        stepIndexRef.current = 0;
      }
      const renderable = observationToRenderable(latest);
      const sanitized = sanitizeState(renderable);
      setSceneState(sanitized ?? null);
    }, interval);

    return () => {
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [running, activeConfig.interval]);

  const handleToggleRun = () => {
    setRunning((prev) => !prev);
  };

  const handleSelectEnv = (id: HeroEnvId) => {
    if (id === activeEnvId) {
      return;
    }
    setActiveEnvId(id);
  };

  const selectedDocsUrl = activeConfig.docsUrl ?? "/docs";
  const infoDescription = envDefinition?.description ?? activeConfig.tagline;

  const scenePosition = activeConfig.scene.position ?? [0, 0, 0];
  const sceneRotation = activeConfig.scene.rotation ?? [0, 0, 0];

  return (
    <div
      className="relative h-screen w-screen overflow-hidden text-slate-100"
      style={backgroundStyle}
    >
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-black/40 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-60 bg-gradient-to-t from-black/60 via-black/25 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(15,23,42,0.28),_transparent_62%)]" />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 18% 82%, ${hexToRgba(
              activeConfig.accent.primary,
              0.18
            )}, transparent 55%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 78% 18%, ${hexToRgba(
              activeConfig.accent.secondary,
              0.18
            )}, transparent 58%)`,
          }}
        />
        {SceneComponent ? (
          <Canvas shadows dpr={[1, 1.8]}>
            <color attach="background" args={["#030616"]} />
            <fog attach="fog" args={["#030616", 35, 110]} />
            <PerspectiveCamera makeDefault position={activeConfig.camera.position} fov={activeConfig.camera.fov} />
            <Suspense fallback={null}>
              <group
                position={scenePosition}
                rotation={sceneRotation as Vector3Tuple}
                scale={activeConfig.scene.scale}
              >
                <SceneComponent state={sceneState ?? fallbackState ?? null} />
              </group>
            </Suspense>
          </Canvas>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-200/60">
            Environment unavailable
          </div>
        )}
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-16 z-20 flex flex-col items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-semibold tracking-[0.28em] uppercase text-white drop-shadow-[0_16px_40px_rgba(15,23,42,0.68)]">
            Playground<span className="text-sky-300">RL</span>
          </div>
          <p className="mt-2 text-sm font-medium uppercase tracking-[0.46em] text-slate-200/75">
            Multi-environment reinforcement learning showcase
          </p>
        </div>
        <div className="pointer-events-auto flex items-center gap-3">
          <Button
            onClick={handleToggleRun}
            className="rounded-full bg-white/90 px-5 text-sm font-semibold uppercase tracking-[0.28em] text-slate-900 shadow-[0_14px_40px_rgba(11,15,25,0.55)] hover:bg-white"
          >
            {running ? (
              <>
                <PauseCircle className="mr-2 size-4" /> Pause
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 size-4" /> Run
              </>
            )}
          </Button>
          <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full border-white/40 bg-white/10 px-5 text-sm font-semibold uppercase tracking-[0.28em] text-slate-100 shadow-[0_12px_32px_rgba(12,19,34,0.46)] hover:bg-white/15"
              >
                <Info className="mr-2 size-4" /> Info
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md border border-white/10 bg-[#071123]/95 text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold tracking-wide text-white">
                  {activeConfig.label}
                </DialogTitle>
                <DialogDescription className="text-slate-300">
                  {infoDescription}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>{activeConfig.tagline}</p>
                <p>
                  Toggle through environments to see how PlaygroundRL stitches together diverse policy
                  challenges inside a single simulation stack.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="pointer-events-auto absolute bottom-20 left-1/2 z-20 flex w-full max-w-5xl -translate-x-1/2 flex-col items-center gap-6 px-6">
        <div className="rounded-full border border-white/20 bg-black/35 px-6 py-2 backdrop-blur-xl text-sm font-semibold uppercase tracking-[0.42em] text-white">
          {activeConfig.label}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {HERO_ENVIRONMENTS.map((env) => {
            const isActive = env.id === activeEnvId;
            return (
              <Button
                key={env.id}
                variant="outline"
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-100 transition"
                style={{
                  backgroundColor: isActive
                    ? hexToRgba(env.accent.primary, 0.35)
                    : "rgba(15, 23, 42, 0.35)",
                  boxShadow: isActive
                    ? `0 12px 38px ${hexToRgba(env.accent.primary, 0.35)}`
                    : "0 10px 28px rgba(15, 23, 42, 0.35)",
                  borderColor: isActive ? hexToRgba(env.accent.secondary, 0.55) : "rgba(255,255,255,0.18)",
                }}
                onClick={() => handleSelectEnv(env.id)}
              >
                {env.label}
              </Button>
            );
          })}
        </div>

        <Button
          onClick={() => window.open(selectedDocsUrl, "_blank")}
          className="rounded-full border border-white/20 bg-white/10 px-6 text-xs font-semibold uppercase tracking-[0.32em] text-slate-100 shadow-[0_14px_40px_rgba(12,19,34,0.55)] hover:bg-white/15"
        >
          View Docs
        </Button>
      </div>
    </div>
  );
}
