/**
 * Structured data. The payload is serialised with `<` escaped so a product name
 * or review body can never break out of the script tag.
 */
export function JsonLd({ id, data }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      id={`ld-${id}`}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
