import Link from "next/link";
import { ArrowLeft, BookOpen, Brain, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AlgorithmsPage() {
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
                Algo
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Mathematical Foundations</p>
                <h1 className="text-3xl font-semibold text-white">Algorithm Deep Dive</h1>
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
          {/* PPO Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-cyan-400/50 bg-cyan-500/10 p-3 text-cyan-300">
                <Brain className="size-6" />
              </div>
              <h2 className="text-3xl font-bold text-white">Proximal Policy Optimization (PPO)</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Calculator className="size-5 text-cyan-400" />
                  Core Mathematics
                </h3>
                
                <div className="space-y-4 text-sm text-slate-300">
                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">1. Policy Gradient Objective</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>L<sup>PG</sup>(θ) = 𝔼<sub>t</sub>[log π<sub>θ</sub>(a<sub>t</sub> | s<sub>t</sub>) · Â<sub>t</sub>]</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Standard policy gradient maximizes expected advantage-weighted log probabilities
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">2. Importance Sampling Ratio</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>r<sub>t</sub>(θ) = π<sub>θ</sub>(a<sub>t</sub> | s<sub>t</sub>) / π<sub>θ_old</sub>(a<sub>t</sub> | s<sub>t</sub>)</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Ratio measures how much the new policy differs from the old policy
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">3. Clipped Surrogate Objective</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>L<sup>CLIP</sup>(θ) = 𝔼<sub>t</sub>[min(r<sub>t</sub>(θ) · Â<sub>t</sub>, clip(r<sub>t</sub>(θ), 1-ε, 1+ε) · Â<sub>t</sub>)]</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Clips ratio to [1-ε, 1+ε] preventing destructively large policy updates
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">4. Value Function Loss</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>L<sup>VF</sup>(θ) = 𝔼<sub>t</sub>[(V<sub>θ</sub>(s<sub>t</sub>) - V<sub>t</sub><sup>target</sup>)²]</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      MSE between predicted value and actual returns
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">5. Entropy Bonus</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>H(π<sub>θ</sub>) = -𝔼<sub>a~π</sub>[log π<sub>θ</sub>(a | s)]</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Encourages exploration by penalizing deterministic policies
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">6. Complete Loss Function</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>L<sup>PPO</sup>(θ) = L<sup>CLIP</sup>(θ) + c<sub>1</sub>·L<sup>VF</sup>(θ) - c<sub>2</sub>·H(π<sub>θ</sub>)</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Combines policy loss, value loss, and entropy with coefficients c₁=0.5, c₂=0.01
                    </p>
                  </div>
                </div>
              </article>

              <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                  <BookOpen className="size-5 text-cyan-400" />
                  Implementation Details
                </h3>
                
                <div className="space-y-4 text-sm text-slate-300">
                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">Generalized Advantage Estimation (GAE)</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>δ<sub>t</sub> = r<sub>t</sub> + γ·V(s<sub>t+1</sub>) - V(s<sub>t</sub>)</p>
                      <p className="mt-1">Â<sub>t</sub> = Σ<sub>l=0</sub><sup>∞</sup> (γλ)<sup>l</sup> · δ<sub>t+l</sub></p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      GAE-λ balances bias-variance tradeoff with λ=0.95, γ=0.99
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">Advantage Normalization</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>Â<sub>norm</sub> = (Â - μ<sub>Â</sub>) / (σ<sub>Â</sub> + ε)</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Normalizes advantages to zero mean, unit variance (ε=1e-8 for stability)
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">Mini-batch Updates</h4>
                    <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
                      <li>Rollout buffer: 1024 steps</li>
                      <li>Mini-batch size: 256 samples</li>
                      <li>Epochs per rollout: 4</li>
                      <li>Total updates: 4 × (1024/256) = 16 per rollout</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">Network Architecture</h4>
                    <div className="space-y-2 text-xs text-slate-400">
                      <p className="font-semibold text-slate-300">Actor Network (Policy):</p>
                      <ul className="list-inside list-disc space-y-1">
                        <li>Input: Observation vector</li>
                        <li>Hidden: 256 units × 2 layers (GELU activation)</li>
                        <li>Output: Action logits (softmax)</li>
                      </ul>
                      <p className="mt-2 font-semibold text-slate-300">Critic Network (Value):</p>
                      <ul className="list-inside list-disc space-y-1">
                        <li>Input: Observation vector</li>
                        <li>Hidden: 256 units × 2 layers (GELU activation)</li>
                        <li>Output: State value V(s)</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">Hyperparameters</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-950/60 p-2">
                        <p className="text-slate-400">Learning rate</p>
                        <p className="font-mono text-slate-200">2.5e-4</p>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 p-2">
                        <p className="text-slate-400">Clip range ε</p>
                        <p className="font-mono text-slate-200">0.12</p>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 p-2">
                        <p className="text-slate-400">Entropy coeff c₂</p>
                        <p className="font-mono text-slate-200">0.01</p>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 p-2">
                        <p className="text-slate-400">Value coeff c₁</p>
                        <p className="font-mono text-slate-200">0.5</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">Why PPO Works</h4>
                    <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
                      <li><strong className="text-slate-300">Stability:</strong> Clipping prevents policy collapse</li>
                      <li><strong className="text-slate-300">Sample efficiency:</strong> Multiple epochs per batch</li>
                      <li><strong className="text-slate-300">Simplicity:</strong> No KL-divergence constraints needed</li>
                      <li><strong className="text-slate-300">Performance:</strong> State-of-art on continuous control</li>
                    </ul>
                  </div>
                </div>
              </article>
            </div>
          </section>

          {/* DQN Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-purple-400/50 bg-purple-500/10 p-3 text-purple-300">
                <Brain className="size-6" />
              </div>
              <h2 className="text-3xl font-bold text-white">Deep Q-Network (DQN)</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                  <Calculator className="size-5 text-purple-400" />
                  Core Mathematics
                </h3>
                
                <div className="space-y-4 text-sm text-slate-300">
                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">1. Q-Value Definition</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>Q<sup>π</sup>(s, a) = 𝔼<sub>π</sub>[R<sub>t</sub> | s<sub>t</sub>=s, a<sub>t</sub>=a]</p>
                      <p className="mt-1">R<sub>t</sub> = Σ<sub>k=0</sub><sup>∞</sup> γ<sup>k</sup> · r<sub>t+k+1</sub></p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Expected cumulative discounted reward from state-action pair
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">2. Bellman Equation</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>Q<sup>*</sup>(s, a) = 𝔼[r + γ · max<sub>a&apos;</sub> Q<sup>*</sup>(s&apos;, a&apos;)]</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Optimal Q-value satisfies recursive Bellman optimality equation
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">3. Temporal Difference Error</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>δ = r + γ · max<sub>a&apos;</sub> Q<sub>target</sub>(s&apos;, a&apos;) - Q(s, a)</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      TD error measures discrepancy between prediction and target
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">4. DQN Loss Function</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>L(θ) = 𝔼<sub>(s,a,r,s&apos;)~D</sub>[(y - Q(s, a; θ))²]</p>
                      <p className="mt-1">y = r + γ · max<sub>a&apos;</sub> Q(s&apos;, a&apos;; θ<sup>-</sup>)</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      MSE between predicted Q and target y using experience replay buffer D
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">5. Epsilon-Greedy Policy</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>π(a | s) = {'{'}</p>
                      <p className="ml-4">1 - ε + ε/|A|, if a = argmax<sub>a&apos;</sub> Q(s, a&apos;)</p>
                      <p className="ml-4">ε/|A|, otherwise</p>
                      <p>{'}'}</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Exploration-exploitation balance with decaying ε: 1.0 → 0.05
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">6. Target Network Update</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                      <p>θ<sup>-</sup> ← θ (every C steps)</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Hard sync target network every 1000 steps for stability
                    </p>
                  </div>
                </div>
              </article>

              <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
                  <BookOpen className="size-5 text-purple-400" />
                  Implementation Details
                </h3>
                
                <div className="space-y-4 text-sm text-slate-300">
                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">Experience Replay</h4>
                    <div className="rounded-lg bg-slate-950/60 p-4 text-xs">
                      <p className="font-mono">D = {'{'} (s<sub>t</sub>, a<sub>t</sub>, r<sub>t</sub>, s<sub>t+1</sub>, done<sub>t</sub>) {'}'}</p>
                      <ul className="mt-2 list-inside list-disc space-y-1 text-slate-400">
                        <li>Buffer size: 50,000 transitions</li>
                        <li>Min buffer: 1,000 before training</li>
                        <li>Uniform sampling: batch size 64</li>
                      </ul>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Breaks temporal correlations, improves data efficiency
                    </p>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">Network Architecture</h4>
                    <div className="space-y-2 text-xs text-slate-400">
                      <p className="font-semibold text-slate-300">Q-Network:</p>
                      <ul className="list-inside list-disc space-y-1">
                        <li>Input: Observation vector</li>
                        <li>Hidden: 128 units × 2 layers (ReLU activation)</li>
                        <li>Output: Q-values for each action</li>
                        <li>Init: Glorot uniform for stability</li>
                      </ul>
                      <p className="mt-2 font-semibold text-slate-300">Target Network:</p>
                      <ul className="list-inside list-disc space-y-1">
                        <li>Identical architecture to Q-network</li>
                        <li>Frozen weights (updated periodically)</li>
                        <li>Prevents moving target problem</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">Training Loop</h4>
                    <ol className="list-inside list-decimal space-y-1 text-xs text-slate-400">
                      <li>Observe state s<sub>t</sub>, select action with ε-greedy</li>
                      <li>Execute action, receive reward r<sub>t</sub>, next state s<sub>t+1</sub></li>
                      <li>Store transition (s<sub>t</sub>, a<sub>t</sub>, r<sub>t</sub>, s<sub>t+1</sub>) in replay buffer</li>
                      <li>Sample random mini-batch from buffer</li>
                      <li>Compute target y using target network</li>
                      <li>Update online network with gradient descent</li>
                      <li>Every C steps, sync θ<sup>-</sup> ← θ</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">Hyperparameters</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-950/60 p-2">
                        <p className="text-slate-400">Learning rate</p>
                        <p className="font-mono text-slate-200">2.5e-4</p>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 p-2">
                        <p className="text-slate-400">Discount γ</p>
                        <p className="font-mono text-slate-200">0.99</p>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 p-2">
                        <p className="text-slate-400">Batch size</p>
                        <p className="font-mono text-slate-200">64</p>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 p-2">
                        <p className="text-slate-400">Target sync</p>
                        <p className="font-mono text-slate-200">1000 steps</p>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 p-2">
                        <p className="text-slate-400">ε start/final</p>
                        <p className="font-mono text-slate-200">1.0 / 0.05</p>
                      </div>
                      <div className="rounded-lg bg-slate-950/60 p-2">
                        <p className="text-slate-400">ε decay</p>
                        <p className="font-mono text-slate-200">25k steps</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">Why DQN Works</h4>
                    <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
                      <li><strong className="text-slate-300">Stability:</strong> Target network prevents oscillations</li>
                      <li><strong className="text-slate-300">Data efficiency:</strong> Experience replay reuses transitions</li>
                      <li><strong className="text-slate-300">Simplicity:</strong> Off-policy, value-based approach</li>
                      <li><strong className="text-slate-300">Discrete actions:</strong> Optimal for finite action spaces</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-2 font-semibold text-slate-200">DQN Variants</h4>
                    <ul className="list-inside list-disc space-y-1 text-xs text-slate-400">
                      <li><strong className="text-slate-300">Double DQN:</strong> Reduces overestimation bias</li>
                      <li><strong className="text-slate-300">Dueling DQN:</strong> Separate value and advantage streams</li>
                      <li><strong className="text-slate-300">Prioritized Replay:</strong> Sample important transitions more</li>
                      <li><strong className="text-slate-300">Rainbow:</strong> Combines multiple improvements</li>
                    </ul>
                  </div>
                </div>
              </article>
            </div>
          </section>

          {/* Comparison Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white">PPO vs DQN Comparison</h2>
            
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-6 py-4 text-left font-semibold text-white">Aspect</th>
                    <th className="px-6 py-4 text-left font-semibold text-cyan-300">PPO (On-Policy)</th>
                    <th className="px-6 py-4 text-left font-semibold text-purple-300">DQN (Off-Policy)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr>
                    <td className="px-6 py-3 font-medium text-slate-200">Action Space</td>
                    <td className="px-6 py-3 text-slate-300">Discrete & Continuous</td>
                    <td className="px-6 py-3 text-slate-300">Discrete only</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium text-slate-200">Learning Type</td>
                    <td className="px-6 py-3 text-slate-300">Policy-based (actor-critic)</td>
                    <td className="px-6 py-3 text-slate-300">Value-based</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium text-slate-200">Data Efficiency</td>
                    <td className="px-6 py-3 text-slate-300">Multiple epochs per batch</td>
                    <td className="px-6 py-3 text-slate-300">Experience replay</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium text-slate-200">Exploration</td>
                    <td className="px-6 py-3 text-slate-300">Entropy bonus</td>
                    <td className="px-6 py-3 text-slate-300">ε-greedy</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium text-slate-200">Stability</td>
                    <td className="px-6 py-3 text-slate-300">Clipped objective</td>
                    <td className="px-6 py-3 text-slate-300">Target network</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium text-slate-200">Sample Source</td>
                    <td className="px-6 py-3 text-slate-300">Current policy only</td>
                    <td className="px-6 py-3 text-slate-300">Any past policy</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-3 font-medium text-slate-200">Best For</td>
                    <td className="px-6 py-3 text-slate-300">Continuous control, robotics</td>
                    <td className="px-6 py-3 text-slate-300">Atari games, discrete tasks</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* References */}
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="mb-4 text-xl font-bold text-white">References & Further Reading</h2>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="text-slate-500">•</span>
                <span>
                  <strong className="text-slate-200">Schulman et al. (2017):</strong> Proximal Policy Optimization Algorithms
                  <a href="https://arxiv.org/abs/1707.06347" className="ml-2 text-cyan-400 hover:underline" target="_blank" rel="noreferrer">
                    arxiv:1707.06347
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500">•</span>
                <span>
                  <strong className="text-slate-200">Bick, Daniel (2021):</strong> Towards Delivering a Coherent Self-Contained Explanation of PPO
                  <a href="https://fse.studenttheses.ub.rug.nl/25709/" className="ml-2 text-cyan-400 hover:underline" target="_blank" rel="noreferrer">
                    University of Groningen
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500">•</span>
                <span>
                  <strong className="text-slate-200">Mnih et al. (2015):</strong> Human-level control through deep reinforcement learning
                  <a href="https://www.nature.com/articles/nature14236" className="ml-2 text-purple-400 hover:underline" target="_blank" rel="noreferrer">
                    Nature 518
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500">•</span>
                <span>
                  <strong className="text-slate-200">Van Hasselt et al. (2016):</strong> Deep Reinforcement Learning with Double Q-learning
                  <a href="https://arxiv.org/abs/1509.06461" className="ml-2 text-purple-400 hover:underline" target="_blank" rel="noreferrer">
                    arxiv:1509.06461
                  </a>
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500">•</span>
                <span>
                  <strong className="text-slate-200">Sutton & Barto (2018):</strong> Reinforcement Learning: An Introduction (2nd Edition)
                  <a href="http://incompleteideas.net/book/the-book-2nd.html" className="ml-2 text-slate-400 hover:underline" target="_blank" rel="noreferrer">
                    MIT Press
                  </a>
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
