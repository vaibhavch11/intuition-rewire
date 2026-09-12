"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COLS = 12;
const ROWS = 3;
const SPACING = 0.68;
const COUNT = COLS * ROWS;

const BASE = new THREE.Color("#ddd9ff");
const PEAK = new THREE.Color("#3525cd");

// Same client-only gate as ParticleNetwork: renders nothing on the server
// without a setState-in-effect or a hydration mismatch.
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/** A row of memory cells with an index pointer sweeping across them. */
function Cells({ animate }: { animate: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  const cells = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        return {
          col,
          x: (col - (COLS - 1) / 2) * SPACING,
          y: (row - (ROWS - 1) / 2) * SPACING,
        };
      }),
    []
  );

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = animate ? clock.getElapsedTime() : 0;

    for (let i = 0; i < COUNT; i++) {
      const cell = cells[i];
      // A travelling wave: one narrow pulse walking the row, like an index.
      const swell = Math.sin(t * 1.15 - cell.col * 0.45);
      const intensity = Math.max(0, swell) ** 5;

      dummy.position.set(cell.x, cell.y + intensity * 0.16, intensity * 0.3);
      dummy.scale.setScalar(0.86 + intensity * 0.38);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      color.copy(BASE).lerp(PEAK, intensity);
      mesh.setColorAt(i, color);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    if (groupRef.current && animate) {
      groupRef.current.rotation.y = Math.sin(t * 0.16) * 0.22;
    }
  });

  return (
    <group ref={groupRef} rotation={[-0.32, 0.5, 0.12]}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
        <boxGeometry args={[0.46, 0.46, 0.46]} />
        <meshStandardMaterial roughness={0.55} metalness={0.05} />
      </instancedMesh>
    </group>
  );
}

export default function MemoryLattice() {
  const isClient = useIsClient();
  const reducedMotion = usePrefersReducedMotion();
  if (!isClient) return null;

  return (
    <Canvas
      orthographic
      camera={{ zoom: 62, position: [0, 0, 12] }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
      frameloop={reducedMotion ? "demand" : "always"}
    >
      <ambientLight intensity={1.9} />
      <directionalLight position={[4, 6, 8]} intensity={1.5} />
      <Cells animate={!reducedMotion} />
    </Canvas>
  );
}
