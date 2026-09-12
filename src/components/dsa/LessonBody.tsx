import type { LessonBlock } from "@/lib/dsa/types";
import LessonFigure from "./LessonFigure";
import RichText from "./RichText";

export default function LessonBody({ blocks }: { blocks: LessonBlock[] }) {
  return (
    <div>
      {blocks.map((block, i) => {
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

          case "code":
            return (
              <pre
                key={i}
                className="font-code-md text-code-md mb-space-base overflow-x-auto rounded-lg border border-outline-variant/60 bg-surface-container-low p-space-base text-on-surface"
              >
                <code>{block.code}</code>
              </pre>
            );

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
              />
            );
        }
      })}
    </div>
  );
}
