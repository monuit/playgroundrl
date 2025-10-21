import torch
from LevelOneEnv import LevelOneEnv
import numpy as np
import gymnasium as gym
from ppo import Actor, Args, make_env
import tyro
from torch.distributions.categorical import Categorical


class OnnxableAgent(torch.nn.Module):
    def __init__(self, agent):
        super().__init__()
        self.agent = agent

    def forward(self, observation: torch.Tensor):
        logits = self.agent(observation)
        return logits
    
args = tyro.cli(Args)
device = torch.device("cuda" if torch.cuda.is_available() and args.cuda else "cpu")

agent = Actor(gym.vector.SyncVectorEnv([make_env(args.env_id, i, False, '') for i in range(args.num_envs)])).to(device)
agent.load_state_dict(torch.load("models/leveltwo/actor.pth"))

onnx_agent = OnnxableAgent(agent)

# Create dummy input matching the observation space
# For LevelTwo: 14 values (2 agent positions, 2 target positions, distance, + 9 enemy positions)
dummy_input = torch.zeros(1, 14, dtype=torch.float32)

torch.onnx.export(
    onnx_agent,
    dummy_input,
    "actor.onnx",
    opset_version=17,
    input_names=["observation"],
    output_names=["logits"],
    dynamic_axes={
        "observation": {0: "batch_size"},
        "logits": {0: "batch_size"},
    },
)