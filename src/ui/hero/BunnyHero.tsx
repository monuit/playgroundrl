'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Suspense } from "react";
import { Canvas } from "@/lib/r3f-canvas";
import { R3FProvider } from "@/lib/R3FProvider";
import { PerspectiveCamera } from "@react-three/drei";
import { ENV_LOOKUP } from "@/env";
import type { ActionSpace, EnvObservation } from "@/env/types";
import type { LevelType } from "@/types/game";
import { LevelType as LevelEnum } from "@/types/game";
import type { BunnyRenderableState } from "@/env";
import { BunnyScene } from "@/env/bunny_garden";
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
  ChevronLeft,
  ChevronRight,
  Info,
  PauseCircle,
  PlayCircle,
  Zap,
} from "lucide-react";

const BUNNY_ENV_ID = "lumen-bunny";
const HERO_BACKGROUND = "radial-gradient(circle at 20% 20%, rgba(56,189,248,0.16), transparent 55%), radial-gradient(circle at 75% 80%, rgba(56,189,248,0.08), transparent 60%), #040714";
const levelOrder: LevelType[] = [LevelEnum.LEVEL_1, LevelEnum.LEVEL_2];

type BunnyEnvDefinition = NonNullable<(typeof ENV_LOOKUP)[typeof BUNNY_ENV_ID]>;
type BunnyEnvInstance = ReturnType<BunnyEnvDefinition["create"]>;

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

