# PlaygroundRL

PlaygroundRL is a browser-native reinforcement learning playground with a neon aesthetic. Agents no longer train client-side; instead, the UI streams observations to an ONNX Runtime policy that runs entirely in your tab while React Three Fiber renders the world through a persistent portal-based Canvas system, keeping the main thread responsive with dedicated workers. No backend, no GPU—just WebAssembly, WebGL, tunnel-rat portals, and IndexedDB.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000> to launch the live playground. Drop an ONNX policy into `public/models/policy.onnx` (or upload one through the controls) and the browser will stream inference across the 3D grid world instantly.

### Verify before shipping

```bash
npm run lint           # eslint + type-aware rules
npm run build          # production Next.js bundle
npx playwright test    # end-to-end smoke of the landing playground
```

All three commands should succeed cleanly; they are exercised whenever environments or landing UI change.

## Architecture overview

- **UI (Next.js + R3F)** — `src/ui/simulation` powers the live agent playground, including the canvas, control surface, and telemetry overlays.
- **3D Portal System** — `src/lib/scene-portal.ts` creates a tunnel-rat bridge; `src/components/canvas/Scene.tsx` renders a persistent Canvas at root; `src/components/canvas/View.tsx` portals 3D content from anywhere in the app into that single Canvas. See [3D Architecture Guide](docs/3D_ARCHITECTURE.md).
- **State (Zustand)** — `src/state/simulationStore.ts` orchestrates worker commands, policy lifecycle, and frame streaming to the UI.
- **Simulation engine** — `src/lib/simulation/gridWorld.ts` contains a deterministic grid-world with heuristics, rewards, and instanced render metadata.
- **Policy runtime** — `src/lib/simulation/policyRunner.ts` wraps ONNX Runtime Web for batched inference and argmax action selection.
- **Workers** — `src/workers/simulation.worker.ts` advances the grid world, funnels observations to the policy runner, and emits renderable frames.
- **Legacy RL toolkit** — The original PPO/DQN trainer, checkpoints, and persistence helpers remain under `src/algo`, `src/state/persistence.ts`, and `src/workers/trainer.worker.ts` if you need in-browser training flows; the new UI is inference-first.

```text
app/               Next.js app router entry points
components/
  canvas/          Scene, View, Lights - 3D portal infrastructure
  dom/             AppLayout - persistent scene wrapper
  ui/              shadcn/ui components
lib/               Simulation engine + policy adapters + scene-portal
state/             Zustand stores
ui/                Dashboard, simulation canvas, control surfaces
workers/           Simulation worker and helpers
public/
  models/          Drop ONNX policies here (policy.onnx by default)
  pyodide/         Optional Python runtime assets
  workers/         Worker bundles served statically
docs/              Architecture guides and documentation
```

- **Grid world renderer** — lightweight instanced meshes, adaptive sparkles, and soft neon lights render dozens of agents without dropping frames.
- **ONNX hot-swap** — load a pre-trained actor from `public/models/` or your disk; inference happens in the main canvas instantly.
- **Quality toggles** — medium mode disables shadows and trims VFX for battery-friendly demos; high mode keeps the full neon bloom.
- **Heuristic fallback** — if no policy is loaded, the worker supplies a greedy baseline so the playground always feels alive.
- **Controls refresh** — streamlined panel exposes difficulty, agent counts, playback speed, and policy management in one place.

## Thematic environments

Four neon playgrounds ship as standalone factories under `src/env/` and surface through the in-app selector:

- **Swarm Drones** — lidar-guided micro UAVs chase unexplored neon maze cells while balancing battery, coverage, and collisions.
- **Reef Guardians** — reef-keeping drones herd bioluminescent shoals away from predators and clear algae bursts to stabilise the biome.
- **Warehouse Bots** — Kiva-inspired floor units fetch orders, queue for chargers, and avoid routing jams across an instanced grid.
- **Snowplow Fleet** — municipal plows coordinate salt spreads, fuel burn, and accident hotspots as vehicles weave through the blizzard.

Each environment includes dedicated 3D agents (`src/ui/agents/`) and game engines (`src/algo/engines/`) for simulation.

## 3D Rendering System

