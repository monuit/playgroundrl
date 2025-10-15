import Link from "next/link";
import { Github, Menu, Play } from "lucide-react";
import { SimulationDashboard } from "@/ui/simulation/SimulationDashboard";
import { HeroShowcase } from "@/ui/hero/HeroShowcase";
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

      <header className="relative z-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.4em] text-slate-300"
          >
            <span className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold shadow-[0_0_30px_-10px_rgba(56,189,248,0.45)] transition group-hover:border-cyan-400/50 group-hover:text-white">
              GRL
            </span>
            GymRL
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden text-slate-300 hover:text-white sm:inline-flex">
              <Link href="/docs">Docs</Link>
            </Button>
            <Button asChild variant="ghost" className="text-slate-300 hover:text-white sm:hidden">
              <Link href="/docs">
                <Menu className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="gap-2 border border-slate-500/40 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="https://github.com/boredbedouin" target="_blank" rel="noreferrer">
                <Github className="size-4" />
                GitHub
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative z-10 px-6 pb-12 pt-8 lg:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.4em] text-slate-300">
              Browser PPO Lab
            </div>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/5 text-white hover:border-cyan-400/60 hover:text-white"
            >
              <Link href="#lab">
                <Play className="mr-2 size-4" />
                Run Live
              </Link>
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 -translate-y-6 animate-pulse rounded-full bg-cyan-500/20 blur-3xl" aria-hidden />
            <HeroShowcase />
            <div className="pointer-events-none absolute left-6 top-6 max-w-sm space-y-3 rounded-3xl border border-white/10 bg-white/10 p-5 text-slate-100 backdrop-blur">
              <h1 className="text-2xl font-semibold tracking-tight text-white">GymRL</h1>
              <p className="text-sm text-slate-200">
                Select a difficulty node, drop into the arena, and let PPO or DQN chase carrots in realtime.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="lab" className="relative z-10 border-t border-white/10 pb-24 pt-16">
        <div
          className="pointer-events-none absolute inset-x-0 -top-44 h-44 bg-gradient-to-b from-cyan-400/30 via-transparent to-transparent blur-3xl"
          aria-hidden
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-800/60 bg-slate-950/80 p-4 shadow-[0_0_160px_-40px_rgba(56,189,248,0.6)] backdrop-blur md:p-6">
            <SimulationDashboard />
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.4em] text-slate-400">
            <Link href="/docs" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:border-cyan-400/40 hover:text-white">
              Docs & Curriculum
            </Link>
            <Link href="https://github.com/boredbedouin/GymRL" target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:border-cyan-400/40 hover:text-white">
              GitHub
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
