"""
PPO Training Script
Trains an agent using Stable-Baselines3 PPO on the GridWorld environment
"""
import os
import numpy as np
from pathlib import Path
from stable_baselines3 import PPO
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.callbacks import CheckpointCallback
from gridworld_env import GridWorldEnv


def train_ppo(
    level: str = "level1",
    total_timesteps: int = 100000,
    learning_rate: float = 3e-4,
    n_steps: int = 2048,
    batch_size: int = 64,
    n_epochs: int = 10,
    checkpoint_dir: str = "checkpoints",
):
    """Train PPO on GridWorld"""
    
    # Create output directory
    Path(checkpoint_dir).mkdir(exist_ok=True)
    models_dir = Path("../public/models")
    models_dir.mkdir(exist_ok=True)
    
    # Create environment
    env = make_vec_env(
        lambda: GridWorldEnv(level=level),
        n_envs=4,
    )
    
    # Create PPO model
    model = PPO(
        "MlpPolicy",
        env,
        learning_rate=learning_rate,
        n_steps=n_steps,
        batch_size=batch_size,
        n_epochs=n_epochs,
        gamma=0.99,
        gae_lambda=0.95,
        clip_range=0.2,
        ent_coef=0.0,
        verbose=1,
    )
    
    # Checkpoint callback
    checkpoint_callback = CheckpointCallback(
        save_freq=5000,
        save_path=checkpoint_dir,
        name_prefix=f"ppo_{level}",
    )
    
    # Train
    print(f"Training PPO on {level} for {total_timesteps} timesteps...")
    model.learn(
        total_timesteps=total_timesteps,
        callback=checkpoint_callback,
        log_interval=10,
    )
    
    # Save final model
    model_path = models_dir / f"policy_{level}.zip"
    model.save(str(model_path))
    print(f"Model saved to {model_path}")
    
    return model


if __name__ == "__main__":
    # Train Level 1
    print("=" * 60)
    print("Training Level 1 (Static Obstacles)")
    print("=" * 60)
    model_l1 = train_ppo(level="level1", total_timesteps=100000)
    
    # Train Level 2
    print("\n" + "=" * 60)
    print("Training Level 2 (Moving Obstacles)")
    print("=" * 60)
    model_l2 = train_ppo(level="level2", total_timesteps=150000)
    
    print("\nTraining complete!")
