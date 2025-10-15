"use client";

import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroShowcase from "@/ui/hero/HeroShowcase";
import { EnvironmentGallery } from "@/ui/env/EnvironmentGallery";
import { SimulationCanvas } from "@/ui/simulation/SimulationCanvas";
import { SimulationControls } from "@/ui/simulation/SimulationControls";
import { SimulationMetrics } from "@/ui/simulation/SimulationMetrics";
import { useSimulationStore } from "@/state/simulationStore";
import { useShallow } from "zustand/react/shallow";

const STATUS_COPY: Record<string, string> = {
  idle: "Ready for launch — load an ONNX actor or start in heuristic mode.",
  loading: "Loading policy weights… hold tight.",
  ready: "Policy loaded. Kick off the sim whenever you're set.",
  running: "Agents are executing the current policy in realtime.",
  paused: "Simulation paused. Resume or step to inspect behaviour.",
  error: "Policy failed to load. Falling back to heuristic control.",
};

const STATUS_ACCENT: Record<string, string> = {
  idle: "from-slate-400/80 via-slate-500/60 to-slate-400/80",
  loading: "from-sky-400/70 via-cyan-400/60 to-sky-500/70",
  ready: "from-emerald-400/80 via-emerald-500/70 to-teal-400/80",
  running: "from-indigo-400/80 via-sky-500/70 to-cyan-400/80",
  paused: "from-amber-400/70 via-amber-500/60 to-amber-400/70",
  error: "from-rose-500/80 via-red-500/70 to-rose-500/80",
};

export default function Page() {
  const [metricsReady, setMetricsReady] = useState(false);

  const { status, start, message, policyReady } = useSimulationStore(
    useShallow((state) => ({
      status: state.status,
      start: state.start,
      message: state.message,
      policyReady: state.policyReady,
    }))
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMetricsReady(true);
    }, 180);
    return () => window.clearTimeout(timer);
  }, []);

  const statusLine = message ?? STATUS_COPY[status] ?? STATUS_COPY.idle;
  const statusAccent = STATUS_ACCENT[status] ?? STATUS_ACCENT.idle;
  const policyIndicatorClass = policyReady
    ? "bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.65)]"
    : "bg-slate-500/70";

  return (
    <main className="bg-slate-950 text-slate-100">
      <section className="relative min-h-screen overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-[-40%] h-[480px] w-[480px] rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute right-[-30%] top-[20%] h-[520px] w-[520px] rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.65),rgba(2,6,23,0.9))]" aria-hidden />
        </div>
        <div className="relative mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-6xl flex-col items-center justify-center gap-10 px-6 py-24 lg:min-h-[calc(100vh-120px)]">
          <div className="w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-[0_25px_80px_-45px_rgba(56,189,248,0.7)] backdrop-blur">
            <HeroShowcase className="h-[clamp(560px,72vh,780px)] w-full" />
          </div>
          <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
            <Button
              size="icon"
              className="rounded-full border border-white/30 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 text-white shadow-[0_12px_45px_-18px_rgba(56,189,248,0.8)] hover:from-cyan-400 hover:to-indigo-500"
              onClick={() => void start()}
              aria-label="Start simulation"
            >
              <Play className="size-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-16 rounded-full bg-gradient-to-r ${statusAccent}`} aria-hidden />
              <div className={`h-2.5 w-2.5 rounded-full ${policyIndicatorClass}`} aria-hidden />
            </div>
          </div>
          <div className="sr-only" aria-live="polite">
            {status.toUpperCase()} — {statusLine}
          </div>
          <div className="sr-only">{policyReady ? "Policy loaded" : "Heuristic preview"}</div>
        </div>
      </section>

      <section id="environments" className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_center,_rgba(30,64,175,0.12),transparent_70%)] py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <EnvironmentGallery />
        </div>
      </section>

      <section id="training" className="relative overflow-hidden py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(8,47,73,0.4),rgba(2,6,23,0.95))]" aria-hidden />
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
            <SimulationCanvas />
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
