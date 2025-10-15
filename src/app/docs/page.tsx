import Link from "next/link";
import { Github, Home, Info, Cpu, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

const LAB_FACTS = [
  {
    label: "Policy runtime",
    value: "ONNX Runtime Web",
    hint: "WebGL/WASM inference in-tab",
  },
  {
    label: "Simulation cadence",
    value: "60 Hz",
    hint: "Deterministic worker ticks",
  },
  {
    label: "Fallback agent",
    value: "Heuristic",
    hint: "Keeps the grid alive when unloaded",
  },
  {
    label: "Visual presets",
    value: "High ↔ Medium",
    hint: "Toggle VFX + shadow budget",
  },
] as const;

const LINKS = [
  { href: "/", label: "Playground", icon: Home, external: false },
  { href: "https://github.com/boredbedouin/PlaygroundRL", label: "GitHub", icon: Github, external: true },
] as const;

export default function DocsPage() {
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
                Doc
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Knowledge Base</p>
                <h1 className="text-3xl font-semibold text-white">PlaygroundRL Documentation</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {LINKS.map((link) => (
                <Button
                  key={link.label}
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
                >
                  <Link href={link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined}>
                    <link.icon className="mr-2 size-4" />
                    {link.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 lg:flex-row lg:gap-12">
          <aside className="w-full max-w-xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:sticky lg:top-10">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-cyan-400/50 bg-cyan-500/10 p-2 text-cyan-300">
                <Info className="size-4" />
              </div>
              <h2 className="text-xl font-semibold">Policy Lab Overview</h2>
            </div>
            <p className="text-sm text-slate-300">
              PlaygroundRL now ships as an inference-first playground. A deterministic grid world streams observations to a
              dedicated worker which feeds the ONNX Runtime policy. Everything happens in your browser—no GPU, no
              backend, just WebAssembly, WebGL, and React Three Fiber.
            </p>
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">Lab quick sheet</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {LAB_FACTS.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-200 shadow-[0_10px_40px_-30px_rgba(56,189,248,0.8)]"
                  >
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{fact.label}</p>
                    <p className="mt-1 text-base font-semibold text-white">{fact.value}</p>
                    <p className="text-xs text-slate-400">{fact.hint}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="flex-1 space-y-10">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(129,140,248,0.6)] backdrop-blur">
              <h2 className="text-xs uppercase tracking-[0.4em] text-slate-400">Architecture</h2>
              <p className="mt-2 text-2xl font-semibold text-white">How the browser loop works</p>
              <p className="mt-2 text-sm text-slate-300">
                The dashboard streams actions from an ONNX policy running on WebGL while a Web Worker advances the grid
                at a steady cadence. Frames, rewards, and status flags are sent back to the main thread for rendering
                via React Three Fiber.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Worker pipeline</p>
                  <p className="mt-2 text-sm text-slate-200">
                    `simulation.worker.ts` handles difficulty changes, policy loads, and batched ticks while keeping the
                    UI thread buttery smooth.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Policy runner</p>
                  <p className="mt-2 text-sm text-slate-200">
                    `policyRunner.ts` normalises observations, executes the ONNX graph, and emits argmax actions with a
                    one-line API.
                  </p>
                </div>
              </div>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(56,189,248,0.6)] backdrop-blur">
              <h2 className="text-xs uppercase tracking-[0.4em] text-slate-400">Policy lifecycle</h2>
              <p className="mt-2 text-2xl font-semibold text-white">Loading, swapping, resetting</p>
              <p className="mt-2 text-sm text-slate-300">
                Drop a model into <code className="rounded bg-white/10 px-1 py-0.5">public/models/policy.onnx</code> or
                upload one through the dashboard. The store automatically reloads policies on reset and falls back to a
                heuristic controller if nothing is available.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-slate-200">
                <li>• `useSimulationStore` tracks status, reward totals, and steps-per-second metrics.</li>
                <li>• Quality toggle swaps between high-fidelity bloom and a battery-friendly preset.</li>
                <li>• Difficulty presets adjust spawn rates, map hazards, and reward modifiers in realtime.</li>
              </ul>
            </article>
            
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(129,140,248,0.6)] backdrop-blur">
              <h2 className="text-xs uppercase tracking-[0.4em] text-slate-400">Visual toolkit</h2>
              <p className="mt-2 text-2xl font-semibold text-white">Making the neon grid sing</p>
              <p className="mt-2 text-sm text-slate-300">
                Instanced meshes let dozens of agents glide across the board while volumetric lights and spark effects add
                depth. Medium mode trims shadows, particles, and bloom for lightweight hardware demos.
              </p>
              <div className="mt-4">
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
                >
                  <Link href="/docs/design">
                    <Cpu className="mr-2 size-4" />
                    Explore design deep dive
                  </Link>
                </Button>
              </div>
            </article>
            
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(129,140,248,0.6)] backdrop-blur">
              <h2 className="text-xs uppercase tracking-[0.4em] text-slate-400">Further reading</h2>
              <p className="mt-2 text-2xl font-semibold text-white">Dig into the math when you need it</p>
              <p className="mt-2 text-sm text-slate-300">
                Prefer the original PPO + DQN training notes? They still live in the archive docs so you can reference
                the derivations when training your own policy offline before exporting to ONNX.
              </p>
              <div className="mt-4">
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
                >
                  <Link href="/docs/algorithms">
                    <Gauge className="mr-2 size-4" />
                    Browse algorithm notes
                  </Link>
                </Button>
              </div>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
