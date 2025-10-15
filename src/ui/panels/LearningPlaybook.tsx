"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Section = {
  id: string;
  label: string;
  accent: string;
  summary: string;
  content: ReactNode;
};

const SECTIONS: Section[] = [
  {
    id: "architecture",
    label: "Actor-Critic",
    accent: "#fbbf24",
    summary: "Two coordinated networks: the actor steers actions while the critic judges them.",
    content: (
      <ul className="ml-4 list-disc space-y-2 text-sm text-slate-300">
        <li>
          Shared feature encoder (2 x 256 hidden units, GELU) feeds both heads to ground the agent in bunny telemetry.
        </li>
        <li>
          Actor head outputs an 8-way categorical policy; critic head produces a single scalar value estimate.
        </li>
        <li>Orthogonal weight initialisation keeps the policy expressive without destabilising value gradients.</li>
      </ul>
    ),
  },
  {
    id: "advantage",
    label: "GAE",
    accent: "#38bdf8",
    summary: "Generalised Advantage Estimation keeps credit assignment smooth across long rollouts.",
    content: (
      <ul className="ml-4 list-disc space-y-2 text-sm text-slate-300">
        <li>Rollout horizon of 1,024 steps balances signal richness with GPU-friendly batch sizes.</li>
        <li>Lambda = 0.95 softly discounts older advantages while preserving momentum toward radiant carrots.</li>
        <li>
          Baseline value bootstrapping reduces variance, so the bunny receives consistent guidance even when exploring
          mazes.
        </li>
      </ul>
    ),
  },
  {
    id: "minibatch",
    label: "Minibatches",
    accent: "#22d3ee",
    summary: "Four gradient passes per rollout make PPO data efficient without overfitting.",
    content: (
      <ul className="ml-4 list-disc space-y-2 text-sm text-slate-300">
        <li>
          Trajectories are shuffled into 256-step minibatches, giving four SGD updates per rollout (1,024 / 256).
        </li>
        <li>
          Adam optimiser with learning rate 2.5e-4 and gradient clipping at 0.5 protects against exploding updates.
        </li>
        <li>Entropy bonus of 0.01 nudges the policy to keep scouting new glades when carrots shift.</li>
      </ul>
    ),
  },
  {
    id: "objective",
    label: "Clipped Objective",
    accent: "#818cf8",
    summary: "Clipping range +/-0.12 defends performance while letting the policy adapt quickly.",
    content: (
      <ul className="ml-4 list-disc space-y-2 text-sm text-slate-300">
        <li>The surrogate loss uses importance sampling ratios bounded to [0.88, 1.12] per step.</li>
        <li>Value-function loss carries a 0.5 coefficient, harmonising reward fitting with policy improvement.</li>
        <li>DQN remains available for ablations--swap algorithms in the console to contrast exploration styles.</li>
      </ul>
    ),
  },
];

const HYPERPARAMETERS = [
  { label: "Learning rate", value: "2.5e-4", hint: "Adam (beta1 = 0.9, beta2 = 0.999)" },
  { label: "Rollout horizon", value: "1,024", hint: "Steps collected before an update" },
  { label: "Discount gamma", value: "0.99", hint: "Long-term planning weight" },
  { label: "GAE lambda", value: "0.95", hint: "Advantage smoothing" },
  { label: "Minibatch size", value: "256", hint: "4 passes per rollout" },
  { label: "Policy clip", value: "+/-0.12", hint: "Keeps updates stable" },
  { label: "Entropy bonus", value: "0.01", hint: "Encourages exploration" },
  { label: "Value loss coef", value: "0.5", hint: "Balances critic updates" },
] as const;

export function LearningPlaybook() {
  const [active, setActive] = useState<Section["id"]>("architecture");

  const activeSection = useMemo(
    () => SECTIONS.find((section) => section.id === active) ?? SECTIONS[0],
    [active]
  );

  return (
    <Card className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-[0_20px_80px_-48px_rgba(129,140,248,0.65)] backdrop-blur-xl">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.25),transparent_65%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(56,189,248,0.12),transparent_70%)]"
        aria-hidden
      />
      <CardHeader className="relative space-y-5 border-b border-white/10 bg-white/5 px-6 py-6">
        <div className="flex items-center justify-between gap-3">
          <Badge className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-1 text-[0.65rem] uppercase tracking-[0.35em] text-cyan-200">
            PPO focus
          </Badge>
          <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Lumen Valley playbook
          </span>
        </div>
        <CardTitle className="text-2xl font-semibold text-white">Curriculum guide</CardTitle>
        <CardDescription className="text-slate-300">
          Understand how the actor-critic pair slices through glowing groves and tight labyrinths.
        </CardDescription>
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((section) => (
            <Button
              key={section.id}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:text-white",
                active === section.id &&
                  "border-cyan-400/70 bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-violet-500/20 text-white shadow-[0_0_40px_-20px_rgba(56,189,248,0.85)]"
              )}
              onClick={() => setActive(section.id)}
            >
              <span className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: section.accent }}
                  aria-hidden
                />
                {section.label}
              </span>
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="relative space-y-6 px-6 py-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-white">{activeSection.summary}</p>
          <div>{activeSection.content}</div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Key hyperparameters</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HYPERPARAMETERS.map((parameter) => (
              <div
                key={parameter.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_15px_60px_-50px_rgba(129,140,248,0.7)] backdrop-blur transition hover:border-cyan-400/40"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {parameter.label}
                </p>
                <p className="mt-1 text-lg font-semibold text-white">{parameter.value}</p>
                <p className="text-xs text-slate-300">{parameter.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
