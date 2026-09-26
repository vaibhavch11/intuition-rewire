import type { Simulation } from "../types";
import { arraysSimulation } from "./arrays";
import { binarySearchTreeSimulation } from "./binary-search-tree";
import { binaryTreeSimulation } from "./binary-tree";
import { doublyLinkedListSimulation } from "./doubly-linked-list";
import { dynamicProgrammingSimulation } from "./dynamic-programming";
import { graphSimulation } from "./graph";
import { hashTableSimulation } from "./hash-table";
import { heapSimulation } from "./heap";
import { queueSimulation } from "./queue";
import { recursionSimulation } from "./recursion";
import { searchingSimulation } from "./searching";
import { singlyLinkedListSimulation } from "./singly-linked-list";
import { sortingSimulation } from "./sorting";
import { stackSimulation } from "./stack";
import { stringsSimulation } from "./strings";
import { trieSimulation } from "./trie";

/** Keyed by section slug; a course without an entry simply shows no simulator. */
const SIMULATIONS: Record<string, Simulation> = {
  arrays: arraysSimulation,
  strings: stringsSimulation,
  "singly-linked-list": singlyLinkedListSimulation,
  "doubly-linked-list": doublyLinkedListSimulation,
  "hash-table": hashTableSimulation,
  stack: stackSimulation,
  queue: queueSimulation,
  "binary-tree": binaryTreeSimulation,
  "binary-search-tree": binarySearchTreeSimulation,
  heap: heapSimulation,
  graph: graphSimulation,
  trie: trieSimulation,
  sorting: sortingSimulation,
  searching: searchingSimulation,
  recursion: recursionSimulation,
  "dynamic-programming": dynamicProgrammingSimulation,
};

export function getSimulation(sectionSlug: string): Simulation | undefined {
  return Object.hasOwn(SIMULATIONS, sectionSlug)
    ? SIMULATIONS[sectionSlug]
    : undefined;
}
