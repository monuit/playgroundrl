"use client";

import { type ChangeEvent, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ALGORITHMS } from "@/algo";
import { ENVIRONMENTS } from "@/env";
import { useTrainingStore } from "@/state/trainingStore";
import { Download, Import, Save } from "lucide-react";

const DQN_DETAILS = [
  { label: "LR", value: "1e-3" },
  { label: "Batch", value: "64" },
  { label: "Γ", value: "0.99" },
  { label: "ε ↘", value: "1.0 → 0.05" },
] as const;

export function ControlPanel() {
  const {
    envId,
    algoId,
    status,
    seed,
    speedMultiplier,
    setEnvId,
    setAlgoId,
    setSeed,
    setSpeed,
    exportRun,
    importRun,
    runs,
  } = useTrainingStore();

  const envOptions = useMemo(
    () =>
      ENVIRONMENTS.map((env) => ({
        id: env.id,
        name: env.name,
      })),
    []
  );

  const algoOptions = useMemo(
    () =>
      ALGORITHMS.map((algo) => ({
        id: algo.id,
        name: algo.name,
      })),
    []
  );

  const handleExport = async (format: "zip" | "json") => {
    const blob = await exportRun(format);
    if (!blob) {
      return;
    }
    const filename =
      format === "json"
        ? `playgroundrl-${Date.now()}.json`
        : `playgroundrl-${Date.now()}.tar.zip`;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    await importRun(file);
    event.target.value = "";
  };

  const isRunning = status === "running";
  const statusTone =
    status === "running"
      ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
      : status === "paused"
        ? "border-amber-400/50 bg-amber-500/15 text-amber-200"
        : status === "error"
          ? "border-rose-400/50 bg-rose-500/20 text-rose-200"
          : "border-white/20 bg-white/10 text-slate-200";

  const selectedAlgo = algoOptions.find((algo) => algo.id === algoId);
  const showDqnDetails = selectedAlgo?.id?.toLowerCase().includes("dqn");

  return (
    <Card className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),transparent_65%)]" />
      <CardHeader className="relative flex items-center justify-between gap-3 px-4 py-3">
        <Badge className={`rounded-full border px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] ${statusTone}`}>
          {status}
        </Badge>
        <Badge className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.6rem] uppercase tracking-[0.35em] text-slate-300">
          Saves {runs.length}
        </Badge>
      </CardHeader>
      <CardContent className="relative space-y-5 px-4 pb-5">
        <section className="space-y-2">
          <Label htmlFor="environment" className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Environment
          </Label>
          <Select
            value={envId}
            onValueChange={(value) => setEnvId(value)}
            disabled={isRunning}
          >
            <SelectTrigger id="environment" className="border-white/15 bg-white/10 text-left text-white">
              <SelectValue placeholder="Select environment" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-slate-950/90 text-slate-100">
              {envOptions.map((env) => (
                <SelectItem key={env.id} value={env.id}>
                  {env.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        <section className="space-y-3">
          <Label className="text-xs uppercase tracking-[0.35em] text-slate-400">Algorithm</Label>
          <div className="grid grid-cols-2 gap-2">
            {algoOptions.map((algo) => (
              <Button
                key={algo.id}
                variant={algoId === algo.id ? "default" : "outline"}
                className={
                  algoId === algo.id
                    ? "border-cyan-400/60 bg-gradient-to-r from-cyan-500/30 via-sky-500/30 to-indigo-500/30 text-white"
                    : "border-white/15 bg-white/5 text-slate-200 hover:border-cyan-400/50 hover:text-white"
                }
                onClick={() => setAlgoId(algo.id)}
                disabled={algoId === algo.id}
              >
                {algo.name}
              </Button>
            ))}
          </div>
          {showDqnDetails ? (
            <div className="grid grid-cols-4 gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 text-center text-[0.65rem] uppercase tracking-[0.35em] text-slate-300">
              {DQN_DETAILS.map((detail) => (
                <div key={detail.label} className="flex flex-col gap-1">
                  <span>{detail.label}</span>
                  <span className="text-white">{detail.value}</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="seed" className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Seed
            </Label>
            <Input
              id="seed"
              value={seed}
              onChange={(event) => setSeed(event.target.value)}
              placeholder="random"
              className="border-white/15 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-cyan-400/60"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="speed" className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Speed
            </Label>
            <Input
              id="speed"
              type="number"
              min={0.1}
              step={0.1}
              value={speedMultiplier}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="border-white/15 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-cyan-400/60"
            />
          </div>
        </section>

        <section className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex-1 border-white/15 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
            onClick={() => void handleExport("zip")}
          >
            <Save className="mr-2 size-4" />
            Export bundle
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-white/15 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
            onClick={() => void handleExport("json")}
          >
            <Download className="mr-2 size-4" />
            JSON
          </Button>
          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
            asChild
          >
            <label className="inline-flex cursor-pointer items-center gap-2 px-3 py-2">
              <Import className="size-4" />
              <span>Import</span>
              <input
                type="file"
                accept=".zip,.playgroundrl.zip,.json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </Button>
        </section>
      </CardContent>
    </Card>
  );
}
