"""
ONNX Export Script
Converts trained PPO models to ONNX format for browser inference
"""
import sys
import numpy as np
from pathlib import Path
from typing import Optional

try:
    import onnx
    import onnxruntime as rt
    from onnx import helper, TensorProto
except ImportError:
    print("onnx and onnxruntime required: pip install onnx onnxruntime")
    sys.exit(1)

try:
    import torch
    from stable_baselines3 import PPO
except ImportError:
    print("torch and stable_baselines3 required: pip install torch stable-baselines3")
    sys.exit(1)


def export_ppo_to_onnx(
    model_path: str,
    output_path: str,
    input_shape: tuple = (1, 5),  # (batch_size, observation_dim)
):
    """
    Convert a SB3 PPO model to ONNX format
    
    Args:
        model_path: Path to saved PPO model (.zip from SB3)
        output_path: Path to save ONNX model
        input_shape: Input shape (batch_size, features)
    """
    
    print(f"Loading SB3 model from {model_path}...")
    model = PPO.load(model_path)
    
    # Access the policy network
    policy = model.policy
    policy.eval()
    
    # Create dummy input
    dummy_input = torch.zeros(input_shape, dtype=torch.float32)
    
    print(f"Exporting to ONNX with input shape {input_shape}...")
    
    # Export
    torch.onnx.export(
        policy,
        dummy_input,
        output_path,
        input_names=["input"],
        output_names=["output"],
        opset_version=12,
        do_constant_folding=True,
        verbose=False,
    )
    
    print(f"Model exported to {output_path}")
    
    # Verify ONNX model
    print("Verifying ONNX model...")
    onnx_model = onnx.load(output_path)
    onnx.checker.check_model(onnx_model)
    print("✓ ONNX model is valid")
    
    # Test inference
    print("Testing ONNX inference...")
    session = rt.InferenceSession(output_path, providers=["CPUExecutionProvider"])
    
    test_input = np.random.randn(1, 5).astype(np.float32)
    outputs = session.run(None, {"input": test_input})
    
    print(f"✓ Inference successful. Output shape: {outputs[0].shape}")
    
    return output_path


def convert_sb3_models(models_dir: str = "../public/models"):
    """
    Convert all trained SB3 models in a directory
    """
    models_dir = Path(models_dir)
    models_dir.mkdir(exist_ok=True)
    
    # Look for .zip files
    sb3_models = list(Path(".").glob("checkpoints/*.zip"))
    
    if not sb3_models:
        print("No SB3 models found in checkpoints/")
        return
    
    for sb3_path in sb3_models:
        try:
            # Extract level name
            name = sb3_path.stem
            
            # Output path
            onnx_path = models_dir / f"policy_{name}.onnx"
            
            print(f"\n{'=' * 60}")
            print(f"Converting {name}...")
            print(f"{'=' * 60}")
            
            export_ppo_to_onnx(
                str(sb3_path),
                str(onnx_path),
                input_shape=(1, 5),
            )
            
        except Exception as e:
            print(f"✗ Error converting {sb3_path}: {e}")
            continue
    
    print("\n" + "=" * 60)
    print("Conversion complete!")
    print("=" * 60)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Export PPO models to ONNX")
    parser.add_argument(
        "--model",
        type=str,
        help="Path to single SB3 model (.zip)",
    )
    parser.add_argument(
        "--output",
        type=str,
        help="Output ONNX path",
    )
    parser.add_argument(
        "--batch",
        action="store_true",
        help="Convert all models in checkpoints/",
    )
    
    args = parser.parse_args()
    
    if args.model and args.output:
        export_ppo_to_onnx(args.model, args.output)
    elif args.batch:
        convert_sb3_models()
    else:
        print("Usage:")
        print("  Single: python torch2onnx.py --model <path> --output <path>")
        print("  Batch:  python torch2onnx.py --batch")
