import { pointersAt, recorder, toneRange, type CellTone, type Program, type Scalar } from "../types";
import { requireSorted } from "./sorted";

const code = `function merge(nums1, m, nums2, n) {
  let i = m - 1;
  let j = n - 1;
  let k = m + n - 1;
  while (j >= 0) {
    if (i >= 0 && nums1[i] > nums2[j]) {
      nums1[k] = nums1[i];
      i--;
    } else {
      nums1[k] = nums2[j];
      j--;
    }
    k--;
  }
}`;

const program: Program = {
  title: "Merge sorted arrays in place",
  code,
  fields: [
    { key: "nums1", label: "nums1 (first m, sorted)", kind: "array", maxLength: 6 },
    { key: "nums2", label: "nums2 (sorted)", kind: "array", maxLength: 6 },
  ],
  examples: [
    { label: "Example", input: { nums1: [1, 2, 3], nums2: [2, 5, 6] } },
    { label: "nums2 goes first", input: { nums1: [4, 5, 6], nums2: [1, 2, 3] } },
  ],
  check: (input) => requireSorted(input, ["nums1", "nums2"]),
  run(input) {
    const first = input.nums1 as number[];
    const nums2 = input.nums2 as number[];
    const m = first.length;
    const n = nums2.length;
    const nums1: Scalar[] = [...first, ...new Array(n).fill(null)];
    const r = recorder();
    let i = m - 1;
    let j = n - 1;
    let k = m + n - 1;

    // Indexes after k are final; between i and k the old values are spare.
    const views = (writeAt?: number) => {
      const tones: Record<number, CellTone> = {
        ...toneRange(i + 1, k, "muted"),
        ...toneRange(k + 1, m + n - 1, "done"),
      };
      if (writeAt !== undefined) tones[writeAt] = "write";
      return [
        { name: "nums1", values: nums1, tones, pointers: pointersAt(m + n, { i, k }, { k: "secondary" }) },
        { name: "nums2", values: nums2, tones: toneRange(j + 1, n - 1, "muted"), pointers: pointersAt(n, { j }, { j: "tertiary" }) },
      ];
    };

    r.step(
      4,
      `\`nums1\` has ${n} empty slot${n === 1 ? "" : "s"} at the end. Filling from the **front** would overwrite values we still need, so fill from the **back**: the largest remaining value goes to \`k\`.`,
      { arrays: views(), vars: { i, j, k } }
    );

    while (j >= 0) {
      const at = k;
      if (i >= 0 && (nums1[i] as number) > nums2[j]) {
        nums1[k] = nums1[i];
        const moved = nums1[i];
        i--;
        k--;
        r.step(
          7,
          `${moved} (nums1) > ${nums2[j]} (nums2), so **${moved}** is the largest left. Move it to index ${at}.`,
          { arrays: views(at), vars: { i, j, k } }
        );
      } else {
        nums1[k] = nums2[j];
        const moved = nums2[j];
        j--;
        k--;
        r.step(
          10,
          i >= 0
            ? `${moved} (nums2) ≥ ${nums1[i]} (nums1), so **${moved}** goes to index ${at}.`
            : `nums1's own values are all placed, so **${moved}** from nums2 goes to index ${at}.`,
          { arrays: views(at), vars: { i, j, k } }
        );
      }
    }

    r.step(
      15,
      `\`nums2\` is empty, so we stop — whatever is left in nums1 is already in its correct spot. No extra array: **O(m + n) time, O(1) space**.`,
      {
        arrays: [
          { name: "nums1", values: nums1, tones: toneRange(0, m + n - 1, "success") },
          { name: "nums2", values: nums2, tones: toneRange(0, n - 1, "muted") },
        ],
        vars: { nums1 },
        done: true,
      }
    );
    return r.frames;
  },
};

export default program;
