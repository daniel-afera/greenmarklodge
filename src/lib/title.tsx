import type { ReactNode } from "react";

/** One line of title text: *text* becomes italic. */
export function inlineTitle(line: string): ReactNode {
  const parts = line.split(/\*(.+?)\*/g);
  return parts.map((p, i) => (i % 2 ? <em key={i}>{p}</em> : p));
}

/**
 * Editor title syntax → lines for MaskText / headings.
 * "Wake up / *in the gardens*" → ["Wake up", <><em>in the gardens</em></>]
 */
export function titleLines(raw: string): ReactNode[] {
  return raw
    .split(/\s*\/\s*/)
    .filter(Boolean)
    .map((line, i) => <span key={i}>{inlineTitle(line)}</span>);
}

/** Stable page anchor for an experience: "The coffee" + "ceremony" → "the-coffee-ceremony". */
export const experienceAnchor = (e: { title: string; italic: string }) =>
  `${e.title} ${e.italic}`
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "experience";

/** Single-line rendering (lines joined with a space or <br>). */
export function titleInline(raw: string, breakLines = false): ReactNode {
  const lines = raw.split(/\s*\/\s*/).filter(Boolean);
  return lines.map((line, i) => (
    <span key={i}>
      {i > 0 && (breakLines ? <br /> : " ")}
      {inlineTitle(line)}
    </span>
  ));
}

/** Plain text (for alt text, metadata). */
export const titlePlain = (raw: string) => raw.replace(/\*/g, "").replace(/\s*\/\s*/g, " ");
