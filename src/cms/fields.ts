/**
 * One field config per document type. It drives:
 *  - validation (zod, built in ./schema.ts) on the browser and the server
 *  - the /admin forms (src/components/admin/DocForm.tsx)
 *  - the on-site editor's popovers (labels, limits)
 *
 * Shapes match src/content/types.ts. Plain data only, so it can be
 * imported by client components.
 */

export type Field =
  | { kind: "text"; key: string; label: string; max?: number; multiline?: boolean; hint?: string; pattern?: [string, string] }
  | { kind: "title"; key: string; label: string; max?: number }
  | { kind: "number"; key: string; label: string; min?: number; max?: number }
  | { kind: "select"; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: "image"; key: string; label: string; optional?: boolean }
  | { kind: "images"; key: string; label: string; max?: number }
  | { kind: "strings"; key: string; label: string; itemLabel: string; max?: number }
  | { kind: "group"; key: string; label: string; fields: Field[] }
  | { kind: "list"; key: string; label: string; itemLabel: string; fields: Field[]; max?: number };

export const TITLE_HINT = "Use / for a new line and *word* for italic.";

// ─── Shared pieces ────────────────────────────────────────────────────
const text = (key: string, label: string, max = 120, extra: Partial<Extract<Field, { kind: "text" }>> = {}): Field => ({ kind: "text", key, label, max, ...extra });
const para = (key: string, label: string, max = 900): Field => ({ kind: "text", key, label, max, multiline: true });
const title = (key: string, label = "Title", max = 120): Field => ({ kind: "title", key, label, max });
const image = (key: string, label: string, optional = false): Field => ({ kind: "image", key, label, optional });

const hero: Field = {
  kind: "group",
  key: "hero",
  label: "Header",
  fields: [image("image", "Photo"), text("eyebrow", "Small heading", 60), title("title"), para("text", "Intro text", 400)],
};
const cta: Field = {
  kind: "group",
  key: "cta",
  label: "Closing banner",
  fields: [image("image", "Photo"), text("eyebrow", "Small heading", 60), title("title")],
};
const splitCard = (key: string, label: string): Field => ({
  kind: "group",
  key,
  label,
  fields: [image("image", "Photo"), text("eyebrow", "Small heading", 60), title("title"), para("text", "Text", 400), text("cta", "Button text", 40), text("href", "Button link", 120)],
});

// ─── Singletons ───────────────────────────────────────────────────────
export const singletons = {
  siteSettings: {
    label: "Settings",
    fields: [
      text("name", "Lodge name", 40),
      text("tagline", "Tagline", 60),
      para("description", "Description (search engines & sharing)", 300),
      text("phone", "Phone", 30),
      text("whatsapp", "WhatsApp number", 30),
      text("email", "Email", 120, { pattern: ["^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", "Enter a valid email address."] }),
      { kind: "group", key: "address", label: "Address", fields: [text("line1", "Line 1", 80), text("line2", "Line 2", 80), text("country", "Country", 60)] },
      text("mapEmbed", "Google Maps embed URL", 600, { hint: "Google Maps → Share → Embed a map → copy the src URL.", pattern: ["^https://", "Must start with https://"] }),
      para("directions", "Directions", 400),
      { kind: "list", key: "social", label: "Social links", itemLabel: "Link", max: 8, fields: [text("label", "Label", 30), text("href", "URL", 300, { pattern: ["^https://", "Must start with https://"] })] },
      image("shareImage", "Share image (link previews)", true),
    ],
  },
  homePage: {
    label: "Home",
    fields: [
      hero,
      {
        kind: "group",
        key: "intro",
        label: "Introduction",
        fields: [text("label", "Small heading", 60), para("statement", "Statement", 300), image("imageLarge", "Large photo"), image("imageSmall", "Small photo"), para("body", "Text", 600), text("linkLabel", "Link text", 40)],
      },
      { kind: "strings", key: "marquee", label: "Scrolling words", itemLabel: "Word", max: 12 },
      { kind: "group", key: "roomsSection", label: "Rooms section", fields: [text("eyebrow", "Small heading", 60), title("title")] },
      { kind: "group", key: "experiencesSection", label: "Experiences section", fields: [text("eyebrow", "Small heading", 60), title("title"), para("text", "Text", 400)] },
      { kind: "list", key: "stats", label: "Numbers", itemLabel: "Number", max: 6, fields: [text("value", "Value", 10), text("unit", "Unit", 10), text("label", "Label", 40)] },
      splitCard("dining", "Dining card"),
      splitCard("spa", "Spa card"),
      { kind: "group", key: "gallerySection", label: "Gallery section", fields: [title("title"), text("linkLabel", "Link text", 40)] },
      cta,
    ],
  },
  roomsPage: {
    label: "Rooms page",
    fields: [
      hero,
      text("comfortsEyebrow", "Comforts small heading", 60),
      title("comfortsTitle", "Comforts title"),
      { kind: "list", key: "comforts", label: "Comforts", itemLabel: "Comfort", max: 12, fields: [text("title", "Title", 60), para("text", "Text", 300)] },
      cta,
    ],
  },
  diningPage: { label: "Dining page", fields: [hero, para("statement", "Statement", 400), cta] },
  spaPage: {
    label: "Spa page",
    fields: [
      hero,
      text("philosophyEyebrow", "Philosophy small heading", 60),
      title("philosophyTitle", "Philosophy title"),
      para("philosophyText", "Philosophy text", 900),
      image("philosophyImage", "Philosophy photo"),
      text("menuEyebrow", "Treatments small heading", 60),
      title("menuTitle", "Treatments title"),
      cta,
    ],
  },
  experiencesPage: { label: "Experiences page", fields: [hero, cta] },
  galleryPage: { label: "Gallery", fields: [hero, { kind: "images", key: "images", label: "Gallery photos", max: 80 }] },
  contactPage: { label: "Contact page", fields: [hero, title("formTitle", "Form title")] },
} satisfies Record<string, { label: string; fields: Field[] }>;

