"use client";

import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ControlPanel } from "@/ui/panels/ControlPanel";
import { CheckpointPanel } from "@/ui/panels/CheckpointPanel";
import { EnvCanvas } from "@/ui/env/EnvCanvas";
import { MetricsChart } from "@/ui/metrics/MetricsChart";
import { cn } from "@/lib/utils";
import { useTrainingStore, type TrainingMetric } from "@/state/trainingStore";
import { ENV_LOOKUP } from "@/env";
import { ALGORITHM_LOOKUP } from "@/algo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PANEL_CARD_CLASS =
  "relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-[0_20px_80px_-48px_rgba(56,189,248,0.75)] backdrop-blur-xl";
const SURFACE_CLASS =
  "rounded-2xl border border-white/10 bg-slate-900/40 shadow-[0_15px_60px_-50px_rgba(56,189,248,0.65)] backdrop-blur";

export function TrainingDashboard({ variant = "full" }: { variant?: "full" | "minimal" }) {
  const { envId, algoId, metrics, status, lastError, currentMetadata } =
    useTrainingStore(
      useShallow((state) => ({
        envId: state.envId,
        algoId: state.algoId,
        metrics: state.metrics,
        status: state.status,
        lastError: state.lastError,
        currentMetadata: state.currentMetadata,
      }))
    );

  const [showTelemetry, setShowTelemetry] = useState(variant !== "minimal");

  const envDefinition = ENV_LOOKUP[envId];
  const algoDefinition = ALGORITHM_LOOKUP[algoId];

  const envDescription = useMemo(
    () => envDefinition?.description ?? "",
    [envDefinition]
  );
  const algoDescription = useMemo(
    () => algoDefinition?.description ?? "",
    [algoDefinition]
  );

  const latestMetric = metrics.at(-1);
  const totalEpisodes = latestMetric?.episode ?? 0;
  const latestReward = latestMetric?.reward ?? 0;
  const lastSteps = latestMetric?.steps ?? 0;
  const bestReward = metrics.length
    ? Math.max(...metrics.map((metric) => metric.reward))
    : 0;
  const averageReward =
    metrics.length > 0
      ? metrics.reduce((sum, metric) => sum + metric.reward, 0) / metrics.length
      : 0;
  const diagnostics = {
    loss: latestMetric?.loss,
    entropy: latestMetric?.entropy,
    stepsPerSecond: latestMetric?.stepsPerSecond,
  };
  const recentMetrics = metrics.slice(-12);

  if (variant === "minimal") {
    return (
      <div className="space-y-6">
        <RunCommandBar
          status={status}
          envName={envDefinition?.name ?? envId}
          algoName={algoDefinition?.name ?? algoId}
          latestReward={latestReward}
          totalEpisodes={totalEpisodes}
          lastError={lastError}
          variant="compact"
        />
        <EnvironmentPanel
          envId={envId}
          envName={envDefinition?.name ?? envId}
          envDescription={envDescription}
          algoName={algoDefinition?.name ?? algoId}
          algoDescription={algoDescription}
          currentMetadata={currentMetadata}
          compact
        />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <ControlPanel />
          <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.35em] text-slate-400">Telemetry</span>
              <Button
                variant="outline"
                className="border-white/15 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
                onClick={() => setShowTelemetry((previous) => !previous)}
              >
                {showTelemetry ? "Hide" : "View"}
              </Button>
            </div>
            <p>
              Rewards, loss, and throughput stream on demand. Toggle to surface the episode timeline when you need it.
            </p>
          </div>
        </div>
        {showTelemetry ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <StatsPanel
              latestReward={latestReward}
              averageReward={averageReward}
              bestReward={bestReward}
              totalEpisodes={totalEpisodes}
              lastSteps={lastSteps}
              diagnostics={diagnostics}
              error={lastError}
            />
            <MetricsPanel
              metrics={metrics}
              recentMetrics={recentMetrics}
              totalEpisodes={totalEpisodes}
            />
          </div>
        ) : null}
        <CheckpointPanel />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RunCommandBar
        status={status}
        envName={envDefinition?.name ?? envId}
        algoName={algoDefinition?.name ?? algoId}
        latestReward={latestReward}
        totalEpisodes={totalEpisodes}
        lastError={lastError}
      />
      <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
        <div className="space-y-6 self-start xl:sticky xl:top-6">
          <ControlPanel />
        </div>
        <div className="space-y-6">
          <EnvironmentPanel
            envId={envId}
            envName={envDefinition?.name ?? envId}
            envDescription={envDescription}
            algoName={algoDefinition?.name ?? algoId}
            algoDescription={algoDescription}
            currentMetadata={currentMetadata}
          />
          <StatsPanel
            latestReward={latestReward}
            averageReward={averageReward}
            bestReward={bestReward}
            totalEpisodes={totalEpisodes}
            lastSteps={lastSteps}
            diagnostics={diagnostics}
            error={lastError}
          />
          <MetricsPanel
            metrics={metrics}
            recentMetrics={recentMetrics}
            totalEpisodes={totalEpisodes}
          />
          <CheckpointPanel />
        </div>
      </div>
    </div>
  );
}

