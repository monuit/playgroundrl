# Scene Configuration Guide

This guide explains how to configure 3D scenes in PlaygroundRL, including lighting, shadows, and environment settings.

## Architecture Overview

PlaygroundRL uses a portal-based rendering architecture (via tunnel-rat) where:

1. **Persistent Canvas** - Rendered once at root level (`Scene.tsx`)
2. **Portal System** - Content injected via `<View>` components
3. **Scene Components** - Environment-specific 3D content

## Shadow Configuration

Shadows are configured at multiple levels:

### Global Shadow Settings (Scene.tsx)

```tsx
<Canvas
  shadows // Enables shadow rendering globally
  gl={{ 
    shadowMap: {
      enabled: true,
      type: THREE.PCFSoftShadowMap // or THREE.BasicShadowMap, THREE.VSMShadowMap
    }
  }}
>
```

### Light Shadows

Directional lights that cast shadows need configuration:

```tsx
<directionalLight
  castShadow
  shadow-mapSize-width={2048}
  shadow-mapSize-height={2048}
  shadow-camera-far={500}
  shadow-camera-left={-100}
  shadow-camera-right={100}
  shadow-camera-top={100}
  shadow-camera-bottom={-100}
  shadow-bias={-0.0001} // Prevents shadow acne
/>
```

### Mesh Shadows

Meshes need to declare shadow behavior:

```tsx
<mesh
  castShadow    // This mesh casts shadows
  receiveShadow // This mesh receives shadows
>
  <boxGeometry />
  <meshStandardMaterial />
</mesh>
```

## Lighting Presets

Use the `EnvironmentLights` component for standardized lighting:

```tsx
import { EnvironmentLights } from '@/components/canvas/Lights';

<EnvironmentLights preset="bunny" />
<EnvironmentLights preset="default" />
<EnvironmentLights preset="dramatic" />
<EnvironmentLights preset="soft" />
```

### Custom Lighting

Override preset values:

```tsx
<EnvironmentLights 
  preset="bunny"
  ambientIntensity={0.8}
  ambientColor="#ff0000"
/>
```

## Environment Effects

### Fog

Add atmospheric depth:

```tsx
<fog attach="fog" args={['#030616', 35, 110]} />
// Format: [color, near, far]
```

### Background Color

```tsx
<color attach="background" args={['#030616']} />
```

### Tone Mapping

Configured in Scene.tsx:

```tsx
<Canvas
  gl={{
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.0
  }}
>
```

## Camera Configuration

Cameras are configured per-view:

```tsx
<PerspectiveCamera
  makeDefault
  position={[18, 16, 28]}
  fov={42}
/>
```

### Camera Properties

- **position**: `[x, y, z]` - Camera location
- **fov**: Field of view (degrees, typically 40-60)
- **near**: Near clipping plane (default: 0.1)
- **far**: Far clipping plane (default: 1000)
- **makeDefault**: Use this as the default camera

## Performance Considerations

### Shadow Optimization

```tsx
// Lower quality but better performance
shadow-mapSize-width={1024}
shadow-mapSize-height={1024}

// Higher quality but slower
shadow-mapSize-width={4096}
shadow-mapSize-height={4096}
```

### Selective Shadows

Only enable shadows where needed:

```tsx
// Ground plane receives shadows
<mesh receiveShadow>
  <planeGeometry />
</mesh>

// Important objects cast shadows
<mesh castShadow>
  <sphereGeometry />
</mesh>

// Decorative objects don't need shadows
<mesh>
  <boxGeometry />
</mesh>
```

### Light Count

Minimize real-time lights for better performance:

- 1-2 directional lights with shadows
- 1-2 directional lights without shadows
- 0-1 point lights
- 1 ambient light


## Example: Complete Scene Setup

```tsx
export function MyScene({ state }: { state: MyState }) {
  return (
    <group>
      {/* Environment */}
      <color attach="background" args={['#030616']} />
      <fog attach="fog" args={['#030616', 35, 110]} />

      {/* Lighting */}
      <EnvironmentLights preset="bunny" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#040b1a" />
      </mesh>

      {/* Objects */}
      <mesh position={[0, 1, 0]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#38bdf8" />
      </mesh>
    </group>
  );
}
```

## Debugging Shadows

### Shadow Camera Helper

Visualize shadow camera frustum:

```tsx
import { useHelper } from '@react-three/drei';
import { DirectionalLightHelper } from 'three';

const lightRef = useRef();
useHelper(lightRef, DirectionalLightHelper, 1);

<directionalLight ref={lightRef} castShadow />
```

### Common Issues

**Shadows not appearing:**

- Check `shadows` prop on Canvas
- Verify `castShadow` on light
- Verify `castShadow` on object and `receiveShadow` on ground

**Shadow acne (artifacts):**

- Adjust `shadow-bias` (typically -0.0001 to -0.001)

**Shadows cut off:**

- Increase `shadow-camera-far`
- Expand `shadow-camera-left/right/top/bottom`

**Blurry shadows:**

- Increase `shadow-mapSize-width/height`
- Use `PCFSoftShadowMap` instead of `BasicShadowMap`
