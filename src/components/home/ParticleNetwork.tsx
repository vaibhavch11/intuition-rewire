"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useInView, useIsClient, usePrefersReducedMotion } from "./clientHooks";

/** The desktop field: 46 particles spread over ±7.5 units across. */
const MAX_PARTICLES = 46;
const MAX_HALF_WIDTH = 7.5;
const CONNECT_DISTANCE = 2.4;
const CONNECT_DISTANCE_SQ = CONNECT_DISTANCE * CONNECT_DISTANCE;
const HALF_HEIGHT = 3.6;
const HALF_DEPTH = 1.2;

type Bounds = { x: number; y: number; z: number };
type Axis = keyof Bounds;
const AXES: Axis[] = ["x", "y", "z"];

type Particle = { position: THREE.Vector3; velocity: THREE.Vector3 };

/** One line segment's two endpoints, reused for every segment of every frame. */
const SEGMENT = new Float32Array(6);
function segment(a: THREE.Vector3, b: THREE.Vector3): Float32Array {
  SEGMENT[0] = a.x;
  SEGMENT[1] = a.y;
  SEGMENT[2] = a.z;
  SEGMENT[3] = b.x;
  SEGMENT[4] = b.y;
  SEGMENT[5] = b.z;
  return SEGMENT;
}

function createParticles(count: number, bounds: Bounds): Particle[] {
  return Array.from({ length: count }, () => ({
    position: new THREE.Vector3(
      (Math.random() * 2 - 1) * bounds.x,
      (Math.random() * 2 - 1) * bounds.y,
      (Math.random() * 2 - 1) * bounds.z
    ),
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.012,
      (Math.random() - 0.5) * 0.012,
      (Math.random() - 0.5) * 0.006
    ),
  }));
}

function Field() {
  const pointsGeoRef = useRef<THREE.BufferGeometry>(null);
  const linesGeoRef = useRef<THREE.BufferGeometry>(null);

  // Created lazily on the first frame (not during render) so the one-time
  // randomness never runs inside a pure render function. A narrow screen only
  // shows the middle of the desktop field, so it gets a narrower field with
  // proportionally fewer particles: the same density for less work.
  const fieldRef = useRef<{ particles: Particle[]; bounds: Bounds } | null>(null);
  // Sized for the desktop field; a narrower one uses the start of each buffer.
  const positions = useMemo(() => new Float32Array(MAX_PARTICLES * 3), []);
  const linePositions = useMemo(() => new Float32Array(MAX_PARTICLES * MAX_PARTICLES * 3), []);

  useFrame(({ viewport }) => {
    if (!fieldRef.current) {
      const halfWidth = Math.min(MAX_HALF_WIDTH, viewport.width / 2 + 0.5);
      const count = Math.max(12, Math.round((MAX_PARTICLES * halfWidth) / MAX_HALF_WIDTH));
      const bounds = { x: halfWidth, y: HALF_HEIGHT, z: HALF_DEPTH };
      fieldRef.current = { particles: createParticles(count, bounds), bounds };
      pointsGeoRef.current?.setDrawRange(0, count);
    }
    const { particles, bounds } = fieldRef.current;
    const count = particles.length;

    for (const p of particles) {
      p.position.add(p.velocity);
      for (const axis of AXES) {
        const bound = bounds[axis];
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

    // Copied through one reused scratch segment: no arrays allocated per
    // frame, so no garbage-collection pauses mid-scroll.
    let lineCount = 0;
    for (let i = 0; i < count; i++) {
      const a = particles[i].position;
      for (let j = i + 1; j < count; j++) {
        const b = particles[j].position;
        if (a.distanceToSquared(b) < CONNECT_DISTANCE_SQ) {
          linePositions.set(segment(a, b), lineCount * 6);
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
  const reducedMotion = usePrefersReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapperRef);

  return (
    <div ref={wrapperRef} className="h-full w-full">
      {isClient && (
        // Draws only while on screen: scrolled away (or with reduced motion)
        // it keeps its last frame instead of redrawing 60 times a second.
        <Canvas
          orthographic
          camera={{ zoom: 60, position: [0, 0, 10] }}
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 1.5]}
          frameloop={inView && !reducedMotion ? "always" : "demand"}
        >
          <Field />
        </Canvas>
      )}
    </div>
  );
}
