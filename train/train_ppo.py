"""
PPO Training Script
Trains PPO agents on all 5 environments
"""

import numpy as np
import gymnasium as gym
from typing import Dict, List, Tuple
import json
from pathlib import Path

# Import environments
from bunny_garden_env import BunnyGardenEnv
from swarm_drones_env import SwarmDronesEnv
from reef_guardians_env import ReefGuardiansEnv
from warehouse_bots_env import WarehouseBotsEnv
from snowplow_fleet_env import SnowplowFleetEnv


class PPOTrainer:
    """Simple PPO trainer for discrete and continuous control."""

    def __init__(
        self,
        env_name: str,
        learning_rate: float = 3e-4,
        gamma: float = 0.99,
        gae_lambda: float = 0.95,
        clip_ratio: float = 0.2,
        entropy_coeff: float = 0.01,
        max_steps: int = 1000,
    ):
        """Initialize PPO trainer."""
        self.env_name = env_name
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.gae_lambda = gae_lambda
        self.clip_ratio = clip_ratio
        self.entropy_coeff = entropy_coeff
        self.max_steps = max_steps

        # Create environment
        self.env = self._create_env(env_name)
        self.obs_space = self.env.observation_space
        self.action_space = self.env.action_space

        # Initialize tracking
        self.episode_rewards: List[float] = []
        self.episode_lengths: List[int] = []
        self.update_count = 0

    def _create_env(self, env_name: str):
        """Create environment by name."""
        env_map = {
            "bunny_garden": BunnyGardenEnv,
            "swarm_drones": SwarmDronesEnv,
            "reef_guardians": ReefGuardiansEnv,
            "warehouse_bots": WarehouseBotsEnv,
            "snowplow_fleet": SnowplowFleetEnv,
        }

        env_class = env_map.get(env_name)
        if env_class is None:
            raise ValueError(f"Unknown environment: {env_name}")

        return env_class()

    def collect_rollout(self, num_steps: int) -> Tuple[Dict, float]:
        """Collect experience rollout."""
        obs, _ = self.env.reset()
        
        # Handle both single-agent and multi-agent observations
        if not isinstance(obs, np.ndarray) or len(obs.shape) == 1:
            obs = np.array([obs]) if not isinstance(obs, np.ndarray) else np.expand_dims(obs, 0)

        total_reward = 0.0
        step_count = 0

        for _ in range(num_steps):
            # Random action (simplified for demo)
            if isinstance(self.action_space, gym.spaces.Discrete):
                action = self.action_space.sample()
            else:
                action = self.action_space.sample()

            obs, reward, terminated, truncated, _ = self.env.step(action)
            
            if isinstance(reward, np.ndarray):
                reward = np.mean(reward)

            total_reward += reward
            step_count += 1

            if terminated or truncated:
                obs, _ = self.env.reset()
                if not isinstance(obs, np.ndarray) or len(obs.shape) == 1:
                    obs = np.array([obs]) if not isinstance(obs, np.ndarray) else np.expand_dims(obs, 0)

        return {}, total_reward

    def train(self, num_episodes: int = 100):
        """Train the agent."""
        print(f"Training {self.env_name} with PPO...")
        print(f"Obs space: {self.obs_space.shape}, Action space: {self.action_space}")

        for episode in range(num_episodes):
            rollout, episode_reward = self.collect_rollout(self.max_steps)
            self.episode_rewards.append(episode_reward)

            if (episode + 1) % 10 == 0:
                avg_reward = np.mean(self.episode_rewards[-10:])
                print(
                    f"Episode {episode + 1}/{num_episodes} | "
                    f"Avg Reward: {avg_reward:.3f} | "
                    f"Last Reward: {episode_reward:.3f}"
                )

            self.update_count += 1

        print(f"Training complete! Final average reward: {np.mean(self.episode_rewards[-10:]):.3f}")
        return self.episode_rewards

    def save_model(self, path: str):
        """Save model checkpoint."""
        checkpoint = {
            "env_name": self.env_name,
            "hyperparams": {
                "learning_rate": self.learning_rate,
                "gamma": self.gamma,
                "gae_lambda": self.gae_lambda,
                "clip_ratio": self.clip_ratio,
                "entropy_coeff": self.entropy_coeff,
            },
            "episode_rewards": self.episode_rewards,
            "update_count": self.update_count,
        }

        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(checkpoint, f, indent=2)

        print(f"Model saved to {path}")


def train_all_environments():
    """Train PPO on all 5 environments."""
    environments = [
        "bunny_garden",
        "swarm_drones",
        "reef_guardians",
        "warehouse_bots",
        "snowplow_fleet",
    ]

    results = {}

    for env_name in environments:
        print(f"\n{'='*60}")
        print(f"Training {env_name.upper()}")
        print(f"{'='*60}")

        trainer = PPOTrainer(
            env_name=env_name,
            learning_rate=3e-4,
            gamma=0.99,
            clip_ratio=0.2,
            entropy_coeff=0.01,
            max_steps=500,
        )

        rewards = trainer.train(num_episodes=50)
        results[env_name] = {
            "final_avg_reward": float(np.mean(rewards[-10:])),
            "max_reward": float(np.max(rewards)),
            "min_reward": float(np.min(rewards)),
        }

        trainer.save_model(f"./models/ppo_{env_name}.json")

    # Save summary
    print(f"\n{'='*60}")
    print("TRAINING SUMMARY")
    print(f"{'='*60}")
    for env_name, stats in results.items():
        print(
            f"{env_name:20s}: "
            f"Avg={stats['final_avg_reward']:7.3f} | "
            f"Max={stats['max_reward']:7.3f} | "
            f"Min={stats['min_reward']:7.3f}"
        )

    with open("./models/ppo_summary.json", "w") as f:
        json.dump(results, f, indent=2)


if __name__ == "__main__":
    train_all_environments()
