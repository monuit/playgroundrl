"use client";

import { forwardRef, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Grid, PresentationControls } from "@react-three/drei";
import { shaderMaterial } from "@react-three/drei";
import { animated, config, useSpring } from "@react-spring/three";
import { CatmullRomCurve3, Color, Group, ShaderMaterial, Vector3 } from "three";
import { cn } from "@/lib/utils";
import { glowTileVertex, glowTileFragment } from "@/ui/hero/shaders/glowTile";

const TILE_SPACING = 7.5;
const AGENT_HEIGHT = 2.6;

const GlowTileMaterial = shaderMaterial(
  { uTime: 0, uAccent: new Color("#38bdf8"), uPulse: 0 },
  glowTileVertex,
  glowTileFragment
);

export interface HeroSceneProps {
  accent: string;
  path: Array<{ x: number; z: number }>;
  highlights: Array<{ x: number; z: number }>;
  running: boolean;
  resetSignal: number;
  className?: string;
}

const AgentModel = forwardRef<Group, { accent: string }>(({ accent }, ref) => {
  const rim = useMemo(() => new Color(accent).multiplyScalar(1.6).getStyle(), [accent]);

  return (
    <group ref={ref}>
      <mesh castShadow position-y={AGENT_HEIGHT * 0.72}>
        <sphereGeometry args={[AGENT_HEIGHT * 0.48, 48, 32]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.45} roughness={0.25} />
      </mesh>

      <mesh castShadow position-y={AGENT_HEIGHT * 0.42}>
        <torusKnotGeometry args={[AGENT_HEIGHT * 0.2, AGENT_HEIGHT * 0.075, 128, 18]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.55}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      <mesh castShadow position-y={AGENT_HEIGHT * 0.16} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[AGENT_HEIGHT * 0.42, AGENT_HEIGHT * 0.62, 64]} />
        <meshStandardMaterial
          color={rim}
          emissive={accent}
          emissiveIntensity={0.4}
          metalness={0.35}
          roughness={0.4}
          transparent
          opacity={0.65}
        />
      </mesh>

      <mesh castShadow position-y={AGENT_HEIGHT * 0.05}>
        <cylinderGeometry args={[AGENT_HEIGHT * 0.38, AGENT_HEIGHT * 0.52, AGENT_HEIGHT * 0.28, 36]} />
        <meshStandardMaterial color={accent} metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  );
});
AgentModel.displayName = "AgentModel";

interface HighlightConfig {
  key: string;
  position: Vector3;
  delay: number;
}

const GlowTile = ({ accent, position, delay }: { accent: string; position: Vector3; delay: number }) => {
  const materialRef = useRef<ShaderMaterial | null>(null);

  if (!materialRef.current) {
    const instance = new GlowTileMaterial();
    instance.uniforms.uAccent.value = new Color(accent);
    instance.transparent = true;
    instance.depthWrite = false;
    materialRef.current = instance as ShaderMaterial;
  }

  useEffect(() => {
    materialRef.current?.uniforms.uAccent.value.set(accent);
  }, [accent]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.uPulse.value = pulse.get();
    }
  });

  const [{ scale, pulse }] = useSpring(() => ({
    from: { scale: 0, pulse: 0 },
    to: [
      { scale: 1.04, pulse: 1 },
      { scale: 0.92, pulse: 0.1 },
    ],
    loop: true,
    config: config.slow,
    delay,
  }));

  return (
    <animated.mesh
      position={position.toArray()}
      rotation={[-Math.PI / 2, 0, 0]}
  scale={scale.to((v: number) => [v, v, v])}
      receiveShadow
    >
      <circleGeometry args={[TILE_SPACING * 0.62, 48]} />
      <primitive object={materialRef.current!} attach="material" />
    </animated.mesh>
  );
};

