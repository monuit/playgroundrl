"use client";

import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Badge } from "@/components/ui/badge";
import { useSimulationStore } from "@/state/simulationStore";
import { SimulationCanvas } from "@/ui/simulation/SimulationCanvas";
import { SimulationControls } from "@/ui/simulation/SimulationControls";
import { SimulationMetrics } from "@/ui/simulation/SimulationMetrics";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  idle: "border-white/20 bg-white/10 text-slate-200",
  loading: "border-cyan-400/60 bg-cyan-500/20 text-cyan-100",
  ready: "border-slate-500/40 bg-slate-700/30 text-slate-200",
  running: "border-emerald-400/60 bg-emerald-500/20 text-emerald-100",
  paused: "border-amber-400/60 bg-amber-500/20 text-amber-100",
  error: "border-rose-500/60 bg-rose-500/20 text-rose-100",
};

export function TrainingDashboard() {
  const store = useSimulationStore(
    useShallow((state) => ({
      status: state.status,
      policyReady: state.policyReady,
      message: state.message,
      tick: state.tick,
      episode: state.episode,
      totalReward: state.totalReward,
      stepsPerSecond: state.stepsPerSecond,
      loadPolicy: state.loadPolicy,
      start: state.start,
    }))
  );

  const { status, policyReady, message, tick, episode, totalReward, stepsPerSecond, loadPolicy, start } = store;

  useEffect(() => {
    void loadPolicy();
  }, [loadPolicy]);

  useEffect(() => {
    if (policyReady && status === "ready") {
      void start();
    }
  }, [policyReady, start, status]);

  const statusTone = STATUS_STYLES[status] ?? STATUS_STYLES.idle;

  const summary = useMemo(() => {
    if (status === "loading") {
      return "Fetching ONNX weights…";
    }
    if (!policyReady) {
      return "Drop an ONNX actor into /public/models/policy.onnx or upload one from the control panel.";
    }
    return "ONNX actor streaming actions into the grid world in realtime.";
  }, [policyReady, status]);

  const secondary =
    message ??
    `Tick ${tick} · Episode ${episode} · Σ reward ${totalReward.toFixed(2)} · ${stepsPerSecond.toFixed(2)} steps/sec`;

  const stats = useMemo(
    () => [
      { label: "Ticks", value: tick.toLocaleString() },
      { label: "Episode", value: episode.toLocaleString() },
      { label: "Reward Σ", value: totalReward.toFixed(2) },
      { label: "Steps / sec", value: stepsPerSecond.toFixed(2) },
    ],
    [episode, stepsPerSecond, tick, totalReward]
  );

  return (
    <section className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <SimulationCanvas className="pointer-events-auto" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(8,47,73,0.35),transparent_75%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.4)_0%,rgba(2,6,23,0.85)_55%,rgba(2,6,23,0.95)_100%)]"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-between px-6 py-10 lg:px-12 lg:py-14">
        <div className="pointer-events-none grid w-full gap-8 lg:grid-cols-[minmax(0,360px)_1fr_minmax(0,420px)]">
          <aside className="pointer-events-auto space-y-5 rounded-3xl border border-white/15 bg-slate-950/80 p-6 backdrop-blur">
            <Badge className={cn("rounded-full border px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em]", statusTone)}>
              {status}
            </Badge>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-white">PlaygroundRL telemetry</h2>
              <p className="text-sm text-slate-300">{summary}</p>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_-60px_rgba(59,130,246,0.8)]"
                >
                  <dt className="text-xs uppercase tracking-[0.35em] text-slate-400">{stat.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-white">{stat.value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{secondary}</p>
          </aside>
          <div className="hidden lg:block" aria-hidden />
          <aside className="pointer-events-auto flex flex-col gap-6">
            <SimulationControls />
            <SimulationMetrics />
          </aside>
        </div>
      </div>
    </section>
  );
}

export default TrainingDashboard;
