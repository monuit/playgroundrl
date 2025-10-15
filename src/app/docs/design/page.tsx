import Link from "next/link";
import { ArrowLeft, Box, Code, Cpu, Layers, Rocket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const STACK_CARDS = [
  {
    icon: Rocket,
    title: "Framework",
    description:
      "Next.js 15 + React 19 handle routing, streaming, and suspense while TypeScript keeps the playground type-safe.",
  },
  {
    icon: Box,
    title: "Simulation",
    description:
      "A dedicated Web Worker advances the grid world, emits renderable frames, and keeps the main thread silky smooth.",
  },
  {
    icon: Cpu,
    title: "Policy runtime",
    description:
      "ONNX Runtime Web executes exported policies directly in the browser with WebGL acceleration and WASM fallback.",
  },
] as const;

const MODULES = [
  {
    title: "Simulation store",
    path: "src/state/simulationStore.ts",
    blurb:
      "Zustand slice that owns status, frame data, difficulty, and worker messaging. All UI components subscribe here.",
  },
  {
    title: "Grid world engine",
    path: "src/lib/simulation/gridWorld.ts",
    blurb:
      "Deterministic world generator with seeded randomness, agent heuristics, and render metadata packing.",
  },
  {
    title: "Policy runner",
    path: "src/lib/simulation/policyRunner.ts",
    blurb:
      "ONNX adapter that normalises tensors, batches requests, and returns greedy actions with a tiny API surface.",
  },
  {
    title: "Dashboard UI",
    path: "src/ui/dashboard/TrainingDashboard.tsx",
    blurb:
      "Hero surface that autoloads policies, shows telemetry badges, and wires controls to the simulation store.",
  },
  {
    title: "Simulation controls",
    path: "src/ui/simulation/SimulationControls.tsx",
    blurb:
      "Difficulty, agent count, playback speed, and upload handling—everything is tuned via friendly sliders and dropzones.",
  },
  {
    title: "Worker",
    path: "src/workers/simulation.worker.ts",
    blurb:
      "Receives commands, loads ONNX models, steps the grid, measures rewards, and streams results back to the store.",
  },
] as const;

const PIPELINE = `UI event
    ↓
useSimulationStore(action)
    ↓ postMessage
simulation.worker.ts
    ↓
policyRunner.infer()
    ↓
gridWorld.step()
    ↓
renderable frame → React Three Fiber`;

export default function DesignPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.92),rgba(2,6,23,0.9))]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:100%_44px]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:44px_100%]" />
        </div>

        <header className="relative z-10 border-b border-white/10">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-10">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold uppercase tracking-[0.4em] text-slate-200 shadow-[0_0_40px_-18px_rgba(56,189,248,0.65)]">
                Arc
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">System Design</p>
                <h1 className="text-3xl font-semibold text-white">Architecture Overview</h1>
              </div>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
            >
              <Link href="/docs">
                <ArrowLeft className="mr-2 size-4" />
                Back to Docs
              </Link>
            </Button>
          </div>
        </header>

        <div className="relative z-10 mx-auto w-full max-w-6xl space-y-10 px-6 py-12">
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-cyan-400/50 bg-cyan-500/10 p-3 text-cyan-300">
                <Layers className="size-6" />
              </div>
              <h2 className="text-3xl font-bold text-white">Playground at a glance</h2>
            </div>
            <p className="text-sm text-slate-300">
              PlaygroundRL is now inference-first: the dashboard streams observations to an ONNX Runtime policy, the
              simulation ticks inside a worker, and React Three Fiber paints the neon grid—all entirely on the client.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {STACK_CARDS.map((card) => (
                <article
                  key={card.title}
                  className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                >
                  <card.icon className="size-6 text-cyan-300" />
                  <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                  <p className="text-sm text-slate-300">{card.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-emerald-400/50 bg-emerald-500/10 p-3 text-emerald-300">
                <Box className="size-6" />
              </div>
              <h2 className="text-3xl font-bold text-white">Core modules</h2>
            </div>
            <p className="text-sm text-slate-300">
              Each layer keeps a tight focus: the store orchestrates, the worker executes, and the UI simply reacts to
              state changes. Dive into any file below to see how the pieces lock together.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              {MODULES.map((module) => (
                <article
                  key={module.title}
                  className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                >
                  <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                  <p className="font-mono text-xs text-cyan-300">{module.path}</p>
                  <p className="text-sm text-slate-300">{module.blurb}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-violet-400/50 bg-violet-500/10 p-3 text-violet-300">
                <Code className="size-6" />
              </div>
              <h2 className="text-3xl font-bold text-white">Command flow</h2>
            </div>
            <p className="text-sm text-slate-300">
              The store exposes a handful of methods—
              <code className="rounded bg-white/10 px-1 py-0.5">loadPolicy</code>,
              <code className="rounded bg-white/10 px-1 py-0.5">start</code>,
              <code className="rounded bg-white/10 px-1 py-0.5">pause</code>, and configuration setters. Everything
              funnels through the worker, which broadcasts state snapshots back to subscribers.
            </p>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold text-white">High-level pipeline</h3>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 font-mono text-xs text-slate-200">
                  <pre>{PIPELINE}</pre>
                </div>
                <p className="text-sm text-slate-300">
                  The worker returns frames with reward totals, step counts, and difficulty metadata. The store computes
                  steps-per-second by comparing ticks and timestamps so the UI can surface live telemetry.
                </p>
              </article>
              <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold text-white">Store excerpt</h3>
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 font-mono text-xs text-slate-200">
                  <pre>{`const { status, policyReady, loadPolicy, start, pause, resume } = useSimulationStore();

const handlePrimary = () => {
  if (status === "running") return pause();
  if (status === "paused") return resume();
  return policyReady ? start() : loadPolicy();
};`}</pre>
                </div>
                <p className="text-sm text-slate-300">
                  UI components never reach into the worker directly—they simply call the store actions. This keeps the
                  dashboard declarative and makes headless usage straightforward for tests.
                </p>
              </article>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-amber-400/50 bg-amber-500/10 p-3 text-amber-300">
                <Zap className="size-6" />
              </div>
              <h2 className="text-3xl font-bold text-white">Rendering & UX</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <article className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold text-white">React Three Fiber canvas</h3>
                <p className="text-sm text-slate-300">
                  Instanced meshes draw agents and pickups with minimal overhead. Bloom, glows, and volumetric beams are
                  tuned for the neon aesthetic while keeping frame rate high on ultrabooks.
                </p>
                <p className="text-sm text-slate-300">
                  The render quality toggle swaps shadow maps, SSAO, and spark emitters so demos can run comfortably on
                  integrated GPUs.
                </p>
              </article>
              <article className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold text-white">Controls & telemetry</h3>
                <p className="text-sm text-slate-300">
                  `SimulationControls` exposes difficulty presets, agent counts (1–32), playback speed multipliers, and
                  file uploads. `SimulationMetrics` surfaces tick, episode, reward, and SPS values via the shared store.
                </p>
                <p className="text-sm text-slate-300">
                  A heuristic fallback keeps the board active until a policy loads, ensuring the playground never feels
                  empty in demos or screenshots.
                </p>
              </article>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-sky-400/50 bg-sky-500/10 p-3 text-sky-300">
                <Rocket className="size-6" />
              </div>
              <h2 className="text-3xl font-bold text-white">Extending the lab</h2>
            </div>
            <ol className="space-y-3 text-sm text-slate-300">
              <li>
                <strong className="text-slate-200">1. Export your policy.</strong> Train offline (PyTorch, JAX, etc.) and
                convert to ONNX. Drop the file into <code className="rounded bg-white/10 px-1 py-0.5">public/models/</code>.
              </li>
              <li>
                <strong className="text-slate-200">2. Wire custom logic.</strong> Extend the worker with new difficulty
                presets or reward signals—the store already exposes hooks for dynamic configuration.
              </li>
              <li>
                <strong className="text-slate-200">3. Tune the visuals.</strong> Add instanced geometry, shader tweaks, or
                brand styling directly in `SimulationCanvas` without touching the inference loop.
              </li>
            </ol>
            <p className="text-sm text-slate-300">
              Looking for the classic PPO/DQN training stack? It lives in the git history. The modern branch focuses on
              lightning-fast inference and a polished demo surface.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
