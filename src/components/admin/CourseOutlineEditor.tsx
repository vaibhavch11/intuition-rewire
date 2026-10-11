"use client";

import Link from "@/components/Link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Difficulty, TopicKind } from "@/lib/dsa/types";
import ConfirmDialog from "./ConfirmDialog";
import { fieldClass, inputClass } from "./fieldStyles";
import { errorMessage, sendCurriculumChange } from "./sendCurriculumChange";

export interface OutlineLesson {
  slug: string;
  title: string;
  difficulty?: Difficulty;
  written: boolean;
}

export interface OutlineChapter {
  title: string;
  lessons: OutlineLesson[];
}

type Removal =
  | { kind: "lesson"; chapter: string; lesson: OutlineLesson }
  | { kind: "chapter"; chapter: OutlineChapter };

const DIFFICULTIES: Difficulty[] = ["Fundamental", "Easy", "Medium", "Hard"];

/** The server tidies titles the same way, so a new chapter can be found by name. */
const tidy = (title: string) => title.replace(/\s+/g, " ").trim();

const secondaryButton =
  "font-label-md text-label-md rounded-lg border border-outline-variant px-space-md py-space-xs text-on-surface-variant hover:border-primary hover:text-primary disabled:opacity-50";

const primaryButton =
  "font-label-md text-label-md rounded-lg bg-primary-container px-space-md py-space-xs font-semibold text-on-primary transition-transform active:scale-[0.98] disabled:opacity-50";

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="shrink-0 rounded p-space-xs text-on-surface-variant/70 transition-colors hover:bg-error-container hover:text-on-error-container"
    >
      <Trash2 size={15} />
    </button>
  );
}

