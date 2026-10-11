"use client";

import Link from "@/components/Link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { BookOpen, CornerDownLeft, FileText, FolderOpen, Search, SquareTerminal } from "lucide-react";
import type { SearchItem } from "@/app/api/search-index/route";

const KIND_ICON = {
  page: FileText,
  course: FolderOpen,
  lesson: BookOpen,
  problem: SquareTerminal,
} as const;

const KIND_LABEL = { page: "Page", course: "Course", lesson: "Lesson", problem: "Problem" } as const;

// Fetched once per visit, the first time search opens.
let index: Promise<SearchItem[]> | null = null;
function loadIndex(): Promise<SearchItem[]> {
  index ??= fetch("/api/search-index")
    .then((res) => {
      if (!res.ok) throw new Error(`search index: ${res.status}`);
      return res.json() as Promise<{ items: SearchItem[] }>;
    })
    .then((body) => body.items)
    .catch((error) => {
      index = null; // let the next open try again
      throw error;
    });
  return index;
}

const MAX_RESULTS = 40;

function rank(items: SearchItem[], query: string): SearchItem[] {
  const phrase = query.trim().toLowerCase();
  if (!phrase) return items.filter((i) => i.kind === "course" || i.kind === "page").slice(0, MAX_RESULTS);

  const terms = phrase.split(/\s+/);
  return items
    .flatMap((item, order) => {
      const title = item.title.toLowerCase();
      const haystack = `${title} ${item.subtitle.toLowerCase()}`;
      if (!terms.every((t) => haystack.includes(t))) return [];
      let score = terms.filter((t) => title.includes(t)).length * 10;
      if (title === phrase) score += 100;
      else if (title.startsWith(phrase)) score += 70;
      else if (title.includes(phrase)) score += 50;
      if (item.kind === "course") score += 15;
      return [{ item, score, order }];
    })
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, MAX_RESULTS)
    .map((r) => r.item);
}

function highlight(text: string, query: string): ReactNode {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return text;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  return text.split(pattern).map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="bg-transparent font-semibold text-primary">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

const noSubscribe = () => () => {};

export const OPEN_SEARCH_EVENT = "ir:open-search";

/** The header search: a trigger button, Ctrl/⌘ + K, and a results dialog. */
export default function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const isMac = useSyncExternalStore(
    noSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false
  );

  const openSearch = useCallback(() => {
    setQuery("");
    setActive(0);
    setFailed(false);
    setOpen(true);
    loadIndex()
      .then(setItems)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    // Other controls (the phone menu) open search by firing this event.
    window.addEventListener(OPEN_SEARCH_EVENT, openSearch);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, openSearch);
    };
  }, [openSearch]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const results = useMemo(() => rank(items ?? [], query), [items, query]);
  const current = Math.min(active, Math.max(results.length - 1, 0));

  function go(item: SearchItem) {
    setOpen(false);
    router.push(item.href);
  }

  function move(delta: number) {
    if (results.length === 0) return;
    const next = (current + delta + results.length) % results.length;
    setActive(next);
    listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
  }

  function onInputKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Enter" && results[current]) {
      event.preventDefault();
      go(results[current]);
    }
  }

  const shortcut = isMac ? "⌘K" : "Ctrl K";

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="hidden h-8 w-full min-w-[190px] max-w-[240px] items-center justify-between gap-space-sm rounded-lg bg-surface-container-low px-space-md text-on-surface-variant shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-surface-container xl:flex"
      >
        <span className="flex min-w-0 items-center gap-space-xs">
          <Search size={16} className="shrink-0" />
          <span className="truncate font-code-sm text-code-sm">Search lessons…</span>
        </span>
        <kbd className="shrink-0 rounded bg-surface-container-highest px-space-2xs py-0.5 font-label-tag text-label-tag text-on-surface-variant">
          {shortcut}
        </kbd>
      </button>
      <button
        type="button"
        onClick={openSearch}
        aria-label="Search lessons"
        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface sm:inline-flex xl:hidden"
      >
        <Search size={18} />
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Search lessons"
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        className="mx-auto mb-auto mt-[12vh] w-[min(40rem,calc(100vw-2rem))] rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-0 text-on-surface shadow-2xl backdrop:bg-[rgba(15,23,42,0.45)] open:motion-safe:animate-pop-in"
      >
        <div className="flex max-h-[70vh] flex-col">
          <div className="flex items-center gap-space-sm border-b border-outline-variant/50 px-space-md">
            <Search size={18} className="shrink-0 text-on-surface-variant" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKey}
              placeholder="Search courses, lessons and problems…"
              role="combobox"
              aria-expanded="true"
              aria-controls="search-results"
              aria-activedescendant={results[current] ? `search-result-${current}` : undefined}
              aria-autocomplete="list"
              spellCheck={false}
              className="h-14 min-w-0 flex-1 bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/70"
            />
            <kbd className="shrink-0 rounded bg-surface-container px-space-xs py-0.5 font-label-tag text-label-tag text-on-surface-variant">
              Esc
            </kbd>
          </div>

          <ul ref={listRef} id="search-results" role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto p-space-xs">
            {failed && (
              <li className="px-space-md py-space-lg text-center font-body-sm text-body-sm text-error">
                Search couldn&apos;t load. Close and try again.
              </li>
            )}
            {!failed && items === null && (
              <li className="px-space-md py-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
                Loading…
              </li>
            )}
            {items !== null && results.length === 0 && (
              <li className="px-space-md py-space-lg text-center font-body-sm text-body-sm text-on-surface-variant">
                Nothing matches “{query}”. Try a shorter word, like <span className="font-semibold">sum</span> or{" "}
                <span className="font-semibold">matrix</span>.
              </li>
            )}
            {!query.trim() && items !== null && results.length > 0 && (
              <li role="presentation" className="px-space-sm pb-space-2xs pt-space-xs font-label-tag text-label-tag uppercase text-on-surface-variant/80">
                Jump to
              </li>
            )}
            {results.map((item, i) => {
              const Icon = KIND_ICON[item.kind];
              const selected = i === current;
              return (
                <li key={`${item.href}-${i}`} id={`search-result-${i}`} role="option" aria-selected={selected} data-index={i}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    onMouseMove={() => setActive(i)}
                    tabIndex={-1}
                    className={`flex items-center gap-space-md rounded-lg px-space-sm py-space-sm transition-colors ${
                      selected ? "bg-primary-fixed/60" : ""
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        selected ? "bg-primary-container text-on-primary" : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-body-md text-body-md text-on-surface">
                        {highlight(item.title, query)}
                      </span>
                      <span className="block truncate font-body-sm text-body-sm text-on-surface-variant">
                        {item.subtitle}
                      </span>
                    </span>
                    <span className="shrink-0 font-label-tag text-label-tag text-on-surface-variant">
                      {item.difficulty ?? KIND_LABEL[item.kind]}
                    </span>
                    {selected && <CornerDownLeft size={14} className="shrink-0 text-primary" />}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-space-md border-t border-outline-variant/50 px-space-md py-space-xs font-label-tag text-label-tag text-on-surface-variant">
            <span>↑ ↓ to move</span>
            <span>Enter to open</span>
            <span>Esc to close</span>
          </div>
        </div>
      </dialog>
    </>
  );
}
