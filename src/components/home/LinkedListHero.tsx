"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import Link from "@/components/Link";
import { useInView, usePrefersReducedMotion } from "@/components/home/clientHooks";

/*
 * A singly linked list in RAM, for the hero. Memory is a 6 × 3 grid of slots
 * 0x40 bytes apart; the list's nodes sit in scattered slots and only know the
 * address of the next one. The loop: the nodes are created one by one, then
 * `curr` walks the list hop by hop until it reaches null.
 */

const COLS = 6;
const CELL = 100;
const addressOf = (slot: number) => `0x${(0x100 + slot * 0x40).toString(16).toUpperCase()}`;

/** The list in order: each node's value and the memory slot it lives in. */
const NODES = [
  { value: 12, slot: 1 },
  { value: 7, slot: 14 },
  { value: 30, slot: 10 },
  { value: 9, slot: 5 },
];

const CODE = [
  { text: "// each node = value + address of next", comment: true },
  { text: "class Node { int val; Node next; }" },
  { text: "Node curr = head;" },
  { text: "while (curr != null) {" },
  { text: "    curr = curr.next;   // one hop" },
  { text: "}" },
];

type Frame = {
  ms: number; // how long this frame stays on screen
  size: number; // nodes created so far
  hops: number;
  curr: number; // index of curr's node; -1 before the walk, NODES.length at null
  line: number; // code line running
  title: string;
  left: string;
  right: string;
};

/** The whole loop, one frame after another, each held long enough to read. */
const FRAMES: Frame[] = [
  { ms: 900, size: 0, hops: 0, curr: -1, line: 0, title: "Nodes live anywhere in RAM", left: "memory: 18 free slots", right: "any free slot will do" },
  ...NODES.map((n, i): Frame => ({
    ms: 900,
    size: i + 1,
    hops: 0,
    curr: -1,
    line: 1,
    title: "Nodes live anywhere in RAM",
    left: `new Node(${n.value}) at ${addressOf(n.slot)}`,
    right: "any free slot will do",
  })),
  { ms: 1600, size: 4, hops: 0, curr: 0, line: 2, title: "Start at head", left: `curr = head = ${addressOf(NODES[0].slot)}`, right: "the only address we hold" },
  ...[1, 2, 3].map((h): Frame => ({
    ms: 1500,
    size: 4,
    hops: h,
    curr: h,
    line: 4,
    title: "Follow next, one hop at a time",
    left: `curr = ${addressOf(NODES[h].slot)}`,
    right: `hop ${h}: read next, jump there`,
  })),
  { ms: 2800, size: 4, hops: 4, curr: NODES.length, line: 3, title: "No index. Just next addresses.", left: "curr = null", right: "end of list after 4 hops" },
];

/** The frame shown, still, to anyone who prefers reduced motion. */
const STILL = FRAMES[FRAMES.length - 1];

const cellX = (slot: number) => (slot % COLS) * CELL;
const cellY = (slot: number) => Math.floor(slot / COLS) * CELL;

/** The centre of a slot, in the grid's own units. */
function centre(slot: number) {
  return { x: cellX(slot) + CELL / 2, y: cellY(slot) + CELL / 2 - 6 };
}

