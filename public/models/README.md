# Models

This directory contains both ONNX policy models and 3D GLTF models for the PlaygroundRL application.

## ONNX Models (ML Policies)

Drop ONNX actor files in this directory so the training playground can load them via `/models/<filename>.onnx`.

The UI looks for `policy.onnx` by default. Replace it with your exported actor or upload a different policy through the interface.

## 3D GLTF Models (Visual Assets)

Place your `.glb` or `.gltf` files here for 3D rendering in the environments.

### Required Models

The following models are referenced by the application (see `src/lib/models.ts`):

- `bunny.glb` - Bunny agent model for Lumen Valley environment
- `carrot.glb` - Carrot collectible model
- `obstacle.glb` - Generic obstacle model
- `drone.glb` - Drone agent model for Swarm Drones environment
- `fish.glb` - Fish agent model for Reef Guardians environment
- `plow.glb` - Snowplow agent model for Snowplow Fleet environment
- `bot.glb` - Warehouse bot model for Warehouse Bots environment

### Model Guidelines

- **Format**: Use `.glb` (binary GLTF) for better performance
- **Scale**: Models should be reasonably scaled (1 unit = 1 meter in Three.js)
- **Optimization**: Keep poly count reasonable (<10k triangles per model)
- **Materials**: Use PBR materials (roughness/metalness workflow)
- **Textures**: Embed textures in the GLB file or keep them small (<512KB)
- **Animations**: Include animations if needed (idle, walk, etc.)

### Creating Models

You can create GLTF models using:

- [Blender](https://www.blender.org/) (free, powerful)
- [SketchFab](https://sketchfab.com/) (download CC-licensed models)
- [Ready Player Me](https://readyplayer.me/) (character creation)
- [Mixamo](https://www.mixamo.com/) (rigged characters with animations)


### Fallback Behavior

When GLTF models are not available, the application falls back to primitive meshes (spheres, boxes, cones) constructed in the respective agent components (see `src/ui/agents/`).

