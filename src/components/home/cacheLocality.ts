// Numbers the cache demo shares with its readouts. Kept apart from the 3D
// scene so the card can render without loading three.js.

/** Reads in each layout: 12 ints in the array, 12 nodes in the list. */
export const ACCESS_COUNT = 12;

export const L1_NS = 0.5;
export const DRAM_NS = 80;
export const ARRAY_NS = DRAM_NS + (ACCESS_COUNT - 1) * L1_NS;
export const LIST_NS = ACCESS_COUNT * DRAM_NS;

/** Simulated cost so far for each layout, reported whenever it changes. */
export type MemoryTick = { arrayNs: number; listNs: number; arrayMisses: number; listMisses: number };
