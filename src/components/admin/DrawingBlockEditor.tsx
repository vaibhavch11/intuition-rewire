"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Pencil } from "lucide-react";
import type { DrawingScene, LessonBlock } from "@/lib/dsa/types";
import type { DrawingResult } from "./DrawingCanvas";

// Excalidraw is ~1MB and touches `window`, so it loads only when the canvas opens.
const DrawingCanvas = dynamic(() => import("./DrawingCanvas"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-surface">
      <p className="font-body-md text-body-md text-on-surface-variant">
        Loading the canvas…
      </p>
    </div>
  ),
});

type DrawingBlock = Extract<LessonBlock, { type: "drawing" }>;

export default function DrawingBlockEditor({
  block,
  onChange,
  onError,
  inputClass,
}: {
  block: DrawingBlock;
  onChange: (block: DrawingBlock) => void;
  onError: (message: string | null) => void;
  inputClass: string;
}) {
  const [open, setOpen] = useState(false);

  async function persist(result: DrawingResult) {
    onError(null);

    const response = await fetch("/api/admin/drawing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ svg: result.svg }),
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      onError(body?.error ?? "Could not save the drawing.");
      return;
    }

    onChange({
      ...block,
      src: body.src,
      width: result.width,
      height: result.height,
      scene: { elements: result.elements, files: result.files },
    });
    setOpen(false);
  }

  const scene: DrawingScene | null =
    block.scene.elements.length > 0 ? block.scene : null;

  return (
    <div className="space-y-space-sm">
      {block.src ? (
        <div className="rounded-lg border border-outline-variant/60 p-space-md">
          <Image
            src={block.src}
            alt={block.alt || "Diagram"}
            width={block.width}
            height={block.height}
            unoptimized
            className="mx-auto h-auto w-full max-w-md"
          />
        </div>
      ) : (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Nothing drawn yet.
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-label-md text-label-md flex items-center gap-space-xs rounded-lg border border-outline-variant px-space-md py-space-xs text-on-surface-variant hover:border-primary hover:text-primary"
      >
        <Pencil size={14} />
        {block.src ? "Edit drawing" : "Open canvas"}
      </button>

      <input
        value={block.alt}
        placeholder="Alt text (describes the diagram for screen readers)"
        onChange={(e) => onChange({ ...block, alt: e.target.value })}
        className={inputClass}
      />
      <input
        value={block.caption ?? ""}
        placeholder="Caption (optional)"
        onChange={(e) => onChange({ ...block, caption: e.target.value })}
        className={inputClass}
      />

      {open && (
        <DrawingCanvas
          initialScene={scene}
          onCancel={() => setOpen(false)}
          onDone={persist}
        />
      )}
    </div>
  );
}
