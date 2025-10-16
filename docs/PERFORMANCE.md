# Performance Optimization Guide

This guide covers performance optimization techniques for 3D rendering in PlaygroundRL.

## Performance Metrics

### Target Metrics
- **60 FPS**: Desktop (smooth)
- **30 FPS**: Mobile (acceptable)
- **Load time**: <3s initial load
- **Memory**: <200MB for main scene

### Monitoring Performance

#### Using Stats.js

```tsx
import { Stats } from '@react-three/drei';

<Canvas>
  <Stats />
  <YourScene />
</Canvas>
```

#### Using Perf Monitor

```tsx
import { Perf } from 'r3f-perf';

<Canvas>
  <Perf position="top-left" />
  <YourScene />
</Canvas>
```

#### Browser DevTools
- Chrome: Performance tab
- Check FPS, GPU usage, memory
- Look for dropped frames

## Rendering Optimizations

### 1. Device Pixel Ratio (DPR)

Lower DPR for better performance:

```tsx
// Good for mobile
<Canvas dpr={[1, 1.5]}>

// High quality desktop
<Canvas dpr={[1, 2]}>

// Max quality (heavy)
<Canvas dpr={[1, 3]}>
```

**Recommendation**: `dpr={[1, 1.5]}` for most cases

### 2. Shadow Quality

Shadows are expensive - optimize carefully:

```tsx
// Low quality (fast)
<directionalLight
  castShadow
  shadow-mapSize-width={512}
  shadow-mapSize-height={512}
/>

// Medium quality (balanced)
<directionalLight
  castShadow
  shadow-mapSize-width={1024}
  shadow-mapSize-height={1024}
/>

// High quality (slow)
<directionalLight
  castShadow
  shadow-mapSize-width={4096}
  shadow-mapSize-height={4096}
/>
```

**Recommendation**: 1024-2048 for most scenes

### 3. Selective Shadow Casting

Only cast shadows where visible:

```tsx
// Ground receives shadows
<mesh receiveShadow>
  <planeGeometry />
</mesh>

// Main objects cast shadows
<mesh castShadow>
  <boxGeometry />
</mesh>

// Decorative objects don't need shadows
<mesh>
  <sphereGeometry />
</mesh>
```

### 4. Level of Detail (LOD)

Reduce geometry for distant objects:

```tsx
import { Lod } from '@react-three/drei';

<Lod distances={[0, 10, 20]}>
  {/* High detail (close) */}
  <mesh geometry={highPolyGeo} />
  
  {/* Medium detail */}
  <mesh geometry={mediumPolyGeo} />
  
  {/* Low detail (far) */}
  <mesh geometry={lowPolyGeo} />
</Lod>
```

### 5. Instancing

Render many similar objects efficiently:

```tsx
import { Instances, Instance } from '@react-three/drei';

<Instances limit={1000} geometry={boxGeometry} material={material}>
  {positions.map((pos, i) => (
    <Instance key={i} position={pos} />
  ))}
</Instances>
```

## Geometry Optimization

### 1. Keep Poly Count Low

**Good poly counts:**
- Simple objects: <1k triangles
- Characters: 5-10k triangles
- Environment objects: 2-5k triangles
- Decorative details: <500 triangles

### 2. Merge Geometries

Combine static meshes:

```tsx
import { useEffect, useMemo } from 'react';
import { BufferGeometryUtils } from 'three-stdlib';

function MergedScene() {
  const mergedGeometry = useMemo(() => {
    const geometries = obstacles.map(o => o.geometry.clone());
    return BufferGeometryUtils.mergeGeometries(geometries);
  }, [obstacles]);
  
  return <mesh geometry={mergedGeometry} />;
}
```

### 3. Simplify Geometry

Use lower subdivision for spheres/cylinders:

```tsx
// Heavy (avoid)
<sphereGeometry args={[1, 64, 64]} />

// Light (prefer)
<sphereGeometry args={[1, 16, 16]} />

// Very light (good for distant objects)
<sphereGeometry args={[1, 8, 8]} />
```

## Material Optimization

### 1. Choose Efficient Materials

**Performance ranking (fastest to slowest):**
1. `MeshBasicMaterial` (no lighting)
2. `MeshLambertMaterial` (simple lighting)
3. `MeshPhongMaterial` (specular highlights)
4. `MeshStandardMaterial` (PBR)
5. `MeshPhysicalMaterial` (advanced PBR)

