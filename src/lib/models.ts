/**
 * 3D Model Management and Preloading
 * 
 * This module handles GLTF model loading and preloading for the application.
 * When actual GLTF models are available, uncomment the useGLTF.preload calls.
 */

// import { useGLTF } from '@react-three/drei';

/**
 * Model paths configuration
 * Place your .glb files in the public/models directory
 */
export const MODEL_PATHS = {
  bunny: '/models/bunny.glb',
  carrot: '/models/carrot.glb',
  obstacle: '/models/obstacle.glb',
  drone: '/models/drone.glb',
  fish: '/models/fish.glb',
  plow: '/models/plow.glb',
  bot: '/models/bot.glb',
} as const;

export type ModelKey = keyof typeof MODEL_PATHS;

/**
 * Preload all models for better performance
 * Call this function early in the application lifecycle
 */
export function preloadModels() {
  // TODO: Uncomment when actual GLTF models are available
  // Object.values(MODEL_PATHS).forEach((path) => {
  //   useGLTF.preload(path);
  // });
  
  console.log('[Models] Model preloading ready (awaiting GLTF files)');
}

/**
 * Preload specific models
 */
export function preloadModel(key: ModelKey) {
  // TODO: Uncomment when actual GLTF models are available
  // useGLTF.preload(MODEL_PATHS[key]);
  
  console.log(`[Models] Ready to preload: ${MODEL_PATHS[key]}`);
}

/**
 * Check if a model exists
 * This is a placeholder - in production, you'd actually check if the file exists
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function hasModel(key: ModelKey): boolean {
  // TODO: Implement actual file existence check
  return false;
}

/**
 * Model configuration for different agents
 */
export const MODEL_CONFIG = {
  bunny: {
    path: MODEL_PATHS.bunny,
    scale: 1,
    rotation: [0, 0, 0] as [number, number, number],
    position: [0, 0, 0] as [number, number, number],
  },
  carrot: {
    path: MODEL_PATHS.carrot,
    scale: 0.8,
    rotation: [0, 0, 0] as [number, number, number],
    position: [0, 0, 0] as [number, number, number],
  },
  obstacle: {
    path: MODEL_PATHS.obstacle,
    scale: 1.2,
    rotation: [0, 0, 0] as [number, number, number],
    position: [0, 0, 0] as [number, number, number],
  },
  drone: {
    path: MODEL_PATHS.drone,
    scale: 1,
    rotation: [0, 0, 0] as [number, number, number],
    position: [0, 0, 0] as [number, number, number],
  },
  fish: {
    path: MODEL_PATHS.fish,
    scale: 1,
    rotation: [0, 0, 0] as [number, number, number],
    position: [0, 0, 0] as [number, number, number],
  },
  plow: {
    path: MODEL_PATHS.plow,
    scale: 1,
    rotation: [0, 0, 0] as [number, number, number],
    position: [0, 0, 0] as [number, number, number],
  },
  bot: {
    path: MODEL_PATHS.bot,
    scale: 1,
    rotation: [0, 0, 0] as [number, number, number],
    position: [0, 0, 0] as [number, number, number],
  },
} as const;
