# Camera and Controls Guide

This document explains camera configuration and control schemes in PlaygroundRL.

## Camera Types

### PerspectiveCamera (Most Common)

Used for realistic 3D scenes with perspective projection:

```tsx
import { PerspectiveCamera } from '@react-three/drei';

<PerspectiveCamera
  makeDefault
  position={[18, 16, 28]}
  fov={42}
/>
```

**Properties:**

- `position`: `[x, y, z]` camera location in 3D space
- `fov`: Field of view in degrees (40-60 typical)
- `makeDefault`: Sets as the default camera for the scene
- `near`: Near clipping plane (default: 0.1)
- `far`: Far clipping plane (default: 2000)

### OrthographicCamera

Used for top-down or isometric views without perspective:

```tsx
import { OrthographicCamera } from '@react-three/drei';

<OrthographicCamera
  makeDefault
  position={[0, 50, 0]}
  zoom={20}
/>
```

## Control Schemes

### OrbitControls

Allows user to orbit, zoom, and pan around a target point:

```tsx
import { OrbitControls } from '@react-three/drei';

<OrbitControls
  enableZoom={true}
  enableRotate={true}
  enablePan={true}
  autoRotate={false}
  autoRotateSpeed={2}
  minPolarAngle={0.3}
  maxPolarAngle={Math.PI - 0.3}
  minDistance={10}
  maxDistance={100}
/>
```

**Common Patterns:**

**Auto-rotate showcase:**

```tsx
<OrbitControls 
  autoRotate 
  autoRotateSpeed={2} 
  minPolarAngle={0.4} 
  maxPolarAngle={Math.PI - 0.4} 
/>
```

**Fixed camera (disabled controls):**

```tsx
<OrbitControls 
  enableZoom={false} 
  enableRotate={false} 
  enablePan={false} 
/>
```

**Restricted orbit:**

```tsx
<OrbitControls 
  minPolarAngle={Math.PI / 4}
  maxPolarAngle={Math.PI / 2}
  minAzimuthAngle={-Math.PI / 4}
  maxAzimuthAngle={Math.PI / 4}
/>
```

### Using View Component

The `View` component includes an `orbit` prop for easy OrbitControls:

```tsx
<View className="w-full h-full" orbit>
  <PerspectiveCamera makeDefault position={[10, 10, 10]} />
  {/* Your 3D content */}
</View>
```

### Other Control Types

**MapControls** - Similar to OrbitControls but optimized for maps:

```tsx
import { MapControls } from '@react-three/drei';
<MapControls />
```

**FlyControls** - Flight simulator style:

```tsx
import { FlyControls } from '@react-three/drei';
<FlyControls movementSpeed={10} rollSpeed={0.5} />
```

**FirstPersonControls** - FPS game style:

```tsx
import { FirstPersonControls } from '@react-three/drei';
<FirstPersonControls lookSpeed={0.1} movementSpeed={10} />
```

**PointerLockControls** - Mouse capture for FPS:

```tsx
import { PointerLockControls } from '@react-three/drei';
<PointerLockControls />
```

## Camera Configuration Per Environment

In PlaygroundHero.tsx, each environment defines its camera:

```tsx
const HERO_ENVIRONMENTS: HeroEnvConfig[] = [
  {
    id: "lumen-bunny",
    label: "Lumen Valley",
    camera: {
      position: [18, 16, 28],
      fov: 42,
    },
    // ...
  },
];
```

The camera is then applied:

```tsx
<PerspectiveCamera 
  makeDefault 
  position={activeConfig.camera.position} 
  fov={activeConfig.camera.fov} 
/>
```

## Animation and Dynamic Cameras

### Animate camera position with useFrame

```tsx
import { useFrame, useThree } from '@react-three/fiber';

function CameraAnimation() {
  const { camera } = useThree();
  
  useFrame((state) => {
    camera.position.x = Math.sin(state.clock.elapsedTime) * 10;
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}
```

### Follow a target

```tsx
function FollowCam({ target }: { target: Vector3 }) {
  const { camera } = useThree();
  
  useFrame(() => {
    camera.position.lerp(
      new Vector3(target.x + 10, target.y + 10, target.z + 10),
      0.1
    );
    camera.lookAt(target);
  });
  
  return null;
}
```

## Best Practices

### Camera Positioning

**Good positioning:**

- Not too close (avoid clipping)
- Not too far (maintain detail visibility)
- Slightly elevated (better spatial understanding)
- Angled (not directly top-down or side view)

**Example good positions:**

- `[15, 12, 15]` - Isometric-ish view
- `[0, 20, 30]` - Slightly elevated front view
- `[25, 20, 25]` - Wide angled view

### Field of View

- **40-50**: Narrow, more "telephoto" feel, good for focused views
- **50-60**: Normal, natural perspective
- **60-75**: Wide angle, more dramatic, good for small spaces
- **75+**: Very wide, can feel distorted

### Control Limits

Always set limits to prevent disorientation:

```tsx
<OrbitControls
  minDistance={5}
  maxDistance={50}
  minPolarAngle={0}
  maxPolarAngle={Math.PI / 2}
/>
```

### Performance

- Fewer camera updates = better performance
- Use `lerp` for smooth camera movements
- Avoid camera changes every frame
- Consider fixed cameras for cinematic scenes

## Debugging Cameras

### Camera Helper

Visualize camera frustum:

```tsx
import { useHelper } from '@react-three/drei';
import { CameraHelper } from 'three';

const cameraRef = useRef();
useHelper(cameraRef, CameraHelper, 1);

<PerspectiveCamera ref={cameraRef} makeDefault position={[10, 10, 10]} />
```

### Log Camera Position

```tsx
useFrame(({ camera }) => {
  console.log(camera.position.toArray());
});
```

## Examples

### Hero Scene (Fixed Camera)

```tsx
<View className="absolute inset-0">
  <PerspectiveCamera makeDefault position={[18, 16, 28]} fov={42} />
  {/* No OrbitControls - fixed cinematic view */}
  <YourScene />
</View>
```

### Interactive Simulation (OrbitControls)

```tsx
<View className="w-full h-full" orbit>
  <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
  <YourSimulation />
</View>
```

### Auto-Rotating Showcase

```tsx
<View className="w-full h-full">
  <PerspectiveCamera makeDefault position={[20, 15, 20]} fov={45} />
  <OrbitControls 
    autoRotate 
    autoRotateSpeed={1.5}
    enableZoom={false}
    minPolarAngle={Math.PI / 4}
    maxPolarAngle={Math.PI / 2.5}
  />
  <YourModel />
</View>
```
