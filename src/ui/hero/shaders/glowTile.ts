export const glowTileVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const glowTileFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uAccent;
  uniform float uPulse;
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(7.23, 157.31))) * 43758.5453);
  }

  void main() {
    vec2 centered = vUv - 0.5;
    float dist = length(centered) * 2.0;
    float ring = smoothstep(0.6, 0.1, abs(dist - 0.55));
    float swirl = sin((centered.x + centered.y) * 8.0 + uTime * 1.8);
    float noise = hash(vWorldPosition.xz * 0.25 + uTime * 0.1);
    float pulse = 0.4 + 0.6 * uPulse;
    float glow = ring * (0.55 + 0.45 * swirl) + noise * 0.2;
    float intensity = smoothstep(0.05, 0.0, dist - 1.0) * glow * pulse;

    vec3 color = uAccent * (0.35 + 0.65 * intensity);
    gl_FragColor = vec4(color, clamp(intensity, 0.0, 0.9));
  }
`;
