"""
PPO Training Script - Extracted from learn.ipynb
Trains an agent using Proximal Policy Optimization on LevelTwo environment
"""

import random
import time
import sys
from pathlib import Path

import gymnasium as gym
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.distributions.categorical import Categorical
from tqdm import trange

# Add parent directory to path to import custom environments
sys.path.insert(0, str(Path(__file__).parent.parent))

from LevelOneEnv import LevelOneEnv
from LevelTwoEnv import LevelTwoEnv


# MARK: Configuration
seed: int = 1
torch_deterministic: bool = True
cuda: bool = True
capture_video: bool = False
env_id: str = "LevelTwo"
total_timesteps: int = 1_000_000
learning_rate: float = 1e-4
num_envs: int = 16
num_steps: int = 128
anneal_lr: bool = True
gamma: float = 0.99
gae_lambda: float = 0.95
num_minibatches: int = 4
update_epochs: int = 4
norm_adv: bool = True
clip_coef: float = 0.2
clip_vloss: bool = True
ent_coef: float = 0.02
vf_coef: float = 0.5
max_grad_norm: float = 0.5


# MARK: Helper Functions
def make_env(env_id, idx, capture_video, run_name):
    """Create a vectorized environment factory function."""
    def thunk():
        if capture_video and idx == 0:
            env = gym.make(env_id, render_mode="rgb_array")
            env = gym.wrappers.RecordVideo(env, f"videos/{run_name}")
        else:
            env = gym.make(env_id)
        return env

    return thunk


def layer_init(layer, std=np.sqrt(2), bias_const=0.0):
    """Initialize network layer with orthogonal weights."""
    torch.nn.init.orthogonal_(layer.weight, std)
    torch.nn.init.constant_(layer.bias, bias_const)
    return layer


# MARK: Neural Network Architecture
class Actor(nn.Module):
    """Policy network (actor) for the agent."""
    def __init__(self, envs):
        super().__init__()
        self.actor = nn.Sequential(
            layer_init(nn.Linear(np.array(envs.single_observation_space.shape).prod(), 64)),
            nn.Tanh(),
            layer_init(nn.Linear(64, 64)),
            nn.Tanh(),
            layer_init(nn.Linear(64, envs.single_action_space.n), std=0.01),
        )

    def forward(self, x):
        return self.actor(x)


class Critic(nn.Module):
    """Value network (critic) for the agent."""
    def __init__(self, envs):
        super().__init__()
        self.critic = nn.Sequential(
            layer_init(nn.Linear(np.array(envs.single_observation_space.shape).prod(), 64)),
            nn.Tanh(),
            layer_init(nn.Linear(64, 64)),
            nn.Tanh(),
            layer_init(nn.Linear(64, 1), std=1.0),
        )

    def forward(self, x):
        return self.critic(x)


class Agent(nn.Module):
    """Actor-Critic agent combining policy and value networks."""
    def __init__(self, envs):
        super().__init__()
        self.critic = Critic(envs)
        self.actor = Actor(envs)

    def get_value(self, x):
        return self.critic(x)

    def get_action_and_value(self, x, action=None):
        logits = self.actor(x)
        probs = Categorical(logits=logits)
        if action is None:
            action = probs.sample()
        return action, probs.log_prob(action), probs.entropy(), self.critic(x)

    def get_action(self, x):
        logits = self.actor(x)
        probs = Categorical(logits=logits)
        action = probs.sample()
        return action


