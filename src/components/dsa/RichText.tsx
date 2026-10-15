const TOKEN = /\*\*[^*]+\*\*|`[^`]+`|\*[^*\s](?:[^*\n]*[^*\s])?\*/g;
const WORD = /\w/;

/**
 * Splits text into plain runs (even indexes) and **bold**, `code` and *italic*
 * tokens (odd indexes). Single asterisks only count as italics between
 * non-word characters, so `2*3*4` or `a*b*c` stay as typed.
 */
function tokens(text: string): string[] {
  const out: string[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const token = match[0];
    const at = match.index ?? 0;
    const italic = token[1] !== "*" && token[0] === "*";
    if (italic && (WORD.test(text[at - 1] ?? "") || WORD.test(text[at + token.length] ?? ""))) continue;
    out.push(text.slice(last, at), token);
    last = at + token.length;
  }
  out.push(text.slice(last));
  return out;
}

export default function RichText({ text }: { text: string }) {
  return (
    <>
      {tokens(text).map((part, i) => {
        if (i % 2 === 0) return part;
        if (part.startsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-on-surface">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`")) {
          return (
            <code
              key={i}
              className="font-code-sm text-code-sm rounded bg-surface-container-high px-space-xs py-0.5 text-primary"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <em key={i}>{part.slice(1, -1)}</em>;
      })}
    </>
  );
}