function InlineForm({
  label,
  submitLabel,
  savingLabel,
  saving,
  canSubmit,
  error,
  hint,
  onSubmit,
  onCancel,
  children,
}: {
  label: string;
  submitLabel: string;
  savingLabel: string;
  saving: boolean;
  canSubmit: boolean;
  error: string | null;
  hint?: string;
  onSubmit: () => void;
  onCancel: () => void;
  children: ReactNode;
}) {
  return (
    <form
      aria-label={label}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (canSubmit && !saving) onSubmit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !saving) onCancel();
      }}
      className="mt-space-sm rounded-lg border border-dashed border-primary/40 bg-surface-container-low p-space-md motion-safe:animate-fade-in"
    >
      <div className="flex flex-wrap gap-space-sm">{children}</div>
      {hint && (
        <p className="font-body-sm text-body-sm mt-space-xs text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        <p role="alert" className="font-body-sm text-body-sm mt-space-xs text-error">
          {error}
        </p>
      )}
      <div className="mt-space-sm flex gap-space-sm">
        <button type="submit" disabled={!canSubmit || saving} className={primaryButton}>
          {saving ? savingLabel : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className={secondaryButton}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddLessonForm({
  sectionSlug,
  chapter,
  onAdded,
  onCancel,
}: {
  sectionSlug: string;
  chapter: string;
  onAdded: (slug: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<TopicKind>("lesson");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setSaving(true);
    setError(null);
    try {
      const { slug } = await sendCurriculumChange({
        op: "add-lesson",
        section: sectionSlug,
        chapter,
        title,
        kind,
        difficulty: kind === "problem" ? difficulty : undefined,
      });
      if (slug) onAdded(slug);
    } catch (caught) {
      setError(errorMessage(caught));
      setSaving(false);
    }
  }

  return (
    <InlineForm
      label={`Add a lesson to ${chapter}`}
      submitLabel="Add lesson"
      savingLabel="Adding…"
      saving={saving}
      canSubmit={tidy(title).length > 0}
      error={error}
      onSubmit={add}
      onCancel={onCancel}
    >
      <input
        autoFocus
        value={title}
        maxLength={120}
        aria-label="Lesson title"
        placeholder="New lesson title"
        onChange={(event) => setTitle(event.target.value)}
        className={`${inputClass} min-w-0 flex-1 basis-60`}
      />
      <select
        value={kind}
        aria-label="Lesson type"
        onChange={(event) => setKind(event.target.value as TopicKind)}
        className={fieldClass}
      >
        <option value="lesson">Lesson</option>
        <option value="problem">Problem</option>
      </select>
      {kind === "problem" && (
        <select
          value={difficulty}
          aria-label="Difficulty"
          onChange={(event) => setDifficulty(event.target.value as Difficulty)}
          className={fieldClass}
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      )}
    </InlineForm>
  );
}

function AddChapterForm({
  sectionSlug,
  onAdded,
  onCancel,
}: {
  sectionSlug: string;
  onAdded: (title: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add() {
    setSaving(true);
    setError(null);
    try {
      await sendCurriculumChange({ op: "add-chapter", section: sectionSlug, title });
      onAdded(tidy(title));
    } catch (caught) {
      setError(errorMessage(caught));
      setSaving(false);
    }
  }

  return (
    <InlineForm
      label="Add a chapter"
      submitLabel="Add chapter"
      savingLabel="Adding…"
      saving={saving}
      canSubmit={tidy(title).length > 0}
      error={error}
      hint="Chapters are added at the end of the course. Start the title with “Pattern:” to count it as a pattern."
      onSubmit={add}
      onCancel={onCancel}
    >
      <input
        autoFocus
        value={title}
        maxLength={80}
        aria-label="Chapter title"
        placeholder="New chapter title, e.g. Pattern: Monotonic stack"
        onChange={(event) => setTitle(event.target.value)}
        className={`${inputClass} min-w-0 flex-1 basis-72`}
      />
    </InlineForm>
  );
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function RemovalMessage({
  removal,
  sectionTitle,
}: {
  removal: Removal;
  sectionTitle: string;
}) {
  if (removal.kind === "lesson") {
    const { lesson, chapter } = removal;
    return (
      <p>
        <strong className="text-on-surface">“{lesson.title}”</strong> will be
        taken out of {chapter}
        {lesson.written && ", and the content written for it will be deleted"}.
        Readers stop seeing it straight away. This can&apos;t be undone.
      </p>
    );
  }

  const { lessons, title } = removal.chapter;
  const written = lessons.filter((l) => l.written).length;
  return (
    <p>
      <strong className="text-on-surface">“{title}”</strong>
      {lessons.length > 0 && ` and its ${plural(lessons.length, "lesson")}`} will
      be taken out of {sectionTitle}
      {written > 0 &&
        `, and the content written for ${
          written === lessons.length ? (written === 1 ? "it" : "them") : `${written} of them`
        } will be deleted`}
      . Readers stop seeing it straight away. This can&apos;t be undone.
    </p>
  );
}

/** One course's chapters and lessons, with controls to add and remove them. */
export default function CourseOutlineEditor({
  sectionSlug,
  sectionTitle,
  chapters,
}: {
  sectionSlug: string;
  sectionTitle: string;
  chapters: OutlineChapter[];
}) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [addingLessonTo, setAddingLessonTo] = useState<string | null>(null);
  const [addingChapter, setAddingChapter] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [removal, setRemoval] = useState<Removal | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  // The fresh row stays tinted just long enough to spot it.
  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(null), 2500);
    return () => clearTimeout(timer);
  }, [justAdded]);

  const refresh = () => startRefresh(() => router.refresh());

  function askToRemove(next: Removal) {
    setRemoveError(null);
    setRemoval(next);
  }

  async function confirmRemoval() {
    if (!removal) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      await sendCurriculumChange(
        removal.kind === "lesson"
          ? { op: "remove-lesson", section: sectionSlug, topic: removal.lesson.slug }
          : { op: "remove-chapter", section: sectionSlug, chapter: removal.chapter.title }
      );
      setRemoval(null);
      refresh();
    } catch (caught) {
      setRemoveError(errorMessage(caught));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className={`transition-opacity ${refreshing ? "opacity-60" : ""}`}>
      {chapters.length === 0 && (
        <p className="font-body-md text-body-md text-on-surface-variant">
          This course has no chapters yet.
        </p>
      )}

      <div className="space-y-space-md">
        {chapters.map((chapter) => (
          <div
            key={chapter.title}
            className={`rounded-lg transition-colors ${
              justAdded === `chapter:${chapter.title}`
                ? "bg-primary-fixed/30 motion-safe:animate-fade-in"
                : ""
            }`}
          >
            <div className="flex items-center justify-between gap-space-md">
              <h3 className="font-label-md text-label-md min-w-0 font-bold text-on-surface">
                {chapter.title}
              </h3>
              <div className="flex shrink-0 items-center gap-space-2xs">
                <button
                  type="button"
                  onClick={() => setAddingLessonTo(chapter.title)}
                  className="font-label-md text-label-md flex items-center gap-space-2xs rounded px-space-sm py-space-2xs text-primary hover:bg-surface-container"
                >
                  <Plus size={14} />
                  Add lesson
                </button>
                <RemoveButton
                  label={`Remove chapter “${chapter.title}”`}
                  onClick={() => askToRemove({ kind: "chapter", chapter })}
                />
              </div>
            </div>

            {chapter.lessons.length === 0 ? (
              <p className="font-body-sm text-body-sm mt-space-2xs px-space-sm text-on-surface-variant italic">
                No lessons yet.
              </p>
            ) : (
              <ul className="mt-space-xs">
                {chapter.lessons.map((lesson) => (
                  <li
                    key={lesson.slug}
                    className={`flex items-center gap-space-2xs rounded transition-colors hover:bg-surface-container ${
                      justAdded === `lesson:${lesson.slug}`
                        ? "bg-primary-fixed/40 motion-safe:animate-fade-in"
                        : ""
                    }`}
                  >
                    <Link
                      href={`/admin/${sectionSlug}/${lesson.slug}`}
                      className="flex min-w-0 flex-1 items-center justify-between gap-space-md px-space-sm py-space-xs"
                    >
                      <span className="font-body-md text-body-md text-primary">
                        {lesson.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-space-sm">
                        {lesson.difficulty && (
                          <span className="font-label-tag text-label-tag text-on-surface-variant">
                            {lesson.difficulty}
                          </span>
                        )}
                        {lesson.written && (
                          <span className="font-label-tag text-label-tag rounded bg-secondary-container px-space-sm py-space-2xs text-on-secondary-container">
                            written
                          </span>
                        )}
                      </span>
                    </Link>
                    <RemoveButton
                      label={`Remove lesson “${lesson.title}”`}
                      onClick={() =>
                        askToRemove({ kind: "lesson", chapter: chapter.title, lesson })
                      }
                    />
                  </li>
                ))}
              </ul>
            )}

            {addingLessonTo === chapter.title && (
              <AddLessonForm
                sectionSlug={sectionSlug}
                chapter={chapter.title}
                onCancel={() => setAddingLessonTo(null)}
                onAdded={(slug) => {
                  setAddingLessonTo(null);
                  setJustAdded(`lesson:${slug}`);
                  refresh();
                }}
              />
            )}
          </div>
        ))}
      </div>

      {addingChapter ? (
        <AddChapterForm
          sectionSlug={sectionSlug}
          onCancel={() => setAddingChapter(false)}
          onAdded={(title) => {
            setAddingChapter(false);
            setJustAdded(`chapter:${title}`);
            // Straight on to its first lesson.
            setAddingLessonTo(title);
            refresh();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAddingChapter(true)}
          className="font-label-md text-label-md mt-space-lg flex w-full items-center justify-center gap-space-xs rounded-lg border border-dashed border-outline-variant py-space-sm text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
        >
          <Plus size={16} />
          Add chapter
        </button>
      )}

      <ConfirmDialog
        open={removal !== null}
        title={removal?.kind === "chapter" ? "Remove this chapter?" : "Remove this lesson?"}
        confirmLabel={removal?.kind === "chapter" ? "Remove chapter" : "Remove lesson"}
        busyLabel="Removing…"
        busy={removing}
        error={removeError}
        onConfirm={confirmRemoval}
        onCancel={() => setRemoval(null)}
      >
        {removal && <RemovalMessage removal={removal} sectionTitle={sectionTitle} />}
      </ConfirmDialog>
    </div>
  );
}
