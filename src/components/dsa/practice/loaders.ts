import type { PracticeProgramId } from "@/lib/dsa/practicePrograms";
import type { Program } from "./types";

type Loader = () => Promise<{ default: Program }>;

/** One chunk per program, so a lesson downloads only the simulator it shows. */
export const PROGRAM_LOADERS: Record<PracticeProgramId, Loader> = {
  "find-max": () => import("./programs/find-max"),
  "reverse-in-place": () => import("./programs/reverse-in-place"),
  "second-largest": () => import("./programs/second-largest"),
  "move-zeroes": () => import("./programs/move-zeroes"),
  "remove-duplicates": () => import("./programs/remove-duplicates"),
  "stock-buy-sell": () => import("./programs/stock-buy-sell"),
  "majority-element": () => import("./programs/majority-element"),
  kadane: () => import("./programs/kadane"),
  "rotate-array": () => import("./programs/rotate-array"),
  "sort-colors": () => import("./programs/sort-colors"),
  "product-except-self": () => import("./programs/product-except-self"),
  "peak-element": () => import("./programs/peak-element"),
  "merge-sorted": () => import("./programs/merge-sorted"),
  "merge-in-place": () => import("./programs/merge-in-place"),
  intersection: () => import("./programs/intersection"),
  "union-sorted": () => import("./programs/union-sorted"),
  "common-three": () => import("./programs/common-three"),
  transpose: () => import("./programs/transpose"),
  "rotate-matrix": () => import("./programs/rotate-matrix"),
  "spiral-order": () => import("./programs/spiral-order"),
  "set-zeroes": () => import("./programs/set-zeroes"),
  "diagonal-traversal": () => import("./programs/diagonal-traversal"),
  "search-matrix": () => import("./programs/search-matrix"),
  "pascal-triangle": () => import("./programs/pascal-triangle"),
  "merge-intervals": () => import("./programs/merge-intervals"),
};
