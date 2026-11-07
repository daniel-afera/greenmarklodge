/**
 * Zod schemas built from the field config (./fields.ts).
 *
 * - "draft": lenient — empty values are fine (singletons fall back to the
 *   built-in content field by field).
 * - "publish": collection items must have every photo and their title,
 *   since a list item has no built-in fallback.
 */
import { z } from "zod";
import type { Field } from "./fields";

// No `new Function` probe: the site's CSP forbids eval (see src/lib/booking-schema.ts).
z.config({ jitless: true });

export type Mode = "draft" | "publish";

const imageSchema = z.object({
  src: z.string().max(600).regex(/^(https:\/\/|\/images\/)/, "Image must be an uploaded photo."),
  alt: z.string().max(200, "Keep the description under 200 characters."),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  position: z
    .string()
    .regex(/^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/)
    .optional(),
  blur: z.string().max(4000).startsWith("data:image/").optional(),
});

function fieldSchema(f: Field, mode: Mode, required: boolean): z.ZodType {
  switch (f.kind) {
    case "text":
    case "title": {
      let s = z.string().max(f.max ?? 2000, `Keep it under ${f.max ?? 2000} characters.`);
      if (required) s = s.min(1, `${f.label} is required.`);
      if (f.kind === "text" && f.pattern) {
        const [re, msg] = f.pattern;
        return s.refine((v) => v === "" || new RegExp(re).test(v), msg);
      }
      return s;
    }
    case "number": {
      let s = z.number({ error: "Enter a number." }).int("Whole numbers only.");
      if (f.min !== undefined) s = s.min(f.min, `At least ${f.min}.`);
      if (f.max !== undefined) s = s.max(f.max, `At most ${f.max}.`);
      return s;
    }
    case "select":
      return z.enum(f.options.map((o) => o.value) as [string, ...string[]]);
    case "image":
      return required && !f.optional ? imageSchema : imageSchema.nullable().optional();
    case "images": {
      const s = z.array(imageSchema).max(f.max ?? 100, `At most ${f.max} photos.`);
      return required ? s.min(1, "Add at least one photo.") : s;
    }
    case "strings":
      return z.array(z.string().max(120)).max(f.max ?? 50);
    case "group":
      return objectSchema(f.fields, mode, false);
    case "list":
      return z.array(objectSchema(f.fields, mode, false)).max(f.max ?? 50, `At most ${f.max} items.`);
  }
}

function objectSchema(fields: Field[], mode: Mode, strictItem: boolean, titleKey?: string) {
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) {
    const required = mode === "publish" && strictItem && (f.kind === "image" || f.kind === "images" || f.key === titleKey);
    const s = fieldSchema(f, mode, required);
    // Missing keys are fine unless required; unknown keys are dropped.
    shape[f.key] = required ? s : s.optional();
  }
  return z.object(shape);
}

/** Schema for a whole document. `item` = collection item (strict on publish). */
export function docSchema(fields: Field[], mode: Mode, item?: { titleKey: string }) {
  return objectSchema(fields, mode, !!item, item?.titleKey);
}

/** Zod issues → { "hero.title": "message" } (first message per path). */
export function issuesByPath(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