const BasePlatform = ({ accent, highlights }: { accent: string; highlights: Array<{ x: number; z: number }> }) => {
  const highlightNodes = useMemo<HighlightConfig[]>(() => {
    return highlights.map(({ x, z }, index) => ({
      key: `${x}-${z}-${index}`,
      position: new Vector3(x * TILE_SPACING, 0.12, z * TILE_SPACING),
      delay: 220 + index * 90,
    }));
  }, [highlights]);

  const [rippleSpring] = useSpring(() => ({
    from: { ripple: 0.96 },
    to: [
      { ripple: 1.04 },
      { ripple: 0.96 },
    ],
    loop: true,
    config: { mass: 2.4, tension: 36, friction: 14 },
  }));

  return (
    <group>
      <animated.mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.32, 0]}
        scale={rippleSpring.ripple.to((v: number) => [v, v, v])}
        receiveShadow
      >
        <ringGeometry args={[TILE_SPACING * 2.6, TILE_SPACING * 4.8, 96]} />
        <meshStandardMaterial color="#0f172a" metalness={0.2} roughness={0.85} />
      </animated.mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.28, 0]} receiveShadow>
        <circleGeometry args={[TILE_SPACING * 4.6, 96]} />
        <meshStandardMaterial color="#02091c" metalness={0.12} roughness={0.92} />
      </mesh>

      <Grid
        args={[TILE_SPACING * 8, TILE_SPACING * 8]}
        position={[0, 0.04, 0]}
        cellSize={TILE_SPACING}
        cellColor={new Color(accent).lerp(new Color("#94a3b8"), 0.35).getStyle()}
        cellThickness={0.96}
        sectionSize={TILE_SPACING * 4}
        sectionColor={new Color(accent).lerp(new Color("#1e293b"), 0.75).getStyle()}
        sectionThickness={1.8}
        fadeDistance={0}
        fadeStrength={0}
        infiniteGrid={false}
      />

      {highlightNodes.map((node) => (
        <GlowTile key={node.key} accent={accent} position={node.position} delay={node.delay} />
      ))}
    </group>
  );
};

const Goal = ({ position, accent }: { position: Vector3; accent: string }) => {
  const [goalSpring] = useSpring(() => ({
    from: { wave: 1, glow: 0.4 },
    to: [
      { wave: 1.28, glow: 0.95 },
      { wave: 1, glow: 0.4 },
    ],
    loop: true,
    config: config.slow,
  }));

  return (
    <group position={position.toArray()}>
      <animated.mesh
        position-y={AGENT_HEIGHT * 0.36}
        castShadow
        rotation-x={Math.PI / 2}
  scale={goalSpring.wave.to((v: number) => [v, v, v])}
      >
        <torusGeometry args={[AGENT_HEIGHT * 0.54, AGENT_HEIGHT * 0.12, 42, 64]} />
        <animated.meshStandardMaterial
          color={accent}
          emissive={accent}
          metalness={0.45}
          roughness={0.28}
          emissiveIntensity={goalSpring.glow}
        />
      </animated.mesh>
      <animated.mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.08, 0]}
        scale={goalSpring.wave.to((v: number) => [v * 1.05, v * 1.05, v * 1.05])}
      >
        <circleGeometry args={[AGENT_HEIGHT * 0.68, 48]} />
        <animated.meshStandardMaterial
          color={accent}
          transparent
          opacity={goalSpring.glow.to((v: number) => 0.25 + v * 0.2)}
        />
      </animated.mesh>
    </group>
  );
};

const OrbitingDrones = ({ accent }: { accent: string }) => {
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.22;
    }
  });

  const drones = useMemo(() => {
    return Array.from({ length: 8 }).map((_, index) => ({
      radius: TILE_SPACING * (3.2 + (index % 2) * 0.28),
      height: 4.2 + (index % 3) * 0.8,
      angle: (index / 8) * Math.PI * 2,
    }));
  }, []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
  {drones.map((drone, index) => (
        <Float key={index} speed={1.7} rotationIntensity={0.35} floatIntensity={0.9}>
          <mesh
            position={[
              Math.cos(drone.angle) * drone.radius,
              drone.height,
              Math.sin(drone.angle) * drone.radius,
            ]}
            castShadow
          >
            <icosahedronGeometry args={[1.15, 0]} />
            <meshStandardMaterial
              color={accent}
              emissive={accent}
              emissiveIntensity={0.95}
              metalness={0.45}
              roughness={0.35}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
};

const PathRibbon = ({ accent, points }: { accent: string; points: Vector3[] }) => {
  const curve = useMemo(() => {
    if (points.length < 2) {
      return null;
    }

    const flattened = points.map((point) => new Vector3(point.x, 0.4, point.z));
    if (flattened.length > 2) {
      flattened.push(flattened[0].clone());
    }
    return new CatmullRomCurve3(flattened, flattened.length > 3, "catmullrom", 0.65);
  }, [points]);

  if (!curve) {
    return null;
  }

  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, Math.max(180, points.length * 48), 0.75, 16, true]} />
      <meshStandardMaterial
        color={accent}
        emissive={accent}
        emissiveIntensity={0.42}
        roughness={0.38}
        metalness={0.45}
        transparent
        opacity={0.32}
      />
    </mesh>
  );
};

