import type { ReactNode } from "react";

/*
 * One icon per course: a tiny, colourful diagram of the structure itself,
 * drawn flat on a 32×32 grid with one outline weight. The outline and the
 * "paper" behind empty shapes come from CSS variables, so the set works on
 * light and dark backgrounds alike.
 */

const C = {
  blue: "#4d9ef5",
  sky: "#a8d8ff",
  red: "#f2605d",
  yellow: "#ffd25e",
  teal: "#3fc1b5",
  aqua: "#8ce0ea",
  purple: "#8b6cf6",
  pink: "#ff9fb6",
  paper: "var(--icon-paper)",
  ink: "var(--icon-ink)",
} as const;

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  // A short line with a small open arrowhead at (x2, y2).
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 2.3;
  const a1 = angle + Math.PI - 0.55;
  const a2 = angle + Math.PI + 0.55;
  // Rounded so the server and the browser print the same path (their trig
  // can differ in the last digit, which would break hydration).
  const r = (n: number) => Math.round(n * 100) / 100;
  return (
    <path
      d={`M${x1} ${y1}L${x2} ${y2}M${r(x2 + head * Math.cos(a1))} ${r(y2 + head * Math.sin(a1))}L${x2} ${y2}L${r(x2 + head * Math.cos(a2))} ${r(y2 + head * Math.sin(a2))}`}
      fill="none"
    />
  );
}