### 2. Reuse Materials

```tsx
// Bad: Creates new material per mesh
{objects.map((obj, i) => (
  <mesh key={i}>
    <boxGeometry />
    <meshStandardMaterial color="red" />
  </mesh>
))}

// Good: Reuse single material
const material = useMemo(() => 
  new MeshStandardMaterial({ color: 'red' }), []
);

{objects.map((obj, i) => (
  <mesh key={i} material={material}>
    <boxGeometry />
  </mesh>
))}
```

### 3. Optimize Textures

```tsx
// Use appropriate texture sizes
const texture = useTexture('/texture.jpg');

useEffect(() => {
  // Don't need 4k textures for small objects
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.anisotropy = 4; // Lower for better performance
}, [texture]);
```

## Scene Optimization

### 1. Frustum Culling

Three.js does this automatically, but help it:

```tsx
// Enable frustum culling (default: true)
<mesh frustumCulled={true} />

// For objects that might clip camera
<mesh frustumCulled={false} />
```

### 2. Conditional Rendering

Don't render offscreen content:

```tsx
function ConditionalScene() {
  const [isVisible, setIsVisible] = useState(true);
  
  return (
    <Suspense fallback={null}>
      {isVisible && <ExpensiveScene />}
    </Suspense>
  );
}
```

### 3. Lazy Loading

Load heavy content on demand:

```tsx
const HeavyModel = lazy(() => import('./HeavyModel'));

<Suspense fallback={<Placeholder />}>
  {showModel && <HeavyModel />}
</Suspense>
```

### 4. Debounce Updates

Don't update 3D state every frame:

```tsx
const debouncedUpdate = useMemo(
  () => debounce((newState) => {
    setSceneState(newState);
  }, 16), // ~60fps
  []
);
```

## Animation Optimization

### 1. UseFrame Efficiently

```tsx
// Bad: Heavy computation every frame
useFrame(() => {
  const result = expensiveCalculation();
  meshRef.current.position.set(result.x, result.y, result.z);
});

// Good: Memoize or calculate outside frame
const positions = useMemo(() => 
  expensiveCalculation(), [dependencies]
);

useFrame(() => {
  meshRef.current.position.copy(positions);
});
```

### 2. Limit Frame Updates

```tsx
// Update every 3 frames for 20fps animation
useFrame(({ clock }) => {
  if (Math.floor(clock.elapsedTime * 20) % 3 !== 0) return;
  
  // Update animation
});
```

### 3. Use Clock Delta

```tsx
useFrame((state, delta) => {
  // delta = time since last frame
  // Use for framerate-independent animation
  meshRef.current.rotation.y += delta * 0.5;
});
```

## Memory Optimization

### 1. Dispose Unused Resources

```tsx
useEffect(() => {
  return () => {
    // Cleanup on unmount
    geometry.dispose();
    material.dispose();
    texture.dispose();
  };
}, [geometry, material, texture]);
```

### 2. Limit Object Count

```tsx
// Bad: Unlimited objects
{allObjects.map((obj, i) => <Mesh key={i} {...obj} />)}

// Good: Limit visible objects
{allObjects.slice(0, 100).map((obj, i) => 
  <Mesh key={i} {...obj} />
)}
```

### 3. Use Object Pooling

```tsx
const pool = useMemo(() => new ObjectPool(100), []);

// Reuse objects instead of creating new ones
const obj = pool.acquire();
// ... use object
pool.release(obj);
```

## Loading Optimization

### 1. Preload Assets

```tsx
import { useGLTF } from '@react-three/drei';

// Preload before rendering
useGLTF.preload('/models/bunny.glb');

function Scene() {
  const { nodes } = useGLTF('/models/bunny.glb');
  // Model loads instantly
}
```

### 2. Progressive Loading

```tsx
<Suspense fallback={<LowPolyVersion />}>
  <HighPolyModel />
</Suspense>
```

### 3. Use Draco Compression

Compressed GLTF models load faster:

```tsx
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const { scene } = useGLTF('/model-draco.glb', true);
```

## Mobile Optimization

### 1. Detect Mobile

```tsx
import { isMobile } from 'react-device-detect';

<Canvas
  dpr={isMobile ? [1, 1] : [1, 2]}
  shadows={!isMobile}
>
  {isMobile ? <MobileLights /> : <DesktopLights />}
</Canvas>
```

