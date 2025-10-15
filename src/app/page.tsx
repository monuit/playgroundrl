"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { animated, useSpring, config as webConfig } from "@react-spring/web";
import { SimulationCanvas } from "@/ui/simulation/SimulationCanvas";
import { SimulationControls } from "@/ui/simulation/SimulationControls";
import { SimulationMetrics } from "@/ui/simulation/SimulationMetrics";
import { Button } from "@/components/ui/button";
import { useSimulationStore } from "@/state/simulationStore";
import { useShallow } from "zustand/react/shallow";

export default function Page() {
  const [isMounted, setIsMounted] = useState(false);
  const [metricsReady, setMetricsReady] = useState(false);

  const { status, start } = useSimulationStore(
    useShallow((state) => ({
      status: state.status,
      start: state.start,
    }))
  );

  useEffect(() => {
    setIsMounted(true);
    const timer = window.setTimeout(() => {
      setMetricsReady(true);
    }, 150);
    return () => window.clearTimeout(timer);
  }, []);

  const initialAnimation = useSpring({
    opacity: status === "running" ? 0 : 1,
    transform: status === "running" ? "translateY(100%)" : "translateY(0)",
    config: webConfig.wobbly,
  });

  const runningAnimation = useSpring({
    opacity: status === "running" ? 1 : 0,
    transform: status === "running" ? "translateY(0)" : "translateY(-100%)",
    config: webConfig.wobbly,
  });

  if (!isMounted) {
    return null;
  }

  return (
    <main className="relative size-full overflow-hidden bg-slate-950 text-slate-100">
      <div id="playground" className="fixed inset-0 size-full">
        <SimulationCanvas />
    </div>

      {/* Top Left - Controls - Always visible */}
      <div className="pointer-events-none absolute left-8 top-8 z-50">
        <div className="pointer-events-auto max-w-sm">
          <SimulationControls />
        </div>
      </div>

      {/* Bottom Right - Telemetry - Always visible */}
      <div className="pointer-events-none absolute bottom-8 right-8 z-50">
        <div className="pointer-events-auto">
          {metricsReady ? <SimulationMetrics /> : null}
        </div>
      </div>

      {status === "loading" && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950">
          <p className="flex items-center gap-2 text-slate-300">Loading policy network...</p>
        </div>
      )}

      {/* Center - Hero */}
      <animated.div
        style={initialAnimation}
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 text-center"
      >
        {status !== "running" && (
          <div className="pointer-events-auto">
            <h1 className="text-5xl font-bold italic tracking-tight text-white">PlaygroundRL</h1>
            <p className="mt-2 text-base text-slate-300">Load ONNX policies straight into your browser</p>
            {status === "error" && (
              <p className="mt-2 text-xs text-amber-400">Policy not loaded • Using heuristic mode</p>
            )}
            <div className="mt-6 flex flex-row flex-wrap items-center justify-center gap-3">
              <Button
                className="flex flex-row items-center gap-2 border border-cyan-400/40 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 text-white shadow-[0_20px_60px_-40px_rgba(56,189,248,0.8)] hover:from-cyan-400 hover:to-indigo-500"
                onClick={() => void start()}
                size="lg"
              >
                <Play className="size-4" />
                Run
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
              >
                <Link href="#playground">Enter Playground</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
              >
                <Link href="https://github.com/monuit/playgroundrl" target="_blank" rel="noreferrer">
                  GitHub
                </Link>
              </Button>
            </div>
          </div>
        )}
      </animated.div>

      <animated.div
        style={runningAnimation}
        className="absolute top-16 z-10 flex w-full flex-col items-center gap-4 text-center"
      >
        {status === "running" && (
          <>
            <h1 className="text-4xl font-bold italic text-white">Agents in motion</h1>
            <p className="text-sm text-slate-400">Policy streaming actions into the grid</p>
          </>
        )}
      </animated.div>
    </main>
  );
}
