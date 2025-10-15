"use client";

import { forwardRef, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Grid, PresentationControls } from "@react-three/drei";
import { shaderMaterial } from "@react-three/drei";
import { animated, config, useSpring } from "@react-spring/three";
import {
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  PlaneGeometry,
  Shape,
  ShaderMaterial,
  TorusGeometry,
  Vector3,
} from "three";
import { cn, lerpColor } from "@/lib/utils";
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
  variant: number;
  seed: number;
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

const HexPylon = ({
  accent,
  position,
  seed,
  delay,
}: {
  accent: string;
  position: Vector3;
  seed: number;
  delay: number;
}) => {
  const coords = useMemo(() => position.toArray() as [number, number, number], [position]);
  const height = 0.7 + (seed % 5) * 0.12;
  const radius = TILE_SPACING * (0.24 + (seed % 3) * 0.04);
  const geometry = useMemo(
    () => new CylinderGeometry(radius * 0.65, radius, height, 6, 1, false),
    [radius, height]
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const [{ stretch, spin, glow }] = useSpring(() => ({
    from: { stretch: 0.85, spin: 0, glow: 0.4 },
    to: [
      { stretch: 1.24, spin: Math.PI * 2, glow: 1 },
      { stretch: 0.92, spin: Math.PI * 4, glow: 0.4 },
    ],
    loop: true,
    config: { mass: 0.9, tension: 58, friction: 16 },
    delay,
  }));

  return (
    <group position={coords}>
      <animated.mesh
        scale={stretch.to((v) => [1.02, v, 1.02])}
        rotation-y={spin}
        castShadow
      >
        <primitive object={geometry} attach="geometry" />
        <animated.meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={glow.to((v) => 0.35 + v * 0.35)}
          metalness={0.48}
          roughness={0.32}
        />
      </animated.mesh>
      <animated.mesh
        position={[0, height * 0.62, 0]}
        rotation-x={Math.PI / 2}
        scale={glow.to((v) => [0.7 + v * 0.2, 0.7 + v * 0.2, 1])}
        receiveShadow
      >
        <ringGeometry args={[radius * 0.72, radius * 0.98, 48]} />
        <meshStandardMaterial
          color={lerpColor(accent, "#e2e8f0", 0.2)}
          emissive={accent}
          emissiveIntensity={0.42}
          metalness={0.35}
          roughness={0.28}
          transparent
          opacity={0.78}
        />
      </animated.mesh>
    </group>
  );
};

const SignalLoop = ({
  accent,
  position,
  seed,
  delay,
}: {
  accent: string;
  position: Vector3;
  seed: number;
  delay: number;
}) => {
  const coords = useMemo(() => position.toArray() as [number, number, number], [position]);
  const torus = useMemo(() => new TorusGeometry(1.18 + (seed % 4) * 0.08, 0.22, 32, 72), [seed]);
  const glyphPlane = useMemo(() => new PlaneGeometry(1.8, 1.8, 8, 8), []);

  useEffect(() => {
    return () => {
      torus.dispose();
      glyphPlane.dispose();
    };
  }, [torus, glyphPlane]);

  const [{ pulse, tilt }] = useSpring(() => ({
    from: { pulse: 0, tilt: -0.2 },
    to: [
      { pulse: 1, tilt: 0.24 },
      { pulse: 0, tilt: -0.2 },
    ],
    loop: true,
    config: { mass: 1, tension: 65, friction: 18 },
    delay,
  }));

  return (
    <group position={coords}>
      <animated.mesh
        rotation-x={tilt}
        rotation-y={tilt.to((v) => v * 0.65)}
        castShadow
      >
        <primitive object={torus} attach="geometry" />
        <animated.meshStandardMaterial
          color={lerpColor(accent, "#facc15", 0.25)}
          emissive={accent}
          emissiveIntensity={pulse.to((v) => 0.4 + v * 0.45)}
          metalness={0.44}
          roughness={0.26}
        />
      </animated.mesh>
      <animated.mesh
        rotation-x={Math.PI / 2}
        scale={pulse.to((v) => [1 + v * 0.22, 1 + v * 0.22, 1])}
        position={[0, 0.05, 0]}
        receiveShadow
      >
        <primitive object={glyphPlane} attach="geometry" />
        <animated.meshStandardMaterial
          color={lerpColor(accent, "#bae6fd", 0.35)}
          emissive={accent}
          emissiveIntensity={pulse.to((v) => 0.2 + v * 0.45)}
          transparent
          opacity={0.48}
        />
      </animated.mesh>
    </group>
  );
};

const WaveSpire = ({
  accent,
  position,
  seed,
  delay,
}: {
  accent: string;
  position: Vector3;
  seed: number;
  delay: number;
}) => {
  const coords = useMemo(() => position.toArray() as [number, number, number], [position]);
  const shape = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, 0);
    s.quadraticCurveTo(0.3, 0.5, 0.12, 1.2);
    s.quadraticCurveTo(-0.08, 1.9, -0.02, 2.8);
    s.quadraticCurveTo(0.18, 3.3, 0, 3.9);
    return s;
  }, []);
  const extrude = useMemo(
    () =>
      new ExtrudeGeometry(shape, {
        steps: 32,
        depth: 0.4 + (seed % 4) * 0.06,
        bevelEnabled: true,
        bevelThickness: 0.18,
        bevelSize: 0.12,
        bevelSegments: 8,
      }),
    [shape, seed]
  );

  useEffect(() => {
    return () => {
      extrude.dispose();
    };
  }, [extrude]);

  const [spring] = useSpring(() => ({
    from: { wave: 0 },
    to: [
      { wave: 1 },
      { wave: -1 },
    ],
    loop: true,
    config: { mass: 1, tension: 45, friction: 12 },
    delay,
  }));

  return (
    <group position={coords}>
      <animated.mesh
        rotation-y={spring.wave.to((v) => v * 0.45)}
        rotation-z={spring.wave.to((v) => v * 0.22)}
        scale={spring.wave.to((v) => [1, 1 + v * 0.08, 1])}
        castShadow
      >
        <primitive object={extrude} attach="geometry" />
        <meshStandardMaterial
          color={lerpColor(accent, "#f5d0fe", 0.3)}
          emissive={accent}
          emissiveIntensity={0.38}
          metalness={0.42}
          roughness={0.33}
        />
      </animated.mesh>
      <animated.mesh position={[0, 2.1, 0]} rotation={[Math.PI / 2, 0, 0]} scale={spring.wave.to((v) => [1 + v * 0.1, 1 + v * 0.1, 1])}>
        <ringGeometry args={[0.65, 0.88, 42]} />
        <meshStandardMaterial
          color={lerpColor(accent, "#f0fdf4", 0.3)}
          emissive={accent}
          emissiveIntensity={0.26}
          transparent
          opacity={0.68}
        />
      </animated.mesh>
    </group>
  );
};

