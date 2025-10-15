# 3D RL Playground - Implementation Complete ✅

This is a complete implementation of a 3D reinforcement learning playground built with React Three Fiber and Stable Baselines 3.

## What's Implemented

### Frontend (Next.js + React Three Fiber)
- **3D Environment**: 25×25 grid with static and moving obstacles
- **Multi-Agent Support**: Add unlimited agents that learn via PPO
- **Real-time Visualization**: Animated agents, obstacles, and goals
- **Interactive Controls**: Level selection, play/pause, speed adjustment
- **ONNX Inference**: Browser-based policy execution

### Backend (Python Training)
- **Gymnasium Environment**: Perfect mirroring of frontend grid world
- **PPO Training**: Stable-Baselines3 with configurable hyperparameters
- **ONNX Export**: Convert PyTorch policies to browser-compatible format
- **Multi-level Support**: Separate policies for Level 1 and Level 2

## File Structure

```
src/app/game/
├── types.ts                # Type definitions (Agent, Observation, etc.)
├── store/
│   ├── agents.ts          # Zustand store for agent state
│   └── world.ts           # Zustand store + level configurations
├── runModel.ts            # ONNX inference wrapper
├── engine.ts              # Game stepping logic
├── LevelOne.tsx           # Static obstacle level renderer
├── LevelTwo.tsx           # Animated obstacle level renderer
├── Player.tsx             # Agent (bunny) 3D component
├── Hud.tsx                # Game controls UI
├── page.tsx               # Main game page
├── ARCHITECTURE.ts        # Design documentation
├── examples.ts            # Usage code samples
└── CHECKLIST.ts           # Implementation checklist

train/
├── gridworld_env.py       # Gymnasium environment
├── ppo.py                 # Training script
├── torch2onnx.py          # ONNX export script
├── requirements.txt       # Python dependencies
└── README.md              # Training guide
```

## Quick Start

### 1. Start Frontend (Immediate)

```powershell
npm install
npm run dev
# Navigate to http://localhost:3000/game
```

You'll see the game world with controls. Without trained models, agents will move randomly.

### 2. Train Models (30-60 minutes)

```powershell
cd train
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python ppo.py
```

This trains two PPO policies:
- `ppo_model_level1` - for static obstacles
- `ppo_model_level2` - for moving obstacles

### 3. Export to ONNX

```powershell
python torch2onnx.py --batch
```

This creates:
- `policy_level1.onnx` → `../public/models/`
- `policy_level2.onnx` → `../public/models/`

### 4. Add Agents to Game

Option A: Via `examples.ts` in your component:
```typescript
import { initializeSingleAgentGame } from '@/app/game/examples';

// In your component
const stats = await initializeSingleAgentGame('models/policy_level1.onnx');
```

Option B: Direct store access:
```typescript
import { useAgentsStore } from '@/app/game/store/agents';

const store = useAgentsStore.getState();
store.addAgent('agent_1', 1, 1);  // id, x, y
store.addAgent('agent_2', 3, 3);
```

Then add Player components in `page.tsx`:
```tsx
<Player agentId="agent_1" />
<Player agentId="agent_2" />
```

### 5. Run the Game

```powershell
npm run dev
# Visit http://localhost:3000/game
```

Use the HUD controls to:
- Switch levels
- Play/pause simulation
- Adjust tick speed (20-180ms)
- Watch agents learn!

## Data Contracts (Critical)

These must match EXACTLY between training and inference:

### Observation Vector
```
[agent_x, agent_y, goal_x, goal_y, distance_to_goal]
dtype: float32
shape: (5,)
```

### Actions
```
0 = UP (y - 1)
1 = DOWN (y + 1)
2 = LEFT (x - 1)
3 = RIGHT (x + 1)
```

### Rewards
```
+1.0  = reached goal
-1.0  = hit obstacle
-0.01 = each step (cost)
```

