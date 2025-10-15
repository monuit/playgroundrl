# PlaygroundRL Documentation

## Overview

PlaygroundRL is a browser-native reinforcement learning playground focused on **inference-first** workflows. Load a pre-trained ONNX policy, stream decisions directly in your tab, and explore a living neon grid without ever touching a backend service or GPU cluster.

## Quick Start

1. **Launch the playground** and allow the auto-loader to check for `public/models/policy.onnx`.
2. **Upload an ONNX actor** from the control panel if you want to swap policies at runtime.
3. **Adjust the arena** using the difficulty, agent count, and speed controls.
4. **Orbit the simulation**—the canvas supports drag, scroll, and auto-rotation for quick inspection.

## Core Features

### ONNX Runtime Web

- Runs entirely client-side via WebGL/WebGPU and WebAssembly.
- Supports hot reloading when a new model is uploaded.
- Falls back to a heuristic controller to keep the arena alive when no model is present.

### Simulation Canvas

- React Three Fiber renders instanced agents, volumetric lighting, and contact shadows.
- Orbit controls let you rotate and zoom around the arena while telemetry updates in real time.
- Quality toggle balances cinematic bloom with battery-friendly presets.

### Telemetry Overlay

- Live counters for ticks, episodes, reward totals, and steps per second.
- Status badge reflects loading, ready, running, paused, or error states.
- Control and metrics panels stay docked to the sides so the canvas remains unobstructed.

## Architecture

```text
src/
    ui/                Dashboard, canvas, telemetry, and control panels
    state/             Zustand stores streaming worker + policy status
    workers/           Simulation + ONNX runners keeping the UI thread light
    lib/               Grid world engine, reward shaping, and helpers
public/
    models/            Drop `policy.onnx` files here for instant loading
    docs/              Markdown documentation (this file)
```

## Tips

- Use the **Reset arena** action to restart the grid while keeping the currently loaded policy.
- Toggle **Render quality** to scale visuals between high-fidelity and lightweight modes.
- Keep ONNX policies under a few megabytes for fastest cold loads.

## Browser Support

- Chromium browsers with WebGL 2/WebGPU (recommended)
- Firefox (WebGL 2)
- Safari 16+

---

For issues or contributions, visit [GitHub](https://github.com/boredbedouin/PlaygroundRL)
