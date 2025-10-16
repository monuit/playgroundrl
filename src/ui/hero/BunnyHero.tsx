'use client';

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@/lib/r3f-canvas";
import { R3FProvider } from "@/lib/R3FProvider";
import { OrbitControls, PerspectiveCamera, Grid } from "@react-three/drei";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const GRID_DIMENSION = 25;
const TILE_SIZE = 1.25;

interface TileConfig {
  position: THREE.Vector3;
  scale: number;
  color: THREE.Color;
}

function generateTileConfigs(): TileConfig[] {
  const tiles: TileConfig[] = [];
  const half = (GRID_DIMENSION - 1) / 2;

  for (let x = 0; x < GRID_DIMENSION; x += 1) {
    for (let z = 0; z < GRID_DIMENSION; z += 1) {
      const offsetX = x - half;
      const offsetZ = z - half;
      const distance = Math.sqrt(offsetX ** 2 + offsetZ ** 2);
      const wave = Math.sin(distance * 0.65) * 0.5 + Math.cos(offsetX * 0.35) * 0.3;
      const height = THREE.MathUtils.lerp(0.3, 3.6, (wave + 1.3) / 2.6);
      const hue = THREE.MathUtils.mapLinear(distance, 0, half, 0.55, 0.65);

      const color = new THREE.Color();
      color.setHSL(hue, 0.62, 0.54);

      tiles.push({
        position: new THREE.Vector3(offsetX * TILE_SIZE, height / 2 - 1.5, offsetZ * TILE_SIZE),
        scale: height,
        color,
      });
    }
  }

  return tiles;
}

function TileField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummyObject = useMemo(() => new THREE.Object3D(), []);
  const tiles = useMemo(() => generateTileConfigs(), []);

  useEffect(() => {
    if (!meshRef.current) {
      return;
    }

    tiles.forEach((tile, index) => {
      dummyObject.position.copy(tile.position);
      dummyObject.scale.set(1, tile.scale, 1);
      dummyObject.updateMatrix();
      meshRef.current?.setMatrixAt(index, dummyObject.matrix);
      if (meshRef.current?.setColorAt) {
        meshRef.current.setColorAt(index, tile.color);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [tiles, dummyObject]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, tiles.length]} castShadow receiveShadow>
      <boxGeometry args={[TILE_SIZE * 0.92, 1, TILE_SIZE * 0.92]} />
      <meshStandardMaterial vertexColors metalness={0.15} roughness={0.55} />
    </instancedMesh>
  );
}

export function BunnyHero() {
  return (
    <div className="relative flex min-h-screen w-full flex-col text-white">
      <R3FProvider>
        <Canvas
          className="absolute inset-0 h-full w-full"
          shadows
          dpr={[1, 1.75]}
          camera={{ position: [14, 12, 26], fov: 45 }}
        >
          <color attach="background" args={["#050312"]} />
          <fog attach="fog" args={["#050312", 35, 80]} />

          <ambientLight intensity={0.35} />
          <directionalLight
            castShadow
            intensity={1.1}
            position={[24, 32, 14]}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <spotLight
            position={[-18, 18, -8]}
            angle={0.45}
            penumbra={0.4}
            intensity={0.6}
            color={new THREE.Color().setHSL(0.12, 0.6, 0.6)}
          />

          <Suspense fallback={null}>
            <group position={[0, -1.2, 0]}>
              <TileField />
              <Grid args={[120, 120]} position={[0, -1.5, 0]} cellColor="#222836" sectionColor="#2a3245" fadeDistance={70} />
            </group>
          </Suspense>

          <PerspectiveCamera makeDefault position={[0, 12, 28]} fov={45} />
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            autoRotate
            autoRotateSpeed={0.45}
            maxPolarAngle={Math.PI / 2.4}
            minPolarAngle={Math.PI / 3.4}
          />
        </Canvas>
      </R3FProvider>

      <div className="relative z-10 flex grow flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-3xl space-y-6">
          <span className="text-sm uppercase tracking-[0.4em] text-white/60">Reinforcement Learning Playground</span>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Train autonomous agents in richly simulated worlds.
          </h1>
          <p className="text-balance text-lg text-white/70 sm:text-xl">
            Visualize policies, compare algorithms, and iterate faster with a full browser-based RL workbench inspired by the
            original PPO Bunny experience.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/docs">Explore the Docs</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" asChild>
              <Link href="#training">Jump into Training</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
