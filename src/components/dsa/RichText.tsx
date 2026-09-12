const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`)/g;

export default function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
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
        return part;
      })}
    </>
  );
}
