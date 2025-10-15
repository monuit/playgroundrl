# PlaygroundRL

PlaygroundRL is a browser-native reinforcement learning studio with a freshly overhauled neon interface. Agents train entirely on the client using TensorFlow.js, while React Three Fiber renders immersive environments and dedicated Web Workers keep the main thread responsive. No backend, no GPU—just WebAssembly, WebGL, and IndexedDB.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000> to launch the live playground. Drop in ONNX policies, spawn glowing agents, and let the browser stream inference across a 3D grid world without touching a backend.

### Verify before shipping

```bash
npm run lint    # eslint + type-aware rules
npm run build   # production Next.js bundle
```

Both commands should succeed cleanly; they are already tested against the latest visual refresh.

## Architecture overview

- **UI (Next.js + R3F)** — `src/ui/simulation` builds the live agent playground, including the canvas, control surface, and telemetry overlays.
- **State (Zustand)** — `src/state/simulationStore.ts` orchestrates worker commands, policy lifecycle, and frame streaming to the UI.
- **Simulation engine** — `src/lib/simulation/gridWorld.ts` contains a deterministic grid-world with heuristics, rewards, and instanced render metadata.
- **Policy runtime** — `src/lib/simulation/policyRunner.ts` wraps ONNX Runtime Web for batched inference and argmax action selection.
- **Workers** — `src/workers/simulation.worker.ts` advances the grid world, funnels observations to the policy runner, and emits renderable frames.
- **Legacy RL toolkit** — The original PPO/DQN trainer, checkpoints, and persistence helpers still live under `src/algo`, `src/state/persistence.ts`, and `src/workers/trainer.worker.ts` if you need in-browser training flows.

```text
app/        Next.js app router entry points
algo/       TensorFlow.js agents + utilities
env/        Environment implementations & R3F scenes
state/      Zustand store, IndexedDB helpers
ui/         Dashboard, control surfaces, charts
workers/    Trainer + Pyodide (placeholder)
public/
  pyodide/  Optional Python runtime assets
  workers/  Worker bundles served statically
```

- **Grid world renderer** — lightweight instanced meshes, adaptive sparkles, and soft neon lights render dozens of agents without dropping frames.
- **ONNX hot-swap** — load a pre-trained actor from `public/models/` or your disk; inference happens in the main canvas instantly.
- **Quality toggles** — medium mode disables shadows and trims VFX for battery-friendly demos; high mode keeps the full neon bloom.
- **Heuristic fallback** — if no policy is loaded, the worker supplies a greedy baseline so the playground always feels alive.
- **Controls refresh** — streamlined panel exposes difficulty, agent counts, playback speed, and policy management in one place.

## Algorithm math straight from the code

The training worker (`src/workers/trainer.worker.ts`) streams tensors into the TensorFlow.js agents in `src/algo`. Below are the exact expressions implemented in code, rewritten without the mojibake that crept into earlier inline comments.

### PPO (src/algo/ppo_tfjs.ts)

- **Temporal-difference residual**

  \[
    \delta_t = r_t + \gamma (1 - d_t)\, V(s_{t+1}) - V(s_t),
  \]
  where \(d_t \in \{0,1\}\) masks terminal transitions.

- **Generalised Advantage Estimation**

  \[
    A_t = \delta_t + \gamma \lambda (1 - d_t)\, A_{t+1}, \qquad
    R_t = A_t + V(s_t).
  \]
  The worker rolls these values backwards through each batch before shipping them to the agent.

- **Policy objective**

  \[
    r_t(\theta) = \frac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)},
  \]
  \[
    L^{\text{CLIP}}(\theta) = \mathbb{E}_t\Big[\min\big(r_t(\theta)A_t,\,
      \operatorname{clip}(r_t(\theta), 1-\varepsilon, 1+\varepsilon)A_t\big)\Big].
  \]
  The combined loss inside `trainFromRollout` is
  \[
    L(\theta) = -L^{\text{CLIP}}(\theta)
      + c_v \|R_t - V_\theta(s_t)\|_2^2
      - c_{\text{ent}}\,\mathcal{H}[\pi_\theta(\cdot\mid s_t)].
  \]
  When `clipValueLoss` is enabled we apply the same clipping trick to the critic:
  \(V^{\text{clip}} = V_{\text{old}} + \operatorname{clip}(V_\theta - V_{\text{old}}, -\varepsilon, \varepsilon)\).

- **Stability tricks**

  Advantages are normalised, gradients are clipped to `maxGradNorm`, and the approximate KL between old and new policies is monitored each epoch so `targetKL` can trigger early stopping.

### DQN (src/algo/dqn_tfjs.ts)

- **Target network**

  Every `targetUpdateFrequency` steps the online weights \(\theta\) are copied into the frozen target network \(\theta^-\).

- **Bellman target**

  \[
    y_t = r_t + \gamma (1 - d_t)\, \max_{a'} Q_{\theta^-}(s_{t+1}, a').
  \]
  Terminal transitions zero out the bootstrapped term via \((1 - d_t)\).

- **Loss**

  \[
    L(\theta) = \mathbb{E}\big[(y_t - Q_\theta(s_t, a_t))^2\big],
  \]
  implemented with `tf.losses.meanSquaredError` during the optimiser step.

- **Exploration**

  Actions follow an \(\varepsilon\)-greedy schedule that decays linearly from `epsilonStart` to `epsilonFinal` across `epsilonDecaySteps`, while the replay buffer (size `bufferSize`) mirrors the original Nature DQN set-up.

## Recent additions

- Inference-only loop: policy evaluation now runs in a dedicated worker with deterministic step timing and batched observations.
- Simulation store: lightweight Zustand slice keeps frame deltas, speed controls, and worker lifecycle in sync.
- ONNX adapter: type-safe helper normalises tensors, resolves argmax actions, and supports remote URLs or ArrayBuffer uploads.
- Adaptive visuals: render quality slider toggles shadows/VFX so the playground shines on high-end rigs and thin laptops alike.

## Development notes

- Workers are instantiated with `new Worker(new URL("../workers/trainer.worker.ts", import.meta.url), { type: "module" })`.
- TensorFlow.js defaults to WebGL; WebGPU automatically enables when available.
- CSP/COOP/COEP headers live in `next.config.ts` and `vercel.json` so `SharedArrayBuffer` and Wasm work without extra configuration.

PlaygroundRL is built for experimentation—modify environments, hook up new algorithms, or extend the persistence layer. Contributions welcome!
