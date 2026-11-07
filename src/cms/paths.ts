/** Immutable get/set by dotted path ("hero.title", "stats.0.label"). Shared by the admin forms and the on-site editor. */

export type Path = string;

export function getIn(obj: unknown, path: Path): unknown {
  return path.split(".").reduce<unknown>((cur, key) => (cur && typeof cur === "object" ? (cur as Record<string, unknown>)[key] : undefined), obj);
}

export function setIn<T>(obj: T, path: Path, value: unknown): T {
  const [head, ...rest] = path.split(".");
  const isIndex = /^\d+$/.test(head);
  const base: Record<string, unknown> | unknown[] = Array.isArray(obj) ? [...obj] : { ...((obj ?? {}) as Record<string, unknown>) };
  const current = (base as Record<string, unknown>)[head];
  const next = rest.length ? setIn(current ?? (/^\d+$/.test(rest[0]) ? [] : {}), rest.join("."), value) : value;
  if (isIndex && Array.isArray(base)) base[Number(head)] = next;
  else (base as Record<string, unknown>)[head] = next;
  return base as T;
}

/** Only same-site paths, e.g. "/rooms/vip-villa" (never "//evil.com" or "https://…"). */
export const safePath = (to: string | null) => (to && /^\/(?!\/)[\w\-./?=&%#]*$/.test(to) ? to : "/");
