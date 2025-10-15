# Training Guide

## Setup

Create a Python environment and install dependencies:

```bash
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## Training PPO Models

### 1. Level 1 (Static Obstacles)

```bash
python ppo.py
```

This trains both Level 1 and Level 2 models. Models are saved to `../public/models/`.

### 2. Export to ONNX

After training, convert the models to ONNX for browser inference:

```bash
# Convert all models in checkpoints/
python torch2onnx.py --batch

# Or convert a single model
python torch2onnx.py --model checkpoints/ppo_level1_100000_steps.zip --output ../public/models/policy_level1.onnx
```

## Environment Details

### GridWorld Environment

- **Grid Size**: 25×25
- **Observation**: `[agent_x, agent_y, goal_x, goal_y, distance_to_goal]`
- **Action Space**: Discrete 4 (UP=0, DOWN=1, LEFT=2, RIGHT=3)
- **Reward**: 
  - +1.0 for reaching goal
  - -1.0 for hitting obstacle
  - -0.01 per step (encourage efficiency)

### Level 1: Static Obstacles

- Border walls
- Interior maze-like walls
- Fixed goal at (23, 23)
- Training: 100k timesteps

### Level 2: Moving Obstacles

- Border walls
- 3 animated obstacles with sinusoidal motion
- Same goal position
- Training: 150k timesteps

## Hyperparameters

```python
PPO(
    learning_rate=3e-4,
    n_steps=2048,
    batch_size=64,
    n_epochs=10,
    gamma=0.99,
    gae_lambda=0.95,
    clip_range=0.2,
)
```

## Models Output

Models are saved as:
- `policy_level1.onnx` - Level 1 trained policy
- `policy_level2.onnx` - Level 2 trained policy
- `policy_level1.zip` - SB3 format (for continued training)
- `policy_level2.zip` - SB3 format

## Browser Inference

The exported ONNX models are loaded in the browser via:
- `src/app/game/runModel.ts` - ONNX Runtime Web wrapper

See the frontend README for details on deployment.

## Tips & Troubleshooting

- **Slow training?** Use GPU: `pip install torch-cuda` and set `device="cuda"` in PPO init
- **Memory issues?** Reduce `n_steps` or `batch_size`
- **Low performance?** Try longer training or tune hyperparameters
- **ONNX export fails?** Ensure torch, onnx, and onnxruntime versions are compatible

## Next Steps

1. Train models: `python ppo.py`
2. Export to ONNX: `python torch2onnx.py --batch`
3. Copy `.onnx` files to `public/models/`
4. Run frontend: `npm run dev` from project root
5. Navigate to `/game` to see agents in action!
