"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useInView, useIsClient, useMediaQuery, usePrefersReducedMotion } from "@/components/home/clientHooks";
import { useIsDark } from "@/components/ThemeToggle";
import { boxCorners, fitCamera } from "@/components/home/fitCamera";
import { ACCESS_COUNT, DRAM_NS, L1_NS, type MemoryTick } from "@/components/home/cacheLocality";

// A small slice of RAM: row 0 holds an array, rows 1–4 hold linked-list nodes.
const COLS = 16;
const ROWS = 5;
const PITCH = 0.6;
const BOARD_W = COLS * PITCH;
const N = ACCESS_COUNT;
const ARRAY_COL = 2; // the array fills columns 2–13 of one 64-byte cache line
/** [row, col] of each list node, in pointer order. */
const NODES: [number, number][] = [
  [2, 1], [4, 9], [1, 13], [3, 4], [4, 14], [1, 6],
  [3, 11], [2, 15], [4, 2], [1, 10], [3, 7], [2, 12],
];

// Seconds of animation per access. Not to scale: the real gap is wider.
const MISS_S = 0.45;
const HIT_S = 0.08;
const PERIOD_S = 7;


const TONE = {
  free: new THREE.Color("#f4f3f9"),
  array: new THREE.Color("#c9c4ff"),
  node: new THREE.Color("#ffcf99"),
  hit: new THREE.Color("#4edea3"),
  miss: new THREE.Color("#ff7a6e"),
  missed: new THREE.Color("#ffa69c"),
  arc: new THREE.Color("#c4c1dc"),
  arcDone: new THREE.Color("#ff8f84"),
};

/** Darker resting tiles and pointers for dark mode; hit/miss colours stay put. */
const DARK_TONE = {
  free: new THREE.Color("#283150"),
  array: new THREE.Color("#6d66e0"),
  node: new THREE.Color("#c98d4c"),
  arc: new THREE.Color("#4b5476"),
};

const cellX = (col: number) => (col - (COLS - 1) / 2) * PITCH;
const cellZ = (row: number) => row * PITCH - 1.2 + (row > 0 ? 0.3 : 0);

const readStart = (k: number) => (k === 0 ? 0 : MISS_S + (k - 1) * HIT_S);
const readEnd = (k: number) => (k === 0 ? MISS_S : MISS_S + k * HIT_S);
const arrival = (k: number) => (k + 1) * MISS_S;
const ARRAY_DONE = readEnd(N - 1);
const LIST_DONE = arrival(N - 1);


