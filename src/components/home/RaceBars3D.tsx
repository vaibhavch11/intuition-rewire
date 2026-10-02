"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useIsClient, usePrefersReducedMotion } from "@/components/home/clientHooks";
import { useIsDark } from "@/components/ThemeToggle";
import { boxCorners, fitCamera } from "@/components/home/fitCamera";

export type BarFocus = { kind: "compare" | "swap"; a: number; b: number } | null;

const PITCH = 0.44;
const WIDTH = 0.33;
const DEPTH = 0.42;
const MAX_HEIGHT = 3.6;
/** Each bar turns green this many ms after its left neighbour when a lane finishes. */
const WAVE_MS = 16;

const TONES = {
  idle: new THREE.Color("#cbc8ff"),
  compare: new THREE.Color("#4f46e5"),
  swap: new THREE.Color("#ffa53d"),
  sorted: new THREE.Color("#4edea3"),
};

/**
 * One instance per value, so a bar keeps its identity and physically slides to
 * its new slot on every swap instead of changing height in place.
 */
function Bars({ values, focus, finished, animate }: { values: number[]; focus: BarFocus; finished: boolean; animate: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((s) => s.invalidate);
  const count = values.length;
  const xs = useRef<Float32Array | null>(null);
  const colors = useMemo(() => Array.from({ length: count + 1 }, () => TONES.idle.clone()), [count]);
  const finishedAt = useRef<number | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Frames are drawn on demand: wake the loop whenever the race moves.
  useEffect(() => {
    invalidate();
  }, [values, focus, finished, invalidate]);

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const slot = (i: number) => (i - (count - 1) / 2) * PITCH;
    if (!xs.current) {
      xs.current = new Float32Array(count + 1);
      values.forEach((v, i) => (xs.current![v] = slot(i)));
    }
    const now = state.clock.elapsedTime;
    if (!finished) finishedAt.current = null;
    else if (finishedAt.current === null) finishedAt.current = now;

    const slide = animate ? 1 - Math.exp(-delta * 18) : 1;
    const fade = animate ? 1 - Math.exp(-delta * 32) : 1;
    let busy = false;

    values.forEach((v, i) => {
      const x = slot(i);
      const cur = xs.current![v];
      const next = Math.abs(x - cur) < 0.002 ? x : cur + (x - cur) * slide;
      xs.current![v] = next;
      if (next !== x) busy = true;

      let tone = TONES.idle;
      if (finished) {
        const since = animate ? (now - finishedAt.current!) * 1000 - i * WAVE_MS : 1;
        if (since > 0) tone = TONES.sorted;
        else busy = true;
      } else if (focus && (focus.a === i || focus.b === i)) {
        tone = focus.kind === "swap" ? TONES.swap : TONES.compare;
      }
      const c = colors[v];
      c.lerp(tone, fade);
      if (Math.abs(c.r - tone.r) + Math.abs(c.g - tone.g) + Math.abs(c.b - tone.b) < 0.003) c.copy(tone);
      else busy = true;

      const h = (v / count) * MAX_HEIGHT;
      // Bars heading opposite ways pass at different depths instead of through each other.
      const lane = Math.max(-0.32, Math.min(0.32, (x - next) * 0.8));
      dummy.position.set(next, h / 2, lane);
      dummy.scale.set(WIDTH, h, DEPTH);
      dummy.updateMatrix();
      m.setMatrixAt(v - 1, dummy.matrix);
      m.setColorAt(v - 1, c);
    });

    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    if (busy) state.invalidate();
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.38} metalness={0.02} />
    </instancedMesh>
  );
}

/** Keeps the whole row in frame at any card width, seen slightly from above. */
function Framing({ width }: { width: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const half = width / 2;
    fitCamera(
      camera,
      new THREE.Vector3(0, MAX_HEIGHT * 0.5, 0),
      new THREE.Vector3(0, 0.2, 1),
      boxCorners(new THREE.Vector3(-half, -0.12, -0.58), new THREE.Vector3(half, MAX_HEIGHT, 0.58)),
      { x: 0.95, y: 0.9 }
    );
    invalidate();
  }, [camera, size, width, invalidate]);
  return null;
}

export default function RaceBars3D({ values, focus, finished }: { values: number[]; focus: BarFocus; finished: boolean }) {
  const isClient = useIsClient();
  const reducedMotion = usePrefersReducedMotion();
  const dark = useIsDark();
  if (!isClient) return null;
  const span = values.length * PITCH;

  return (
    <Canvas
      flat
      shadows="percentage"
      frameloop="demand"
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      camera={{ fov: 26, position: [0, 3, 12] }}
    >
      <Framing width={span + 0.5} />
      <hemisphereLight args={["#ffffff", dark ? "#1c2340" : "#dedcf5", 2]} />
      <directionalLight
        position={[3.5, 8, 6]}
        intensity={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={6}
        shadow-camera-bottom={-3}
        shadow-bias={-0.001}
        shadow-normalBias={0.03}
      />
      <Bars values={values} focus={focus} finished={finished} animate={!reducedMotion} />
      {/* The tray the bars stand on. */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[span + 0.5, 0.12, 1.15]} />
        <meshStandardMaterial color={dark ? "#2a3352" : "#eeedf7"} roughness={0.85} />
      </mesh>
    </Canvas>
  );
}
