# Training Scripts

This directory contains standalone Python scripts for training and testing the PPO agent.

## Scripts

### `learn.py`
Main training script implementing the Proximal Policy Optimization (PPO) algorithm.

**Usage:**
```bash
cd .. && python scripts/learn.py
```

**Configuration:**
All hyperparameters are defined at the top of the script:
- `env_id`: Environment to train on (default: "LevelTwo")
- `total_timesteps`: Total training timesteps (default: 1,000,000)
- `learning_rate`: Learning rate (default: 1e-4)
- `num_envs`: Number of parallel environments (default: 16)
- `num_steps`: Steps per rollout (default: 128)
- And more PPO-specific hyperparameters

**Features:**
- Actor-Critic architecture with policy and value networks
- Generalized Advantage Estimation (GAE)
- Policy gradient with clipped surrogate loss
- Learning rate annealing
- Advantage normalization

### `test.py`
Testing script for the environment and basic agent interaction.

**Usage:**
```bash
cd .. && python scripts/test.py
```

**What it does:**
- Initializes the LevelTwo environment
- Runs a single environment step
- Executes a full random episode
- Prints environment properties and statistics

## Requirements

- `gymnasium`
- `numpy`
- `torch`
- `tqdm`

Install with:
```bash
pip install -r requirements.txt
```

## Related Files

- `ppo.py` - Alternative PPO implementation (main training entry point)
- `torch2onnx.py` - Converts trained models to ONNX format
- `LevelOneEnv.py` - Level 1 environment
- `LevelTwoEnv.py` - Level 2 environment
- `Agent.py` - Agent implementation
