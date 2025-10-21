"""
Simple ONNX export script for PPO actor network.
Exports the actor network logits without requiring TensorBoard/TensorFlow dependencies.
"""

import argparse
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn

# Simple environment factory without TensorFlow dependencies
def make_env(env_id: str):
    if env_id == "LevelTwo":
        from LevelTwoEnv import LevelTwoEnv

        return LevelTwoEnv()
    if env_id == "LevelOne":
        from LevelOneEnv import LevelOneEnv

        return LevelOneEnv()
    raise ValueError(f"Unknown environment: {env_id}")

# Define the actor network (from ppo.py)
class Actor(nn.Module):
    """Policy network (actor) for the agent."""
    def __init__(self, envs):
        super().__init__()
        
        def layer_init(layer, std=np.sqrt(2), bias_const=0.0):
            torch.nn.init.orthogonal_(layer.weight, std)
            torch.nn.init.constant_(layer.bias, bias_const)
            return layer
        
        self.actor = nn.Sequential(
            layer_init(nn.Linear(np.array(envs.observation_space.shape).prod(), 64)),
            nn.Tanh(),
            layer_init(nn.Linear(64, 64)),
            nn.Tanh(),
            layer_init(nn.Linear(64, envs.action_space.n), std=0.01),
        )

    def forward(self, x):
        return self.actor(x)


def export_actor(env_id: str, model_path: Path | None, output_path: Path, device_choice: str = "auto") -> None:
    env = make_env(env_id)
    print(f"Environment: {env_id}")
    print(f"Observation space: {env.observation_space}")
    print(f"Action space: {env.action_space}")

    if device_choice == "cpu":
        device = torch.device("cpu")
    elif device_choice == "cuda":
        if not torch.cuda.is_available():
            print("⚠️ CUDA requested but not available. Falling back to CPU.")
            device = torch.device("cpu")
        else:
            device = torch.device("cuda")
    else:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    print(f"Using device: {device}")

    actor = Actor(env).to(device)

    if model_path is not None:
        if model_path.exists():
            actor.load_state_dict(torch.load(model_path, map_location=device))
            print(f"Loaded model weights from {model_path}")
        else:
            print(f"⚠️ Model path {model_path} not found. Exporting randomly initialised weights.")
    else:
        print("⚠️ No model path provided. Exporting randomly initialised weights.")

    actor.eval()

    obs_size = int(np.array(env.observation_space.shape).prod())
    dummy_input = torch.zeros(1, obs_size, dtype=torch.float32).to(device)
    print(f"Dummy input shape: {dummy_input.shape}")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    torch.onnx.export(
        actor,
        dummy_input,
        str(output_path),
        opset_version=18,
        input_names=["observation"],
        output_names=["logits"],
        dynamic_axes={
            "observation": {0: "batch_size"},
            "logits": {0: "batch_size"},
        },
        verbose=False,
        export_params=True,
    )

    print(f"✓ Model exported to {output_path}")

    import onnx

    print("Converting to inline model format...")
    model = onnx.load(str(output_path), load_external_data=True)
    onnx.save_model(model, str(output_path), save_as_external_data=False, all_tensors_to_one_file=True)

    data_file = output_path.with_suffix(output_path.suffix + ".data")
    if data_file.exists():
        data_file.unlink()
        print(f"✓ Removed external data file: {data_file}")

    print("✓ Model converted to inline format")

    import onnxruntime as rt

    session = rt.InferenceSession(str(output_path))
    output = session.run(None, {session.get_inputs()[0].name: dummy_input.cpu().numpy()})
    print("✓ ONNX model verification successful")
    print(f"  Output shape: {output[0].shape}")
    print(f"  Output sample: {output[0][0][:4]}")

    if hasattr(env, "close"):
        env.close()


def resolve_defaults(env_id: str) -> tuple[Path | None, Path]:
    defaults = {
        "LevelOne": {
            "model_path": Path("models/actor.pth"),
            "output_path": Path("actor.onnx"),
        },
        "LevelTwo": {
            "model_path": Path("models/leveltwo/actor.pth"),
            "output_path": Path("actorlvl2.onnx"),
        },
    }

    if env_id not in defaults:
        raise ValueError(f"Unknown environment: {env_id}")

    config = defaults[env_id]
    model_path = config["model_path"]

    return model_path, config["output_path"]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export PPO actor network to ONNX.")
    parser.add_argument("--env", choices=["LevelOne", "LevelTwo"], default="LevelOne", help="Environment to export the actor for.")
    parser.add_argument("--model-path", type=Path, default=None, help="Path to the trained .pth weights. If omitted, defaults are used.")
    parser.add_argument("--output", type=Path, default=None, help="Output ONNX file path.")
    parser.add_argument("--device", choices=["auto", "cpu", "cuda"], default="auto", help="Device to use for export.")

    args = parser.parse_args()

    default_model_path, default_output_path = resolve_defaults(args.env)

    model_path = args.model_path if args.model_path is not None else default_model_path
    output_path = args.output if args.output is not None else default_output_path

    export_actor(args.env, model_path, output_path, args.device)
