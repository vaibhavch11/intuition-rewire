import type { ReactNode } from "react";

export type RegisterTone = "primary" | "tertiary" | "secondary" | "plain";

/** One row of the dark register panel, e.g. `[REGISTER] Left (L):  0 (val: 2)`. */
export interface Register {
  label: string;
  value: string;
  tone?: RegisterTone;
}

export interface SimulationStep {
  /**
   * The memory picture for this step. Rendered on the server and handed to
   * the client engine as serialized output, so it must stay presentational.
   */
  visual: ReactNode;
  /** Keep the same labels on every step so the panel doesn't jump. */
  registers: Register[];
  /** What the machine is doing at this step. Supports `code` and **bold**. */
  note: string;
  /** Replaces "Running Dry-Run" in the status row, typically on the last step. */
  status?: string;
}

/** A self-contained dry run shown at the top of a course page. */
export interface Simulation {
  /** Highlighted in the lead: "Test the <algorithm> algorithm in real-time below." */
  algorithm: string;
  /** The sentence that opens the lead paragraph. */
  lead: string;
  input: {
    label: string;
    value: string;
    /** The rule the algorithm follows. Supports `code` and **bold**. */
    rule: string;
  };
  /** Title-bar label of the memory window, e.g. `contiguous_ram_buffer[6]`. */
  buffer: string;
  /** Complexity badge in the memory window's title bar. */
  badge: string;
  steps: SimulationStep[];
}