### 2. Reduce Quality on Mobile

```tsx
const quality = isMobile ? 'low' : 'high';

<directionalLight
  castShadow={!isMobile}
  shadow-mapSize={isMobile ? 512 : 2048}
/>
```

### 3. Simplify Effects

```tsx
{!isMobile && <EnvironmentMap />}
{!isMobile && <PostProcessing />}
{!isMobile && <Reflections />}
```

## Performance Checklist

### Before Optimizing
- [ ] Profile with Stats.js or Perf
- [ ] Identify bottlenecks (CPU vs GPU)
- [ ] Check memory usage
- [ ] Test on target devices

### Common Optimizations
- [ ] Set appropriate DPR
- [ ] Reduce shadow quality
- [ ] Lower geometry poly count
- [ ] Reuse materials
- [ ] Enable frustum culling
- [ ] Implement LOD for complex scenes
- [ ] Use instancing for repeated objects
- [ ] Debounce state updates
- [ ] Lazy load heavy assets
- [ ] Dispose unused resources

### Mobile Specific
- [ ] Detect mobile devices
- [ ] Disable shadows on mobile
- [ ] Use simpler materials
- [ ] Reduce object count
- [ ] Lower texture resolution
- [ ] Disable post-processing

## Debugging Performance

### Finding Bottlenecks

**GPU bound (low FPS, high GPU usage):**
- Too many triangles
- Too many lights
- High shadow resolution
- Complex materials
- Post-processing effects

**CPU bound (low FPS, low GPU usage):**
- Too many draw calls
- Complex JavaScript logic
- React re-renders
- Heavy useFrame logic

### Tools

**Drei Stats:**
```tsx
<Stats showPanel={0} /> {/* FPS */}
<Stats showPanel={1} /> {/* MS */}
<Stats showPanel={2} /> {/* MB */}
```

**R3F Perf:**
```tsx
<Perf 
  position="top-left"
  showGraph={true}
  minimal={false}
/>
```

**Chrome DevTools:**
- Performance > Record
- Check "Screenshots" and "Memory"
- Look for long tasks (>50ms)
- Check FPS meter

## Common Performance Mistakes

### 1. Creating Objects in Render

```tsx
// Bad
<mesh material={new MeshBasicMaterial()} />

// Good
const material = useMemo(() => new MeshBasicMaterial(), []);
<mesh material={material} />
```

### 2. Not Disposing Resources

```tsx
// Bad: Memory leak
useEffect(() => {
  const texture = textureLoader.load('/texture.jpg');
  // Never disposed
}, []);

// Good
useEffect(() => {
  const texture = textureLoader.load('/texture.jpg');
  return () => texture.dispose();
}, []);
```

### 3. Too Many Lights

```tsx
// Bad: 10 lights
{lights.map((light, i) => <directionalLight key={i} {...light} />)}

// Good: 2-3 carefully placed lights
<ambientLight intensity={0.5} />
<directionalLight position={[10, 10, 5]} />
```

### 4. Heavy useFrame Logic

```tsx
// Bad
useFrame(() => {
  // Expensive physics sim every frame
  const result = complexPhysicsSimulation();
  updatePositions(result);
});

// Good
useFrame(() => {
  // Light updates, heavy logic elsewhere
  updatePositionsFromPrecomputed();
});
```

## When to Optimize

### Optimize When:
- FPS consistently <30 on target device
- Memory usage >500MB
- Load time >5 seconds
- Dropped frames during interaction

### Don't Optimize When:
- FPS already >60
- Code becomes unreadable
- No measurable improvement
- Not a user-facing issue

## Benchmarking

Create performance test scenes:

```tsx
function BenchmarkScene() {
  const [objectCount, setObjectCount] = useState(100);
  
  return (
    <>
      <Stats />
      <Perf />
      
      {Array.from({ length: objectCount }).map((_, i) => (
        <Mesh key={i} position={[
          Math.random() * 20 - 10,
          Math.random() * 20 - 10,
          Math.random() * 20 - 10
        ]} />
      ))}
      
      <Html>
        <button onClick={() => setObjectCount(c => c + 100)}>
          Add 100 Objects ({objectCount})
        </button>
      </Html>
    </>
  );
}
```

Test on real devices and measure:
- FPS at different object counts
- Memory usage over time
- Load time with different assets
- Frame drops during interaction
