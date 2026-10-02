"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/**
 * A modal "are you sure?" for destructive actions. Built on <dialog>, so the
 * browser traps focus and Escape cancels; Cancel comes first so it, not the
 * destructive button, gets the initial focus.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busyLabel,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busyLabel: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(event) => {
        // Only the backdrop itself is the <dialog>; the card is a child.
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-0 text-on-surface shadow-xl backdrop:bg-[rgba(15,23,42,0.45)] open:motion-safe:animate-pop-in"
    >
      <div className="p-space-lg">
        <h2
          id={titleId}
          className="font-headline-md text-headline-md text-on-surface"
        >
          {title}
        </h2>
        <div className="font-body-md text-body-md mt-space-sm space-y-space-sm text-on-surface-variant">
          {children}
        </div>

        {error && (
          <p role="alert" className="font-body-sm text-body-sm mt-space-md text-error">
            {error}
          </p>
        )}

        <div className="mt-space-lg flex flex-wrap justify-end gap-space-sm">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="font-label-md text-label-md rounded-lg border border-outline-variant px-space-md py-space-sm text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="font-label-md text-label-md rounded-lg bg-error px-space-md py-space-sm font-semibold text-on-error transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
