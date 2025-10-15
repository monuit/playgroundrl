"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSimulationStore } from "@/state/simulationStore";

const formatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 2,
});

export function SimulationMetrics() {
  const { frame, stepsPerSecond, totalReward, episode, tick, difficulty } = useSimulationStore(
    useShallow((state) => ({
      frame: state.frame,
      stepsPerSecond: state.stepsPerSecond,
      totalReward: state.totalReward,
      episode: state.episode,
      tick: state.tick,
      difficulty: state.difficulty,
    }))
  );

  const agents = frame.agents.length;
  const perAgent = useMemo(() => (agents > 0 ? totalReward / agents : 0), [agents, totalReward]);

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.2),transparent_65%)]" />
      <CardHeader className="relative flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-white">Live telemetry</CardTitle>
        <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-slate-200">
          {difficulty}
        </Badge>
      </CardHeader>
      <CardContent className="relative grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Ticks</p>
          <p className="text-2xl font-semibold text-white">{tick}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Episode</p>
          <p className="text-2xl font-semibold text-white">{episode}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Agents</p>
          <p className="text-2xl font-semibold text-white">{agents}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Reward Σ</p>
          <p className="text-2xl font-semibold text-emerald-200">{formatter.format(totalReward)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Reward / agent</p>
          <p className="text-xl font-semibold text-emerald-100">{formatter.format(perAgent)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Steps per second</p>
          <p className="text-xl font-semibold text-sky-200">{formatter.format(stepsPerSecond)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