### Grid Configuration
```
Size: 25 × 25
Tile size: 1 unit
Origin: (0, 0) = bottom-left
Goal: (23, 23) = top-right
```

## Architecture Overview

### Game Loop Flow
```
1. stepGame() called every tickDuration ms
2. Get all non-terminal agents
3. Build observation vectors
4. Run batch inference → get actions
5. Apply actions with collision detection
6. Compute rewards
7. Update agent store
8. React re-renders (Zustand)
9. useFrame updates positions (spring animation)
```

### ONNX Inference
```
Observation → Float32Array (5 elements)
           ↓
     ONNX Model (1 hidden layer)
           ↓
     Logits (4 values) → argmax → Action ∈ {0,1,2,3}
```

### World Collision System
```
applyAction(agent, action)
  ↓
computeNewPosition(x, y, action)
  ↓
isBlocked(newX, newY)
  - Check static obstacles
  - Check moving obstacles
  - Check grid boundaries
  ↓
If blocked: stay at (x, y)
If free: move to (newX, newY)
```

## Performance Optimizations

- **InstancedMesh**: 600+ floor tiles rendered in 1 draw call
- **Batch Inference**: Multiple agents inferred simultaneously
- **Zustand Selectors**: Only re-render changed agents
- **Spring Animation**: 150ms smooth movement at any tick rate
- **Matrix4 Transforms**: GPU-based obstacle animation

## Troubleshooting

### Issue: Agents not moving
**Solution**: Add agents first
```typescript
useAgentsStore.getState().addAgent('agent_1', 1, 1);
```

### Issue: Random actions instead of intelligent
**Solution**: Train and export models, or check console for ONNX load errors

### Issue: Models not found
**Console output**: Will fallback to random actions gracefully

### Issue: Python venv not activating
```powershell
# On Windows PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
venv\Scripts\activate
```

## Customization Examples

### Change grid size
Edit `src/app/game/store/world.ts`:
```typescript
export const GRID_SIZE = 30;  // was 25
```

### Add custom obstacles
Edit `src/app/game/store/world.ts` → `LEVEL_ONE` or `LEVEL_TWO` config

### Adjust reward function
Edit `src/app/game/engine.ts` → `computeReward()`

### Change agent appearance
Edit `src/app/game/Player.tsx` → fallback mesh or load different model

### Modify training hyperparameters
Edit `train/ppo.py`:
```python
model = PPO(
    "MlpPolicy",
    vec_env,
    learning_rate=1e-3,      # was 3e-4
    n_steps=4096,             # was 2048
    batch_size=128,           # was 64
    n_epochs=20,              # was 10
)
```

## Development Resources

- **Type Definitions**: `src/app/game/types.ts`
- **Architecture Doc**: `src/app/game/ARCHITECTURE.ts`
- **Code Examples**: `src/app/game/examples.ts`
- **Training Guide**: `train/README.md`
- **This Checklist**: `src/app/game/CHECKLIST.ts`

## Next Steps

1. ✅ Frontend is running
2. Train models (takes 30-60 min)
3. Export to ONNX
4. Add agents to game
5. Observe agents learning
6. (Optional) Customize levels, rewards, models

## Tech Stack

**Frontend:**
- Next.js 15.5 + React 19
- React Three Fiber 9.4 + Three.js 0.180
- React Spring 10.0 (animation)
- Zustand 5.0 (state management)
- ONNX Runtime Web 1.23
- Tailwind CSS 4 + shadcn/ui

**Backend:**
- Python 3.9+
- Gymnasium 0.27+
- Stable-Baselines3 2.0+
- PyTorch 2.0+
- ONNX + onnxruntime

## Questions?

Refer to:
- `src/app/game/ARCHITECTURE.ts` - System design
- `src/app/game/examples.ts` - Integration patterns
- `train/README.md` - Training details
- This file - Quick reference

---

**Status**: ✅ Complete and ready to run
**Last Updated**: 2025
**Lines of Code**: ~2,300 (frontend + backend)
