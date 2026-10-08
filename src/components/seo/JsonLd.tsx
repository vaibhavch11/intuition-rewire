/**
 * Structured data for search engines. `<` is escaped so text inside the data
 * (a lesson title, an answer) can never close the script tag early.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
