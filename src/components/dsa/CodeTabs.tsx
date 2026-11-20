"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Check, Copy } from "lucide-react";
import { useStoredString, writeStored } from "@/lib/browserStore";
import CodeLines from "./CodeLines";

export const LANGUAGE_KEY = "ir:code-language";

const LABELS: Record<string, string> = {
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  "c++": "C++",
  c: "C",
  go: "Go",
};

/** The dot beside each language tab, in each language's familiar colour. */
export const DOTS: Record<string, string> = {
  javascript: "#f7df1e",
  js: "#f7df1e",
  typescript: "#3178c6",
  python: "#4b8bbe",
  java: "#f89820",
  cpp: "#659ad2",
  "c++": "#659ad2",
};

export const languageLabel = (language: string) => LABELS[language.toLowerCase()] ?? language;

/** A language's tab label: "JS" on phones so every tab fits, the full name from sm up. */
export function LanguageName({ language }: { language: string }) {
  const full = languageLabel(language);
  const short = full === "JavaScript" ? "JS" : full;
  return (
    <>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{full}</span>
    </>
  );
}

/**
 * The same solution in one or more languages, shown as a code editor. The
 * reader's pick is remembered, so every lesson opens on the language they
 * chose last.
 */
export default function CodeTabs({ blocks }: { blocks: { language: string; code: string }[] }) {
  const stored = useStoredString(LANGUAGE_KEY);
  const active = blocks.find((b) => b.language === stored) ?? blocks[0];
  const [copied, setCopied] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const lineCount = active.code.split("\n").length;

  function choose(index: number) {
    writeStored(LANGUAGE_KEY, blocks[index].language);
    tabs.current[index]?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = blocks.indexOf(active);
    if (event.key === "ArrowRight") choose((current + 1) % blocks.length);
    if (event.key === "ArrowLeft") choose((current - 1 + blocks.length) % blocks.length);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(active.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked; the code is still selectable by hand.
    }
  }

  return (
    <div className="code-editor mb-space-base overflow-hidden rounded-xl shadow-[0_1px_2px_rgba(19,27,46,0.08),0_16px_36px_-24px_rgba(19,27,46,0.55)] ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-space-sm border-b border-white/10 bg-black/20 pr-space-sm">
        <div role="tablist" aria-label="Code language" onKeyDown={onKeyDown} className="flex min-w-0 overflow-x-auto">
          {blocks.map((block, i) => {
            const selected = block === active;
            return (
              <button
                key={block.language}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => choose(i)}
                className={`relative flex h-10 shrink-0 items-center gap-space-xs whitespace-nowrap px-3 font-label-md text-[13px] sm:px-space-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--editor-active-edge)] ${
                  selected
                    ? "bg-[var(--editor-bg)] font-semibold text-[var(--editor-text)]"
                    : "text-[var(--editor-muted)] hover:bg-white/5 hover:text-[var(--editor-text)]"
                }`}
              >
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ background: DOTS[block.language.toLowerCase()] ?? "#a5a0ff" }}
                />
                <LanguageName language={block.language} />
                {selected && <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-[var(--editor-active-edge)]" />}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Code copied" : "Copy code"}
          className={`inline-flex h-7 shrink-0 items-center gap-space-xs rounded-md px-space-sm font-label-md text-[13px] transition-colors ${
            copied ? "text-[#86e3bb]" : "text-[var(--editor-muted)] hover:bg-white/10 hover:text-[var(--editor-text)]"
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div role="tabpanel" aria-label={`${languageLabel(active.language)} code`}>
        <CodeLines code={active.code} language={active.language} className="max-h-[560px]" />
      </div>

      <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-space-md py-1 font-code-sm text-[11px] text-[var(--editor-muted)]">
        <span>{languageLabel(active.language)}</span>
        <span>
          {lineCount} {lineCount === 1 ? "line" : "lines"}
        </span>
      </div>
    </div>
  );
}
