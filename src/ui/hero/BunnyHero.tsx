'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { ENV_LOOKUP } from "@/env";
import { HeroScene } from "@/ui/hero/HeroScene";
import { cn } from "@/lib/utils";
import type { LevelType } from "@/types/game";
import { LevelType as LevelEnum } from "@/types/game";

const HERO_ENVIRONMENTS: Array<{ id: string; label: string }> = [
  { id: "lumen-bunny", label: "Bunny" },
  { id: "swarm-drones", label: "Drones" },
  { id: "reef-guardians", label: "Reef" },
  { id: "warehouse-bots", label: "Bots" },
  { id: "snowplow-fleet", label: "Plow" },
];

const DEFAULT_ACCENT = "#38bdf8";

type HeroPoint = { x: number; z: number };

interface HeroLevelConfig {
  accent?: string;
  path: HeroPoint[];
  highlights: HeroPoint[];
}

interface HeroPresentationConfig {
  accent: string;
  levels: Partial<Record<LevelType, HeroLevelConfig>>;
}

const DEFAULT_PATH: HeroPoint[] = [
  { x: -2.8, z: -1.8 },
  { x: -1.4, z: -0.4 },
  { x: 0.2, z: 0.8 },
  { x: 1.9, z: 1.9 },
  { x: 3.2, z: 0.4 },
  { x: 1.2, z: -1.6 },
];

const DEFAULT_HIGHLIGHTS: HeroPoint[] = [
  { x: -2.0, z: -1.2 },
  { x: 0.2, z: 0.4 },
  { x: 2.4, z: 1.2 },
];

const HERO_PRESENTATIONS: Record<string, HeroPresentationConfig> = {
  "lumen-bunny": {
    accent: "#f97316",
    levels: {
      [LevelEnum.LEVEL_1]: {
        path: [
          { x: -3.4, z: -2.1 },
          { x: -1.8, z: -0.2 },
          { x: -0.1, z: 1.2 },
          { x: 1.8, z: 2 },
          { x: 3.1, z: 0.4 },
          { x: 1.2, z: -1.8 },
        ],
        highlights: [
          { x: -2.4, z: -1.6 },
          { x: -0.2, z: 0.6 },
          { x: 2.2, z: 1.6 },
        ],
      },
      [LevelEnum.LEVEL_2]: {
        accent: "#fb7185",
        path: [
          { x: -3.2, z: -2.8 },
          { x: -1.6, z: -0.8 },
          { x: 0.4, z: 0.6 },
          { x: 2.2, z: 1.8 },
          { x: 3, z: 0.1 },
          { x: 1.4, z: -2.2 },
          { x: -0.4, z: -2.6 },
        ],
        highlights: [
          { x: -2.6, z: -2 },
          { x: -0.4, z: 0.4 },
          { x: 2.6, z: 1 },
        ],
      },
    },
  },
  "swarm-drones": {
    accent: "#38bdf8",
    levels: {
      [LevelEnum.LEVEL_1]: {
        path: [
          { x: -3.1, z: -2.4 },
          { x: -1.5, z: -0.8 },
          { x: 0.1, z: 0.9 },
          { x: 1.9, z: 1.9 },
          { x: 3.2, z: 0.3 },
          { x: 1.1, z: -1.9 },
        ],
        highlights: [
          { x: -2.5, z: -2.2 },
          { x: 0, z: -0.1 },
          { x: 2.4, z: 1.6 },
        ],
      },
      [LevelEnum.LEVEL_2]: {
        accent: "#2dd4bf",
        path: [
          { x: -3.4, z: -1.5 },
          { x: -2, z: 0.8 },
          { x: -0.6, z: 2.1 },
          { x: 1, z: 1.6 },
          { x: 2.4, z: 0.4 },
          { x: 1.6, z: -1.2 },
          { x: -0.2, z: -1.8 },
        ],
        highlights: [
          { x: -2.8, z: -1.6 },
          { x: -0.6, z: 1.6 },
          { x: 1.8, z: 0.2 },
        ],
      },
    },
  },
  "reef-guardians": {
    accent: "#22d3ee",
    levels: {
      [LevelEnum.LEVEL_1]: {
        path: [
          { x: -2.8, z: 2.8 },
          { x: -1.4, z: 1.4 },
          { x: 0.2, z: 0 },
          { x: 1.8, z: -1.4 },
          { x: 3.1, z: -0.2 },
          { x: 1.4, z: 1.6 },
        ],
        highlights: [
          { x: -2, z: 2.2 },
          { x: 0, z: 0.2 },
          { x: 2.4, z: 0.8 },
        ],
      },
      [LevelEnum.LEVEL_2]: {
        accent: "#38bdf8",
        path: [
          { x: -3.2, z: 3.1 },
          { x: -2, z: 1.6 },
          { x: -0.6, z: 0.1 },
          { x: 1.1, z: -1.6 },
          { x: 2.6, z: -0.6 },
          { x: 1.6, z: 1.4 },
          { x: -0.2, z: 2.6 },
        ],
        highlights: [
          { x: -2.4, z: 2.6 },
          { x: -0.6, z: 0.6 },
          { x: 2.2, z: 0.4 },
        ],
      },
    },
  },
  "warehouse-bots": {
    accent: "#60a5fa",
    levels: {
      [LevelEnum.LEVEL_1]: {
        path: [
          { x: -3, z: -1.4 },
          { x: -1.8, z: 0.8 },
          { x: 0, z: 2.1 },
          { x: 1.8, z: 0.8 },
          { x: 3.1, z: -0.6 },
          { x: 1.4, z: -2.1 },
        ],
        highlights: [
          { x: -2.4, z: -1 },
          { x: 0, z: 1.8 },
          { x: 2.4, z: -0.2 },
        ],
      },
      [LevelEnum.LEVEL_2]: {
        accent: "#38bdf8",
        path: [
          { x: -3.3, z: -0.4 },
          { x: -2, z: 1.4 },
          { x: -0.4, z: 2.4 },
          { x: 1.2, z: 1.2 },
          { x: 2.8, z: -0.2 },
          { x: 1.6, z: -1.8 },
          { x: -0.6, z: -1.6 },
        ],
        highlights: [
          { x: -2.6, z: 0.6 },
          { x: -0.2, z: 2 },
          { x: 2.2, z: -1 },
        ],
      },
    },
  },
  "snowplow-fleet": {
    accent: "#a5b4fc",
    levels: {
      [LevelEnum.LEVEL_1]: {
        path: [
          { x: -3.2, z: 0.8 },
          { x: -1.8, z: 1.8 },
          { x: 0, z: 1.2 },
          { x: 1.6, z: 0.2 },
          { x: 3, z: -1.2 },
          { x: 1, z: -2 },
        ],
        highlights: [
          { x: -2.2, z: 0.8 },
          { x: 0.4, z: 1 },
          { x: 2.4, z: -0.8 },
        ],
      },
      [LevelEnum.LEVEL_2]: {
        accent: "#c4b5fd",
        path: [
          { x: -3.4, z: 1.6 },
          { x: -2.2, z: 2.4 },
          { x: -0.6, z: 1.6 },
          { x: 1, z: 0.6 },
          { x: 2.6, z: -0.6 },
          { x: 1.2, z: -2.2 },
          { x: -1, z: -1.2 },
        ],
        highlights: [
          { x: -2.6, z: 1.6 },
          { x: -0.4, z: 1.2 },
          { x: 2, z: -1.2 },
        ],
      },
    },
  },
};