export function BunnyHero() {
  const [activeLevel, setActiveLevel] = useState<LevelType>(LevelEnum.LEVEL_1);
  const [sceneState, setSceneState] = useState<BunnyRenderableState | null>(null);
  const [running, setRunning] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const envRef = useRef<BunnyEnvInstance | null>(null);
  const stepIndexRef = useRef(0);
  const animationTimerRef = useRef<number | null>(null);

  const bunnyDefinition = ENV_LOOKUP[BUNNY_ENV_ID];

  const warmupSteps = useMemo(() => (activeLevel === LevelEnum.LEVEL_2 ? 28 : 12), [activeLevel]);

  const runInterval = useMemo(() => (activeLevel === LevelEnum.LEVEL_2 ? 220 : 320), [activeLevel]);

  const resetEnvironment = useCallback(() => {
    if (!bunnyDefinition) {
      return;
    }

    if (animationTimerRef.current !== null) {
      window.clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    const env = bunnyDefinition.create();
    envRef.current = env;
    stepIndexRef.current = 0;

    const initialObservation = env.reset();
    let latest = initialObservation;

    for (let i = 0; i < warmupSteps; i += 1) {
      const action = sampleAction(env.actionSpace, stepIndexRef.current);
      stepIndexRef.current += 1;
      const result = env.step(action);
      latest = result?.state ?? latest;
      if (result?.done) {
        latest = env.reset();
      }
    }

    const renderable = observationToRenderable(latest);
    const sanitized = sanitizeState(renderable);
    setSceneState((sanitized ?? null) as BunnyRenderableState | null);
  }, [bunnyDefinition, warmupSteps]);

  useEffect(() => {
    resetEnvironment();
    setRunning(false);
    return () => {
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current);
      }
    };
  }, [resetEnvironment, activeLevel]);

  useEffect(() => {
    if (!running) {
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
      return undefined;
    }

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
      setSceneState((sanitized ?? null) as BunnyRenderableState | null);
    }, runInterval);

    return () => {
      if (animationTimerRef.current !== null) {
        window.clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [running, runInterval]);

  const handleToggleRun = () => {
    setRunning((prev) => !prev);
  };

  const handlePrevLevel = () => {
    const currentIndex = levelOrder.indexOf(activeLevel);
    const nextIndex = (currentIndex - 1 + levelOrder.length) % levelOrder.length;
    setActiveLevel(levelOrder[nextIndex]);
  };

  const handleNextLevel = () => {
    const currentIndex = levelOrder.indexOf(activeLevel);
    const nextIndex = (currentIndex + 1) % levelOrder.length;
    setActiveLevel(levelOrder[nextIndex]);
  };

  const levelLabel = activeLevel === LevelEnum.LEVEL_1 ? "Level 1" : "Level 2";

  return (
    <div className="relative h-screen w-screen overflow-hidden text-slate-100" style={{ background: HERO_BACKGROUND }}>
      <div className="absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#020717] via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#01040c] via-[#01040c]/60 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(12,79,151,0.15),_transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),_transparent_58%)]" />
        <R3FProvider>
          {sceneState ? (
            <Canvas shadows dpr={[1, 1.8]}>
              <color attach="background" args={["#030616"]} />
              <fog attach="fog" args={["#030616", 30, 90]} />
              <PerspectiveCamera makeDefault position={[18, 15, 26]} fov={42} />
              <ambientLight intensity={0.45} color="#6cbcf5" />
              <directionalLight
                position={[40, 60, 30]}
                intensity={1.2}
                color="#60a5fa"
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <spotLight
                position={[-28, 50, -20]}
                intensity={0.8}
                angle={0.5}
                penumbra={0.4}
                color="#38bdf8"
                castShadow
              />
              <Suspense fallback={null}>
                <group position={[0, -6, 0]} scale={0.05}>
                  <BunnyScene state={sceneState} />
                </group>
              </Suspense>
            </Canvas>
          ) : null}
        </R3FProvider>
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-12 z-20 flex flex-col items-center gap-4">
        <div className="text-4xl font-semibold tracking-[0.32em] text-white drop-shadow-[0_8px_24px_rgba(15,23,42,0.72)]">
          PPO <span className="text-sky-300">Bunny</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            onClick={handleToggleRun}
            className="rounded-full bg-white/90 px-5 text-sm font-semibold uppercase tracking-[0.28em] text-slate-900 shadow-[0_12px_32px_rgba(15,23,42,0.45)] hover:bg-white"
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
                className="rounded-full border-white/30 bg-white/5 px-5 text-sm font-semibold uppercase tracking-[0.28em] text-slate-100 shadow-[0_10px_28px_rgba(15,23,42,0.35)] hover:bg-white/10"
              >
                <Info className="mr-2 size-4" /> Info
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md border border-white/10 bg-[#071123]/95 text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold tracking-wide text-white">PPO Bunny Overview</DialogTitle>
                <DialogDescription className="text-slate-300">
                  PPO Bunny showcases a policy gradient agent collecting glowing energy cells while navigating obstacles on a 25×25 grid. Use <strong>Run</strong> to step through the policy rollout and switch levels to explore harder layouts.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>Level 1 features static obstacles and a gentle reward curve.</p>
                <p>Level 2 introduces denser hazards and longer trajectories, highlighting PPO&apos;s stability.</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="pointer-events-auto absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-4">
        <div className="flex items-center gap-3 rounded-full border border-white/20 bg-black/40 px-4 py-2 backdrop-blur-xl">
          <Button
            size="icon"
            variant="ghost"
            className="size-9 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
            onClick={handlePrevLevel}
            aria-label="Previous level"
          >
            <ChevronLeft className="size-5" />
          </Button>
          <div className="min-w-[120px] text-center text-sm font-semibold uppercase tracking-[0.4em] text-white">
            {levelLabel}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="size-9 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
            onClick={handleNextLevel}
            aria-label="Next level"
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
        <Button
          onClick={() => window.open("/docs/models", "_blank")}
          className="rounded-full border border-sky-400/40 bg-sky-500/20 px-6 text-xs font-semibold uppercase tracking-[0.32em] text-sky-200 shadow-[0_10px_28px_rgba(56,189,248,0.35)] hover:bg-sky-500/30"
        >
          <Zap className="mr-2 size-4" /> Model Details
        </Button>
      </div>
    </div>
  );
}
