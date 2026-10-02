import type { Input } from "../types";

/** Shared input check for problems that take sorted arrays. */
export function requireSorted(input: Input, keys: string[]): string | null {
  for (const key of keys) {
    const values = input[key] as number[];
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[i - 1]) return `${key} must be sorted in ascending order.`;
    }
  }
  return null;
}
