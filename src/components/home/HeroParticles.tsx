"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useMediaQuery, usePrefersReducedMotion } from "./clientHooks";

// three.js is about 870 KB of JavaScript: never on the server, and only fetched
// once the page has finished its own work.
const ParticleNetwork = dynamic(() => import("./ParticleNetwork"), { ssr: false });

/**
 * The hero's decorative particle field. Only for large screens with a mouse:
 * on phones and tablets the download and the GPU time aren't worth a
 * background effect, and the gradient glow behind the hero stays either way.
 */
export default function HeroParticles() {
  const wanted = useMediaQuery("(min-width: 768px) and (pointer: fine)");
  const reducedMotion = usePrefersReducedMotion();
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (!wanted || reducedMotion) return;
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setIdle(true), 1200);
    return () => clearTimeout(id);
  }, [wanted, reducedMotion]);

  return wanted && !reducedMotion && idle ? <ParticleNetwork /> : null;
}
