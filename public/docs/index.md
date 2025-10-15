# GymRL Documentation

## Overview

GymRL is a browser-based reinforcement learning playground that lets you train agents using PPO and DQN algorithms—no GPU required. Powered by TensorFlow.js, everything runs client-side.

## Quick Start

1. **Select an environment** from the control panel (Lumen Valley, Aurora Labyrinth, Pong, etc.)
2. **Choose an algorithm** (PPO or DQN)
3. **Hit "Start run"** to begin training
4. **Watch live metrics** and the 3D environment as your agent learns

## Features

### Environments

- **Lumen Valley**: Navigate a bunny through glowing carrots while managing energy
- **Aurora Labyrinth**: Solve maze puzzles with optimal pathfinding
- **Pong**: Classic arcade game with discrete actions
- **Tiny Grid**: Minimal gridworld for quick experiments

### Algorithms

- **PPO (Proximal Policy Optimization)**: Actor-critic with clipped objectives
- **DQN (Deep Q-Network)**: Value-based learning with experience replay

### Checkpoints

Save, load, rename, and export model snapshots at any time. Pin important checkpoints for quick access.

### Persistence

All training data is stored in IndexedDB. Export sessions as `.zip` or `.json` for backup or sharing.

## Architecture

```text
web/
├── src/
│   ├── algo/         # PPO & DQN implementations
│   ├── env/          # Environment definitions
│   ├── state/        # Zustand store + persistence
│   ├── workers/      # Training worker (TensorFlow.js)
│   └── ui/           # Dashboard components
├── public/
│   └── docs/         # This documentation
└── package.json
```

## Tips

- Use the **speed multiplier** to accelerate training (1x to 5x)
- Set a **seed** for reproducible experiments
- Monitor **entropy** to track exploration vs exploitation
- Export checkpoints before resetting sessions

## Browser Support

- Chrome/Edge (WebGL 2.0 or WebGPU)
- Firefox (WebGL 2.0)
- Safari (WebGL 2.0)

---

For issues or contributions, visit [GitHub](https://github.com/boredbedouin)
