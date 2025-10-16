# PlaygroundRL �️

PlaygroundRL is a real-time reinforcement learning playground that runs entirely in the browser. Watch autonomous agents explore stylized grid worlds, adapt to obstacles, and chase rewards using Proximal Policy Optimization (PPO).

![PlaygroundRL screenshot](https://github.com/user-attachments/assets/4fd82867-86c9-4823-aa8e-00b3dc952874)


## Overview

PlaygroundRL turns PPO training into an interactive visual experience. Multiple agents learn concurrently inside richly lit Three.js environments, helping you understand how policy gradients behave under different levels of difficulty.

## Features

- **Real-time AI Training**: Watch PPO agents improve directly in the browser
- **Multiple Difficulty Levels**: Two distinct environments with increasing complexity
- **Smooth 3D Visualization**: Powered by React Three Fiber for performant 3D graphics
- **Multi-Agent System**: Ten agents learn simultaneously for richer dynamics
- **Dynamic Environments**: Level 2 introduces moving obstacles for an added challenge

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **3D Graphics**: React Three Fiber, Three.js
- **AI/ML**: ONNX Runtime Web for in-browser inference
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: Zustand
- **Animation**: React Spring

## Getting Started

### Prerequisites

- Node.js 14+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/playgroundrl.git

# Navigate to project directory
cd playgroundrl

# Install dependencies
npm install
# or
yarn install

# Run the development server
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build for Production

```bash
npm run build
npm start
```

## How It Works

### The Environment

- **Grid World**: 25x25 tile-based environment
- **Agents**: Bunny agents start from random positions
- **Goal**: Find the pink reward tile while avoiding hologram tiles
- **Obstacles**: 
  - Level 1: Static hologram tiles (instant failure)
  - Level 2: Moving hologram tiles + vision-based navigation

### The AI

The bunnies use PPO (Proximal Policy Optimization) to learn optimal policies:

- **State Space**: Agent position, target position, distance to goal (+ vision in Level 2)
- **Action Space**: 4 discrete actions (up, down, left, right)
- **Reward Structure**: Positive reward for reaching the goal, negative for hitting obstacles

### Model Details

- **Architecture**: Actor-Critic neural network
- **Training**: Python implementation with stable-baselines3
- **Deployment**: ONNX models running in-browser via ONNX Runtime Web
- **Hyperparameters**: See in-app "Model Details" for complete configuration

## Project Structure

```
├── app/
│   ├── (game)/
│   │   ├── page.tsx          # Main game page
│   │   ├── LevelOne.tsx      # Level 1 implementation
│   │   ├── LevelTwo.tsx      # Level 2 implementation
│   │   ├── Player.tsx        # Player bunny component
│   │   ├── runModel.ts       # ONNX inference logic
│   │   └── store/           # Zustand stores
│   └── components/          # UI components
├── public/
│   └── models/             # 3D models and ONNX files
└── train/                  # Python training scripts
```

## Training Your Own Model

The `train/` directory contains Python scripts for training new PPO models:

```bash
cd train
python ppo.py  # Train the model
python torch2onnx.py  # Convert to ONNX format
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Links

- [Live Demo](https://playgroundrl.vercel.app)
- [Video Explanation](https://www.youtube.com/watch?v=TjHH_--7l8g&t=2019s)
- [PPO Paper](https://fse.studenttheses.ub.rug.nl/25709/1/mAI_2021_BickD.pdf)
