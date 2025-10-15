"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimulationStore } from "@/state/simulationStore";

const formatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
});

export function SimulationMetrics() {
  const { frame, stepsPerSecond, totalReward, episode, tick } = useSimulationStore(
    useShallow((state) => ({
      frame: state.frame,
      stepsPerSecond: state.stepsPerSecond,
      totalReward: state.totalReward,
      episode: state.episode,
      tick: state.tick,
    }))
  );

  const agents = frame.agents.length;
  const perAgent = useMemo(() => (agents > 0 ? totalReward / agents : 0), [agents, totalReward]);

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.15),transparent_65%)]" />
      <CardHeader className="relative pb-3">
        <CardTitle className="font-mono text-xs font-medium uppercase tracking-widest text-slate-400">Telemetry</CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-2 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
          <span className="text-slate-500">Ticks</span>
          <span className="font-semibold text-white">{tick}</span>
        </div>
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
          <span className="text-slate-500">Episode</span>
          <span className="font-semibold text-white">{episode}</span>
        </div>
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
          <span className="text-slate-500">Agents</span>
          <span className="font-semibold text-white">{agents}</span>
        </div>
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
          <span className="text-slate-500">Reward Σ</span>
          <span className="font-semibold text-emerald-300">{formatter.format(totalReward)}</span>
        </div>
        <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
          <span className="text-slate-500">R/agent</span>
          <span className="font-semibold text-emerald-200">{formatter.format(perAgent)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">SPS</span>
          <span className="font-semibold text-sky-300">{formatter.format(stepsPerSecond)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
