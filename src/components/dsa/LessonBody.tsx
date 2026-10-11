import type { ReactNode } from "react";
import type { LessonBlock } from "@/lib/dsa/types";
import PracticeSimulator from "./practice/PracticeSimulator";
import CodeTabs from "./CodeTabs";
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
  }
}

export default function LessonBody({ blocks }: { blocks: LessonBlock[] }) {
  const out: ReactNode[] = [];
  // The first picture is usually the largest thing near the top (the page's
  // LCP), so it loads straight away; the rest wait until they're scrolled near.
  const firstFigure = blocks.findIndex((b) => b.type === "drawing" || b.type === "figure");

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type !== "code") {
      out.push(renderBlock(block, i, firstFigure));
      continue;
    }

    // Back-to-back code blocks in different languages are one solution
    // written several ways, so they share a tabbed box. Plain-text examples
    // never join one.
    const run: CodeBlock[] = [block];
    while (block.language !== "text" && i + 1 < blocks.length) {
      const next = blocks[i + 1];
      if (
        next.type !== "code" ||
        next.language === "text" ||
        run.some((b) => b.language === next.language)
      ) {
        break;
      }
      run.push(next);
      i++;
    }
    out.push(run.length > 1 ? <CodeTabs key={i} blocks={run} /> : renderCode(block, i));
  }

  return <div>{out}</div>;
}
