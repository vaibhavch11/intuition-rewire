"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { PRACTICE_PROGRAMS } from "@/lib/dsa/practicePrograms";
import type { LessonBlock, LessonBlockType } from "@/lib/dsa/types";
import ConfirmDialog from "./ConfirmDialog";
import DrawingBlockEditor from "./DrawingBlockEditor";
import { fieldClass, inputClass } from "./fieldStyles";
import { errorMessage, sendCurriculumChange } from "./sendCurriculumChange";

const BLOCK_LABELS: Record<LessonBlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  list: "List",
  code: "Code",
  drawing: "Drawing",
  figure: "Image",
  simulator: "Simulator",
};

function emptyBlock(type: LessonBlockType): LessonBlock {
  switch (type) {
    case "heading":
      return { type: "heading", text: "" };
    case "paragraph":
      return { type: "paragraph", text: "" };
    case "list":
      return { type: "list", ordered: false, items: [""] };
    case "code":
      return { type: "code", language: "javascript", code: "" };
    case "figure":
      return { type: "figure", src: "", alt: "", width: 0, height: 0 };
    case "drawing":
      return {
        type: "drawing",
        src: "",
        alt: "",
        width: 0,
        height: 0,
        scene: { elements: [], files: {} },
      };
    case "simulator":
      return { type: "simulator", program: PRACTICE_PROGRAMS[0].id };
  }
}

