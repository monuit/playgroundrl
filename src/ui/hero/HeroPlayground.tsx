"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroScene } from "@/ui/hero/HeroScene";
import { GALLERY_ENTRIES } from "@/ui/env/EnvironmentGallery";
import { cn } from "@/lib/utils";

interface HeroVisualConfig {
  accent: string;
  path: Array<{ x: number; z: number }>;
  highlights: Array<{ x: number; z: number }>;
}

const HERO_VISUALS: Record<string, HeroVisualConfig> = {
  "swarm-drones": {
    accent: "#38bdf8",
    path: [
      { x: -3.25, z: -2.75 },
      { x: -1.25, z: -1.25 },
      { x: 0, z: 0.5 },
      { x: 1.75, z: 1.75 },
      { x: 3.2, z: 0.25 },
      { x: 1.1, z: -2.1 },
    ],
    highlights: [
      { x: -2.5, z: -2.5 },
      { x: 0, z: 0 },
      { x: 2.6, z: 1.8 },
    ],
  },
  "reef-guardians": {
    accent: "#22d3ee",
    path: [
      { x: -2.4, z: 2.9 },
      { x: -1.1, z: 1.1 },
      { x: 0.8, z: -0.6 },
      { x: 1.8, z: -1.9 },
      { x: 3.1, z: -0.25 },
      { x: 1.6, z: 1.8 },
    ],
    highlights: [
      { x: -1.5, z: 2.2 },
      { x: 0.5, z: -0.9 },
      { x: 2.5, z: 0.9 },
    ],
  },
  "warehouse-bots": {
    accent: "#60a5fa",
    path: [
      { x: -3, z: -1.8 },
      { x: -1.8, z: 1.2 },
      { x: 0, z: 2.4 },
      { x: 1.8, z: 1.2 },
      { x: 3.2, z: -0.6 },
      { x: 1.6, z: -2.2 },
    ],
    highlights: [
      { x: -2.4, z: -1.5 },
      { x: 0, z: 1.9 },
      { x: 2.6, z: -0.3 },
    ],
  },
  "snowplow-fleet": {
    accent: "#a5b4fc",
    path: [
      { x: -3.2, z: 0.6 },
      { x: -1.2, z: 1.9 },
      { x: 0.5, z: 1.5 },
      { x: 1.8, z: 0.4 },
      { x: 3.2, z: -0.8 },
      { x: 0.8, z: -1.6 },
    ],
    highlights: [
      { x: -2.2, z: 0.8 },
      { x: 0.6, z: 1.2 },
      { x: 2.6, z: -1 },
    ],
  },
};

const FALLBACK_VISUAL: HeroVisualConfig = {
  accent: "#38bdf8",
  path: [
    { x: -2, z: -2 },
    { x: -1, z: 0 },
    { x: 0.5, z: 1.2 },
    { x: 2, z: 0 },
    { x: 0.5, z: -1.5 },
  ],
  highlights: [
    { x: -1.5, z: -1.5 },
    { x: 0.2, z: 0.4 },
  ],
};

const HERO_SCENARIOS = GALLERY_ENTRIES.map((entry) => ({
  id: entry.id,
  name: entry.name,
  ...(HERO_VISUALS[entry.id] ?? FALLBACK_VISUAL),
}));

export const HeroPlayground = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const restartTimer = useRef<number | null>(null);

  const scenario = HERO_SCENARIOS[activeIndex];

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
    }, 480);
    return () => {
      if (restartTimer.current !== null) {
        window.clearTimeout(restartTimer.current);
        restartTimer.current = null;
      }
    };
  }, [scenario.id]);

  useEffect(() => {
    return () => {
      if (restartTimer.current !== null) {
        window.clearTimeout(restartTimer.current);
        restartTimer.current = null;
      }
    };
  }, []);

  const handleCycle = (direction: 1 | -1) => {
    setActiveIndex((prev) => (prev + direction + HERO_SCENARIOS.length) % HERO_SCENARIOS.length);
  };

  const handleRestart = () => {
    if (restartTimer.current !== null) {
      window.clearTimeout(restartTimer.current);
      restartTimer.current = null;
    }
    setRunning(false);
    setResetSignal((value) => value + 1);
    restartTimer.current = window.setTimeout(() => {
      setRunning(true);
      restartTimer.current = null;
    }, 160);
  };

  const prevIndex = (activeIndex + HERO_SCENARIOS.length - 1) % HERO_SCENARIOS.length;
  const nextIndex = (activeIndex + 1) % HERO_SCENARIOS.length;

  return (
    <div className="relative h-full w-full overflow-hidden">
      <HeroScene
        accent={scenario.accent}
        path={scenario.path}
        highlights={scenario.highlights}
        running={running}
        resetSignal={resetSignal}
        className="absolute inset-0"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.12),transparent_65%)]" />

      <div className="pointer-events-auto absolute top-10 left-1/2 flex -translate-x-1/2 items-center gap-4">
        {HERO_SCENARIOS.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.name}
            onClick={() => setActiveIndex(index)}
            className={cn(
              "relative size-3 rounded-full border border-white/30 transition md:size-4",
              index === activeIndex ? "scale-150 border-white/60 shadow-[0_0_0_6px_rgba(15,23,42,0.45)]" : "opacity-65 hover:opacity-100"
            )}
            style={{ backgroundColor: item.accent }}
          >
            <span className="sr-only">{item.name}</span>
          </button>
        ))}
      </div>

      <div className="pointer-events-auto absolute bottom-16 left-1/2 flex -translate-x-1/2 items-center gap-6">
        <Button
          size="icon"
          variant="outline"
          className="rounded-full border-white/30 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
          onClick={() => handleCycle(-1)}
          aria-label={`Previous arena: ${HERO_SCENARIOS[prevIndex].name}`}
        >
          <ChevronLeft className="size-5" />
        </Button>
        <div className="rounded-full border border-white/25 bg-white/10 px-6 py-2 text-xs uppercase tracking-[0.45em] text-slate-100">
          {scenario.name}
        </div>
        <Button
          size="icon"
          variant="outline"
          className="rounded-full border-white/30 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
          onClick={() => handleCycle(1)}
          aria-label={`Next arena: ${HERO_SCENARIOS[nextIndex].name}`}
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      <div className="pointer-events-auto absolute bottom-16 right-16 flex items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          className="rounded-full border-white/30 bg-white/10 text-white hover:border-white/60 hover:bg-white/20"
          onClick={handleRestart}
          aria-label="Replay sequence"
        >
          <RotateCcw className="size-5" />
        </Button>
      </div>
    </div>
  );
};

export default HeroPlayground;