/** A gently curved arrow from one node to the next, trimmed to the node edges. */
function arrowPath(from: number, to: number) {
  const a = centre(from);
  const b = centre(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const start = { x: a.x + ux * 46, y: a.y + uy * 26 };
  const end = { x: b.x - ux * 46, y: b.y - uy * 28 };
  const cx = (start.x + end.x) / 2 - uy * 26;
  const cy = (start.y + end.y) / 2 + ux * 26;
  return `M${start.x.toFixed(1)} ${start.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function LinkedListHero() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!inView || reduced) return;
    const id = window.setTimeout(() => setIndex((i) => (i + 1) % FRAMES.length), FRAMES[index].ms);
    return () => window.clearTimeout(id);
  }, [index, inView, reduced]);

  const f = reduced ? STILL : FRAMES[index];
  // curr's tag glides between nodes; at null it rests on the last node and fades.
  const currNode = NODES[Math.min(Math.max(f.curr, 0), NODES.length - 1)];
  const currShown = f.curr >= 0 && f.curr < NODES.length;

  return (
    <div
      ref={ref}
      className="w-full rounded-3xl border border-outline-variant/60 bg-surface-container-lowest/90 p-space-lg shadow-[0_30px_70px_-40px_rgba(53,37,205,0.45)] backdrop-blur-sm sm:p-space-xl"
    >
      {/* Header: what this is, and two live counters */}
      <div className="flex items-center justify-between gap-space-md">
        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-primary-fixed/70 px-3 py-1 font-code-sm text-[10px] font-semibold uppercase tracking-[0.1em] text-primary sm:text-[11px] sm:tracking-[0.16em]">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Singly linked list
        </span>
        <span className="flex shrink-0 gap-1.5 font-code-sm text-[11px] sm:text-[12px]">
          <span className="whitespace-nowrap rounded-md border border-outline-variant/70 px-2 py-0.5 text-on-surface-variant">
            size{" "}
            <span key={`s${f.size}`} className="ll-fade inline-block min-w-[1ch] font-semibold text-primary">
              {f.size}
            </span>
          </span>
          <span className="whitespace-nowrap rounded-md border border-outline-variant/70 px-2 py-0.5 text-on-surface-variant">
            hops{" "}
            <span key={`h${f.hops}`} className="ll-fade inline-block min-w-[1ch] font-semibold text-[#d97706]">
              {f.hops}
            </span>
          </span>
        </span>
      </div>

      <p aria-live="polite" className="mt-space-md min-h-[32px] text-[22px] font-bold tracking-tight text-on-surface sm:text-[24px]">
        <span key={f.title} className="ll-fade inline-block">
          {f.title}
        </span>
      </p>

      {/* Memory: 18 slots, the list's nodes, the head and curr tags, and the arrows already followed */}
      <div className="mt-space-sm">
        <p className="mb-1 text-right font-code-sm text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/70">RAM</p>
        <svg viewBox={`0 0 ${COLS * CELL} ${3 * CELL}`} className="block w-full" role="img" aria-label="Memory slots with the list's nodes in scattered addresses">
          <defs>
            <marker id="ll-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" fill="var(--color-primary)" />
            </marker>
          </defs>

          {Array.from({ length: COLS * 3 }, (_, slot) => (
            <g key={slot}>
              <rect
                x={cellX(slot) + 4}
                y={cellY(slot) + 4}
                width={CELL - 8}
                height={CELL - 8}
                rx="8"
                fill="var(--color-surface-container-low)"
                stroke="var(--color-outline-variant)"
                strokeOpacity="0.5"
              />
              <text x={cellX(slot) + 12} y={cellY(slot) + CELL - 12} fontSize="10" fontFamily="var(--font-mono)" fill="var(--color-on-surface-variant)" opacity="0.55">
                {addressOf(slot)}
              </text>
            </g>
          ))}

          {/* Arrows for the hops taken so far; each draws itself in */}
          {NODES.slice(0, -1).map((n, i) => {
            const shown = f.hops > i;
            return (
              <path
                key={n.slot}
                d={arrowPath(n.slot, NODES[i + 1].slot)}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                markerEnd="url(#ll-arrow)"
                pathLength={1}
                strokeDasharray="1"
                style={{
                  strokeDashoffset: shown ? 0 : 1,
                  opacity: shown ? 0.9 : 0,
                  transition: `stroke-dashoffset 800ms ${EASE}, opacity ${shown ? 200 : 500}ms ease`,
                }}
              />
            );
          })}

          {NODES.map((n, i) => {
            const x = cellX(n.slot) + 8;
            const y = cellY(n.slot) + 20;
            const made = i < f.size;
            const next = NODES[i + 1];
            const isCurr = f.curr === i;
            const visited = f.curr > i;
            return (
              <g
                key={n.slot}
                style={{
                  opacity: made ? 1 : 0,
                  transform: made ? "translateY(0) scale(1)" : "translateY(6px) scale(0.9)",
                  transformOrigin: `${x + 42}px ${y + 23}px`,
                  transition: `opacity 500ms ease, transform 600ms ${EASE}`,
                }}
              >
                <rect
                  x={x}
                  y={y}
                  width="84"
                  height="46"
                  rx="7"
                  fill={isCurr ? "var(--color-primary-fixed)" : "var(--color-surface-container-lowest)"}
                  stroke="var(--color-primary)"
                  strokeWidth={isCurr ? 2.6 : 1.8}
                  strokeOpacity={visited ? 0.5 : 1}
                  style={{ transition: "fill 400ms ease, stroke-width 400ms ease, stroke-opacity 400ms ease" }}
                />
                <line x1={x + 36} y1={y} x2={x + 36} y2={y + 46} stroke="var(--color-primary)" strokeOpacity="0.45" strokeWidth="1.4" />
                <text x={x + 18} y={y + 30} textAnchor="middle" fontSize="19" fontWeight="700" fill="var(--color-on-surface)">
                  {n.value}
                </text>
                <text x={x + 60} y={y + 17} textAnchor="middle" fontSize="8.5" fontFamily="var(--font-mono)" fill="var(--color-on-surface-variant)">
                  next
                </text>
                <text x={x + 60} y={y + 33} textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono)" fill={next ? "var(--color-primary)" : "#e11d48"}>
                  {next ? addressOf(next.slot) : "null"}
                </text>
              </g>
            );
          })}

          {/* head: a dark tag above the first node, once the list is built */}
          <g style={{ opacity: f.size === NODES.length ? 1 : 0, transition: "opacity 500ms ease" }}>
            <rect x={cellX(NODES[0].slot) + 30} y={cellY(NODES[0].slot) + 3} width="40" height="14" rx="7" fill="var(--color-on-surface)" />
            <text x={cellX(NODES[0].slot) + 50} y={cellY(NODES[0].slot) + 13.5} textAnchor="middle" fontSize="9.5" fontWeight="600" fill="var(--color-surface-container-lowest)">
              head
            </text>
          </g>

          {/* curr: a purple tag under its node that glides along the list */}
          <g
            style={{
              transform: `translate(${cellX(currNode.slot)}px, ${cellY(currNode.slot)}px)`,
              opacity: currShown ? 1 : 0,
              transition: `transform 700ms ${EASE}, opacity 400ms ease`,
            }}
          >
            <path d="M47 68l3 -4 3 4z" fill="var(--color-primary)" />
            <rect x="32" y="68" width="36" height="14" rx="7" fill="var(--color-primary)" />
            <text x="50" y="78.5" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#fff">
              curr
            </text>
          </g>
        </svg>
      </div>

      {/* The code, with the running line lit */}
      <div className="mt-space-md overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-low/60">
        <div className="flex items-center gap-space-md border-b border-outline-variant/50 px-space-md py-1.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-[#f2605d]" />
            <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
            <span className="h-2 w-2 rounded-full bg-[#28c840]" />
          </span>
          <span className="font-code-sm text-[11px] text-on-surface-variant">SinglyLinkedList.java</span>
        </div>
        <pre className="m-0 py-1.5 font-code-sm text-[11.5px] leading-[20px]">
          {CODE.map((l, i) => (
            <div
              key={i}
              className={`flex border-l-2 pr-space-md transition-colors duration-500 ease-out ${
                i === f.line ? "border-primary bg-primary-fixed/60" : "border-transparent"
              }`}
            >
              <span className="w-8 shrink-0 select-none pr-space-sm text-right text-on-surface-variant/50">{i + 1}</span>
              <code className={`whitespace-pre ${l.comment ? "text-on-surface-variant/70" : "text-on-surface"}`}>{l.text}</code>
            </div>
          ))}
        </pre>
      </div>

      {/* Status bar */}
      <div className="mt-space-sm flex items-center justify-between gap-space-md rounded-lg bg-[#131b2e] px-space-md py-2 font-code-sm text-[11.5px] text-white/85 dark:bg-black/40">
        <span key={f.left} className="ll-fade truncate">
          {f.left}
        </span>
        <span key={f.right} className="ll-fade hidden shrink-0 text-white/60 sm:inline">
          {f.right}
        </span>
      </div>

      <div className="mt-space-base flex justify-end">
        <Link href="/dsa/singly-linked-list" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
          Open the Linked List course <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
