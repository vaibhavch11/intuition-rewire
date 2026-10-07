"use client";

import dynamic from "next/dynamic";
import { useMediaQuery } from "@/components/home/clientHooks";

// The lattice is hidden below lg, so smaller screens never download three.js.
const MemoryLattice = dynamic(() => import("./MemoryLattice"), { ssr: false });

export default function LargeScreenLattice() {
  return useMediaQuery("(min-width: 1024px)") ? <MemoryLattice /> : null;
}