function Node({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  return <circle cx={cx} cy={cy} r={r} fill={fill} />;
}

const ICONS: Record<string, ReactNode> = {
  arrays: (
    <>
      {[0, 1, 2].flatMap((row) =>
        [C.blue, C.aqua, C.sky].map((fill, col) => (
          <rect
            key={`${row}-${col}`}
            x={2.5 + col * 9.5}
            y={2.5 + row * 9.5}
            width="8"
            height="8"
            rx="1.6"
            fill={row === 1 && col === 1 ? C.red : fill}
          />
        ))
      )}
    </>
  ),
  strings: (
    <>
      {[C.yellow, C.pink, C.aqua].map((fill, i) => (
        <rect key={i} x={1.8 + i * 9.8} y="8.5" width="8.8" height="15" rx="1.8" fill={fill} />
      ))}
      {["a", "b", "c"].map((ch, i) => (
        <text
          key={ch}
          x={6.2 + i * 9.8}
          y="19.6"
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          stroke="none"
          fill="#1e2235"
          fontFamily="var(--font-jetbrains-mono), monospace"
        >
          {ch}
        </text>
      ))}
    </>
  ),
  "singly-linked-list": (
    <>
      <path d="M19.3 8H24c4.7 0 4.7 8 0 8H8c-4.7 0-4.7 8 0 8h4.4" fill="none" />
      <path d="M10.6 22.2l2.1 1.8-2.1 1.8" fill="none" />
      <Arrow x1={9.3} y1={8} x2={12.6} y2={8} />
      <Arrow x1={19.3} y1={24} x2={22.6} y2={24} />
      <Node cx={6} cy={8} r={3.2} fill={C.teal} />
      <Node cx={16} cy={8} r={3.2} fill={C.yellow} />
      <Node cx={16} cy={24} r={3.2} fill={C.red} />
      <Node cx={26} cy={24} r={3.2} fill={C.blue} />
    </>
  ),
  "doubly-linked-list": (
    <>
      {[C.red, C.aqua, C.yellow].map((fill, i) => (
        <rect key={i} x={1.5 + i * 10.75} y="9" width="7.5" height="14" rx="1.6" fill={fill} />
      ))}
      <Arrow x1={9.4} y1={13.5} x2={12} y2={13.5} />
      <Arrow x1={12} y1={18.5} x2={9.4} y2={18.5} />
      <Arrow x1={20.15} y1={13.5} x2={22.75} y2={13.5} />
      <Arrow x1={22.75} y1={18.5} x2={20.15} y2={18.5} />
    </>
  ),
  "hash-table": (
    <>
      {[C.sky, C.red, C.sky, C.blue].map((fill, i) => (
        <rect key={i} x="2.5" y={3 + i * 7} width="7" height="5" rx="1.1" fill={fill} />
      ))}
      <Arrow x1={10} y1={12.5} x2={14.2} y2={12.5} />
      <rect x="14.5" y="10" width="6" height="5" rx="1.1" fill={C.yellow} />
      <Arrow x1={20.8} y1={12.5} x2={24.2} y2={12.5} />
      <rect x="24.5" y="10" width="5.5" height="5" rx="1.1" fill={C.teal} />
      <Arrow x1={10} y1={26.5} x2={14.2} y2={26.5} />
      <rect x="14.5" y="24" width="6" height="5" rx="1.1" fill={C.pink} />
    </>
  ),
  stack: (
    <>
      <rect x="6" y="24" width="20" height="5" rx="1.4" fill={C.sky} />
      <rect x="6" y="18.5" width="20" height="5" rx="1.4" fill={C.aqua} />
      <rect x="6" y="13" width="20" height="5" rx="1.4" fill={C.blue} />
      <Arrow x1={16} y1={2.5} x2={16} y2={10} />
    </>
  ),
  queue: (
    <>
      {[C.red, C.yellow, C.aqua].map((fill, i) => (
        <rect key={i} x={8.5 + i * 6.5} y="9" width="5.8" height="14" rx="1.4" fill={fill} />
      ))}
      <Arrow x1={31} y1={16} x2={28.2} y2={16} />
      <Arrow x1={7.6} y1={16} x2={1.4} y2={16} />
    </>
  ),
  "binary-tree": (
    <>
      <path d="M14.2 8.9 10.3 14.1M17.8 8.9 21.7 14.1M7.3 19.3 5.5 23.7M9.7 19.3 11.5 23.7M24.7 19.3 26.5 23.7" />
      <Node cx={16} cy={6.5} r={3} fill={C.yellow} />
      <Node cx={8.5} cy={16.5} r={3} fill={C.aqua} />
      <Node cx={23.5} cy={16.5} r={3} fill={C.aqua} />
      <Node cx={4.5} cy={26} r={2.5} fill={C.red} />
      <Node cx={12.5} cy={26} r={2.5} fill={C.teal} />
      <Node cx={27.5} cy={26} r={2.5} fill={C.red} />
    </>
  ),
  "binary-search-tree": (
    <>
      <path d="M14.2 8.9 10.3 14.1M7.3 19.3 5.5 23.7M9.7 19.3 11.5 23.7" />
      <path d="M17.8 8.9 21.7 14.1M22.3 19.3 20.5 23.7" strokeWidth="2.3" />
      <rect x="12.6" y="3.4" width="6.8" height="6.2" rx="1.4" fill={C.red} />
      <rect x="5.1" y="13.4" width="6.8" height="6.2" rx="1.4" fill={C.aqua} />
      <rect x="20.1" y="13.4" width="6.8" height="6.2" rx="1.4" fill={C.yellow} />
      <rect x="1.8" y="23.4" width="5.4" height="5.2" rx="1.2" fill={C.sky} />
      <rect x="9.8" y="23.4" width="5.4" height="5.2" rx="1.2" fill={C.sky} />
      <rect x="16.8" y="23.4" width="5.4" height="5.2" rx="1.2" fill={C.yellow} />
    </>
  ),
  heap: (
    <>
      <path d="M14.3 8.6 10.6 14.2M17.7 8.6 21.4 14.2M8.2 19.1 6 23.4M9.8 19.1 12 23.4M22.2 19.1 20 23.4M23.8 19.1 26 23.4" />
      <Node cx={16} cy={6} r={3.2} fill={C.aqua} />
      <path d="M14.6 6.1l1 1 1.9-2" fill="none" />
      <Node cx={9} cy={16.5} r={2.7} fill={C.sky} />
      <Node cx={23} cy={16.5} r={2.7} fill={C.red} />
      {[
        [5, C.red],
        [13, C.sky],
        [19, C.sky],
        [27, C.yellow],
      ].map(([cx, fill]) => (
        <Node key={cx} cx={cx as number} cy={26} r={2.3} fill={fill as string} />
      ))}
    </>
  ),
  graph: (
    <>
      <path d="M8.5 7.4 15.4 5.4M20.4 6.3 25 12.2M26.2 16.7 21.5 23.8M17.3 25.6 9.7 22.9M6.5 19.3 6.1 10.8M8.6 9.3 24.4 13.6M8.7 20.6 25.3 15.8" />
      <Node cx={6} cy={8} r={3} fill={C.blue} />
      <Node cx={18} cy={4.8} r={3} fill={C.purple} />
      <Node cx={27} cy={14.2} r={3} fill={C.yellow} />
      <Node cx={20} cy={26} r={3} fill={C.aqua} />
      <Node cx={7} cy={22} r={3} fill={C.red} />
    </>
  ),
  trie: (
    <>
      <path d="M14.4 6.1 9.6 11M17.6 6.1 22.4 11M7.1 15.4 4.9 20.2M8.9 15.4 11.1 20.2M24 15.6V20" />
      <Node cx={16} cy={4.5} r={2.3} fill={C.purple} />
      <Node cx={8} cy={13} r={2.7} fill={C.yellow} />
      <Node cx={24} cy={13} r={2.7} fill={C.teal} />
      <Node cx={4} cy={23} r={2.4} fill={C.sky} />
      <circle cx="12" cy="23" r="4" fill="none" />
      <Node cx={12} cy={23} r={2.4} fill={C.red} />
      <circle cx="24" cy="23" r="4" fill="none" />
      <Node cx={24} cy={23} r={2.4} fill={C.red} />
    </>
  ),
  sorting: (
    <>
      {[
        [3, 8, C.sky],
        [10, 13, C.aqua],
        [17, 18, C.yellow],
        [24, 23, C.red],
      ].map(([x, h, fill]) => (
        <rect key={x as number} x={x as number} y={28 - (h as number)} width="5" height={h as number} rx="1.2" fill={fill as string} />
      ))}
      <path d="M2 29.2h28" />
    </>
  ),
  searching: (
    <>
      <path d="M20.2 20.2l7.8 7.8" strokeWidth="3.4" />
      <path d="M20.2 20.2l7.8 7.8" stroke={C.blue} strokeWidth="1.6" />
      <circle cx="13.5" cy="13.5" r="9" fill={C.sky} />
      {[8, 12.25, 16.5].map((x, i) => (
        <rect key={x} x={x} y="11" width="3.5" height="5" rx="0.8" fill={i === 1 ? C.red : C.yellow} />
      ))}
    </>
  ),
  recursion: (
    <>
      <rect x="3" y="3" width="26" height="26" rx="4" fill={C.sky} />
      <rect x="8" y="8" width="16" height="16" rx="3" fill={C.yellow} />
      <rect x="12.5" y="12.5" width="7" height="7" rx="2" fill={C.red} />
    </>
  ),
  "dynamic-programming": (
    <>
      {[0, 1, 2].flatMap((row) =>
        [0, 1, 2].map((col) => {
          const index = row * 3 + col;
          const fill = row === 1 && col === 2 ? C.red : index < 5 ? (index % 2 ? C.aqua : C.teal) : C.paper;
          return <rect key={index} x={3 + col * 9} y={3 + row * 9} width="7.5" height="7.5" rx="1.5" fill={fill} />;
        })
      )}
    </>
  ),
  "cache-locality": (
    <>
      {[2, 7, 12, 17, 22, 27].map((x, i) => (
        <rect key={x} x={x} y="9" width="3.8" height="14" rx="1" fill={i < 3 ? C.yellow : C.sky} />
      ))}
      <rect x="0.8" y="6.5" width="16.4" height="19" rx="2.4" fill="none" stroke={C.blue} strokeWidth="1.7" strokeDasharray="2.2 1.8" />
    </>
  ),
  "stack-vs-heap": (
    <>
      <rect x="3" y="21" width="10" height="4.5" rx="1.1" fill={C.sky} />
      <rect x="3" y="15.5" width="10" height="4.5" rx="1.1" fill={C.aqua} />
      <rect x="3" y="10" width="10" height="4.5" rx="1.1" fill={C.blue} />
      <path d="M16 5v22" strokeDasharray="2 2" />
      <rect x="19.5" y="5.5" width="6" height="5" rx="1.1" fill={C.pink} />
      <rect x="23" y="14" width="6" height="5" rx="1.1" fill={C.yellow} />
      <rect x="19" y="22" width="6" height="5" rx="1.1" fill={C.teal} />
    </>
  ),
  pointers: (
    <>
      <rect x="2.5" y="18" width="10" height="9" rx="1.6" fill={C.red} />
      <circle cx="7.5" cy="22.5" r="1.3" fill={C.ink} stroke="none" />
      <rect x="19.5" y="5" width="10" height="9" rx="1.6" fill={C.aqua} />
      <path d="M7.5 21.2c0-8.5 4-13.7 9.4-13.7" fill="none" />
      <Arrow x1={16.4} y1={7.5} x2={19} y2={7.5} />
    </>
  ),
};

/** A course's icon, or a neutral one for courses without their own. */
export default function TopicIcon({ slug, size = 34 }: { slug: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="var(--icon-ink)"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[slug] ?? ICONS.arrays}
    </svg>
  );
}
