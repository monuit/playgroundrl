"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SimulationCanvas } from "./SimulationCanvas";
import { SimulationControls } from "./SimulationControls";
import { SimulationMetrics } from "./SimulationMetrics";
import { useSimulationStore } from "@/state/simulationStore";

export function SimulationDashboard() {
  const {
    status,
    policyReady,
    totalReward,
    tick,
    stepsPerSecond,
    start,
    pause,
  } = useSimulationStore(
    useShallow((state) => ({
      status: state.status,
      policyReady: state.policyReady,
      totalReward: state.totalReward,
      tick: state.tick,
      stepsPerSecond: state.stepsPerSecond,
      start: state.start,
      pause: state.pause,
    }))
  );

  const statusTone =
    status === "running"
      ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
      : status === "paused"
        ? "border-amber-400/60 bg-amber-500/20 text-amber-100"
        : status === "error"
          ? "border-rose-500/60 bg-rose-500/20 text-rose-100"
          : status === "loading"
            ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100"
            : "border-white/20 bg-white/10 text-slate-200";

  const callToAction = useMemo(() => {
    if (status === "running") {
      return { label: "Pause", action: pause };
    }
    return { label: "Launch simulation", action: start };
  }, [pause, start, status]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <Badge className={`rounded-full border px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${statusTone}`}>
            {status}
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-white">Live agent playground</h2>
          <p className="max-w-xl text-sm text-slate-300">
            Grid-world policy inference streams directly in the browser via ONNX Runtime Web. Each agent pulls the
            latest state, queries the loaded actor, and we render the response as glowing runners weaving through the
            arena.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-slate-400">
            <span>Tick {tick}</span>
            <span>Σ reward {totalReward.toFixed(2)}</span>
            <span>{policyReady ? "Policy" : "Heuristic"} mode</span>
            <span>{stepsPerSecond.toFixed(2)} steps/sec</span>
          </div>
        </div>
        <Button
          className="self-start border border-cyan-400/40 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-white shadow-[0_30px_120px_-60px_rgba(56,189,248,0.85)] hover:from-cyan-400 hover:to-indigo-500"
          onClick={() => {
            void callToAction.action();
          }}
        >
          {callToAction.label}
        </Button>
      </header>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <SimulationCanvas />
        <div className="space-y-6">
          <SimulationControls />
          <SimulationMetrics />
        </div>
      </div>
    </div>
  );
}
