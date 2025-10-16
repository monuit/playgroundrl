/**
 * Reusable lighting configurations for 3D environments
 * Based on PPO Bunny's lighting approach
 */

interface EnvironmentLightsProps {
  preset?: 'bunny' | 'default' | 'dramatic' | 'soft';
  ambientIntensity?: number;
  ambientColor?: string;
}

/**
 * Standard lighting setup for environments
 * Includes ambient light and directional lights with shadows
 */
export function EnvironmentLights({
  preset = 'default',
  ambientIntensity,
  ambientColor,
}: EnvironmentLightsProps) {
  const configs = {
    bunny: {
      ambient: { intensity: 0.55, color: '#60a5fa' },
      directional1: {
        position: [60, 110, 90] as [number, number, number],
        intensity: 1.3,
        color: '#38bdf8',
        castShadow: true,
      },
      directional2: {
        position: [-70, 140, -60] as [number, number, number],
        intensity: 0.9,
        color: '#f472b6',
        castShadow: false,
      },
      point: {
        position: [0, 62, 0] as [number, number, number],
        intensity: 1.05,
        distance: 260,
        color: '#38bdf8',
        decay: 1.4,
      },
    },
    default: {
      ambient: { intensity: 0.5, color: '#ffffff' },
      directional1: {
        position: [50, 100, 50] as [number, number, number],
        intensity: 1.0,
        color: '#ffffff',
        castShadow: true,
      },
      directional2: {
        position: [-50, 100, -50] as [number, number, number],
        intensity: 0.5,
        color: '#ffffff',
        castShadow: false,
      },
      point: undefined,
    },
    dramatic: {
      ambient: { intensity: 0.2, color: '#1e40af' },
      directional1: {
        position: [100, 150, 100] as [number, number, number],
        intensity: 2.0,
        color: '#fbbf24',
        castShadow: true,
      },
      directional2: {
        position: [-100, 100, -100] as [number, number, number],
        intensity: 0.8,
        color: '#60a5fa',
        castShadow: true,
      },
      point: {
        position: [0, 80, 0] as [number, number, number],
        intensity: 1.5,
        distance: 300,
        color: '#fbbf24',
        decay: 2,
      },
    },
    soft: {
      ambient: { intensity: 0.8, color: '#f3f4f6' },
      directional1: {
        position: [30, 80, 30] as [number, number, number],
        intensity: 0.6,
        color: '#fef3c7',
        castShadow: true,
      },
      directional2: {
        position: [-30, 60, -30] as [number, number, number],
        intensity: 0.4,
        color: '#dbeafe',
        castShadow: false,
      },
      point: undefined,
    },
  };

  const config = configs[preset];

  return (
    <>
      <ambientLight
        intensity={ambientIntensity ?? config.ambient.intensity}
        color={ambientColor ?? config.ambient.color}
      />

      <directionalLight
        position={config.directional1.position}
        intensity={config.directional1.intensity}
        color={config.directional1.color}
        castShadow={config.directional1.castShadow}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />

      <directionalLight
        position={config.directional2.position}
        intensity={config.directional2.intensity}
        color={config.directional2.color}
        castShadow={config.directional2.castShadow}
      />

      {config.point && (
        <pointLight
          position={config.point.position}
          intensity={config.point.intensity}
          distance={config.point.distance}
          color={config.point.color}
          decay={config.point.decay}
        />
      )}
    </>
  );
}

/**
 * Simple three-point lighting setup
 */
export function ThreePointLighting() {
  return (
    <>
      {/* Key light */}
      <directionalLight
        position={[50, 100, 50]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Fill light */}
      <directionalLight position={[-50, 50, -50]} intensity={0.5} />

      {/* Back light */}
      <directionalLight position={[0, 50, -100]} intensity={0.3} />

      {/* Ambient */}
      <ambientLight intensity={0.4} />
    </>
  );
}

/**
 * Minimal lighting for performance
 */
export function MinimalLighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 100, 50]} intensity={0.8} castShadow />
    </>
  );
}
