"use client";

import { useRef, type ChangeEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSimulationStore } from "@/state/simulationStore";
import type { Difficulty } from "@/lib/simulation/gridWorld";

const DIFFICULTY_OPTIONS = [
  { id: "meadow", label: "Radiant Meadow" },
  { id: "labyrinth", label: "Chromatic Labyrinth" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  idle: "border-white/20 bg-white/10 text-slate-200",
  loading: "border-cyan-400/60 bg-cyan-500/20 text-cyan-100",
  ready: "border-slate-500/40 bg-slate-700/30 text-slate-200",
  running: "border-emerald-400/60 bg-emerald-500/20 text-emerald-100",
  paused: "border-amber-400/60 bg-amber-500/20 text-amber-100",
  error: "border-rose-500/60 bg-rose-500/20 text-rose-100",
};

export function SimulationControls() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const state = useSimulationStore(
    useShallow((store) => ({
      status: store.status,
      message: store.message,
      difficulty: store.difficulty,
      agentCount: store.agentCount,
      speed: store.speed,
      policyReady: store.policyReady,
      renderQuality: store.renderQuality,
      start: store.start,
      pause: store.pause,
      resume: store.resume,
      step: store.step,
      reset: store.reset,
      setDifficulty: store.setDifficulty,
      setAgentCount: store.setAgentCount,
      setSpeed: store.setSpeed,
      toggleQuality: store.toggleQuality,
      loadPolicy: store.loadPolicy,
      loadPolicyFromFile: store.loadPolicyFromFile,
    }))
  );

  const statusTone = STATUS_STYLES[state.status] ?? STATUS_STYLES.idle;

  const handleLoadPolicy = () => {
    void state.loadPolicy();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await state.loadPolicyFromFile(file);
    event.target.value = "";
  };

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_65%)]" />
      <CardHeader className="relative space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Badge className={`rounded-full border px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${statusTone}`}>
            {state.status}
          </Badge>
          <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-slate-300">
            {state.policyReady ? "Policy online" : "Heuristic mode"}
          </Badge>
        </div>
        <CardTitle className="text-lg font-semibold text-white">Simulation controls</CardTitle>
        {state.message ? <p className="text-sm text-slate-300">{state.message}</p> : null}
      </CardHeader>
      <CardContent className="relative space-y-6">
        <section className="space-y-3">
          <Label className="text-xs uppercase tracking-[0.35em] text-slate-400">Difficulty</Label>
          <Select value={state.difficulty} onValueChange={(value) => state.setDifficulty(value as Difficulty)}>
            <SelectTrigger className="border-white/15 bg-white/10 text-left text-white">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-slate-950/95 text-slate-100">
              {DIFFICULTY_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Agents <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem]">{state.agentCount}</span>
          </Label>
          <input
            type="range"
            min={1}
            max={32}
            step={1}
            value={state.agentCount}
            onChange={(event) => state.setAgentCount(Number.parseInt(event.target.value, 10))}
            className="w-full accent-cyan-400"
          />
        </section>

        <section className="space-y-2">
          <Label className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Simulation speed ×{state.speed.toFixed(2)}
          </Label>
          <input
            type="range"
            min={0.25}
            max={5}
            step={0.25}
            value={state.speed}
            onChange={(event) => state.setSpeed(Number.parseFloat(event.target.value))}
            className="w-full accent-sky-400"
          />
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Button
            className="border border-cyan-400/40 bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 text-white shadow-[0_20px_60px_-40px_rgba(56,189,248,0.8)] hover:from-cyan-400 hover:to-indigo-500"
            onClick={() => {
              if (state.status === "running") {
                void state.pause();
              } else {
                void state.start();
              }
            }}
          >
            {state.status === "running" ? "Pause" : "Start"}
          </Button>
          <Button
            variant="outline"
            className="border-white/20 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
            onClick={() => {
              if (state.status === "paused") {
                void state.resume();
              } else {
                void state.step(1);
              }
            }}
          >
            {state.status === "paused" ? "Resume" : "Step"}
          </Button>
          <Button
            variant="outline"
            className="border-white/20 bg-white/5 text-slate-200 hover:border-rose-400/60 hover:text-rose-50"
            onClick={() => {
              void state.reset();
            }}
          >
            Reset arena
          </Button>
          <Button
            variant="outline"
            className="border-white/20 bg-white/5 text-slate-200 hover:border-emerald-400/60 hover:text-emerald-100"
            onClick={() => {
              state.toggleQuality();
            }}
          >
            Render {state.renderQuality === "high" ? "medium" : "high"}
          </Button>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1 border-cyan-400/40 bg-white/5 text-cyan-100 hover:border-cyan-300 hover:text-white"
              onClick={handleLoadPolicy}
            >
              Load policy from /models
            </Button>
            <Button
              variant="outline"
              className="border-white/15 bg-white/5 text-slate-200 hover:border-cyan-300 hover:text-white"
              onClick={handleUploadClick}
            >
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".onnx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <p className="text-[0.75rem] text-slate-400">
            Drop an ONNX actor into <code className="rounded bg-white/5 px-1.5 py-0.5">public/models/</code> or upload a file to hot-swap policies.
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
