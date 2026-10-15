import type { Section } from "../types";
import { chapterTopics, lesson, problem } from "./seeds";

export const graphSection: Section = {
  slug: "graph",
  title: "Graph",
  category: "data-structure",
  description: "Nodes and edges for modeling networks, dependencies, and paths between things.",
  tagline:
    "Learn what a graph is, how to store and walk one, then master the 12 graph patterns — from flood fill to Dijkstra and Tarjan — through the interview questions asked most.",
  illustrationCount: 55,
  outcomes: [
    "What a graph is — vertices, edges, directed, weighted — and why maps, networks and dependencies are all graphs",
    "How to store a graph as an adjacency list or matrix, and how a grid is a graph in disguise",
    "BFS and DFS, the two ways to walk any graph, in JavaScript, Python, Java and C++",
    "How to spot a graph problem and pick the right pattern from its wording",
    "12 patterns from easiest to hardest: flood fill, multi-source BFS, cycles, topological sort, union-find, Dijkstra, Bellman-Ford, MST, Floyd-Warshall and bridges",
    "The graph questions interviews ask most, each with a dry-run simulator",
  ],
  overview: [
    "Graphs are everywhere: roads between cities, friends in a network, courses that unlock other courses, pages that link to pages. Learn to see a problem as **dots joined by lines** and a whole family of interview questions becomes the same few moves.",
    "The introduction is short on purpose: **what** a graph is, **how** to store it, **how** BFS and DFS walk it, and **how** to recognise a graph problem. Every later lesson builds on those four.",
    "Then come **12 patterns, from easiest to hardest** — each taught through the interview questions that use it, with code in four languages, the complexity of every approach and a simulator you can step through.",
  ],
  requirements: [
    "Comfort writing loops, conditionals, functions and recursion in at least one language",
    "The Queue and Stack courses help: BFS walks a graph with a queue, DFS with a stack",
    "For the weighted patterns (Dijkstra, Prim), the Heap course explains the priority queue they use",
  ],
  topics: [
    ...chapterTopics("Introduction to graphs", [
      lesson("what-is-a-graph", "What is a graph, and why does it matter?"),
      lesson("how-to-store-a-graph", "How do we store a graph?"),
      lesson("bfs-and-dfs", "BFS and DFS: walking a graph"),
      lesson("how-to-spot-a-graph-problem", "How to spot a graph problem"),
    ]),

    ...chapterTopics("Pattern 1 · Traverse and count", [
      problem("flood-fill", "Flood Fill", "Easy"),
      problem("number-of-islands", "Number of Islands", "Medium"),
      problem("number-of-provinces", "Number of Provinces", "Medium"),
      problem("clone-graph", "Clone Graph", "Medium"),
    ]),

    ...chapterTopics("Pattern 2 · Multi-source BFS", [
      problem("rotting-oranges", "Rotting Oranges", "Medium"),
      problem("zero-one-matrix", "01 Matrix", "Medium"),
    ]),

    ...chapterTopics("Pattern 3 · Start from the border", [
      problem("surrounded-regions", "Surrounded Regions", "Medium"),
      problem("pacific-atlantic-water-flow", "Pacific Atlantic Water Flow", "Medium"),
    ]),

    ...chapterTopics("Pattern 4 · Cycles and two-colouring", [
      problem("detect-cycle-undirected", "Detect a Cycle in an Undirected Graph", "Medium"),
      problem("is-graph-bipartite", "Is Graph Bipartite?", "Medium"),
    ]),

    ...chapterTopics("Pattern 5 · Topological sort", [
      problem("course-schedule", "Course Schedule", "Medium"),
      problem("course-schedule-ii", "Course Schedule II", "Medium"),
      problem("alien-dictionary", "Alien Dictionary", "Hard"),
    ]),

    ...chapterTopics("Pattern 6 · Shortest path with BFS", [
      problem("shortest-path-in-binary-matrix", "Shortest Path in Binary Matrix", "Medium"),
      problem("word-ladder", "Word Ladder", "Hard"),
    ]),

    ...chapterTopics("Pattern 7 · Union-Find", [
      problem("redundant-connection", "Redundant Connection", "Medium"),
      problem("accounts-merge", "Accounts Merge", "Medium"),
    ]),

    ...chapterTopics("Pattern 8 · Dijkstra", [
      problem("network-delay-time", "Network Delay Time", "Medium"),
      problem("path-with-minimum-effort", "Path With Minimum Effort", "Medium"),
    ]),

    ...chapterTopics("Pattern 9 · Shortest path with a limit", [
      problem("cheapest-flights-within-k-stops", "Cheapest Flights Within K Stops", "Medium"),
    ]),

    ...chapterTopics("Pattern 10 · Minimum spanning tree", [
      problem("min-cost-to-connect-all-points", "Min Cost to Connect All Points", "Medium"),
    ]),

    ...chapterTopics("Pattern 11 · All-pairs shortest paths", [
      problem("find-the-city", "Find the City With the Smallest Number of Neighbors", "Medium"),
    ]),

    ...chapterTopics("Pattern 12 · Bridges", [
      problem("critical-connections-in-a-network", "Critical Connections in a Network", "Hard"),
    ]),
  ],
};