const HighlightElement = ({ accent, node }: { accent: string; node: HighlightConfig }) => {
  switch (node.variant) {
    case 0:
      return <GlowTile accent={accent} position={node.position} delay={node.delay} />;
    case 1:
      return <HexPylon accent={lerpColor(accent, "#38bdf8", 0.22)} position={node.position} seed={node.seed} delay={node.delay} />;
    case 2:
      return <SignalLoop accent={lerpColor(accent, "#f97316", 0.3)} position={node.position} seed={node.seed} delay={node.delay} />;
    case 3:
    default:
      return <WaveSpire accent={lerpColor(accent, "#c084fc", 0.35)} position={node.position} seed={node.seed} delay={node.delay} />;
  }
};

const BasePlatform = ({ accent, highlights }: { accent: string; highlights: Array<{ x: number; z: number }> }) => {
  const highlightNodes = useMemo<HighlightConfig[]>(() => {
    return highlights.map(({ x, z }, index) => ({
      key: `${x}-${z}-${index}`,
      position: new Vector3(x * TILE_SPACING, 0.12, z * TILE_SPACING),
      delay: 220 + index * 90,
      variant: index % 4,
      seed: ((x + 11) * 31 + (z + 17) * 17 + index * 13) % 97,
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
        <HighlightElement key={node.key} accent={accent} node={node} />
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

interface PolarPlacement {
  angle: number;
  radius: number;
  height: number;
}

const HelixSentinel = ({
  color,
  placement,
  delay,
}: {
  color: string;
  placement: PolarPlacement;
  delay: number;
}) => {
  const { angle, radius, height } = placement;
  const helixRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (helixRef.current) {
      helixRef.current.rotation.y += delta * 0.6;
    }
  });

  const position = useMemo(
    () => [Math.cos(angle) * radius, height, Math.sin(angle) * radius] as [number, number, number],
    [angle, radius, height]
  );

  const [{ scale, twist }] = useSpring(() => ({
    from: { scale: 0.88, twist: -0.4 },
    to: [
      { scale: 1.18, twist: 0.35 },
      { scale: 0.92, twist: -0.4 },
    ],
    loop: true,
    config: { mass: 1.1, tension: 90, friction: 18 },
    delay,
  }));

  return (
    <group ref={helixRef} position={position}>
      <animated.mesh scale={scale.to((v) => [v, v, v])} rotation-y={twist} castShadow>
        <torusKnotGeometry args={[1.4, 0.42, 140, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.78}
          metalness={0.55}
          roughness={0.28}
        />
      </animated.mesh>
    </group>
  );
};

const PulsePrism = ({
  color,
  placement,
  delay,
}: {
  color: string;
  placement: PolarPlacement;
  delay: number;
}) => {
  const { angle, radius, height } = placement;
  const position = useMemo(
    () => [Math.cos(angle) * radius, height, Math.sin(angle) * radius] as [number, number, number],
    [angle, radius, height]
  );

  const [{ scale, tilt }] = useSpring(() => ({
    from: { scale: 0.72, tilt: -0.5 },
    to: [
      { scale: 1.08, tilt: 0.4 },
      { scale: 0.72, tilt: -0.5 },
    ],
    loop: true,
    config: { mass: 0.9, tension: 70, friction: 12 },
    delay,
  }));

  return (
    <animated.mesh
      position={position}
      rotation-x={0.6}
      rotation-y={tilt}
      scale={scale.to((v) => [v, v * 1.2, v])}
      castShadow
    >
      <octahedronGeometry args={[1.28, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.58}
        metalness={0.42}
        roughness={0.34}
      />
    </animated.mesh>
  );
};

const SignalCapsule = ({
  color,
  placement,
  delay,
}: {
  color: string;
  placement: PolarPlacement;
  delay: number;
}) => {
  const { angle, radius, height } = placement;
  const capsuleRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (capsuleRef.current) {
      capsuleRef.current.rotation.y += delta * 0.32;
      capsuleRef.current.rotation.z += delta * 0.14;
    }
  });

  const position = useMemo(
    () => [Math.cos(angle) * radius, height, Math.sin(angle) * radius] as [number, number, number],
    [angle, radius, height]
  );

  const [{ bob, shimmer }] = useSpring(() => ({
    from: { bob: -0.55, shimmer: 0 },
    to: [
      { bob: 0.55, shimmer: 1 },
      { bob: -0.55, shimmer: 0 },
    ],
    loop: true,
    config: { mass: 1.4, tension: 42, friction: 14 },
    delay,
  }));

  return (
    <group position={position}>
      <animated.group ref={capsuleRef} position={bob.to((v) => [0, v, 0])}>
        <mesh castShadow>
          <capsuleGeometry args={[0.72, 1.8, 14, 28]} />
          <animated.meshStandardMaterial
            color={lerpColor(color, "#f472b6", 0.32)}
            emissive={lerpColor(color, "#f472b6", 0.1)}
            emissiveIntensity={shimmer.to((v) => 0.35 + v * 0.45)}
            metalness={0.5}
            roughness={0.35}
          />
        </mesh>
        <animated.mesh
          rotation={[Math.PI / 2, 0, 0]}
          scale={shimmer.to((v) => [1 + v * 0.22, 1 + v * 0.22, 1])}
        >
          <ringGeometry args={[1.08, 1.32, 48]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.36}
            transparent
            opacity={0.65}
          />
        </animated.mesh>
      </animated.group>
    </group>
  );
};

const DataGlyph = ({
  color,
  placement,
  delay,
}: {
  color: string;
  placement: PolarPlacement;
  delay: number;
}) => {
  const { angle, radius, height } = placement;
  const glyphRef = useRef<Group>(null);
  const wireframeGeometry = useMemo(() => new IcosahedronGeometry(1.42, 0), []);

  useEffect(() => {
    return () => {
      wireframeGeometry.dispose();
    };
  }, [wireframeGeometry]);

  useFrame((_, delta) => {
    if (glyphRef.current) {
      glyphRef.current.rotation.y += delta * 0.48;
      glyphRef.current.rotation.x += delta * 0.18;
    }
  });

  const position = useMemo(
    () => [Math.cos(angle) * radius, height, Math.sin(angle) * radius] as [number, number, number],
    [angle, radius, height]
  );

  const [spring] = useSpring(() => ({
    from: { scale: 0.76 },
    to: [
      { scale: 1.08 },
      { scale: 0.76 },
    ],
    loop: true,
    config: { mass: 1, tension: 74, friction: 16 },
    delay,
  }));

  return (
    <group ref={glyphRef} position={position}>
      <animated.mesh scale={spring.scale.to((v) => [v, v, v])} castShadow>
        <sphereGeometry args={[1.28, 48, 48]} />
        <meshStandardMaterial
          color={lerpColor(color, "#e0f2fe", 0.4)}
          emissive={color}
          emissiveIntensity={0.32}
          metalness={0.35}
          roughness={0.26}
          transparent
          opacity={0.82}
        />
      </animated.mesh>
      <lineSegments>
        <edgesGeometry attach="geometry" args={[wireframeGeometry]} />
        <lineBasicMaterial
          attach="material"
          color={color}
          transparent
          opacity={0.85}
        />
      </lineSegments>
    </group>
  );
};

const ShowcaseMeshes = ({ accent }: { accent: string }) => {
  const palette = useMemo(() => [
    accent,
    lerpColor(accent, "#f97316", 0.35),
    lerpColor(accent, "#34d399", 0.4),
    lerpColor(accent, "#c084fc", 0.48),
  ], [accent]);

  return (
    <group>
      <HelixSentinel
        color={palette[0]}
        placement={{ angle: Math.PI * 0.05, radius: TILE_SPACING * 3.4, height: 4.1 }}
        delay={90}
      />
      <PulsePrism
        color={palette[1]}
        placement={{ angle: Math.PI * 0.52, radius: TILE_SPACING * 3.1, height: 3.4 }}
        delay={240}
      />
      <SignalCapsule
        color={palette[2]}
        placement={{ angle: Math.PI * 1.08, radius: TILE_SPACING * 3.6, height: 3.9 }}
        delay={420}
      />
      <DataGlyph
        color={palette[3]}
        placement={{ angle: Math.PI * 1.58, radius: TILE_SPACING * 3.25, height: 4.6 }}
        delay={520}
      />
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
          <ShowcaseMeshes accent={accent} />
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
