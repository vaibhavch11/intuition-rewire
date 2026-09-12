"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 46;
const CONNECT_DISTANCE = 2.4;
const BOUNDS = { x: 7.5, y: 3.6, z: 1.2 } as const;

type Axis = keyof typeof BOUNDS;
const AXES: Axis[] = ["x", "y", "z"];

type Particle = { position: THREE.Vector3; velocity: THREE.Vector3 };

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    position: new THREE.Vector3(
      (Math.random() * 2 - 1) * BOUNDS.x,
      (Math.random() * 2 - 1) * BOUNDS.y,
      (Math.random() * 2 - 1) * BOUNDS.z
    ),
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.012,
      (Math.random() - 0.5) * 0.012,
      (Math.random() - 0.5) * 0.006
    ),
  }));
}

// Subscribes to nothing — this is the standard client-only-render gate that
// avoids calling setState from an effect (and the SSR/hydration mismatch a
// plain `useState(false)` + `useEffect` would otherwise need).
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function Field() {
  const pointsGeoRef = useRef<THREE.BufferGeometry>(null);
  const linesGeoRef = useRef<THREE.BufferGeometry>(null);

  // Created lazily on the first animation tick (not during render) so the
  // one-time randomness here never runs inside a pure render function.
  const particlesRef = useRef<Particle[] | null>(null);
  // Deterministic (all-zero) allocations — safe to create during render.
  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const linePositions = useMemo(
    () => new Float32Array(PARTICLE_COUNT * PARTICLE_COUNT * 3),
    []
  );

  useFrame(() => {
    if (!particlesRef.current) particlesRef.current = createParticles();
    const particles = particlesRef.current;

    for (const p of particles) {
      p.position.add(p.velocity);
      for (const axis of AXES) {
        const bound = BOUNDS[axis];
        if (p.position[axis] > bound || p.position[axis] < -bound) {
          p.velocity[axis] *= -1;
        }
      }
    }

    particles.forEach((p, i) => {
      positions[i * 3] = p.position.x;
      positions[i * 3 + 1] = p.position.y;
      positions[i * 3 + 2] = p.position.z;
    });

    let lineCount = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        if (particles[i].position.distanceTo(particles[j].position) < CONNECT_DISTANCE) {
          linePositions.set(
            [
              particles[i].position.x,
              particles[i].position.y,
              particles[i].position.z,
              particles[j].position.x,
              particles[j].position.y,
              particles[j].position.z,
            ],
            lineCount * 6
          );
          lineCount++;
        }
      }
    }

    if (pointsGeoRef.current) {
      const attr = pointsGeoRef.current.getAttribute("position") as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }
    if (linesGeoRef.current) {
      const attr = linesGeoRef.current.getAttribute("position") as THREE.BufferAttribute;
      attr.needsUpdate = true;
      linesGeoRef.current.setDrawRange(0, lineCount * 2);
    }
  });

  return (
    <group>
      <points>
        <bufferGeometry ref={pointsGeoRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#3525cd" size={0.09} sizeAttenuation transparent opacity={0.75} />
      </points>
      <lineSegments>
        <bufferGeometry ref={linesGeoRef}>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#7c78e8" transparent opacity={0.22} />
      </lineSegments>
    </group>
  );
}

export default function ParticleNetwork() {
  const isClient = useIsClient();
  if (!isClient) return null;

  return (
    <Canvas
      orthographic
      camera={{ zoom: 60, position: [0, 0, 10] }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
    >
      <Field />
    </Canvas>
  );
}
