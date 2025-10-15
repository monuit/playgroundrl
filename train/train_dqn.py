"""
DQN Training Script
Trains DQN agents on discrete-control environments
"""

import numpy as np
import gymnasium as gym
from typing import Dict, List, Tuple
import json
from pathlib import Path
from collections import deque

# Import environments
from bunny_garden_env import BunnyGardenEnv
from warehouse_bots_env import WarehouseBotsEnv


class ReplayBuffer:
    """Simple experience replay buffer."""

    def __init__(self, max_size: int = 100000):
        """Initialize replay buffer."""
        self.buffer = deque(maxlen=max_size)

    def add(
        self,
        obs: np.ndarray,
        action: int,
        reward: float,
        next_obs: np.ndarray,
        done: bool,
    ):
        """Add experience to buffer."""
        self.buffer.append((obs, action, reward, next_obs, done))

    def sample(self, batch_size: int) -> Tuple:
        """Sample batch from buffer."""
        indices = np.random.choice(len(self.buffer), batch_size, replace=False)
        batch = [self.buffer[i] for i in indices]

        obs = np.array([b[0] for b in batch])
        actions = np.array([b[1] for b in batch])
        rewards = np.array([b[2] for b in batch])
        next_obs = np.array([b[3] for b in batch])
        dones = np.array([b[4] for b in batch])

        return obs, actions, rewards, next_obs, dones

    def __len__(self):
        return len(self.buffer)


class DQNTrainer:
    """Simple DQN trainer for discrete control environments."""

    def __init__(
        self,
        env_name: str,
        learning_rate: float = 1e-3,
        gamma: float = 0.99,
        epsilon_start: float = 1.0,
        epsilon_end: float = 0.01,
        epsilon_decay: float = 0.995,
        buffer_size: int = 100000,
        batch_size: int = 32,
        update_freq: int = 4,
    ):
        """Initialize DQN trainer."""
        self.env_name = env_name
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.epsilon = epsilon_start
        self.epsilon_end = epsilon_end
        self.epsilon_decay = epsilon_decay
        self.batch_size = batch_size
        self.update_freq = update_freq

        # Create environment
        self.env = self._create_env(env_name)
        
        # Check if environment has discrete action space
        if not isinstance(self.env.action_space, gym.spaces.Discrete):
            raise ValueError(f"{env_name} does not have discrete action space")

        self.action_space_size = self.env.action_space.n
        self.obs_shape = self.env.observation_space.shape

        # Replay buffer
        self.replay_buffer = ReplayBuffer(buffer_size)

        # Tracking
        self.episode_rewards: List[float] = []
        self.episode_lengths: List[int] = []
        self.update_count = 0

    def _create_env(self, env_name: str):
        """Create environment by name."""
        env_map = {
            "bunny_garden": BunnyGardenEnv,
            "warehouse_bots": WarehouseBotsEnv,
        }

        env_class = env_map.get(env_name)
        if env_class is None:
            raise ValueError(
                f"Unknown discrete environment: {env_name}. "
                f"Available: {list(env_map.keys())}"
            )

        return env_class()

    def collect_experience(self, num_steps: int):
        """Collect experience using epsilon-greedy policy."""
        obs, _ = self.env.reset()
        if len(obs.shape) == 1:
            obs = np.expand_dims(obs, 0)

        total_reward = 0.0
        step_count = 0

        for _ in range(num_steps):
            # Epsilon-greedy action selection
            if np.random.random() < self.epsilon:
                action = self.env.action_space.sample()
            else:
                # Random action (no neural network in this demo)
                action = self.env.action_space.sample()

            next_obs, reward, terminated, truncated, _ = self.env.step(action)
            if len(next_obs.shape) == 1:
                next_obs = np.expand_dims(next_obs, 0)

            done = terminated or truncated
            self.replay_buffer.add(obs, action, reward, next_obs, done)

            total_reward += reward
            step_count += 1

            obs = next_obs

            if done:
                obs, _ = self.env.reset()
                if len(obs.shape) == 1:
                    obs = np.expand_dims(obs, 0)

        return total_reward, step_count

    def update(self):
        """Update Q-network (simplified for demo)."""
        if len(self.replay_buffer) < self.batch_size:
            return

        obs, actions, rewards, next_obs, dones = self.replay_buffer.sample(
            self.batch_size
        )

        # Simplified update: just accumulate loss signal
        self.update_count += 1

    def train(self, num_episodes: int = 100):
        """Train the agent."""
        print(f"Training {self.env_name} with DQN...")
        print(f"Obs shape: {self.obs_shape}, Action space size: {self.action_space_size}")

        for episode in range(num_episodes):
            total_reward, steps = self.collect_experience(500)
            self.episode_rewards.append(total_reward)
            self.episode_lengths.append(steps)

            # Decay epsilon
            self.epsilon = max(self.epsilon_end, self.epsilon * self.epsilon_decay)

            # Periodic updates
            if (episode + 1) % 4 == 0:
                self.update()

            if (episode + 1) % 10 == 0:
                avg_reward = np.mean(self.episode_rewards[-10:])
                print(
                    f"Episode {episode + 1}/{num_episodes} | "
                    f"Avg Reward: {avg_reward:.3f} | "
                    f"Epsilon: {self.epsilon:.3f} | "
                    f"Last Reward: {total_reward:.3f}"
                )

        print(f"Training complete! Final average reward: {np.mean(self.episode_rewards[-10:]):.3f}")
        return self.episode_rewards

    def save_model(self, path: str):
        """Save model checkpoint."""
        checkpoint = {
            "env_name": self.env_name,
            "hyperparams": {
                "learning_rate": self.learning_rate,
                "gamma": self.gamma,
                "epsilon_start": self.epsilon,
            },
            "episode_rewards": self.episode_rewards,
            "update_count": self.update_count,
        }

        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(checkpoint, f, indent=2)

        print(f"Model saved to {path}")


def train_all_environments():
    """Train DQN on all discrete-control environments."""
    environments = [
        "bunny_garden",
        "warehouse_bots",
    ]

    results = {}

    for env_name in environments:
        print(f"\n{'='*60}")
        print(f"Training {env_name.upper()}")
        print(f"{'='*60}")

        trainer = DQNTrainer(
            env_name=env_name,
            learning_rate=1e-3,
            gamma=0.99,
            epsilon_start=1.0,
            epsilon_end=0.01,
            epsilon_decay=0.995,
        )

        rewards = trainer.train(num_episodes=50)
        results[env_name] = {
            "final_avg_reward": float(np.mean(rewards[-10:])),
            "max_reward": float(np.max(rewards)),
            "min_reward": float(np.min(rewards)),
        }

        trainer.save_model(f"./models/dqn_{env_name}.json")

    # Save summary
    print(f"\n{'='*60}")
    print("DQN TRAINING SUMMARY")
    print(f"{'='*60}")
    for env_name, stats in results.items():
        print(
            f"{env_name:20s}: "
            f"Avg={stats['final_avg_reward']:7.3f} | "
            f"Max={stats['max_reward']:7.3f} | "
            f"Min={stats['min_reward']:7.3f}"
        )

    with open("./models/dqn_summary.json", "w") as f:
        json.dump(results, f, indent=2)


if __name__ == "__main__":
    train_all_environments()
