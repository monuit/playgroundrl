# 3D Rendering Architecture

This document explains the 3D rendering architecture in PlaygroundRL, including the portal system, state management integration, and rendering patterns.

## Architecture Overview

PlaygroundRL uses **two different rendering approaches** depending on the use case:

### 1. Portal-Based Rendering (New - PPO Bunny Pattern)

Used for: **Landing page hero scenes and interactive demos**

```plaintext
Root Layout (layout.tsx)
  └── AppLayout (wraps children)
       ├── {children} (DOM content)
       └── Scene (fixed, behind content)
            └── Canvas (persistent, single instance)
                 └── <r3f.Out /> (portal outlet)

View Components (anywhere in app)
  └── <View> (portal inlet)
       └── <r3f.In>
            └── 3D Content (portaled to Canvas)
```

**How it works:**

1. Single `<Canvas>` mounted once at root level (via AppLayout)
2. Canvas is positioned fixed behind all DOM content
3. `tunnel-rat` creates a portal bridge (`r3f`)
4. `<View>` components anywhere in the app inject content into the persistent Canvas
5. Multiple Views can exist simultaneously, each rendering to different screen regions

**Benefits:**
- Single WebGL context (better performance)
- Seamless integration with DOM (can overlay HTML on 3D)
- No Canvas mounting/unmounting (smooth transitions)
- Multiple 3D views on same page

**Files:**
- `src/lib/scene-portal.ts` - tunnel-rat configuration
- `src/components/canvas/Scene.tsx` - Persistent Canvas
- `src/components/dom/AppLayout.tsx` - Layout wrapper
- `src/components/canvas/View.tsx` - Portal view component

### 2. Direct Canvas Rendering (Original Pattern)

Used for: **Training dashboards and full-screen simulations**

```
Component
  └── <Canvas> (direct mount)
       └── 3D Content
```

**How it works:**
1. Each component creates its own `<Canvas>` directly
2. Canvas occupies the full container
3. No portal system needed
4. Independent WebGL context

**Benefits:**
- Simpler for dedicated 3D views
- Self-contained components
- No dependencies on global portal

**Files:**
- `src/ui/simulation/SimulationCanvas.tsx` - Training simulation
- `src/ui/env/EnvCanvas.tsx` - Environment testing

## When to Use Which Pattern

### Use Portal System When:
- ✅ Multiple 3D views on same page
- ✅ 3D content needs to integrate with DOM layers
- ✅ Landing pages / hero sections
- ✅ Interactive demos embedded in content
- ✅ Shared 3D context across components

### Use Direct Canvas When:
- ✅ Full-screen dedicated 3D view
- ✅ Training/simulation dashboards
- ✅ Standalone 3D applications
- ✅ No need for DOM overlay
- ✅ Self-contained component

## State Management Integration

### Portal System + Local State (Hero Scenes)

PlaygroundHero uses **local component state**:

```tsx
const [activeEnvId, setActiveEnvId] = useState<HeroEnvId>(defaultEnvId);
const [running, setRunning] = useState(false);
const [sceneState, setSceneState] = useState<unknown>(null);

// Environment simulation
const env = envDefinition.create();
const result = env.step(action);
setSceneState(result.state);

// Render with portal
<View className="absolute inset-0">
  <SceneComponent state={sceneState} />
</View>
```

### Direct Canvas + Global State (Training Dashboard)

SimulationCanvas uses **Zustand global state**:

```tsx
const { frame, environment, level } = useSimulationStore(
  useShallow((state) => ({
    frame: state.frame,
    environment: state.environment,
    level: state.level,
  }))
);

// Render directly
<Canvas>
  <EnvironmentRenderer environment={environment} level={level} />
</Canvas>
```

## Component Communication Patterns

### Pattern 1: Props Down (Local State)

```tsx
// Parent manages state
function App() {
  const [data, setData] = useState();
  
  return (
    <View>
      <Scene3D data={data} />
    </View>
  );
}
```

### Pattern 2: Global Store (Zustand)

```tsx
// Store
export const useGameStore = create((set) => ({
  position: [0, 0, 0],
  updatePosition: (pos) => set({ position: pos }),
}));

// Consumer
function Player() {
  const { position, updatePosition } = useGameStore();
  // ...
}
```

### Pattern 3: Ref Forwarding (Direct Access)

```tsx
const meshRef = useRef();

// Parent can access child's 3D object
<Mesh ref={meshRef} />

// Later
meshRef.current.position.set(x, y, z);
```

## Performance Considerations

### Portal System Performance

**Pros:**
- Single WebGL context (saves memory)
- No context switching overhead
- Better for mobile

**Cons:**
- All Views share same render loop
- Heavy scene in one View affects all Views
- More complex debugging

