"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Droplets, GitBranch, Lock, Pause, Play, Route, type LucideIcon } from "lucide-react";
import { TOUR_VIDEO } from "@/components/TourVideo";

/** Where each part of the product footage starts, in seconds. */
const CHAPTERS: { label: string; start: number; icon: LucideIcon }[] = [
  { label: "Lessons", start: 5.1, icon: BookOpen },
  { label: "Learning Path", start: 8.6, icon: Route },
  { label: "Water Challenge", start: 10.6, icon: Droplets },
  { label: "BST dry run", start: 16.1, icon: GitBranch },
];

/** The loop covers the product footage only: the lessons through the BST dry run. */
const LOOP_START = CHAPTERS[0].start;
const LOOP_END = 17.9;

const chapterEnd = (i: number) => (i + 1 < CHAPTERS.length ? CHAPTERS[i + 1].start : LOOP_END);

function chapterAt(t: number): number {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) if (t >= CHAPTERS[i].start) return i;
  return 0;
}

/** Reduced motion and data saver both mean: don't start a video on your own. */
function mayAutoplay(): boolean {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return !saveData && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The homepage product tour: a silent loop of the real product that starts
 * when it scrolls into view and pauses when it leaves. Always muted, with no
 * sound control. The video is attached only as the player nears the screen,
 * so the homepage carries no video until then (the indexable copy is on /tour).
 */
export default function TourPlayer() {
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const fillsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const visibleRef = useRef(false);
  const autoplayRef = useRef(true);
  const userPausedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState(0);

  /** Attaches the video file the first time it's needed. */
  const attach = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;
    if (!video.getAttribute("src")) {
      video.muted = true;
      video.preload = "auto";
      video.src = TOUR_VIDEO.src;
      video.currentTime = LOOP_START;
    }
    return video;
  }, []);

  /** Keeps playback inside the loop and moves the chapter fills; runs every frame while playing. */
  const paint = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    let t = video.currentTime;
    if (t >= LOOP_END || t < LOOP_START - 0.5) video.currentTime = t = LOOP_START;
    CHAPTERS.forEach((chapter, i) => {
      const fill = fillsRef.current[i];
      if (!fill) return;
      const share = (t - chapter.start) / (chapterEnd(i) - chapter.start);
      fill.style.transform = `scaleX(${Math.max(0, Math.min(1, share))})`;
    });
    setActive(chapterAt(t));
  }, []);

  const play = useCallback(() => {
    const video = attach();
    if (!video) return;
    video.muted = true;
    video.play().catch(() => {
      // The browser refused to start it (iPhone low-power mode, for one).
      autoplayRef.current = false;
    });
  }, [attach]);

  // Load just before it scrolls in; play while on screen, pause when it leaves.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        autoplayRef.current = mayAutoplay();
        if (autoplayRef.current) attach();
      },
      { rootMargin: "600px 0px" }
    );
    const seen = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
        if (!entry.isIntersecting) videoRef.current?.pause();
        else if (autoplayRef.current && !userPausedRef.current) play();
      },
      { threshold: 0.35 }
    );

    near.observe(stage);
    seen.observe(stage);
    return () => {
      near.disconnect();
      seen.disconnect();
    };
  }, [attach, play]);

  // Smooth chapter fills; the browser's timeupdate fires only ~4 times a second.
  useEffect(() => {
    if (!playing) return;
    let frame = requestAnimationFrame(function tick() {
      paint();
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [playing, paint]);

  // On phones the chapter strip scrolls sideways: keep the playing one in view (the strip only, never the page).
  useEffect(() => {
    const strip = stripRef.current;
    const item = strip?.querySelectorAll("li")[active];
    if (!strip || !item || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({ left: Math.max(0, item.offsetLeft - (strip.clientWidth - item.offsetWidth) / 2), behavior: "smooth" });
  }, [active]);

  const togglePlay = () => {
    const video = attach();
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      autoplayRef.current = true;
      play();
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  };

  const jumpTo = (i: number) => {
    const video = attach();
    if (!video) return;
    video.currentTime = CHAPTERS[i].start;
    setActive(i);
    paint();
    if (video.paused) {
      userPausedRef.current = false;
      autoplayRef.current = true;
      play();
    }
  };

  return (
    <div className="relative mx-auto mt-space-xl max-w-5xl">
      {/* A soft lavender glow behind the window. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-[6%] -inset-y-[10%] -z-10"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 45%, color-mix(in oklab, var(--color-primary-fixed-dim) 55%, transparent), transparent 70%)",
        }}
      />

      {/* A browser window, so the footage reads as the real site. */}
      <div className="rounded-[20px] bg-gradient-to-b from-primary/35 via-outline-variant/70 to-outline-variant/30 p-px shadow-[0_2px_6px_rgba(19,27,46,0.06),0_40px_80px_-40px_rgba(53,37,205,0.45)]">
        <div className="overflow-hidden rounded-[19px] bg-surface-container-lowest">
          <div className="flex h-[40px] items-center gap-space-md border-b border-outline-variant/60 bg-surface-container-low px-[14px]">
            <div className="flex w-[46px] shrink-0 gap-[6px]" aria-hidden="true">
              <span className="h-[10px] w-[10px] rounded-full bg-[#ff5f57]" />
              <span className="h-[10px] w-[10px] rounded-full bg-[#febc2e]" />
              <span className="h-[10px] w-[10px] rounded-full bg-[#28c840]" />
            </div>
            <div className="mx-auto flex h-[24px] min-w-0 max-w-[280px] flex-1 items-center justify-center gap-[6px] rounded-[7px] bg-surface-container-lowest px-[10px] font-label-md text-[12px] text-on-surface-variant ring-1 ring-inset ring-outline-variant/60">
              <Lock size={11} aria-hidden="true" className="shrink-0" />
              <span className="truncate">intuitionrewire.com</span>
            </div>
            <span className="w-[46px] shrink-0" aria-hidden="true" />
          </div>

          <div ref={stageRef} className="group relative aspect-video w-full bg-surface-container-low">
            <video
              ref={videoRef}
              className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${ready ? "opacity-100" : "opacity-0"}`}
              playsInline
              muted
              preload="none"
              disablePictureInPicture
              disableRemotePlayback
              aria-label={TOUR_VIDEO.label}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onPlaying={() => setReady(true)}
              onSeeked={paint}
              onTimeUpdate={paint}
            />
            {/* The cover shows until the first frame plays, then the video fades in over it. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- a plain poster frame */}
            <img
              src={TOUR_VIDEO.poster}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className={`pointer-events-none absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
            />

            {/* Pause control: always on touch screens, on hover elsewhere, and whenever paused. */}
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pause the tour" : "Play the tour"}
              className={`absolute bottom-[12px] right-[12px] flex h-[36px] w-[36px] items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-opacity duration-200 hover:bg-black/70 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white group-hover:opacity-100 [@media(hover:none)]:opacity-100 sm:bottom-[16px] sm:right-[16px] ${
                playing ? "opacity-0" : "opacity-100"
              }`}
            >
              {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="translate-x-px" />}
            </button>
          </div>
        </div>
      </div>

      {/* Chapters: each one jumps the tour there, and fills while it plays. */}
      <div
        ref={stripRef}
        className="relative -mx-gutter-mobile mt-space-lg overflow-x-auto px-gutter-mobile [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        <ol className="flex min-w-max gap-space-sm sm:grid sm:min-w-0 sm:grid-cols-4">
          {CHAPTERS.map((chapter, i) => {
            const Icon = chapter.icon;
            const isActive = i === active;
            return (
              <li key={chapter.label}>
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  aria-current={isActive ? "step" : undefined}
                  className={`group relative flex w-full items-center gap-[10px] overflow-hidden rounded-[12px] px-[12px] py-[10px] text-left ring-1 ring-inset transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-primary-fixed/45 ring-primary/35"
                      : "bg-surface-container-lowest ring-outline-variant/70 hover:bg-surface-container-low"
                  }`}
                >
                  <span
                    className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px] transition-colors duration-200 ${
                      isActive ? "bg-primary-container text-on-primary" : "bg-surface-container text-on-surface-variant group-hover:text-primary"
                    }`}
                  >
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <span className={`whitespace-nowrap font-label-md text-[13px] font-semibold ${isActive ? "text-primary" : "text-on-surface"}`}>
                    {chapter.label}
                  </span>
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px]">
                    <span
                      ref={(el) => {
                        fillsRef.current[i] = el;
                      }}
                      className={`block h-full origin-left scale-x-0 bg-primary-container transition-opacity duration-200 ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
