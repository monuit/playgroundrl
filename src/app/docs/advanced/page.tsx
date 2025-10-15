import Link from "next/link";
import { ArrowLeft, Settings, TrendingUp, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdvancedFeaturesPage() {
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
                Adv
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Best Practices</p>
                <h1 className="text-3xl font-semibold text-white">Advanced Training Features</h1>
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

        <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8 px-6 py-12">
          {/* Introduction */}
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-2xl font-bold text-white">PPO Advanced Features</h2>
            <p className="text-slate-300">
              Our PPO implementation includes several advanced techniques from recent research that improve
              training stability, sample efficiency, and final performance. These features are based on best
              practices from the original PPO paper and subsequent improvements by the RL community.
            </p>
          </section>

          {/* Value Function Clipping */}
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-purple-400/50 bg-purple-500/10 p-3 text-purple-300">
                <Shield className="size-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Value Function Clipping</h2>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p>
                Similar to how PPO clips the policy updates, we can also clip value function updates to
                prevent large changes that might destabilize training.
              </p>

              <div className="rounded-lg bg-slate-950/60 p-4">
                <h3 className="mb-2 font-mono text-xs font-semibold text-slate-200">Mathematical Formula</h3>
                <div className="font-mono text-xs">
                  <p>V_clipped = V_old + clip(V_new - V_old, -ε, ε)</p>
                  <p className="mt-2">L^VF_clip = max((V_target - V_new)², (V_target - V_clipped)²)</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-200">Benefits:</h3>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>Prevents value function from changing too rapidly</li>
                  <li>More stable advantage estimates throughout training</li>
                  <li>Reduces variance in policy gradient estimates</li>
                  <li>Particularly helpful in environments with sparse rewards</li>
                </ul>
              </div>

              <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4">
                <h3 className="mb-2 font-semibold text-cyan-200">Usage:</h3>
                <div className="rounded bg-slate-950/60 p-3 font-mono text-xs">
                  <code>{`clipValueLoss: true  // Enable value function clipping`}</code>
                </div>
              </div>
            </div>
          </section>

          {/* Gradient Clipping */}
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-orange-400/50 bg-orange-500/10 p-3 text-orange-300">
                <Zap className="size-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Gradient Clipping</h2>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p>
                Gradient clipping prevents exploding gradients by limiting the maximum norm of gradient updates.
                This is especially important in recurrent architectures or complex environments.
              </p>

              <div className="rounded-lg bg-slate-950/60 p-4">
                <h3 className="mb-2 font-mono text-xs font-semibold text-slate-200">Mathematical Formula</h3>
                <div className="font-mono text-xs">
                  <p>g_clipped = g · min(1, max_norm / ||g||)</p>
                  <p className="mt-1 text-slate-400">where g is the gradient vector and ||g|| is its L2 norm</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-200">Benefits:</h3>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>Prevents training instability from exploding gradients</li>
                  <li>Allows use of higher learning rates</li>
                  <li>Improves convergence in challenging environments</li>
                  <li>Essential for training on tasks with large state/action spaces</li>
                </ul>
              </div>

              <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4">
                <h3 className="mb-2 font-semibold text-cyan-200">Usage:</h3>
                <div className="rounded bg-slate-950/60 p-3 font-mono text-xs">
                  <code>{`maxGradNorm: 0.5  // Clip gradients to max norm of 0.5\nmaxGradNorm: 0    // Disable gradient clipping`}</code>
                </div>
              </div>
            </div>
          </section>

          {/* Advantage Normalization */}
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-green-400/50 bg-green-500/10 p-3 text-green-300">
                <TrendingUp className="size-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">Advantage Normalization</h2>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p>
                Normalizing advantages to zero mean and unit variance makes training more stable by keeping
                gradient magnitudes consistent regardless of reward scale.
              </p>

              <div className="rounded-lg bg-slate-950/60 p-4">
                <h3 className="mb-2 font-mono text-xs font-semibold text-slate-200">Mathematical Formula</h3>
                <div className="font-mono text-xs">
                  <p>Â_norm = (Â - μ) / (σ + ε)</p>
                  <p className="mt-1 text-slate-400">
                    where μ = mean(Â), σ = std(Â), ε = small constant for stability
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-200">Benefits:</h3>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>Makes learning rate tuning easier across different environments</li>
                  <li>Prevents advantage values from overwhelming the clipping bounds</li>
                  <li>Improves numerical stability in policy gradient estimates</li>
                  <li>Standard practice in most production PPO implementations</li>
                </ul>
              </div>

              <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4">
                <h3 className="mb-2 font-semibold text-cyan-200">Usage:</h3>
                <div className="rounded bg-slate-950/60 p-3 font-mono text-xs">
                  <code>{`normalizeAdvantages: true  // Enable advantage normalization (recommended)`}</code>
                </div>
              </div>
            </div>
          </section>

          {/* KL Divergence Monitoring */}
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-red-400/50 bg-red-500/10 p-3 text-red-300">
                <Settings className="size-6" />
              </div>
              <h2 className="text-2xl font-bold text-white">KL Divergence Early Stopping</h2>
            </div>

            <div className="space-y-4 text-sm text-slate-300">
              <p>
                Monitoring the KL divergence between old and new policies helps detect when the policy is
                changing too rapidly. Early stopping prevents policy collapse.
              </p>

              <div className="rounded-lg bg-slate-950/60 p-4">
                <h3 className="mb-2 font-mono text-xs font-semibold text-slate-200">Mathematical Formula</h3>
                <div className="font-mono text-xs">
                  <p>KL(π_old || π_new) ≈ E[log π_old(a|s) - log π_new(a|s)]</p>
                  <p className="mt-1 text-slate-400">Approximate KL divergence for early stopping</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-200">How It Works:</h3>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>Calculated during each mini-batch update</li>
                  <li>If KL exceeds target threshold, stop current epoch</li>
                  <li>Prevents destructive policy updates that might harm performance</li>
                  <li>Complements clipping by adding an adaptive stopping criterion</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-200">Benefits:</h3>
                <ul className="list-inside list-disc space-y-1 pl-4">
                  <li>Adaptive control over policy update magnitude</li>
                  <li>Prevents overfitting to mini-batch data</li>
                  <li>Useful diagnostic for monitoring training health</li>
                  <li>Can enable higher learning rates safely</li>
                </ul>
              </div>

              <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-4">
                <h3 className="mb-2 font-semibold text-cyan-200">Usage:</h3>
                <div className="rounded bg-slate-950/60 p-3 font-mono text-xs">
                  <code>{`targetKL: 0.015  // Stop epoch if KL divergence > 0.015\ntargetKL: 0      // Disable early stopping (use clipping only)`}</code>
                </div>
              </div>
            </div>
          </section>

          {/* Hyperparameter Recommendations */}
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-2xl font-bold text-white">Recommended Hyperparameters</h2>

            <div className="space-y-4 text-sm">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-200">Conservative (Most Stable):</h3>
                <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                  <pre>{`{
  clipRange: 0.1,
  clipValueLoss: true,
  maxGradNorm: 0.5,
  normalizeAdvantages: true,
  targetKL: 0.01,
  epochs: 4,
  learningRate: 2.5e-4
}`}</pre>
                </div>
                <p className="text-xs text-slate-400">
                  Best for: Complex environments, initial experiments, debugging
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-200">Balanced (Default):</h3>
                <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                  <pre>{`{
  clipRange: 0.12,
  clipValueLoss: false,
  maxGradNorm: 0.5,
  normalizeAdvantages: true,
  targetKL: 0,
  epochs: 4,
  learningRate: 2.5e-4
}`}</pre>
                </div>
                <p className="text-xs text-slate-400">
                  Best for: General purpose training, good stability-speed tradeoff
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-200">Aggressive (Faster Learning):</h3>
                <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                  <pre>{`{
  clipRange: 0.2,
  clipValueLoss: false,
  maxGradNorm: 1.0,
  normalizeAdvantages: true,
  targetKL: 0.03,
  epochs: 10,
  learningRate: 3e-4
}`}</pre>
                </div>
                <p className="text-xs text-slate-400">
                  Best for: Simple environments, when you need faster convergence
                </p>
              </div>
            </div>
          </section>

          {/* Research References */}
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-2xl font-bold text-white">Research References</h2>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="space-y-1">
                <p className="font-semibold text-slate-200">Value Function Clipping:</p>
                <p className="text-xs">
                  Introduced in the original PPO paper as an alternative formulation. See Section 3 of
                  Schulman et al. (2017).
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-slate-200">Gradient Clipping:</p>
                <p className="text-xs">
                  Standard practice in deep learning, particularly important for RNNs. See Pascanu et al.
                  (2013) &ldquo;On the difficulty of training recurrent neural networks.&rdquo;
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-slate-200">Advantage Normalization:</p>
                <p className="text-xs">
                  Widely used in practice, discussed in Engstrom et al. (2020) &ldquo;Implementation Matters in
                  Deep RL.&rdquo;
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-slate-200">KL Divergence Monitoring:</p>
                <p className="text-xs">
                  Used in TRPO and discussed as an alternative stopping criterion in the PPO paper.
                </p>
              </div>
            </div>
          </section>

          {/* Back to docs */}
          <div className="flex justify-center pb-8">
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-white/5 text-slate-200 hover:border-cyan-400/60 hover:text-white"
            >
              <Link href="/docs">
                <ArrowLeft className="mr-2 size-4" />
                Back to Documentation
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