function RunCommandBar({
  status,
  envName,
  algoName,
  latestReward,
  totalEpisodes,
  lastError,
  variant = "default",
}: {
  status: string;
  envName: string;
  algoName: string;
  latestReward: number;
  totalEpisodes: number;
  lastError?: string;
  variant?: "default" | "compact";
}) {
  const [stepsInput, setStepsInput] = useState("1000");
  const { start, pause, resume, step, resetMetrics } = useTrainingStore(
    useShallow((state) => ({
      start: state.start,
      pause: state.pause,
      resume: state.resume,
      step: state.step,
      resetMetrics: state.resetMetrics,
    }))
  );

  const isRunning = status === "running";
  const isPaused = status === "paused";
  const parsedSteps = Number.parseInt(stepsInput, 10);
  const canStep = Number.isFinite(parsedSteps) && parsedSteps > 0;

  const statusClasses = cn(
    "rounded-full border px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em]",
    status === "running" && "border-emerald-400/50 bg-emerald-500/20 text-emerald-200",
    status === "paused" && "border-amber-400/50 bg-amber-500/20 text-amber-200",
    status === "error" && "border-rose-400/50 bg-rose-500/20 text-rose-200",
    status === "idle" && "border-white/20 bg-white/10 text-slate-200"
  );

  const handleStep = async () => {
    if (!canStep) {
      return;
    }
    await step(parsedSteps);
  };

  const handleReset = async () => {
    await trainerClientCleanup();
    resetMetrics();
  };

  return (
    <Card
      className={cn(
        PANEL_CARD_CLASS,
        "p-0",
        variant === "compact" && "border-white/10 bg-white/5 shadow-[0_15px_60px_-48px_rgba(56,189,248,0.7)]"
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),transparent_60%)] opacity-80"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.65),transparent_65%)]" aria-hidden />
      <CardContent
        className={cn(
          "relative flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between",
          variant === "compact" && "gap-3 px-4 py-4 text-sm"
        )}
      >
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={statusClasses}>{status}</Badge>
            <span className="text-white">
              <span className="font-medium">Environment:</span> {envName}
            </span>
            <span className="text-white">
              <span className="font-medium">Algorithm:</span> {algoName}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span>Episodes: {totalEpisodes}</span>
            <span className="text-emerald-300">Latest reward: {latestReward.toFixed(2)}</span>
            {lastError ? (
              <span className="text-rose-300">Error: {lastError}</span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            className="bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 text-white shadow-[0_10px_40px_-20px_rgba(56,189,248,0.75)] hover:from-cyan-400 hover:to-indigo-500 disabled:opacity-60"
            onClick={() => {
              void start();
            }}
            disabled={isRunning}
          >
            {status === "idle" ? "Initialise & start" : "Start run"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="border border-amber-400/30 bg-amber-500/15 text-amber-200 hover:border-amber-400/60 hover:text-amber-100 disabled:opacity-60"
            onClick={() => {
              void pause();
            }}
            disabled={!isRunning}
          >
            Pause
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border border-cyan-400/40 text-cyan-200 hover:border-cyan-300 hover:text-cyan-100 disabled:opacity-60"
            onClick={() => {
              void resume();
            }}
            disabled={!isPaused}
          >
            Resume
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              value={stepsInput}
              onChange={(event) => setStepsInput(event.target.value)}
              className="w-24 border-white/20 bg-white/10 text-white placeholder:text-slate-400 focus-visible:ring-cyan-400/60"
            />
            <Button
              size="sm"
              variant="outline"
              className="border border-white/20 text-slate-200 hover:border-cyan-300 hover:text-white disabled:opacity-60"
              onClick={() => {
                void handleStep();
              }}
              disabled={!canStep}
            >
              Step ×{stepsInput || "—"}
            </Button>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="border border-rose-500/50 bg-rose-500/20 text-rose-100 hover:border-rose-400 hover:text-white disabled:opacity-60"
            onClick={() => {
              void handleReset();
            }}
          >
            Reset session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EnvironmentPanel({
  envId,
  envName,
  envDescription,
  algoName,
  algoDescription,
  currentMetadata,
  compact = false,
}: {
  envId: string;
  envName: string;
  envDescription: string;
  algoName: string;
  algoDescription: string;
  currentMetadata?: Record<string, unknown>;
  compact?: boolean;
}) {
  const envStats = useMemo(() => {
    if (!currentMetadata) {
      return [] as Array<{ label: string; value: string }>;
    }
    if (envId === "lumen-bunny") {
      const energy = Number((currentMetadata as { bunny?: { energy?: number } }).bunny?.energy ?? Number.NaN);
      const collected = Number((currentMetadata as { collected?: number }).collected ?? Number.NaN);
      const target = Number((currentMetadata as { target?: number }).target ?? Number.NaN);
      const steps = Number((currentMetadata as { steps?: number }).steps ?? Number.NaN);
      const maxSteps = Number((currentMetadata as { maxSteps?: number }).maxSteps ?? Number.NaN);
      return [
        Number.isFinite(energy)
          ? { label: "Energy", value: `${Math.round(energy * 100)}%` }
          : null,
        Number.isFinite(collected) && Number.isFinite(target)
          ? { label: "Carrots", value: `${collected}/${target}` }
          : null,
        Number.isFinite(steps) && Number.isFinite(maxSteps)
          ? { label: "Steps", value: `${steps}/${maxSteps}` }
          : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>;
    }
    if (envId === "maze") {
      const steps = Number((currentMetadata as { steps?: number }).steps ?? Number.NaN);
      return Number.isFinite(steps)
        ? [{ label: "Steps", value: steps.toString() }]
        : [];
    }
    return [];
  }, [envId, currentMetadata]);

  return (
    <Card className={cn(PANEL_CARD_CLASS, "overflow-hidden p-0", compact && "border-white/10 bg-white/5")}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.22),transparent_60%)]"
        aria-hidden
      />
      <CardHeader className="relative space-y-3 border-b border-white/10 bg-white/5 px-6 py-5 backdrop-blur md:px-8">
        <CardTitle className="text-lg font-semibold text-white">Live environment</CardTitle>
        {compact ? null : (
          <CardDescription className="text-slate-300">
            Watch the agent evolve in real time. Adjust the configuration on the left without losing progress.
          </CardDescription>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-slate-300">
          <span>
            <span className="font-semibold text-white/90">Environment:</span> {envName}
          </span>
          <span>
            <span className="font-semibold text-white/90">Algorithm:</span>{" "}
            <span className="text-cyan-300">{algoName}</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="relative p-0">
        <div className="relative h-[520px]">
          <EnvCanvas envId={envId} metadata={currentMetadata} />
          <div className="pointer-events-none absolute left-4 top-4 flex min-w-[220px] flex-col gap-1 rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3 text-xs text-slate-300 shadow-[0_30px_80px_-60px_rgba(56,189,248,0.8)] backdrop-blur-lg">
            <span className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
              Environment
            </span>
            <span className="text-sm font-semibold text-white">{envName}</span>
            {envDescription && !compact ? (
              <span className="text-xs text-slate-400">{envDescription}</span>
            ) : null}
            <span className="mt-3 text-[0.6rem] uppercase tracking-[0.3em] text-slate-400">
              Algorithm
            </span>
            <span className="text-xs font-medium text-cyan-300">{algoName}</span>
            {algoDescription && !compact ? (
              <span className="text-xs text-slate-400">{algoDescription}</span>
            ) : null}
            {envStats.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {envStats.map((stat) => (
                  <span
                    key={stat.label}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.65rem] font-medium text-white shadow-[0_8px_26px_-18px_rgba(56,189,248,0.7)]"
                  >
                    {stat.label}: {stat.value}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsPanel({
  latestReward,
  averageReward,
  bestReward,
  totalEpisodes,
  lastSteps,
  diagnostics,
  error,
}: {
  latestReward: number;
  averageReward: number;
  bestReward: number;
  totalEpisodes: number;
  lastSteps: number;
  diagnostics: { loss?: number; entropy?: number; stepsPerSecond?: number };
  error?: string;
}) {
  const formatDefault = (value: number) => {
    if (!Number.isFinite(value)) {
      return "—";
    }
    const precision = Math.abs(value) >= 100 ? 0 : 2;
    return value.toFixed(precision).replace(/\.00$/, "");
  };

  const tiles: Array<{
    label: string;
    value: number;
    detail: string;
    accent: string;
    format?: (value: number) => string;
  }> = [
    {
      label: "Episodes",
      value: totalEpisodes,
      detail: "completed",
      accent: "text-cyan-200",
      format: (value) => Math.max(0, Math.round(value)).toString(),
    },
    {
      label: "Latest Reward",
      value: latestReward,
      detail: "per episode",
      accent: "text-emerald-300",
    },
    {
      label: "Average Reward",
      value: averageReward,
      detail: "rolling mean",
      accent: "text-sky-300",
    },
    {
      label: "Best Reward",
      value: bestReward,
      detail: "historical",
      accent: "text-amber-300",
    },
    {
      label: "Steps / Episode",
      value: lastSteps,
      detail: "latest",
      accent: "text-fuchsia-300",
      format: (value) => Math.max(0, Math.round(value)).toString(),
    },
    {
      label: "Loss",
      value: diagnostics.loss ?? Number.NaN,
      detail: "after update",
      accent: "text-rose-300",
    },
    {
      label: "Entropy",
      value: diagnostics.entropy ?? Number.NaN,
      detail: "policy",
      accent: "text-cyan-300",
    },
    {
      label: "Steps / Sec",
      value: diagnostics.stepsPerSecond ?? Number.NaN,
      detail: "throughput",
      accent: "text-lime-300",
      format: (value) => (Number.isFinite(value) ? value.toFixed(1) : "-"),
    },
  ];

  return (
    <Card className={cn(PANEL_CARD_CLASS, "p-0")}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),transparent_65%)]"
        aria-hidden
      />
      <CardHeader className="relative flex flex-col gap-3 border-b border-white/10 bg-white/5 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg text-white">Run telemetry</CardTitle>
          <CardDescription className="text-slate-300">
            High-signal stats updating each episode.
          </CardDescription>
        </div>
        {error ? (
          <Badge className="whitespace-normal border border-rose-400/40 bg-rose-500/20 text-rose-200">
            {error}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="relative px-6 py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tiles.map(({ label, value, detail, accent, format }) => {
            const display = (format ?? formatDefault)(value);
            return (
              <div
                key={label}
                className={cn(
                  SURFACE_CLASS,
                  "border-white/10 bg-white/5 px-4 py-4 transition hover:border-cyan-400/40"
                )}
              >
                <div className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400">
                  {label}
                </div>
                <div className={cn("mt-1 text-xl font-semibold text-white", accent)}>
                  {display}
                </div>
                <div className="text-xs text-slate-300">{detail}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricsPanel({
  metrics,
  recentMetrics,
  totalEpisodes,
}: {
  metrics: TrainingMetric[];
  recentMetrics: TrainingMetric[];
  totalEpisodes: number;
}) {
  return (
    <Card className={cn(PANEL_CARD_CLASS, "p-0")}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),transparent_60%)]"
        aria-hidden
      />
      <CardHeader className="relative flex flex-col gap-2 border-b border-white/10 bg-white/5 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-lg text-white">Episode timeline</CardTitle>
          <CardDescription className="text-slate-300">
            Live plot of episodic returns tracked locally in your browser.
          </CardDescription>
        </div>
        <Badge className="mt-1 border border-cyan-400/40 bg-cyan-500/10 text-cyan-200 sm:mt-0">
          Episodes: {totalEpisodes}
        </Badge>
      </CardHeader>
      <CardContent className="relative space-y-4 px-6 py-6">
        <div
          className={cn(
            SURFACE_CLASS,
            "border-white/10 bg-white/5 p-3 shadow-[0_0_60px_-45px_rgba(56,189,248,0.8)]"
          )}
        >
          <MetricsChart metrics={metrics} />
        </div>
        <MetricTable metrics={recentMetrics} />
      </CardContent>
    </Card>
  );
}

function MetricTable({ metrics }: { metrics: TrainingMetric[] }) {
  if (!metrics.length) {
    return (
      <p className="text-sm text-slate-300">
        Metrics will appear once training begins.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <table className="w-full table-fixed text-left text-xs text-slate-300">
        <thead className="bg-white/10 text-xs uppercase tracking-[0.3em] text-slate-400">
          <tr>
            <th className="px-3 py-2">Episode</th>
            <th className="px-3 py-2">Reward</th>
            <th className="px-3 py-2">Steps</th>
            <th className="px-3 py-2">Loss</th>
            <th className="px-3 py-2">Entropy</th>
            <th className="px-3 py-2">Steps/Sec</th>
            <th className="px-3 py-2">LR</th>
            <th className="px-3 py-2">Time (ms)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {metrics.map((metric) => (
            <tr key={metric.episode} className="bg-white/5 text-slate-200">
              <td className="px-3 py-2 font-mono text-slate-400">
                {metric.episode}
              </td>
              <td className="px-3 py-2 text-emerald-300">{metric.reward.toFixed(2)}</td>
              <td className="px-3 py-2">{metric.steps}</td>
              <td className="px-3 py-2 text-rose-300">
                {formatMetric(metric.loss)}
              </td>
              <td className="px-3 py-2 text-cyan-300">
                {formatMetric(metric.entropy)}
              </td>
              <td className="px-3 py-2 text-lime-300">
                {formatMetric(metric.stepsPerSecond, 1)}
              </td>
              <td className="px-3 py-2 text-violet-300">
                {formatMetric(metric.learningRate, 5)}
              </td>
              <td className="px-3 py-2 text-slate-400">
                {formatMetric(metric.timeMs, 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatMetric(value?: number, precision = 2) {
  if (value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return Number(value)
    .toFixed(precision)
    .replace(/\.0+$/u, "")
    .replace(/\.([1-9])0+$/u, ".$1");
}

async function trainerClientCleanup() {
  const store = useTrainingStore.getState();
  await store.client.dispose();
  useTrainingStore.setState({
    runId: null,
    status: "idle",
    metrics: [],
    currentObservation: undefined,
    currentMetadata: undefined,
    rewardSource: "return reward;",
    checkpoints: [],
  });
}
