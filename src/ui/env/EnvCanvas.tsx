"use client";

import { Suspense, useMemo, type ComponentType } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ENV_LOOKUP, ENVIRONMENTS } from "@/env";

interface EnvCanvasProps {
  envId: string;
  metadata?: Record<string, unknown>;
}

export function EnvCanvas({ envId, metadata }: EnvCanvasProps) {
  const safeDefinition = ENV_LOOKUP[envId] ?? ENVIRONMENTS[0];
  const fallbackState = useMemo<unknown>(() => {
    if (!safeDefinition) {
      return undefined;
    }
    const instance = safeDefinition.create();
    const initial = instance.reset();
    if (initial && typeof initial === "object" && "metadata" in initial) {
      return (initial as { metadata?: unknown }).metadata;
    }
    return undefined;
  }, [safeDefinition]);
  if (!safeDefinition) {
    return null;
  }
  const Scene = safeDefinition.Scene as ComponentType<{ state: unknown }>;
  const sceneState = metadata ?? fallbackState ?? {};

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <Canvas camera={{ position: [0, 160, 220], fov: 42 }}>
        <color attach="background" args={["#f8fafc"]} />
        <ambientLight intensity={0.4} />
        <Suspense fallback={null}>
          {Scene && <Scene state={sceneState} />}
        </Suspense>
        <OrbitControls enableZoom={false} enableRotate={false} enablePan={false} />
      </Canvas>
    </div>
  );
}
