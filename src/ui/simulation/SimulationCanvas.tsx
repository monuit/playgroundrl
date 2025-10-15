"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, SSAO } from "@react-three/postprocessing";
import { useShallow } from "zustand/react/shallow";
import { useSimulationStore } from "@/state/simulationStore";
import { GridWorldScene } from "./GridWorldScene";

export function SimulationCanvas() {
  const { frame, renderQuality } = useSimulationStore(
    useShallow((state) => ({ frame: state.frame, renderQuality: state.renderQuality }))
  );

  return (
    <div className="h-[520px] w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/60 shadow-[0_30px_120px_-60px_rgba(56,189,248,0.75)] backdrop-blur">
      <Canvas camera={{ position: [0, 26, 26], fov: 45 }} shadows>
        <color attach="background" args={["#020617"]} />
        <hemisphereLight args={["#1e293b", "#020617", 0.8]} />
        <directionalLight
          position={[18, 24, 12]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Suspense fallback={null}>
          <GridWorldScene frame={frame} />
          {renderQuality === "high" ? (
            <EffectComposer multisampling={0} enableNormalPass>
              <SSAO radius={0.3} intensity={35} luminanceInfluence={0.5} />
              <Bloom intensity={0.7} luminanceThreshold={0.2} luminanceSmoothing={0.8} mipmapBlur />
            </EffectComposer>
          ) : null}
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}
