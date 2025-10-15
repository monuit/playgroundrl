import Link from "next/link";
import { Github } from "lucide-react";
import { TrainingDashboard } from "@/ui/dashboard/TrainingDashboard";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-64 top-24 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18)_0%,_rgba(15,23,42,0)_70%)] blur-3xl" />
        <div className="absolute -right-44 -top-32 h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.18)_0%,_rgba(15,23,42,0)_70%)] blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.55),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(14,22,40,0.9),rgba(2,6,23,0.92))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.08),transparent_60%)] mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:100%_40px]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:42px_100%]" />
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-8">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.4em] text-slate-300"
            >
              <span className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold shadow-[0_0_30px_-10px_rgba(56,189,248,0.45)] transition group-hover:border-cyan-400/50 group-hover:text-white">
                PRL
              </span>
              PlaygroundRL
            </Link>
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" className="hidden text-slate-300 hover:text-white sm:inline-flex">
                <Link href="/docs">Docs</Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="gap-2 border border-slate-500/40 bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="https://github.com/boredbedouin/PlaygroundRL" target="_blank" rel="noreferrer">
                  <Github className="size-4" />
                  GitHub
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-5xl px-6 pb-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.4em] text-slate-300">
              Browser-native RL Playground
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">PlaygroundRL</h1>
              <p className="max-w-2xl text-base text-slate-200 sm:text-lg">
                Load ONNX policies straight into your browser and orbit around a living grid world. Inspect telemetry, tweak
                parameters, and watch agents learn without leaving the tab.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.35em] text-slate-300">
              <Link
                href="#playground"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:border-cyan-400/40 hover:text-white"
              >
                Enter Playground
              </Link>
              <Link
                href="/docs"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:border-cyan-400/40 hover:text-white"
              >
                Docs
              </Link>
            </div>
          </div>
        </section>

        <section id="playground" className="relative flex-1">
          <TrainingDashboard />
        </section>
      </div>
    </main>
  );
}