export type SingletonId = keyof typeof singletons;

// ─── Collections ──────────────────────────────────────────────────────
export const collections = {
  room: {
    label: "Rooms",
    singular: "room",
    titleKey: "name",
    fields: [
      text("name", "Name", 60),
      text("slug", "Web address", 60, { hint: "Used in the link: /rooms/your-text. Lowercase letters, numbers and dashes.", pattern: ["^[a-z0-9]+(-[a-z0-9]+)*$", "Use lowercase letters, numbers and dashes."] }),
      { kind: "select", key: "category", label: "Category", options: [{ value: "suite", label: "Suite" }, { value: "villa", label: "Villa" }, { value: "room", label: "Room" }] },
      text("tag", "Tag", 40),
      text("view", "View", 60),
      text("bed", "Bed", 60),
      { kind: "number", key: "maxGuests", label: "Max guests", min: 1, max: 20 },
      text("size", "Size", 30),
      text("priceFrom", "Price from", 30),
      para("short", "Short description", 240),
      para("description", "Description", 1200),
      { kind: "images", key: "images", label: "Photos", max: 20 },
      { kind: "strings", key: "amenities", label: "Amenities", itemLabel: "Amenity", max: 30 },
    ],
  },
  experience: {
    label: "Experiences",
    singular: "experience",
    titleKey: "title",
    fields: [text("title", "Title", 60), text("italic", "Italic part", 60), para("text", "Text", 500), image("image", "Photo"), text("cta", "Button text", 40)],
  },
  venue: {
    label: "Restaurants",
    singular: "restaurant",
    titleKey: "name",
    fields: [text("name", "Name", 60), text("kind", "Kind", 60), text("hours", "Hours", 60), para("text", "Text", 500), image("image", "Photo")],
  },
  treatment: {
    label: "Spa treatments",
    singular: "treatment",
    titleKey: "name",
    fields: [text("name", "Name", 60), text("duration", "Duration", 30), para("text", "Text", 400)],
  },
  testimonial: {
    label: "Reviews",
    singular: "review",
    titleKey: "who",
    fields: [para("text", "Review", 600), text("who", "Guest name", 80)],
  },
} satisfies Record<string, { label: string; singular: string; titleKey: string; fields: Field[] }>;

export type CollectionType = keyof typeof collections;

export const isSingleton = (id: string): id is SingletonId => id in singletons;
export const isCollection = (type: string): type is CollectionType => type in collections;

/** Fields for a content row (singleton by id, collection item by type). */
export function fieldsFor(row: { id: string; type: string }): Field[] | null {
  if (row.type === "singleton") return isSingleton(row.id) ? singletons[row.id].fields : null;
  return isCollection(row.type) ? collections[row.type].fields : null;
}

/** An empty value for a set of fields (new collection items). */
export function emptyValue(fields: Field[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.kind === "group") out[f.key] = emptyValue(f.fields);
    else if (f.kind === "list" || f.kind === "images" || f.kind === "strings") out[f.key] = [];
    else if (f.kind === "number") out[f.key] = f.min ?? 0;
    else if (f.kind === "select") out[f.key] = f.options[0]?.value ?? "";
    else if (f.kind === "image") out[f.key] = null;
    else out[f.key] = "";
  }
  return out;
}

/** Find a field by dotted path, e.g. "hero.title" or "stats.0.label". */
export function fieldAt(fields: Field[], path: string): Field | null {
  const [head, ...rest] = path.split(".");
  const f = fields.find((x) => x.key === head);
  if (!f || !rest.length) return f ?? null;
  if (f.kind === "group") return fieldAt(f.fields, rest.join("."));
  if (f.kind === "list") return fieldAt(f.fields, rest.slice(1).join("."));
  return null;
}
