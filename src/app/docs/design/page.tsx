import Link from "next/link";
import { ArrowLeft, Box, Code, Cpu, Layers, Rocket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

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

        <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8 px-6 py-12">
          {/* What It Is */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-cyan-400/50 bg-cyan-500/10 p-3 text-cyan-300">
                <Layers className="size-6" />
              </div>
              <h2 className="text-3xl font-bold text-white">What It Is</h2>
            </div>

            <p className="text-slate-300">
              <strong>GymRL</strong> is a fully browser-based reinforcement learning playground. Train PPO and DQN agents
              in real-time using TensorFlow.js - no backend servers, no Python runtime, everything runs locally in your browser.
            </p>

            <div className="space-y-4">
              <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Rocket className="size-5 text-cyan-400" />
                  <h3 className="text-xl font-semibold text-white">Framework & Deployment</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>
                    <strong className="text-slate-200">Next.js 15.5.5 + React 19.1.0</strong> (TypeScript) app using the App Router,
                    optimized for static export and edge deployment on Vercel.
                  </p>
                  <ul className="list-inside list-disc space-y-1 pl-4">
                    <li>App Router for modern file-based routing</li>
                    <li>Static site generation (SSG) for instant page loads</li>
                    <li>React Server Components for optimal bundle splitting</li>
                    <li>TypeScript 5 for type safety across the stack</li>
                  </ul>
                </div>
              </article>

              <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Box className="size-5 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">In-Browser RL Training</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>
                    <strong className="text-slate-200">TensorFlow.js 4.22.0</strong> with WebGL backend powers GPU-accelerated
                    training entirely in your browser. Train PPO and DQN agents without any server-side computation.
                  </p>
                  <ul className="list-inside list-disc space-y-1 pl-4">
                    <li><strong>PPO Agent:</strong> Actor-critic with clipped surrogate objective (256×2 GELU layers)</li>
                    <li><strong>DQN Agent:</strong> Deep Q-Network with target network and experience replay (128×2 ReLU layers)</li>
                    <li><strong>WebGL Backend:</strong> Neural networks run on GPU for 10-100x speedup</li>
                    <li><strong>Web Workers:</strong> Training loop isolated from UI thread via `trainer.worker.ts`</li>
                    <li><strong>Memory Management:</strong> Automatic tensor disposal with `tf.tidy()` prevents memory leaks</li>
                  </ul>
                  <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                    <pre>{`// src/algo/ppo_tfjs.ts - Real implementation
export class PpoTfjsAgent {
  private policyModel: tf.LayersModel;  // Actor
  private valueModel: tf.LayersModel;   // Critic
  
  async act(obs: EnvObservation) {
    const logits = this.policyModel.predict(...) as tf.Tensor;
    const probs = tf.softmax(logits);
    const action = tf.multinomial(probs, 1).dataSync()[0];
    return action;
  }
}`}</pre>
                  </div>
                </div>
              </article>

              <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Code className="size-5 text-green-400" />
                  <h3 className="text-xl font-semibold text-white">RL Environments</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>
                    <strong className="text-slate-200">5 Custom Environments</strong> built from scratch with Canvas 2D rendering.
                    Each implements the standard Gym interface: `reset()`, `step(action)`, and `render(ctx)`.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <p className="font-semibold text-slate-200">CartPole</p>
                      <p className="text-xs text-slate-400">Balance pole on moving cart</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <p className="font-semibold text-slate-200">Pong</p>
                      <p className="text-xs text-slate-400">Single-player paddle game</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <p className="font-semibold text-slate-200">Maze</p>
                      <p className="text-xs text-slate-400">Grid navigation task</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <p className="font-semibold text-slate-200">TinyGrid</p>
                      <p className="text-xs text-slate-400">Simple 3×3 world</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <p className="font-semibold text-slate-200">FlappyLite</p>
                      <p className="text-xs text-slate-400">Flappy Bird inspired</p>
                    </div>
                  </div>
                  <ul className="list-inside list-disc space-y-1 pl-4 text-xs">
                    <li>Consistent interface: Float32Array observations, discrete actions</li>
                    <li>60 FPS rendering with requestAnimationFrame</li>
                    <li>Training loop decoupled from render loop</li>
                    <li>Lightweight Canvas 2D - no WebGL/3D overhead</li>
                  </ul>
                </div>
              </article>

              <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Zap className="size-5 text-yellow-400" />
                  <h3 className="text-xl font-semibold text-white">UI & State Management</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>
                    <strong className="text-slate-200">Tailwind CSS 4 + shadcn/ui</strong> for a beautiful, responsive interface.
                    State managed with <strong>Zustand 5</strong> and persisted to <strong>Dexie (IndexedDB)</strong>.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <p className="font-semibold text-slate-200">UI Framework</p>
                      <p className="mt-1 text-xs text-slate-400">
                        shadcn/ui components + Radix UI primitives
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <p className="font-semibold text-slate-200">State</p>
                      <p className="mt-1 text-xs text-slate-400">Zustand 5 with immer middleware</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <p className="font-semibold text-slate-200">Persistence</p>
                      <p className="mt-1 text-xs text-slate-400">Dexie + IndexedDB for checkpoints & episodes</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <p className="font-semibold text-slate-200">Worker Communication</p>
                      <p className="mt-1 text-xs text-slate-400">TrainerClient wrapper with message passing</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                    <pre>{`// src/state/trainingStore.ts
const useTrainingStore = create<TrainingState>((set) => ({
  status: 'idle',
  metrics: [],
  start: async () => {
    await trainerClient.start({ envId, algoId });
    set({ status: 'running' });
  }
}));`}</pre>
                  </div>
                </div>
              </article>

              <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Cpu className="size-5 text-red-400" />
                  <h3 className="text-xl font-semibold text-white">Repository Structure</h3>
                </div>
                <div className="space-y-3 text-sm text-slate-300">
                  <p>Clean, modular architecture with clear separation of concerns:</p>
                  <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                    <pre>{`web/
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx          # Main playground
│   │   ├── docs/             # Documentation pages
│   │   ├── globals.css       # Tailwind styles
│   │   └── layout.tsx        # Root layout
│   ├── algo/                  # RL Algorithms
│   │   ├── ppo_tfjs.ts       # PPO implementation
│   │   ├── dqn_tfjs.ts       # DQN implementation
│   │   ├── buffers.ts        # Replay & rollout buffers
│   │   ├── schedules.ts      # Learning rate schedules
│   │   └── types.ts          # Algorithm interfaces
│   ├── env/                   # RL Environments
│   │   ├── cartpole.tsx      # CartPole
│   │   ├── pong.tsx          # Pong
│   │   ├── maze.tsx          # Maze
│   │   ├── tiny_grid.tsx     # TinyGrid
│   │   ├── flappy_lite.tsx   # FlappyLite
│   │   └── types.ts          # Environment interface
│   ├── workers/               # Web Workers
│   │   ├── trainer.worker.ts # Main training loop
│   │   └── types.ts          # Worker messages
│   ├── state/                 # State Management
│   │   ├── trainingStore.ts  # Zustand store
│   │   ├── persistence.ts    # IndexedDB layer
│   │   └── export_import.ts  # Checkpoint I/O
│   ├── ui/                    # React Components
│   │   ├── dashboard/        # Main training UI
│   │   ├── panels/           # Control panels
│   │   ├── metrics/          # Charts
│   │   └── env/              # Canvas wrapper
│   ├── lib/                   # Utilities
│   │   └── trainerClient.ts  # Worker client
│   └── utils/                 # Helpers
├── public/
│   ├── workers/              # Built worker bundles
│   └── pyodide/              # Pyodide runtime (optional)
└── tests/                     # E2E tests
    └── training.spec.ts      # Playwright tests`}</pre>
                  </div>
                </div>
              </article>
            </div>
          </section>

          {/* How to Recreate It */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-purple-400/50 bg-purple-500/10 p-3 text-purple-300">
                <Code className="size-6" />
              </div>
              <h2 className="text-3xl font-bold text-white">How to Recreate It</h2>
            </div>

            {/* Step 1: Framework Setup */}
            <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">
                <span className="mr-2 text-cyan-400">01</span>
                Set Up the Framework
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>Initialize Next.js with TypeScript and install core dependencies:</p>
                <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                  <pre>{`# Create Next.js app
npx create-next-app@latest gymrl --typescript --app --tailwind

# Install TensorFlow.js
npm install @tensorflow/tfjs @tensorflow/tfjs-backend-webgl

# Install UI dependencies
npm install zustand class-variance-authority clsx tailwind-merge
npm install recharts lucide-react

# Install shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card select slider tabs

# Install development tools
npm install -D @playwright/test`}</pre>
                </div>
              </div>
            </article>

            {/* Step 2: Environment Design */}
            <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">
                <span className="mr-2 text-cyan-400">02</span>
                Design the Environments
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>Create RL environments with consistent interfaces:</p>
                <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                  <pre>{`// src/env/types.ts
export interface Environment {
  reset(): EnvObservation;
  step(action: number): StepResult;
  render(ctx: CanvasRenderingContext2D): void;
  getObservationSpace(): number[];
  getActionSpace(): number;
}

// Example environments:
// - CartPole: Balance pole on moving cart
// - Pong: Single-player paddle game
// - Maze: Navigation with obstacles
// - TinyGrid: Simple grid world
// - FlappyBird Lite: Jump timing game`}</pre>
                </div>
                <p className="text-xs text-slate-400">
                  Each environment implements reset(), step(), and render() for consistency. Observations are normalized
                  Float32Arrays for efficient neural network input.
                </p>
              </div>
            </article>

            {/* Step 3: Canvas Rendering */}
            <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">
                <span className="mr-2 text-cyan-400">03</span>
                Implement Canvas Rendering
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>Efficient 2D rendering with React hooks:</p>
                <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                  <pre>{`// src/ui/env/EnvCanvas.tsx
export function EnvCanvas({ environment }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      // Clear and render environment
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      environment.render(ctx);
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [environment]);
  
  return <canvas ref={canvasRef} width={800} height={600} />;
}`}</pre>
                </div>
                <p className="text-xs text-slate-400">
                  Keep rendering at 60 FPS while decoupling it from training steps. Use requestAnimationFrame for smooth
                  visuals and simple canvas drawing operations for performance.
                </p>
              </div>
            </article>

            {/* Step 4: Algorithm Implementation */}
            <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">
                <span className="mr-2 text-cyan-400">04</span>
                Build RL Algorithms
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>Implement PPO and DQN with TensorFlow.js:</p>
                <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                  <pre>{`// src/algo/ppo_tfjs.ts
export class PpoTfjsAgent {
  private policyModel: tf.LayersModel;
  private valueModel: tf.LayersModel;
  
  async init({ obsShape, actionSize }) {
    // Build actor network (policy)
    this.policyModel = tf.sequential({
      layers: [
        tf.layers.dense({ units: 256, activation: 'gelu' }),
        tf.layers.dense({ units: 256, activation: 'gelu' }),
        tf.layers.dense({ units: actionSize }) // logits
      ]
    });
    
    // Build critic network (value)
    this.valueModel = tf.sequential({
      layers: [
        tf.layers.dense({ units: 256, activation: 'gelu' }),
        tf.layers.dense({ units: 256, activation: 'gelu' }),
        tf.layers.dense({ units: 1 })
      ]
    });
  }
  
  async act(observation) {
    // Sample action from policy
  }
  
  async observe(batch) {
    // Update policy with PPO objective
  }
}`}</pre>
                </div>
                <ul className="list-inside list-disc space-y-1 pl-4 text-xs text-slate-400">
                  <li>Separate policy and value networks for actor-critic</li>
                  <li>Use GELU activation for smooth gradients</li>
                  <li>Implement clipped surrogate objective for stable updates</li>
                  <li>Store rollouts in RolloutBuffer, replay in ReplayBuffer</li>
                </ul>
              </div>
            </article>

            {/* Step 5: Web Workers */}
            <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">
                <span className="mr-2 text-cyan-400">05</span>
                Offload Training to Workers
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>Use Web Workers to keep training off the main thread:</p>
                <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                  <pre>{`// src/workers/trainer.worker.ts
self.onmessage = async (e) => {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'INIT':
      // Initialize algorithm and environment
      agent = new PpoTfjsAgent();
      await agent.init(payload);
      break;
      
    case 'STEP':
      // Run training steps
      for (let i = 0; i < payload.steps; i++) {
        const obs = env.reset();
        const action = await agent.act(obs);
        const result = env.step(action);
        await agent.observe(result);
      }
      
      // Send metrics back to main thread
      self.postMessage({
        type: 'METRICS',
        data: agent.getDiagnostics()
      });
      break;
  }
};`}</pre>
                </div>
                <p className="text-xs text-slate-400">
                  This keeps the UI responsive during training. The main thread only handles rendering and user input,
                  while the worker handles computationally intensive training loops.
                </p>
              </div>
            </article>

            {/* Step 6: State Management */}
            <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">
                <span className="mr-2 text-cyan-400">06</span>
                Manage State with Zustand
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>Centralized state for training sessions and metrics:</p>
                <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                  <pre>{`// src/state/trainingStore.ts
export const useTrainingStore = create<TrainingState>((set, get) => ({
  isTraining: false,
  episodes: [],
  currentEpisode: 0,
  metrics: { reward: 0, loss: 0, entropy: 0 },
  
  startTraining: () => {
    const worker = new Worker('/workers/trainer.worker.js');
    worker.postMessage({ type: 'INIT', payload: {...} });
    set({ isTraining: true });
  },
  
  stopTraining: () => {
    set({ isTraining: false });
  },
  
  updateMetrics: (metrics) => {
    set({ metrics });
  }
}));`}</pre>
                </div>
                <p className="text-xs text-slate-400">
                  Zustand provides a simple, performant state solution without Redux boilerplate. Perfect for managing
                  training state, checkpoints, and real-time metrics.
                </p>
              </div>
            </article>

            {/* Step 7: UI Controls */}
            <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">
                <span className="mr-2 text-cyan-400">07</span>
                Build Control Panels
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>Interactive controls using shadcn/ui components:</p>
                <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                  <pre>{`// src/ui/panels/ControlPanel.tsx
export function ControlPanel() {
  const { isTraining, startTraining, stopTraining } = useTrainingStore();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select label="Algorithm">
            <SelectItem value="ppo">PPO</SelectItem>
            <SelectItem value="dqn">DQN</SelectItem>
          </Select>
          
          <Slider label="Learning Rate" min={0.0001} max={0.01} />
          
          <Button 
            onClick={isTraining ? stopTraining : startTraining}
          >
            {isTraining ? 'Stop' : 'Start'} Training
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}`}</pre>
                </div>
              </div>
            </article>

            {/* Step 8: Performance Optimization */}
            <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">
                <span className="mr-2 text-cyan-400">08</span>
                Optimize Performance
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>Key optimization strategies:</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <p className="font-semibold text-slate-200">Typed Arrays</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Use Float32Array for observations, actions, and buffers. Faster than regular arrays.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <p className="font-semibold text-slate-200">WebGL Backend</p>
                    <p className="mt-1 text-xs text-slate-400">
                      TensorFlow.js uses WebGL for GPU acceleration. Enable with tf.setBackend(&apos;webgl&apos;).
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <p className="font-semibold text-slate-200">Batch Operations</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Process multiple transitions at once. Use tf.tidy() to prevent memory leaks.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <p className="font-semibold text-slate-200">Lazy Loading</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Load TensorFlow.js and workers only when needed. Use dynamic imports.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <p className="font-semibold text-slate-200">Memory Management</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Dispose tensors after use. Monitor with tf.memory() and limit buffer sizes.
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <p className="font-semibold text-slate-200">Fixed Time Steps</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Decouple training Hz from render FPS. Train at 10-20 Hz, render at 60 FPS.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Step 9: Persistence */}
            <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">
                <span className="mr-2 text-cyan-400">09</span>
                Add Persistence Layer
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>Save models and training history to IndexedDB:</p>
                <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                  <pre>{`// src/state/persistence.ts
export async function saveCheckpoint(name, modelData) {
  const db = await openDB('gymrl', 1, {
    upgrade(db) {
      db.createObjectStore('checkpoints');
      db.createObjectStore('episodes');
    }
  });
  
  await db.put('checkpoints', {
    name,
    timestamp: Date.now(),
    model: modelData,
    metrics: {...}
  }, name);
}

export async function loadCheckpoint(name) {
  const db = await openDB('gymrl', 1);
  return await db.get('checkpoints', name);
}`}</pre>
                </div>
                <p className="text-xs text-slate-400">
                  IndexedDB provides large storage capacity for model weights and episode history. Users can save
                  checkpoints, export to JSON, and reload later.
                </p>
              </div>
            </article>

            {/* Step 10: Testing */}
            <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h3 className="text-xl font-semibold text-white">
                <span className="mr-2 text-cyan-400">10</span>
                Add E2E Testing
              </h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p>Automated tests with Playwright:</p>
                <div className="rounded-lg bg-slate-950/60 p-4 font-mono text-xs">
                  <pre>{`// tests/training.spec.ts
test('should start PPO training', async ({ page }) => {
  await page.goto('/');
  
  // Select PPO algorithm
  await page.click('[data-testid="algorithm-select"]');
  await page.click('text=PPO');
  
  // Start training
  await page.click('[data-testid="start-training"]');
  
  // Wait for metrics to update
  await page.waitForSelector('[data-testid="reward-metric"]');
  
  // Verify training is running
  const status = await page.textContent('[data-testid="status"]');
  expect(status).toBe('Training');
});`}</pre>
                </div>
              </div>
            </article>
          </section>

          {/* Tech Stack Summary */}
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-2xl font-bold text-white">Complete Tech Stack</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Framework</p>
                <p className="mt-1 text-sm text-slate-200">Next.js 15.5.5 + React 19</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">RL Library</p>
                <p className="mt-1 text-sm text-slate-200">TensorFlow.js</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Styling</p>
                <p className="mt-1 text-sm text-slate-200">Tailwind CSS 4</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">UI Components</p>
                <p className="mt-1 text-sm text-slate-200">shadcn/ui + Radix</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">State</p>
                <p className="mt-1 text-sm text-slate-200">Zustand + IndexedDB</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rendering</p>
                <p className="mt-1 text-sm text-slate-200">Canvas 2D API</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Charts</p>
                <p className="mt-1 text-sm text-slate-200">Recharts</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Testing</p>
                <p className="mt-1 text-sm text-slate-200">Playwright</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Deployment</p>
                <p className="mt-1 text-sm text-slate-200">Vercel Edge</p>
              </div>
            </div>
          </section>

          {/* Performance Budget */}
          <section className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h2 className="text-2xl font-bold text-white">Performance Budget</h2>
            <div className="space-y-3 text-sm text-slate-300">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-green-400/30 bg-green-500/10 p-3">
                  <p className="font-semibold text-green-200">Target Frame Time</p>
                  <p className="mt-1 text-2xl font-bold text-green-100">&lt; 16ms</p>
                  <p className="mt-1 text-xs text-green-300">60 FPS for smooth rendering</p>
                </div>
                <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
                  <p className="font-semibold text-cyan-200">Training Frequency</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-100">10-20 Hz</p>
                  <p className="mt-1 text-xs text-cyan-300">Decoupled from render loop</p>
                </div>
                <div className="rounded-lg border border-purple-400/30 bg-purple-500/10 p-3">
                  <p className="font-semibold text-purple-200">Memory Limit</p>
                  <p className="mt-1 text-2xl font-bold text-purple-100">&lt; 200 MB</p>
                  <p className="mt-1 text-xs text-purple-300">TensorFlow.js + buffers + UI</p>
                </div>
                <div className="rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-3">
                  <p className="font-semibold text-yellow-200">Initial Load</p>
                  <p className="mt-1 text-2xl font-bold text-yellow-100">&lt; 2s</p>
                  <p className="mt-1 text-xs text-yellow-300">Time to interactive on 4G</p>
                </div>
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
