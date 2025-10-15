import Link from "next/link";
import { Github, Home, Info, Brain, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LearningPlaybook } from "@/ui/panels/LearningPlaybook";

const DQN_HYPERPARAMETERS = [
  { label: "Learning rate", value: "1e-3" },
  { label: "Replay buffer", value: "50,000 transitions" },
  { label: "Batch size", value: "64" },
  { label: "Target update", value: "Soft τ = 0.005" },
  { label: "Discount γ", value: "0.99" },
  { label: "Epsilon schedule", value: "1.0 → 0.05 over 150k steps" },
  { label: "Optimizer", value: "Adam" },
  { label: "Exploration bonus", value: "Prioritized sampling" },
] as const;

const LINKS = [
  { href: "/", label: "Playground", icon: Home, external: false },
  { href: "https://github.com/boredbedouin/GymRL", label: "GitHub", icon: Github, external: true },
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
                <h1 className="text-3xl font-semibold text-white">GymRL Documentation</h1>
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
              <h2 className="text-xl font-semibold">Agent Overview</h2>
            </div>
            <p className="text-sm text-slate-300">
              GymRL mirrors the PPO Bunny experience with a live PPO agent and a companion DQN baseline. Training runs
              entirely in-browser using TensorFlow.js, while the docs collect the full curriculum, hyperparameters, and
              environment notes.
            </p>
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">DQN Quick Sheet</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {DQN_HYPERPARAMETERS.map((parameter) => (
                  <div
                    key={parameter.label}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-200 shadow-[0_10px_40px_-30px_rgba(56,189,248,0.8)]"
                  >
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{parameter.label}</p>
                    <p className="mt-1 text-base font-semibold text-white">{parameter.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <section className="flex-1 space-y-10">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(129,140,248,0.6)] backdrop-blur">
              <h2 className="text-xs uppercase tracking-[0.4em] text-slate-400">Playbook</h2>
              <p className="mt-2 text-2xl font-semibold text-white">Curriculum Guide</p>
              <p className="mt-2 text-sm text-slate-300">
                The curriculum outlines the PPO actor-critic internals, advantage shaping, minibatch strategy, and
                clipped objective safeguards that power the bunny agents.
              </p>
              <div className="mt-6">
                <LearningPlaybook />
              </div>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(56,189,248,0.6)] backdrop-blur">
              <h2 className="text-xs uppercase tracking-[0.4em] text-slate-400">Telemetry</h2>
              <p className="mt-2 text-2xl font-semibold text-white">Metrics & Persistence</p>
              <p className="mt-2 text-sm text-slate-300">
                Episodes, rewards, entropy, and loss values stream into local storage. Checkpoints can be pinned,
                annotated, exported, and replayed without leaving the browser. Jump back to the playground to watch the
                charts come alive in realtime.
              </p>
            </article>
            
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(129,140,248,0.6)] backdrop-blur">
              <h2 className="text-xs uppercase tracking-[0.4em] text-slate-400">Mathematical Foundations</h2>
              <p className="mt-2 text-2xl font-semibold text-white">Algorithm Deep Dive</p>
              <p className="mt-2 text-sm text-slate-300">
                Explore the complete mathematical foundations of PPO and DQN algorithms. Learn about clipped surrogate objectives,
                Generalized Advantage Estimation, Bellman equations, and the implementation details that make these algorithms
                work in-browser with TensorFlow.js.
              </p>
              <div className="mt-4">
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
                >
                  <Link href="/docs/algorithms">
                    <Brain className="mr-2 size-4" />
                    View Algorithm Details
                  </Link>
                </Button>
              </div>
            </article>
            
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_-40px_rgba(129,140,248,0.6)] backdrop-blur">
              <h2 className="text-xs uppercase tracking-[0.4em] text-slate-400">Advanced Features</h2>
              <p className="mt-2 text-2xl font-semibold text-white">Training Best Practices</p>
              <p className="mt-2 text-sm text-slate-300">
                Learn about advanced PPO training techniques including value function clipping, gradient clipping,
                advantage normalization, and KL divergence monitoring. These features improve training stability and
                sample efficiency based on recent RL research.
              </p>
              <div className="mt-4">
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
                >
                  <Link href="/docs/advanced">
                    <Settings className="mr-2 size-4" />
                    View Advanced Features
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
