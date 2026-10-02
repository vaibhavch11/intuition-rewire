import { highlight, type TokenKind } from "./highlight";

const TOKEN_CLASS: Record<TokenKind, string> = {
  plain: "",
  comment: "tok-comment",
  string: "tok-string",
  number: "tok-number",
  keyword: "tok-keyword",
  function: "tok-function",
  type: "tok-type",
  punct: "tok-punct",
  meta: "tok-meta",
};

/**
 * Highlighted, line-numbered code in the editor theme. Line numbers can't be
 * selected, so copying by hand gets clean code.
 */
export default function CodeLines({
  code,
  language,
  activeLine,
  size = "md",
  className = "",
}: {
  code: string;
  language: string;
  /** 1-based line to mark as the one currently executing. */
  activeLine?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const lines = highlight(code, language);
  return (
    <pre
      className={`code-editor m-0 overflow-auto py-space-sm ${
        size === "sm" ? "font-code-sm text-code-sm" : "font-code-md text-code-md"
      } ${className}`}
    >
      <code className="block min-w-max">
        {lines.map((tokens, i) => {
          const n = i + 1;
          const active = n === activeLine;
          return (
            <span
              key={i}
              data-line={n}
              data-active={active ? "true" : undefined}
              className={`flex border-l-2 pr-space-lg transition-colors duration-150 ${
                active ? "border-[var(--editor-active-edge)] bg-[var(--editor-active)]" : "border-transparent"
              }`}
            >
              <span
                aria-hidden
                className={`w-11 shrink-0 select-none pr-space-md text-right ${
                  active ? "text-[var(--editor-text)]" : "text-[var(--editor-gutter)]"
                }`}
              >
                {n}
              </span>
              <span className="whitespace-pre">
                {tokens.length === 0
                  ? " "
                  : tokens.map((token, j) =>
                      token.kind === "plain" ? (
                        token.text
                      ) : (
                        <span key={j} className={TOKEN_CLASS[token.kind]}>
                          {token.text}
                        </span>
                      )
                    )}
              </span>
            </span>
          );
        })}
      </code>
    </pre>
  );
}