PlaygroundRL uses a **portal-based rendering architecture** inspired by PPO Bunny:

- **Single Persistent Canvas**: One `<Canvas>` at the root level (managed by `Scene.tsx`) renders all 3D content.
- **tunnel-rat Portals**: Components use `<View>` to inject 3D content into the persistent Canvas from anywhere in the app.
- **Dual Rendering Modes**:
  - **Portal-based**: Hero/landing pages use `<View>` components for seamless 3D/DOM integration.
  - **Direct Canvas**: Dashboards/simulations use direct `<Canvas>` for independent 3D scenes with state management.

### Quick Start - Adding 3D Content

**Using the Portal System (for hero/landing pages):**

```tsx
import { View } from '@/components/canvas/View'
import { BunnyAgent } from '@/ui/agents/BunnyAgent'

export function MyHeroComponent() {
  return (
    <div className="relative h-screen">
      {/* DOM content */}
      <h1 className="relative z-10">Hello World</h1>
      
      {/* 3D content portaled to persistent Canvas */}
      <View className="absolute inset-0">
        <BunnyAgent position={[0, 0, 0]} />
        <ambientLight intensity={0.5} />
      </View>
    </div>
  )
}
```

**Using Direct Canvas (for dashboards/simulations):**

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export function MyDashboard() {
  return (
    <Canvas shadows camera={{ position: [5, 5, 5] }}>
      <YourSimulation />
      <OrbitControls />
    </Canvas>
  )
}
```

### Documentation

- [3D Architecture Guide](docs/3D_ARCHITECTURE.md) - When to use portal vs direct Canvas
- [Scene Configuration](docs/SCENE_CONFIGURATION.md) - Shadows, lighting, environment setup
- [Camera & Controls](docs/CAMERA_CONTROLS.md) - Camera types and control schemes
- [Performance Optimization](docs/PERFORMANCE.md) - FPS targets, memory management, mobile optimization
- [Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md) - Complete implementation details

## Recent additions

- **Portal-based 3D rendering**: Persistent Canvas with tunnel-rat portals enables seamless 3D/DOM integration across the app (PPO Bunny pattern).
- **Enhanced 3D agents**: BunnyAgent and other agents now feature animations, shadows, and GLTF-ready structure with model preloading system.
- **Reusable lighting**: EnvironmentLights component provides preset configurations (bunny, default, dramatic, soft) for consistent scene quality.
- **Comprehensive documentation**: 1,500+ lines covering architecture, scene configuration, cameras, performance optimization, and implementation details.
- Inference-only loop: policy evaluation now runs in a dedicated worker with deterministic step timing and batched observations.
- Training dashboard refresh: the legacy panels now wrap the ONNX simulation pipeline and auto-attempt to load `policy.onnx` for instant playback.
- ONNX adapter: type-safe helper normalises tensors, resolves argmax actions, and supports remote URLs or ArrayBuffer uploads.
- Adaptive visuals: render quality slider toggles shadows/VFX so the playground shines on high-end rigs and thin laptops alike.
- Landing intro + Playwright guards: hero copy, controls, and telemetry headings are pinned by automated browser coverage to prevent regressions.

## Development notes

- **3D Rendering**: Use `<View>` from `src/components/canvas/View` for portal-based rendering in hero/landing pages. Use direct `<Canvas>` for dashboards/simulations with independent state.
- **Scene Management**: The persistent Canvas (`Scene.tsx`) is managed by `AppLayout.tsx` at the root. It's positioned fixed behind all content with `pointer-events: none`.
- **Model Loading**: GLTF models go in `public/models/`. Use the models manifest (`src/lib/models.ts`) for preloading configuration.
- Workers are instantiated with `new Worker(new URL("../workers/simulation.worker.ts", import.meta.url), { type: "module" })`.
- ONNX Runtime Web runs inference on WebGL; WebGPU automatically enables when available.
- CSP/COOP/COEP headers live in `next.config.ts` and `vercel.json` so `SharedArrayBuffer` and Wasm work without extra configuration.

PlaygroundRL is built for experimentation—swap policies, tweak the grid world, or bring back the TensorFlow training stack if you prefer.