def main():
    """Main training loop."""
    # MARK: Initialization
    batch_size = int(num_envs * num_steps)
    minibatch_size = int(batch_size // num_minibatches)
    num_iterations = total_timesteps // batch_size
    run_name = f"{env_id}__{seed}__{int(time.time())}"

    # Seeding
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.backends.cudnn.deterministic = torch_deterministic

    device = torch.device("cuda" if torch.cuda.is_available() and cuda else "cpu")
    print(f"Using device: {device}")

    # Environment setup
    envs = gym.vector.SyncVectorEnv(
        [make_env(env_id, i, capture_video, run_name) for i in range(num_envs)],
    )

    assert isinstance(envs.single_action_space, gym.spaces.Discrete), "only discrete action space is supported"

    agent = Agent(envs).to(device)
    optimizer = optim.Adam(agent.parameters(), lr=learning_rate, eps=1e-5)

    # MARK: Storage Setup
    obs = torch.zeros((num_steps, num_envs) + envs.single_observation_space.shape).to(device)
    actions = torch.zeros((num_steps, num_envs) + envs.single_action_space.shape).to(device)
    logprobs = torch.zeros((num_steps, num_envs)).to(device)
    rewards = torch.zeros((num_steps, num_envs)).to(device)
    dones = torch.zeros((num_steps, num_envs)).to(device)
    values = torch.zeros((num_steps, num_envs)).to(device)

    # MARK: Training Loop
    global_step = 0
    start_time = time.time()
    next_obs, _ = envs.reset(seed=seed)
    next_obs = torch.Tensor(next_obs).to(device)
    next_done = torch.zeros(num_envs).to(device)

    for iteration in (walrus := trange(1, num_iterations + 1)):
        # Annealing the learning rate
        if anneal_lr:
            frac = 1.0 - (iteration - 1.0) / num_iterations
            lrnow = frac * learning_rate
            optimizer.param_groups[0]["lr"] = lrnow

        # MARK: Rollout Phase
        for step in range(0, num_steps):
            global_step += num_envs
            obs[step] = next_obs
            dones[step] = next_done

            # Action logic
            with torch.no_grad():
                action, logprob, _, value = agent.get_action_and_value(next_obs)
                values[step] = value.flatten()
            actions[step] = action
            logprobs[step] = logprob

            # Execute the game and log data
            next_obs, reward, terminations, truncations, infos = envs.step(action.cpu().numpy())

            next_done = np.logical_or(terminations, truncations)
            rewards[step] = torch.tensor(reward).to(device).view(-1)
            next_obs, next_done = torch.Tensor(next_obs).to(device), torch.Tensor(next_done).to(device)

        # MARK: Advantage and Return Computation
        with torch.no_grad():
            # Get estimated value for the next state
            next_value = agent.get_value(next_obs).reshape(1, -1)

            # Initialize advantages tensor
            advantages = torch.zeros_like(rewards).to(device)

            # Initialize last GAE value
            lastgaelam = 0

            # Iterate over timesteps in reverse order
            for t in reversed(range(num_steps)):
                # Determine nextnonterminal and nextvalues based on timestep
                if t == num_steps - 1:
                    nextnonterminal = 1.0 - next_done
                    nextvalues = next_value
                else:
                    nextnonterminal = 1.0 - dones[t + 1]
                    nextvalues = values[t + 1]

                # Calculate TD error
                delta = rewards[t] + gamma * nextvalues * nextnonterminal - values[t]

                # Calculate GAE and update last GAE value
                lastgaelam = delta + gamma * gae_lambda * nextnonterminal * lastgaelam

                advantages[t] = delta + gamma * gae_lambda * nextnonterminal * lastgaelam

            # Calculate returns
            returns = advantages + values

        # MARK: Flatten the batch
        b_obs = obs.reshape((-1,) + envs.single_observation_space.shape)
        b_logprobs = logprobs.reshape(-1)
        b_actions = actions.reshape((-1,) + envs.single_action_space.shape)
        b_advantages = advantages.reshape(-1)
        b_returns = returns.reshape(-1)
        b_values = values.reshape(-1)

        # MARK: Policy and Value Network Update
        b_inds = np.arange(batch_size)
        clipfracs = []
        for epoch in range(update_epochs):
            np.random.shuffle(b_inds)
            for start in range(0, batch_size, minibatch_size):
                end = start + minibatch_size
                mb_inds = b_inds[start:end]

                _, newlogprob, entropy, newvalue = agent.get_action_and_value(
                    b_obs[mb_inds], b_actions.long()[mb_inds]
                )
                logratio = newlogprob - b_logprobs[mb_inds]
                ratio = logratio.exp()

                with torch.no_grad():
                    clipfracs += [((ratio - 1.0).abs() > clip_coef).float().mean().item()]

                mb_advantages = b_advantages[mb_inds]
                if norm_adv:
                    mb_advantages = (mb_advantages - mb_advantages.mean()) / (mb_advantages.std() + 1e-8)

                # Policy loss
                pg_loss1 = -mb_advantages * ratio
                pg_loss2 = -mb_advantages * torch.clamp(ratio, 1 - clip_coef, 1 + clip_coef)
                pg_loss = torch.max(pg_loss1, pg_loss2).mean()

                # Value loss
                newvalue = newvalue.view(-1)
                if clip_vloss:
                    v_loss_unclipped = (newvalue - b_returns[mb_inds]) ** 2
                    v_clipped = b_values[mb_inds] + torch.clamp(
                        newvalue - b_values[mb_inds],
                        -clip_coef,
                        clip_coef,
                    )
                    v_loss_clipped = (v_clipped - b_returns[mb_inds]) ** 2
                    v_loss_max = torch.max(v_loss_unclipped, v_loss_clipped)
                    v_loss = 0.5 * v_loss_max.mean()
                else:
                    v_loss = 0.5 * ((newvalue - b_returns[mb_inds]) ** 2).mean()

                entropy_loss = entropy.mean()
                loss = pg_loss - ent_coef * entropy_loss + v_loss * vf_coef

                optimizer.zero_grad()
                loss.backward()
                nn.utils.clip_grad_norm_(agent.parameters(), max_grad_norm)
                optimizer.step()

        # MARK: Logging
        y_pred, y_true = b_values.cpu().numpy(), b_returns.cpu().numpy()
        var_y = np.var(y_true)
        explained_var = np.nan if var_y == 0 else 1 - np.var(y_true - y_pred) / var_y

        avg_reward = rewards.sum(dim=0).mean().item()
        walrus.set_description(f"reward: {avg_reward:.2f}")

    envs.close()
    print(f"Training completed in {time.time() - start_time:.2f} seconds")


if __name__ == "__main__":
    main()