function Memory({ onTick, animate, dark }: { onTick: (tick: MemoryTick) => void; animate: boolean; dark: boolean }) {
  const tones = useMemo(() => (dark ? { ...TONE, ...DARK_TONE } : TONE), [dark]);
  const cells = useRef<THREE.InstancedMesh>(null);
  const line = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const pointer = useRef<THREE.Mesh>(null);
  const board = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const reported = useRef("");

  // What each cell is: part of the array, a list node, or free memory.
  const roles = useMemo(
    () =>
      Array.from({ length: ROWS * COLS }, (_, i) => {
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        if (row === 0 && col >= ARRAY_COL && col < ARRAY_COL + N) return { kind: "array" as const, k: col - ARRAY_COL };
        const k = NODES.findIndex(([r, c]) => r === row && c === col);
        return k >= 0 ? { kind: "node" as const, k } : { kind: "free" as const, k: -1 };
      }),
    []
  );
  const colors = useMemo(
    () => roles.map((r) => (r.kind === "array" ? TONE.array : r.kind === "node" ? TONE.node : TONE.free).clone()),
    [roles]
  );

  // The `next` pointers: an arc from each node to the one after it.
  const arcs = useMemo(() => {
    const at = ([r, c]: [number, number]) => new THREE.Vector3(cellX(c), 0.12, cellZ(r));
    const entry = at(NODES[0]).add(new THREE.Vector3(0, 1.6, 0));
    return NODES.map((node, k) => {
      const from = k === 0 ? entry : at(NODES[k - 1]);
      const to = at(node);
      const mid = from.clone().add(to).multiplyScalar(0.5);
      if (k > 0) mid.y += 0.7 + from.distanceTo(to) * 0.12;
      return new THREE.QuadraticBezierCurve3(from, mid, to);
    });
  }, []);
  const arcLines = useMemo(
    () =>
      arcs.slice(1).map(
        (curve) =>
          new THREE.Mesh(
            new THREE.TubeGeometry(curve, 48, 0.022, 6, false),
            new THREE.MeshBasicMaterial({ color: TONE.arc.clone() })
          )
      ),
    [arcs]
  );
  const lineGeometry = useMemo(() => new THREE.BoxGeometry(BOARD_W - 0.04, 0.34, 0.62), []);
  const lineEdges = useMemo(() => new THREE.EdgesGeometry(lineGeometry), [lineGeometry]);

  useEffect(
    () => () => {
      arcLines.forEach((l) => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      });
      lineGeometry.dispose();
      lineEdges.dispose();
    },
    [arcLines, lineGeometry, lineEdges]
  );

  useFrame((state, delta) => {
    const m = cells.current;
    if (!m) return;
    const t = animate ? state.clock.elapsedTime % PERIOD_S : PERIOD_S - 0.01;
    const fade = animate ? 1 - Math.exp(-delta * 14) : 1;

    roles.forEach((role, i) => {
      const row = Math.floor(i / COLS);
      const col = i % COLS;
      let tone = tones.free;
      let done = Infinity;
      if (role.kind === "array") {
        tone = tones.array;
        if (t >= readStart(role.k)) tone = role.k === 0 ? tones.miss : tones.hit;
        if (t >= readEnd(role.k)) {
          tone = role.k === 0 ? tones.missed : tones.hit;
          done = readEnd(role.k);
        }
      } else if (role.kind === "node") {
        tone = tones.node;
        const at = arrival(role.k);
        if (t >= at) {
          tone = t < at + 0.25 ? tones.miss : tones.missed;
          done = at;
        }
      }
      colors[i].lerp(tone, fade);
      const bounce = t >= done ? 0.14 * Math.exp(-(t - done) / 0.12) : 0;
      dummy.position.set(cellX(col), bounce, cellZ(row));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, colors[i]);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;

    // The first array read misses and streams the whole 64-byte line in.
    if (line.current) {
      const s = Math.min(1, t / MISS_S);
      line.current.scale.x = Math.max(0.001, s);
      line.current.position.x = (-BOARD_W / 2) * (1 - s);
    }

    // Array cursor: hops cell to cell, then bows out.
    if (head.current) {
      let k = N - 1;
      for (let j = 0; j < N; j++) if (t < readEnd(j)) { k = j; break; }
      const from = cellX(ARRAY_COL + Math.max(0, k - 1));
      const to = cellX(ARRAY_COL + k);
      const p = k === 0 ? 1 : Math.min(1, (t - readStart(k)) / (HIT_S * 0.6));
      head.current.position.set(from + (to - from) * p, 0.48, cellZ(0));
      head.current.scale.setScalar(Math.max(0.001, Math.min(1, (ARRAY_DONE + 0.5 - t) / 0.3)));
    }

    // List pointer: follows each `next` arc, one cold miss per node.
    if (pointer.current) {
      const k = Math.min(N - 1, Math.floor(t / MISS_S));
      const u = Math.min(1, (t - k * MISS_S) / MISS_S);
      const eased = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
      pointer.current.position.copy(arcs[k].getPoint(eased));
      pointer.current.position.y += 0.1;
      pointer.current.scale.setScalar(Math.max(0.001, Math.min(1, (LIST_DONE + 0.8 - t) / 0.3)));
    }
    // Each `next` arc appears as the pointer starts down it and turns red once followed.
    arcLines.forEach((l, j) => {
      l.visible = t >= (j + 1) * MISS_S;
      (l.material as THREE.MeshBasicMaterial).color.copy(t >= arrival(j + 1) ? tones.arcDone : tones.arc);
    });

    if (board.current && animate) board.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.25) * 0.04;

    // Report the running cost for the readouts under the scene.
    const arrayReads = roles.filter((r) => r.kind === "array" && t >= readEnd(r.k)).length;
    const listReads = Math.min(N, Math.floor(t / MISS_S));
    const tick = {
      arrayNs: arrayReads ? DRAM_NS + (arrayReads - 1) * L1_NS : 0,
      listNs: listReads * DRAM_NS,
      arrayMisses: arrayReads ? 1 : 0,
      listMisses: listReads,
    };
    const key = `${tick.arrayNs}/${tick.listNs}`;
    if (key !== reported.current) {
      reported.current = key;
      onTick(tick);
    }
  });

  return (
    <group ref={board}>
      <instancedMesh ref={cells} args={[undefined, undefined, ROWS * COLS]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.16, 0.5]} />
        <meshStandardMaterial roughness={0.48} metalness={0.02} />
      </instancedMesh>
      <mesh position={[0, -0.13, 0.2]} receiveShadow>
        <boxGeometry args={[BOARD_W + 0.4, 0.08, 4.1]} />
        <meshStandardMaterial color={dark ? "#1a2138" : "#ebe9f4"} roughness={0.9} />
      </mesh>
      <group position={[0, 0.06, cellZ(0)]}>
        <group ref={line}>
          <mesh geometry={lineGeometry}>
            <meshBasicMaterial color="#4f46e5" transparent opacity={0.08} depthWrite={false} />
          </mesh>
          <lineSegments geometry={lineEdges}>
            <lineBasicMaterial color="#4f46e5" transparent opacity={0.9} />
          </lineSegments>
        </group>
      </group>
      <mesh ref={head} castShadow>
        <sphereGeometry args={[0.1, 24, 16]} />
        <meshStandardMaterial color="#4f46e5" emissive="#4f46e5" emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={pointer} castShadow>
        <sphereGeometry args={[0.11, 24, 16]} />
        <meshStandardMaterial color="#f05d4f" emissive="#f05d4f" emissiveIntensity={0.25} />
      </mesh>
      {arcLines.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </group>
  );
}

