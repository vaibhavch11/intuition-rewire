"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { TOUR_VIDEO } from "@/lib/tourVideo";

/**
 * The 18-second product tour. On its watch page (/tour) the video is in the
 * page from the start. Elsewhere (`deferred`) only the poster is, and the
 * video loads when it's played: Google indexes a video only on a page where
 * it's the main content, so the homepage shouldn't carry a second copy.
 */
export default function TourVideo({ deferred = false }: { deferred?: boolean }) {
  const [playing, setPlaying] = useState(!deferred);

  if (!playing) {
    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="group relative block aspect-video w-full cursor-pointer bg-surface-container-low"
        aria-label="Play the 18-second product tour"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a plain poster frame, same file the video uses */}
        <img src={TOUR_VIDEO.poster} alt={TOUR_VIDEO.label} className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-transform duration-200 group-hover:scale-110">
            <Play size={26} fill="currentColor" className="translate-x-0.5" />
          </span>
        </span>
      </button>
    );
  }

  return (
    <video
      className="block aspect-video w-full bg-surface-container-low"
      controls
      playsInline
      autoPlay={deferred}
      preload="metadata"
      poster={TOUR_VIDEO.poster}
      aria-label={TOUR_VIDEO.label}
    >
      <source src={TOUR_VIDEO.src} type="video/mp4" />
      <a href={TOUR_VIDEO.src} className="text-primary underline">
        Download the tour video
      </a>
    </video>
  );
}
