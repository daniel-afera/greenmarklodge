/**
 * Marks an element as editable in on-site edit mode:
 *   <h2 {...cms("homePage", "roomsSection.title")}>…</h2>
 * Renders `data-cms="homePage:roomsSection.title"`. The editor (loaded only
 * in edit mode) finds these and opens the right field. With no doc (e.g. a
 * built-in fallback list item) nothing is rendered.
 */
export const cms = (doc: string | undefined, path: string) => (doc ? { "data-cms": `${doc}:${path}` } : {});

export const parseMark = (mark: string) => {
  const i = mark.indexOf(":");
  return { doc: mark.slice(0, i), path: mark.slice(i + 1) };
};