export default function LessonEditor({
  sectionSlug,
  sectionTitle,
  topicSlug,
  lessonTitle,
  chapterTitle,
  initialBlocks,
  updatedAt,
}: {
  sectionSlug: string;
  sectionTitle: string;
  topicSlug: string;
  lessonTitle: string;
  chapterTitle: string;
  initialBlocks: LessonBlock[];
  updatedAt: string | null;
}) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<LessonBlock[]>(initialBlocks);
  // Every edit makes a new array, so "changed since the last save" is just
  // whether this is still the same array that was last saved.
  const [savedBlocks, setSavedBlocks] = useState<LessonBlock[]>(initialBlocks);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [discardError, setDiscardError] = useState<string | null>(null);

  const unsaved = blocks !== savedBlocks;
  const hasSavedContent = updatedAt !== null || savedBlocks !== initialBlocks;

  function replaceBlock(index: number, block: LessonBlock) {
    setBlocks((current) => current.map((b, i) => (i === index ? block : b)));
  }

  function moveBlock(index: number, delta: number) {
    setBlocks((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function uploadImage(index: number, block: LessonBlock, file: File) {
    if (block.type !== "figure") return;
    setError(null);

    let width = 0;
    let height = 0;
    try {
      const bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
      bitmap.close();
    } catch {
      setError("That file could not be read as an image.");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body: form,
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      setError(body?.error ?? "Upload failed.");
      return;
    }
    replaceBlock(index, { ...block, src: body.src, width, height });
  }

  async function save() {
    // Edits made while this is in flight stay unsaved.
    const snapshot = blocks;
    setSaving(true);
    setError(null);
    setStatus(null);

    const response = await fetch(
      `/api/admin/content/${sectionSlug}/${topicSlug}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: snapshot }),
      }
    );
    const body = await response.json().catch(() => null);
    setSaving(false);

    if (!response.ok) {
      setError(body?.error ?? "Could not save.");
      return;
    }
    setSavedBlocks(snapshot);
    setStatus(`Saved ${new Date(body.updatedAt).toLocaleTimeString()}`);
  }

  function revert() {
    setBlocks(savedBlocks);
    setError(null);
  }

  async function discardLesson() {
    setDiscarding(true);
    setDiscardError(null);
    try {
      await sendCurriculumChange({
        op: "remove-lesson",
        section: sectionSlug,
        topic: topicSlug,
      });
      // Stays in its "Discarding…" state until the admin home replaces it.
      router.push(`/admin?discarded=${sectionSlug}`);
    } catch (caught) {
      setDiscardError(errorMessage(caught));
      setDiscarding(false);
    }
  }

  const incompleteFigure = blocks.some(
    (block) =>
      (block.type === "figure" || block.type === "drawing") &&
      block.src.length === 0
  );

  return (
    <div className="mt-space-lg">
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Text fields accept <code className="font-code-sm text-code-sm">**bold**</code>{" "}
        and <code className="font-code-sm text-code-sm">`inline code`</code>.
      </p>

      <div className="mt-space-base space-y-space-md">
        {blocks.map((block, index) => (
          <section
            key={index}
            className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-space-base"
          >
            <header className="mb-space-sm flex items-center justify-between">
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                {BLOCK_LABELS[block.type]}
              </span>
              <span className="flex items-center gap-space-2xs">
                <button
                  type="button"
                  aria-label="Move up"
                  onClick={() => moveBlock(index, -1)}
                  disabled={index === 0}
                  className="rounded p-space-xs text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  onClick={() => moveBlock(index, 1)}
                  disabled={index === blocks.length - 1}
                  className="rounded p-space-xs text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Delete block"
                  onClick={() =>
                    setBlocks((current) =>
                      current.filter((_, i) => i !== index)
                    )
                  }
                  className="rounded p-space-xs text-on-surface-variant hover:bg-error-container hover:text-on-error-container"
                >
                  <X size={15} />
                </button>
              </span>
            </header>

            {block.type === "heading" && (
              <input
                value={block.text}
                placeholder="Section heading"
                onChange={(e) =>
                  replaceBlock(index, { ...block, text: e.target.value })
                }
                className={inputClass}
              />
            )}

            {block.type === "paragraph" && (
              <textarea
                value={block.text}
                rows={5}
                placeholder="Write the paragraph…"
                onChange={(e) =>
                  replaceBlock(index, { ...block, text: e.target.value })
                }
                className={inputClass}
              />
            )}

            {block.type === "list" && (
              <div className="space-y-space-sm">
                <label className="font-label-md text-label-md flex items-center gap-space-sm text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={block.ordered === true}
                    onChange={(e) =>
                      replaceBlock(index, {
                        ...block,
                        ordered: e.target.checked,
                      })
                    }
                  />
                  Numbered list
                </label>
                {block.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex gap-space-sm">
                    <input
                      value={item}
                      placeholder={`Item ${itemIndex + 1}`}
                      onChange={(e) =>
                        replaceBlock(index, {
                          ...block,
                          items: block.items.map((v, i) =>
                            i === itemIndex ? e.target.value : v
                          ),
                        })
                      }
                      className={inputClass}
                    />
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() =>
                        replaceBlock(index, {
                          ...block,
                          items: block.items.filter((_, i) => i !== itemIndex),
                        })
                      }
                      className="rounded p-space-xs text-on-surface-variant hover:bg-surface-container"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    replaceBlock(index, {
                      ...block,
                      items: [...block.items, ""],
                    })
                  }
                  className="font-label-md text-label-md text-primary hover:underline"
                >
                  + Add item
                </button>
              </div>
            )}

            {block.type === "code" && (
              <div className="space-y-space-sm">
                <input
                  value={block.language}
                  placeholder="Language"
                  onChange={(e) =>
                    replaceBlock(index, { ...block, language: e.target.value })
                  }
                  className={inputClass}
                />
                <textarea
                  value={block.code}
                  rows={8}
                  spellCheck={false}
                  placeholder="Paste the code…"
                  onChange={(e) =>
                    replaceBlock(index, { ...block, code: e.target.value })
                  }
                  className={`${inputClass} font-code-md text-code-md`}
                />
              </div>
            )}

            {block.type === "drawing" && (
              <DrawingBlockEditor
                block={block}
                onChange={(next) => replaceBlock(index, next)}
                onError={setError}
                inputClass={inputClass}
              />
            )}

            {block.type === "simulator" && (
              <div className="space-y-space-sm">
                <select
                  value={block.program}
                  aria-label="Simulator"
                  onChange={(e) =>
                    replaceBlock(index, { ...block, program: e.target.value })
                  }
                  className={`${fieldClass} w-full`}
                >
                  {PRACTICE_PROGRAMS.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title}
                    </option>
                  ))}
                </select>
                <input
                  value={block.caption ?? ""}
                  placeholder="Caption (optional) — defaults to how to use the simulator"
                  onChange={(e) =>
                    replaceBlock(index, { ...block, caption: e.target.value })
                  }
                  className={inputClass}
                />
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Readers can change the input and step through the code line by line.
                </p>
              </div>
            )}

            {block.type === "figure" && (
              <div className="space-y-space-sm">
                {block.src ? (
                  <div className="rounded-lg border border-outline-variant/60 p-space-md">
                    <Image
                      src={block.src}
                      alt={block.alt || "Uploaded image"}
                      width={block.width}
                      height={block.height}
                      className="mx-auto h-auto w-full max-w-md"
                    />
                  </div>
                ) : (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Choose a PNG, JPEG, GIF, or WebP image (max 5MB).
                  </p>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImage(index, block, file);
                  }}
                  className="font-body-sm text-body-sm text-on-surface-variant"
                />
                <input
                  value={block.alt}
                  placeholder="Alt text (describes the image for screen readers)"
                  onChange={(e) =>
                    replaceBlock(index, { ...block, alt: e.target.value })
                  }
                  className={inputClass}
                />
                <input
                  value={block.caption ?? ""}
                  placeholder="Caption (optional)"
                  onChange={(e) =>
                    replaceBlock(index, { ...block, caption: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            )}
          </section>
        ))}
      </div>

      <div className="mt-space-base flex flex-wrap gap-space-sm">
        {(Object.keys(BLOCK_LABELS) as LessonBlockType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() =>
              setBlocks((current) => [...current, emptyBlock(type)])
            }
            className="font-label-md text-label-md flex items-center gap-space-xs rounded-lg border border-outline-variant px-space-md py-space-xs text-on-surface-variant hover:border-primary hover:text-primary"
          >
            <Plus size={14} />
            {BLOCK_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="mt-space-lg flex flex-wrap items-center gap-space-base border-t border-outline-variant/50 pt-space-base">
        <button
          type="button"
          onClick={save}
          disabled={saving || incompleteFigure}
          className="font-label-md text-label-md rounded-lg bg-primary-container px-space-lg py-space-sm text-on-primary disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save lesson"}
        </button>
        <button
          type="button"
          onClick={() => {
            setDiscardError(null);
            setConfirmingDiscard(true);
          }}
          disabled={saving}
          className="font-label-md text-label-md flex items-center gap-space-xs rounded-lg border border-error/40 px-space-lg py-space-sm text-error transition-colors hover:border-error hover:bg-error-container hover:text-on-error-container disabled:opacity-50"
        >
          <Trash2 size={15} />
          Discard lesson
        </button>

        {incompleteFigure && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Every image needs a file and every drawing needs a saved canvas.
          </p>
        )}
        {error ? (
          <p className="font-body-sm text-body-sm text-error" role="alert">
            {error}
          </p>
        ) : unsaved ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Unsaved changes ·{" "}
            <button
              type="button"
              onClick={revert}
              disabled={saving}
              className="font-semibold text-primary hover:underline disabled:opacity-50"
            >
              Revert to last save
            </button>
          </p>
        ) : status ? (
          <p className="font-body-sm text-body-sm text-secondary">{status}</p>
        ) : (
          updatedAt && (
            // The server and the reader's browser format dates differently.
            <p
              suppressHydrationWarning
              className="font-body-sm text-body-sm text-on-surface-variant"
            >
              Last saved {new Date(updatedAt).toLocaleString()}
            </p>
          )
        )}
      </div>

      <ConfirmDialog
        open={confirmingDiscard}
        title="Discard this lesson?"
        confirmLabel="Discard lesson"
        busyLabel="Discarding…"
        busy={discarding}
        error={discardError}
        onConfirm={discardLesson}
        onCancel={() => setConfirmingDiscard(false)}
      >
        <p>
          <strong className="text-on-surface">“{lessonTitle}”</strong> will be
          taken out of {chapterTitle} in {sectionTitle}
          {hasSavedContent && ", and the content saved for it will be deleted"}.
          Readers stop seeing it straight away. This can&apos;t be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}