const AnimatedScene = ({
  accent,
  pathPoints,
  highlights,
  running,
  resetSignal,
}: {
  accent: string;
  pathPoints: Vector3[];
  highlights: Array<{ x: number; z: number }>;
  running: boolean;
  resetSignal: number;
}) => {
  const runningRef = useRef(running);
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const startingPoint = useMemo(() => pathPoints[0] ?? new Vector3(0, 0, 0), [pathPoints]);

  const [agentMotion, agentApi] = useSpring(() => ({
    position: startingPoint.toArray() as [number, number, number],
    heading: 0,
    config: { mass: 1.6, tension: 55, friction: 18 },
  }));

  useEffect(() => {
    agentApi.stop();
    agentApi.set({
      position: startingPoint.toArray() as [number, number, number],
      heading: 0,
    });

    if (!runningRef.current || pathPoints.length < 2) {
      return;
    }

    let cancelled = false;
    let currentIndex = 0;

    const tick = () => {
      if (cancelled || !runningRef.current) {
        return;
      }

      const nextIndex = (currentIndex + 1) % pathPoints.length;
      const from = pathPoints[currentIndex];
      const to = pathPoints[nextIndex];
      const direction = new Vector3().subVectors(to, from);
      const heading = Math.atan2(direction.x, direction.z);

      agentApi.start({
        position: to.toArray() as [number, number, number],
        heading,
        config: { mass: 1.4, tension: 50, friction: 16 },
        onRest: () => {
          if (cancelled) {
            return;
          }
          currentIndex = nextIndex;
          tick();
        },
      });
    };

    tick();

    return () => {
      cancelled = true;
      agentApi.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal, pathPoints, agentApi]);

  useEffect(() => {
    if (!running) {
      agentApi.stop();
      agentApi.set({
        position: startingPoint.toArray() as [number, number, number],
        heading: 0,
      });
    }
  }, [running, startingPoint, agentApi]);

  const [hoverSpring] = useSpring(() => ({
    from: { hover: -0.24 },
    to: [
      { hover: 0.32 },
      { hover: -0.24 },
    ],
    loop: true,
    config: { mass: 1.2, tension: 28, friction: 12 },
  }));

  const goalPosition = useMemo(() => pathPoints[pathPoints.length - 1] ?? new Vector3(0, 0, 0), [pathPoints]);

  return (
    <group>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[48, 80, 60]}
        intensity={1.1}
        color={new Color(accent).lerp(new Color("#f97316"), 0.45).getStyle()}
        castShadow
      />
      <directionalLight position={[-70, 60, -40]} intensity={0.6} color="#60a5fa" />
      <spotLight
        position={[0, 160, 0]}
        intensity={1.15}
        angle={0.6}
        penumbra={0.5}
        color={accent}
        castShadow
      />

      <PresentationControls
        global
        rotation={[Math.PI * 0.16, 0.1, 0]}
        polar={[Math.PI / 5.2, Math.PI / 2.8]}
        azimuth={[-Math.PI / 4.6, Math.PI / 4.6]}
      >
        <group position={[0, -5.8, 0]}>
          <BasePlatform accent={accent} highlights={highlights} />
          <PathRibbon accent={accent} points={pathPoints} />
          <OrbitingDrones accent={accent} />
          <Goal accent={accent} position={goalPosition} />

          <animated.group position={agentMotion.position} rotation-y={agentMotion.heading}>
            <animated.group position-y={hoverSpring.hover}>
              <AgentModel accent={accent} />
            </animated.group>
          </animated.group>
        </group>
      </PresentationControls>
    </group>
  );
};

export function HeroScene({ accent, path, highlights, running, resetSignal, className }: HeroSceneProps) {
  const pathPoints = useMemo(() => {
    if (!path.length) {
      return [new Vector3(0, 0, 0)];
    }
    return path.map(({ x, z }) => new Vector3(x * TILE_SPACING, 0, z * TILE_SPACING));
  }, [path]);

  return (
    <div className={cn("h-full w-full overflow-hidden bg-[#010516]", className)}>
      <Canvas camera={{ position: [0, 58, 142], fov: 36 }} shadows dpr={[1, 2]}>
        <color attach="background" args={["#020617"]} />
        <fog attach="fog" args={["#020617", 120, 280]} />
        <Float floatIntensity={0.5} rotationIntensity={0.08} speed={0.7}>
          <AnimatedScene
            accent={accent}
            pathPoints={pathPoints}
            highlights={highlights}
            running={running}
            resetSignal={resetSignal}
          />
        </Float>
      </Canvas>
    </div>
  );
}

export default HeroScene;