**Optimization:**
```tsx
// Suspend unused Views
<Suspense fallback={null}>
  <View>
    {isVisible && <ExpensiveScene />}
  </View>
</Suspense>
```

### Direct Canvas Performance

**Pros:**
- Isolated render loops
- Can optimize each Canvas independently
- Easier to profile

**Cons:**
- Multiple WebGL contexts (memory heavy)
- Context switching overhead
- Not suitable for mobile with many canvases

**Optimization:**
```tsx
// Lower DPR for performance
<Canvas dpr={[1, 1.5]}>
  {/* Lower shadow quality */}
  <directionalLight castShadow shadow-mapSize={1024} />
</Canvas>
```

## Migration Guide

### Converting Direct Canvas to Portal System

**Before:**
```tsx
function MyComponent() {
  return (
    <div className="h-screen">
      <Canvas>
        <PerspectiveCamera position={[10, 10, 10]} />
        <MyScene />
      </Canvas>
    </div>
  );
}
```

**After:**
```tsx
function MyComponent() {
  return (
    <div className="h-screen">
      <View className="absolute inset-0">
        <PerspectiveCamera position={[10, 10, 10]} />
        <MyScene />
      </View>
    </div>
  );
}
```

**Steps:**
1. Replace `<Canvas>` with `<View>`
2. Remove Canvas props (handled by Scene.tsx)
3. Keep camera and scene content
4. Ensure AppLayout is in root layout

### Converting Portal to Direct Canvas

**Before:**
```tsx
<View className="w-full h-full">
  <MyScene />
</View>
```

**After:**
```tsx
<Canvas shadows dpr={[1, 2]}>
  <MyScene />
</Canvas>
```

## Debugging

### Portal System Issues

**3D content not appearing:**
1. Check AppLayout is wrapping children in root layout
2. Verify Scene.tsx is mounting
3. Check View has valid className dimensions
4. Inspect `<r3f.Out />` is in Scene.tsx

**Multiple Views not working:**
1. Each View needs unique tracking ref
2. Views need defined screen regions (position: absolute, etc.)
3. Check z-index if Views overlap

**Console commands:**
```tsx
// In Scene.tsx, add temporary logging
<r3f.Out />
{console.log('Portal outlet rendered')}
```

### Direct Canvas Issues

**Canvas not rendering:**
1. Check container has height defined
2. Verify Canvas camera is positioned correctly
3. Check lights are present
4. Inspect browser console for WebGL errors

**Performance issues:**
1. Lower `dpr` to `[1, 1]`
2. Reduce `shadow-mapSize`
3. Use fewer lights
4. Check object count with stats

## Examples

### Example 1: Hero with Portal
```tsx
// PlaygroundHero.tsx
<div className="h-screen">
  <View className="absolute inset-0">
    <PerspectiveCamera makeDefault position={[18, 16, 28]} fov={42} />
    <BunnyScene state={sceneState} />
  </View>
  
  <div className="relative z-10">
    <h1>PlaygroundRL</h1>
    <button>Run</button>
  </div>
</div>
```

### Example 2: Dashboard with Direct Canvas
```tsx
// TrainingDashboard.tsx
<div className="flex h-screen">
  <Sidebar />
  
  <div className="flex-1">
    <Canvas shadows camera={{ position: [0, 28, 28] }}>
      <SimulationScene />
      <OrbitControls />
    </Canvas>
  </div>
</div>
```

### Example 3: Multiple Views on One Page
```tsx
function MultiViewPage() {
  return (
    <div className="grid grid-cols-2 h-screen">
      <View className="relative">
        <PerspectiveCamera makeDefault position={[10, 10, 10]} />
        <Scene1 />
      </View>
      
      <View className="relative">
        <PerspectiveCamera makeDefault position={[5, 5, 5]} />
        <Scene2 />
      </View>
    </div>
  );
}
```

## Best Practices

1. **Use portal system for landing pages** - Better UX with HTML/3D integration
2. **Use direct Canvas for dashboards** - Simpler, isolated contexts
3. **Minimize View count** - Portal system has overhead per View
4. **Suspend unused scenes** - Don't render offscreen content
5. **Profile both approaches** - Choose based on actual performance needs
6. **Keep scenes lightweight** - Especially in portal system (shared context)
7. **Use LOD (Level of Detail)** - Reduce complexity when not in focus
8. **Debounce state updates** - Don't update 3D state on every React render

## Future Improvements

- [ ] Implement View pooling for better performance
- [ ] Add View intersection observer (only render visible Views)
- [ ] Create hybrid approach (portal + dedicated Canvas when needed)
- [ ] Add performance monitoring for portal system
- [ ] Implement automatic View suspense based on FPS