const defaultLevelConfig: HeroLevelConfig = {
  accent: DEFAULT_ACCENT,
  path: DEFAULT_PATH,
  highlights: DEFAULT_HIGHLIGHTS,
};

const validHeroEnvs = HERO_ENVIRONMENTS.filter((entry) => Boolean(ENV_LOOKUP[entry.id]))
  .map((entry) => ({
    ...entry,
    label: ENV_LOOKUP[entry.id]?.name ?? entry.label,
  }));

const DEFAULT_ENVIRONMENT_ID = validHeroEnvs[0]?.id ?? HERO_ENVIRONMENTS[0]?.id ?? "";

const HERO_CONTROL_BASE =
  "h-7 rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.22em] leading-none transition-all duration-200";
const HERO_CONTROL_ACTIVE = "shadow-[0_16px_36px_rgba(8,47,73,0.45)]";
const HERO_CONTROL_INACTIVE =
  "border border-white/12 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white";

const hexToRgba = (hex: string | undefined, alpha: number): string => {
  if (!hex) {
    return `rgba(56, 189, 248, ${alpha})`;
  }
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;
  if (expanded.length !== 6) {
    return `rgba(56, 189, 248, ${alpha})`;
  }
  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const resolveHeroPresentation = (environmentId: string, level: LevelType) => {
  const environmentConfig = HERO_PRESENTATIONS[environmentId];
  const fallbackLevel = environmentConfig?.levels[LevelEnum.LEVEL_1] ?? defaultLevelConfig;
  const levelConfig = environmentConfig?.levels[level] ?? fallbackLevel;
  return {
    accent: levelConfig?.accent ?? fallbackLevel.accent ?? environmentConfig?.accent ?? DEFAULT_ACCENT,
    path: levelConfig?.path ?? fallbackLevel.path ?? defaultLevelConfig.path,
    highlights: levelConfig?.highlights ?? fallbackLevel.highlights ?? defaultLevelConfig.highlights,
  };
};

export function BunnyHero() {
  const [activeEnv, setActiveEnv] = useState<string>(DEFAULT_ENVIRONMENT_ID);
  const [activeLevel, setActiveLevel] = useState<LevelType>(LevelEnum.LEVEL_1);
  const [running, setRunning] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const restartTimer = useRef<number | null>(null);

  const heroVisual = useMemo(() => resolveHeroPresentation(activeEnv, activeLevel), [activeEnv, activeLevel]);

  useEffect(() => {
    if (restartTimer.current !== null) {
      window.clearTimeout(restartTimer.current);
      restartTimer.current = null;
    }
    setRunning(false);
    setResetSignal((value) => value + 1);
    restartTimer.current = window.setTimeout(() => {
      setRunning(true);
      restartTimer.current = null;
    }, 380);
    return () => {
      if (restartTimer.current !== null) {
        window.clearTimeout(restartTimer.current);
        restartTimer.current = null;
      }
    };
  }, [activeEnv, activeLevel]);

  useEffect(() => {
    return () => {
      if (restartTimer.current !== null) {
        window.clearTimeout(restartTimer.current);
      }
    };
  }, []);

  const accentGlowTop = useMemo(() => hexToRgba(heroVisual.accent, 0.24), [heroVisual.accent]);
  const accentGlowBottom = useMemo(() => hexToRgba(heroVisual.accent, 0.16), [heroVisual.accent]);
  const accentBorder = useMemo(() => hexToRgba(heroVisual.accent, 0.22), [heroVisual.accent]);
  const accentShadow = useMemo(() => hexToRgba(heroVisual.accent, 0.28), [heroVisual.accent]);

  const activeControlStyle = useMemo<CSSProperties>(
    () => ({
      background: hexToRgba(heroVisual.accent, 0.9),
      color: "#031019",
      borderColor: hexToRgba(heroVisual.accent, 0.38),
      boxShadow: `0 18px 42px ${hexToRgba(heroVisual.accent, 0.38)}`,
    }),
    [heroVisual.accent]
  );
  const inactiveControlStyle = useMemo<CSSProperties>(
    () => ({
      borderColor: hexToRgba(heroVisual.accent, 0.16),
      color: "rgba(248, 250, 252, 0.78)",
      background: "rgba(15, 23, 42, 0.48)",
    }),
    [heroVisual.accent]
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#050312]">
      <div className="absolute inset-0">
        <HeroScene
          accent={heroVisual.accent}
          path={heroVisual.path}
          highlights={heroVisual.highlights}
          running={running}
          resetSignal={resetSignal}
          className="absolute inset-0"
        />
        <div
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          style={{
            background: `radial-gradient(circle at 20% 18%, ${accentGlowTop}, transparent 58%)`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          style={{
            background: `radial-gradient(circle at 70% 82%, ${accentGlowBottom}, transparent 62%)`,
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#020617] via-[#020617]/30 to-transparent" />
      </div>

      <div
        className="pointer-events-auto absolute left-1/2 top-5 z-30 flex -translate-x-1/2 gap-1 rounded-full border bg-black/40 p-1 backdrop-blur-xl"
        style={{ borderColor: accentBorder, boxShadow: `0 18px 48px ${accentShadow}` }}
      >
        {validHeroEnvs.map((env) => {
          const isActive = env.id === activeEnv;
          return (
            <Button
              key={env.id}
              size="sm"
              variant="ghost"
              className={cn(HERO_CONTROL_BASE, isActive ? HERO_CONTROL_ACTIVE : HERO_CONTROL_INACTIVE, "min-w-[74px]")}
              style={isActive ? activeControlStyle : inactiveControlStyle}
              onClick={() => {
                setActiveEnv(env.id);
                setActiveLevel(LevelEnum.LEVEL_1);
              }}
            >
              {env.label}
            </Button>
          );
        })}
      </div>

      <div
        className="pointer-events-auto absolute right-4 top-5 z-30 flex gap-1 rounded-full border bg-black/40 p-1 backdrop-blur-xl"
        style={{ borderColor: accentBorder, boxShadow: `0 18px 48px ${accentShadow}` }}
      >
        <Button
          size="sm"
          variant="ghost"
          className={cn(HERO_CONTROL_BASE, activeLevel === LevelEnum.LEVEL_1 ? HERO_CONTROL_ACTIVE : HERO_CONTROL_INACTIVE)}
          style={activeLevel === LevelEnum.LEVEL_1 ? activeControlStyle : inactiveControlStyle}
          onClick={() => setActiveLevel(LevelEnum.LEVEL_1)}
        >
          Level 1
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={cn(HERO_CONTROL_BASE, activeLevel === LevelEnum.LEVEL_2 ? HERO_CONTROL_ACTIVE : HERO_CONTROL_INACTIVE)}
          style={activeLevel === LevelEnum.LEVEL_2 ? activeControlStyle : inactiveControlStyle}
          onClick={() => setActiveLevel(LevelEnum.LEVEL_2)}
        >
          Level 2
        </Button>
      </div>
    </div>
  );
}
