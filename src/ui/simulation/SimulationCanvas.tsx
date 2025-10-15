"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useShallow } from "zustand/react/shallow";
import { useSimulationStore } from "@/state/simulationStore";
import { GridWorldScene } from "./GridWorldScene";
import { cn } from "@/lib/utils";

interface SimulationCanvasProps {
  className?: string;
}

export function SimulationCanvas({ className }: SimulationCanvasProps) {
  const { frame, renderQuality } = useSimulationStore(
    useShallow((state) => ({ frame: state.frame, renderQuality: state.renderQuality }))
  );

  return (
    <div
      className={cn(
        "relative h-full min-h-[420px] w-full overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_center,_rgba(12,74,110,0.25),rgba(2,6,23,0.95))] shadow-[0_40px_160px_-60px_rgba(59,130,246,0.55)]",
        className
      )}
    >
      <Canvas camera={{ position: [0, 28, 28], fov: 42 }} shadows>
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 32, 80]} />
        <hemisphereLight args={["#1f2937", "#020617", 0.6]} />
        <directionalLight
          position={[22, 32, 16]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={4096}
          shadow-mapSize-height={4096}
        />
        <spotLight
          position={[-18, 28, -12]}
          angle={0.6}
          penumbra={0.35}
          intensity={1.1}
          color="#38bdf8"
          castShadow
        />
        <Suspense fallback={null}>
          <GridWorldScene frame={frame} quality={renderQuality} />
        </Suspense>
        <ContactShadows
          position={[0, -0.01, 0]}
          opacity={0.4}
          scale={frame.size * 2}
          blur={2.4}
          far={16}
        />
        <Environment background={false} resolution={256}>
          <group>
            <Lightformer
              form="ring"
              intensity={0.8}
              color="#38bdf8"
              scale={16}
              position={[-6, 8, -4]}
              rotation={[-Math.PI / 6, Math.PI / 4, 0]}
            />
            <Lightformer
              form="rect"
              intensity={0.5}
              color="#6366f1"
              scale={18}
              position={[4, 10, 6]}
              rotation={[-Math.PI / 3, Math.PI / 5, 0]}
            />
            <Lightformer
              form="ring"
              intensity={0.25}
              color="#facc15"
              scale={30}
              position={[0, -10, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            />
          </group>
        </Environment>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.25}
          maxPolarAngle={Math.PI * 0.6}
          minPolarAngle={Math.PI * 0.2}
        />
      </Canvas>
    </div>
  );
}
