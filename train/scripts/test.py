"""
PPO Testing Script - Extracted from test.ipynb
Tests a trained agent on the LevelTwo environment
"""

import sys
from pathlib import Path

import gymnasium as gym
import numpy as np
import random
import torch

# Add parent directory to path to import custom environments
sys.path.insert(0, str(Path(__file__).parent.parent))

from LevelTwoEnv import LevelTwoEnv
from Agent import Agent


def main():
    """Main testing loop."""
    # MARK: Seeding
    seed = 1
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)

    print(f"Setting random seed to {seed}")

    # MARK: Environment Setup
    env = gym.make('LevelTwo')
    print(f"Created environment: {env}")

    # MARK: Environment Reset
    obs, info = env.reset(seed=seed)
    print(f"Environment reset with seed {seed}")
    print(f"Initial observation shape: {obs.shape}")
    print(f"Initial observation: {obs}")

    # MARK: Environment Properties
    print(f"\nEnvironment properties:")
    if hasattr(env, 'hologram_tiles'):
        print(f"Hologram tiles: {env.hologram_tiles}")

    # MARK: Test Step
    print(f"\nTesting environment step...")
    action = 3
    obs, reward, terminated, truncated, info = env.step(action)

    print(f"After step with action {action}:")
    print(f"  obs: {obs}")
    print(f"  reward: {reward}")
    print(f"  done: {terminated or truncated}")
    print(f"  info: {info}")

    # MARK: Test Episode
    print(f"\nRunning a full episode...")
    obs, info = env.reset(seed=seed)
    total_reward = 0
    episode_length = 0
    done = False

    while not done and episode_length < 200:
        # Random action
        action = env.action_space.sample()
        obs, reward, terminated, truncated, info = env.step(action)
        done = terminated or truncated
        total_reward += reward
        episode_length += 1

    print(f"Episode completed:")
    print(f"  Total reward: {total_reward}")
    print(f"  Episode length: {episode_length}")
    print(f"  Info: {info}")

    env.close()
    print("\nTesting complete!")


if __name__ == "__main__":
    main()
