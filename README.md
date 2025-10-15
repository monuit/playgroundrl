# PlaygroundRL

PlaygroundRL is a browser-native reinforcement learning studio with a freshly overhauled neon interface inspired by PPO Bunny. Agents train entirely on the client using TensorFlow.js, while React Three Fiber renders immersive environments and dedicated Web Workers keep the main thread responsive. No backend, no GPU—just WebAssembly, WebGL, and IndexedDB.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000> to launch the dashboard. Flip between environments, pick algorithms, retune hyperparameters, edit reward functions, and manage checkpoints directly in the browser.

### Verify before shipping

```bash
npm run lint    # eslint + type-aware rules
npm run build   # production Next.js bundle
```

Both commands should succeed cleanly; they are already tested against the latest visual refresh.

## Architecture overview

- **UI (Next.js + R3F)** — `src/ui` contains the dashboard, environment canvases, control panels, metrics charts, and checkpoint tools.
- **State (Zustand)** — `src/state/trainingStore.ts` wires UI actions to background workers, persistence, and diagnostics.
- **Environments** — `src/env` hosts the playable library (Pong, Maze, Tiny Grid, CartPole Lite, Flappy Lite, Mountain Car, Bunny Garden) and shared typings.
- **Algorithms** — `src/algo/dqn_tfjs.ts` and `src/algo/ppo_tfjs.ts` provide lightweight tfjs implementations with replay buffers, schedules, and diagnostics hooks.
- **Workers** — `src/workers/trainer.worker.ts` runs PPO/DQN updates off the main thread. Reward validation happens in-sandbox via AST checks before execution.
- **Persistence** — `src/state/persistence.ts` wraps Dexie/IndexedDB for manifests, metrics, checkpoints, and blobs. `src/state/export_import.ts` exports/imports `.playgroundrl.zip` bundles or pure JSON payloads.

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

## PPO Bunny visual refresh

- **Neon hero experience** — new landing page with layered gradients, feature highlights, and a live 3D HeroPlayground to mirror the PPO Bunny vibe.
- **Glassmorphism dashboard** — reusable panel styling introduces frosted surfaces, accent lighting, and ambient overlays across control, telemetry, and environment panels.
- **Playbook and checkpoints** — revamped copy, pastel info tiles, and luminous tables make curriculum notes and checkpoint management easier to scan.
- **Metric clarity** — episode tables now use color-coded typography on soft glass backgrounds, keeping data legible in the dark theme.
- **Theme palette** — global CSS variables were retuned for cyan-violet accents and smoothed surfaces that carry through every component.

## Recent additions

- Diagnostics: loss, entropy, learning rate, and steps/sec surface live in the dashboard and historical tables.
- Checkpoint suite: pin, rename, annotate, export, or delete checkpoints with updated metadata timelines.
- Environment expansion: Mountain Car physics joins Pong, Maze, Tiny Grid, CartPole Lite, Flappy Lite, and Bunny Garden.
- Reward sandbox hardening: AST guards block unsafe globals, complex scripts, and prototype escapes before execution.
- JSON export: runs can be archived as `.playgroundrl.json` for easy diffing or sharing, alongside zipped bundles.

## Development notes

- Workers are instantiated with `new Worker(new URL("../workers/trainer.worker.ts", import.meta.url), { type: "module" })`.
- TensorFlow.js defaults to WebGL; WebGPU automatically enables when available.
- CSP/COOP/COEP headers live in `next.config.ts` and `vercel.json` so `SharedArrayBuffer` and Wasm work without extra configuration.

PlaygroundRL is built for experimentation—modify environments, hook up new algorithms, or extend the persistence layer. Contributions welcome!
