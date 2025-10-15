# PlaygroundRL

PlaygroundRL is a browser-native reinforcement learning playground with a neon aesthetic. Agents no longer train client-side; instead, the UI streams observations to an ONNX Runtime policy that runs entirely in your tab while React Three Fiber renders the world and a dedicated worker keeps the main thread responsive. No backend, no GPU—just WebAssembly, WebGL, and IndexedDB.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000> to launch the live playground. Drop an ONNX policy into `public/models/policy.onnx` (or upload one through the controls) and the browser will stream inference across the 3D grid world instantly.

### Verify before shipping

```bash
npm run lint    # eslint + type-aware rules
npm run build   # production Next.js bundle
```

Both commands should succeed cleanly; they are already tested against the latest visual refresh.

## Architecture overview

- **UI (Next.js + R3F)** — `src/ui/simulation` powers the live agent playground, including the canvas, control surface, and telemetry overlays.
- **State (Zustand)** — `src/state/simulationStore.ts` orchestrates worker commands, policy lifecycle, and frame streaming to the UI.
- **Simulation engine** — `src/lib/simulation/gridWorld.ts` contains a deterministic grid-world with heuristics, rewards, and instanced render metadata.
- **Policy runtime** — `src/lib/simulation/policyRunner.ts` wraps ONNX Runtime Web for batched inference and argmax action selection.
- **Workers** — `src/workers/simulation.worker.ts` advances the grid world, funnels observations to the policy runner, and emits renderable frames.
- **Legacy RL toolkit** — The original PPO/DQN trainer, checkpoints, and persistence helpers remain under `src/algo`, `src/state/persistence.ts`, and `src/workers/trainer.worker.ts` if you need in-browser training flows; the new UI is inference-first.

```text
app/        Next.js app router entry points
lib/        Simulation engine + policy adapters
state/      Zustand stores
ui/         Dashboard, simulation canvas, control surfaces
workers/    Simulation worker and helpers
public/
  models/   Drop ONNX policies here (policy.onnx by default)
  pyodide/  Optional Python runtime assets
  workers/  Worker bundles served statically
```

- **Grid world renderer** — lightweight instanced meshes, adaptive sparkles, and soft neon lights render dozens of agents without dropping frames.
- **ONNX hot-swap** — load a pre-trained actor from `public/models/` or your disk; inference happens in the main canvas instantly.
- **Quality toggles** — medium mode disables shadows and trims VFX for battery-friendly demos; high mode keeps the full neon bloom.
- **Heuristic fallback** — if no policy is loaded, the worker supplies a greedy baseline so the playground always feels alive.
- **Controls refresh** — streamlined panel exposes difficulty, agent counts, playback speed, and policy management in one place.

## Recent additions

- Inference-only loop: policy evaluation now runs in a dedicated worker with deterministic step timing and batched observations.
- Training dashboard refresh: the legacy panels now wrap the ONNX simulation pipeline and auto-attempt to load `policy.onnx` for instant playback.
- ONNX adapter: type-safe helper normalises tensors, resolves argmax actions, and supports remote URLs or ArrayBuffer uploads.
- Adaptive visuals: render quality slider toggles shadows/VFX so the playground shines on high-end rigs and thin laptops alike.

## Development notes

- Workers are instantiated with `new Worker(new URL("../workers/simulation.worker.ts", import.meta.url), { type: "module" })`.
- ONNX Runtime Web runs inference on WebGL; WebGPU automatically enables when available.
- CSP/COOP/COEP headers live in `next.config.ts` and `vercel.json` so `SharedArrayBuffer` and Wasm work without extra configuration.

PlaygroundRL is built for experimentation—swap policies, tweak the grid world, or bring back the TensorFlow training stack if you prefer.
