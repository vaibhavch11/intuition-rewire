"use client";

import { Excalidraw, exportToSvg } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { useState } from "react";
import type { DrawingScene } from "@/lib/dsa/types";

export interface DrawingResult extends DrawingScene {
  svg: string;
  width: number;
  height: number;
}

type ExcalidrawAPI = Parameters<
  NonNullable<React.ComponentProps<typeof Excalidraw>["excalidrawAPI"]>
>[0];

export default function DrawingCanvas({
  initialScene,
  onCancel,
  onDone,
}: {
  initialScene: DrawingScene | null;
  onCancel: () => void;
  onDone: (result: DrawingResult) => void;
}) {
  const [api, setApi] = useState<ExcalidrawAPI | null>(null);
  const [busy, setBusy] = useState(false);

  async function finish() {
    if (!api) return;
    setBusy(true);

    const elements = api.getSceneElements();
    const files = api.getFiles();
    const svg = await exportToSvg({
      elements,
      files,
      appState: { exportBackground: true, exportWithDarkMode: false },
      exportPadding: 16,
    });

    onDone({
      svg: svg.outerHTML,
      width: Number(svg.getAttribute("width")) || 800,
      height: Number(svg.getAttribute("height")) || 600,
      elements: [...elements],
      files: files as unknown as Record<string, unknown>,
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-surface">
      <div className="flex items-center justify-between gap-space-md border-b border-outline-variant/60 px-space-lg py-space-sm">
        <span className="font-label-md text-label-md text-on-surface-variant">
          Draw the diagram, then save. You can reopen and edit it any time.
        </span>
        <span className="flex gap-space-sm">
          <button
            type="button"
            onClick={onCancel}
            className="font-label-md text-label-md rounded-lg border border-outline-variant px-space-md py-space-xs text-on-surface-variant"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={finish}
            disabled={busy || !api}
            className="font-label-md text-label-md rounded-lg bg-primary-container px-space-lg py-space-xs text-on-primary disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save drawing"}
          </button>
        </span>
      </div>

      <div className="min-h-0 flex-1">
        <Excalidraw
          excalidrawAPI={setApi}
          initialData={
            initialScene
              ? {
                  // Stored as `unknown[]` so the reader bundle never sees these types.
                  elements: initialScene.elements as never,
                  files: initialScene.files as never,
                  scrollToContent: true,
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
