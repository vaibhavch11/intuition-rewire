import type { ReactNode } from "react";
import type { LessonBlock } from "@/lib/dsa/types";
import PracticeSimulator from "./practice/PracticeSimulator";
import CodeTabs from "./CodeTabs";
import ComplexityCard from "./ComplexityCard";
import LessonFigure from "./LessonFigure";
import RichText from "./RichText";

type CodeBlock = Extract<LessonBlock, { type: "code" }>;

function renderCode(block: CodeBlock, key: number) {
  // Real code opens in the editor; plain-text examples (formulas, sample
  // input and output) stay a quiet monospace panel.
  if (block.language !== "text") return <CodeTabs key={key} blocks={[block]} />;
  return (
    <pre
      key={key}
      className="font-code-md text-code-md mb-space-base overflow-x-auto rounded-xl border border-outline-variant/60 bg-surface-container-low px-space-base py-space-md text-on-surface"
    >
      <code>{block.code}</code>
    </pre>
  );
}

function renderBlock(block: Exclude<LessonBlock, CodeBlock>, i: number, firstFigure: number) {
  switch (block.type) {
    case "heading":
      return (
        <h2
          key={i}
          className="font-headline-lg text-headline-lg mt-space-2xl mb-space-base text-on-surface"
        >
          {block.text}
        </h2>
      );

    case "paragraph":
      return (
        <p
          key={i}
          className="font-body-lg text-body-lg mb-space-base text-on-surface-variant"
        >
          <RichText text={block.text} />
        </p>
      );

    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <div
          key={i}
          className="my-space-lg rounded-lg bg-surface-container-low px-space-xl py-space-lg"
        >
          <List
            className={`space-y-space-sm pl-space-base ${
              block.ordered ? "list-decimal" : "list-disc"
            }`}
          >
            {block.items.map((item, j) => (
              <li
                key={j}
                className="font-body-lg text-body-lg text-on-surface-variant"
              >
                <RichText text={item} />
              </li>
            ))}
          </List>
        </div>
      );
    }

    case "drawing":
    case "figure":
      return (
        <LessonFigure
          key={i}
          src={block.src}
          alt={block.alt}
          caption={block.caption}
          width={block.width}
          height={block.height}
          eager={i === firstFigure}
        />
      );

    case "simulator":
      return <PracticeSimulator key={i} program={block.program} caption={block.caption} />;

    case "complexity":
      return <ComplexityCard key={i} rows={block.rows} />;
  }
}

/**
 * Back-to-back code blocks in different languages, starting at `start`: one
 * solution written several ways. Plain-text examples never join one.
 */
function codeRun(blocks: LessonBlock[], start: number): CodeBlock[] {
  const run: CodeBlock[] = [];
  for (let k = start; k < blocks.length; k++) {
    const next = blocks[k];
    if (next.type !== "code") break;
    if (run.length > 0 && (next.language === "text" || run[0].language === "text")) break;
    if (run.some((b) => b.language === next.language)) break;
    run.push(next);
    if (next.language === "text") break;
  }
  return run;
}

export default function LessonBody({ blocks }: { blocks: LessonBlock[] }) {
  const out: ReactNode[] = [];
  // The first picture is usually the largest thing near the top (the page's
  // LCP), so it loads straight away; the rest wait until they're scrolled near.
  const firstFigure = blocks.findIndex((b) => b.type === "drawing" || b.type === "figure");

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // A simulator followed straight away by its solution in several languages
    // shows them as tabs in its own code panel, with the running line marked
    // in each, so the solution isn't shown a second time below it.
    if (block.type === "simulator") {
      const run = codeRun(blocks, i + 1);
      const solved = run.length > 1 && run.some((b) => b.language === "javascript");
      out.push(
        <PracticeSimulator key={i} program={block.program} caption={block.caption} solutions={solved ? run : undefined} />
      );
      if (solved) i += run.length;
      continue;
    }

    if (block.type !== "code") {
      out.push(renderBlock(block, i, firstFigure));
      continue;
    }

    // One solution written several ways shares a tabbed box.
    const run = codeRun(blocks, i);
    out.push(run.length > 1 ? <CodeTabs key={i} blocks={run} /> : renderCode(block, i));
    i += run.length - 1;
  }

  return <div>{out}</div>;
}
