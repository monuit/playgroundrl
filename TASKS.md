# PlaygroundRL Task List

- [ ] Initialize Next.js App Router project with TypeScript, configure PWA, COOP/COEP, CSP headers.
- [ ] Configure TensorFlow.js (WebGL/WebGPU) and optional ONNX/Pyodide assets, set up worker build tooling.
- [ ] Implement environment modules (`/env/pong.tsx`, `/env/maze.tsx`) with R3F scenes and `Env` interface compliance.
- [ ] Implement RL algorithm modules (`/algo/dqn_tfjs.ts`, `/algo/ppo_tfjs.ts`, buffers, schedules).
- [ ] Build worker infrastructure (`trainer.worker.ts`, `pyodide.worker.ts`) with communication layer and reward sandboxing hooks.
- [ ] Implement state persistence layer (IndexedDB helpers, export/import bundles).
- [ ] Create UI: training dashboard, charts, controls, environment renderers, reward editor.
- [ ] Add reproducibility metadata, settings management, and turbo/no-render training mode.
- [ ] Implement PWA service worker, caching strategy, Pyodide lazy loading UX.
- [ ] Document architecture, development workflow, and deployment steps.
