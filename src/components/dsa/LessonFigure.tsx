"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";

export default function LessonFigure({
  src,
  alt,
  caption,
  width,
  height,
}: {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}) {
  const [zoomed, setZoomed] = useState(false);
  // Excalidraw drawings get flipped for dark mode; photos and uploads don't.
  const art = src.includes("/drawings/") ? " drawing-art" : "";

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  return (
    <figure className="my-space-2xl">
      <div className="relative rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-space-lg py-space-2xl">
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="View image full screen"
          className="absolute right-space-sm top-space-sm rounded p-space-xs text-on-surface-variant hover:bg-surface-container hover:text-primary"
        >
          <Maximize2 size={16} />
        </button>
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          unoptimized={src.endsWith(".svg")}
          className={`mx-auto h-auto w-full max-w-3xl${art}`}
        />
      </div>

      {caption && (
        <figcaption className="mt-space-base flex justify-center">
          <span className="font-body-md text-body-md rounded bg-surface-container-low px-space-2xl py-space-md text-center text-on-surface-variant">
            {caption}
          </span>
        </figcaption>
      )}

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-inverse-surface/80 p-space-lg"
        >
          <button
            type="button"
            aria-label="Close full screen"
            className="absolute right-space-lg top-space-lg rounded-lg bg-surface-container-lowest p-space-sm text-on-surface"
          >
            <X size={18} />
          </button>
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            unoptimized={src.endsWith(".svg")}
            className={`max-h-full w-auto max-w-full rounded-lg bg-surface-container-lowest p-space-lg${art}`}
          />
        </div>
      )}
    </figure>
  );
}