/** Frames the board from above at any card size, arcs included. */
function Framing() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    const halfW = BOARD_W / 2 + 0.25;
    fitCamera(
      camera,
      new THREE.Vector3(0, 0.3, 0.2),
      new THREE.Vector3(0, 0.95, 0.62),
      boxCorners(new THREE.Vector3(-halfW, -0.17, -1.85), new THREE.Vector3(halfW, 0.7, 2.25)),
      { x: 0.96, y: 0.92 }
    );
  }, [camera, size]);
  return null;
}

export default function CacheLocalityScene({ onTick }: { onTick: (tick: MemoryTick) => void }) {
  const isClient = useIsClient();
  const reducedMotion = usePrefersReducedMotion();
  const dark = useIsDark();
  const box = useRef<HTMLDivElement>(null);
  const inView = useInView(box);
  // Phones: fewer pixels and a smaller shadow map — the difference is invisible
  // at that size, the GPU work is not.
  const touch = useMediaQuery("(pointer: coarse)");

  return (
    <div ref={box} className="h-full w-full">
      {isClient && (
        <Canvas
          flat
          shadows="percentage"
          dpr={touch ? [1, 1.5] : [1, 2]}
          frameloop={inView && !reducedMotion ? "always" : "demand"}
          gl={{ alpha: true, antialias: true }}
          camera={{ fov: 30, position: [0, 8, 6] }}
        >
          <Framing />
          <hemisphereLight args={["#ffffff", dark ? "#1c2340" : "#dedcf5", 1.7]} />
          <directionalLight
            position={[-4, 9, 5]}
            intensity={1.75}
            castShadow
            shadow-mapSize={touch ? [512, 512] : [1024, 1024]}
            shadow-camera-left={-6}
            shadow-camera-right={6}
            shadow-camera-top={4}
            shadow-camera-bottom={-4}
            shadow-bias={-0.001}
            shadow-normalBias={0.02}
          />
          <Memory onTick={onTick} animate={!reducedMotion} dark={dark} />
        </Canvas>
      )}
    </div>
  );
}
