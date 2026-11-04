/** Local-date helpers working on YYYY-MM-DD strings (no time zones involved). */
const pad = (n: number) => String(n).padStart(2, "0");

export const isISO = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export function toISO(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO() {
  return toISO(new Date());
}

export function addDaysISO(iso: string, days: number) {
  const d = fromISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days));
}

/** First day of the month containing `iso`, shifted by `n` months. */
export function addMonthsISO(iso: string, n: number) {
  const d = fromISO(iso);
  return toISO(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

export const monthStart = (iso: string) => iso.slice(0, 8) + "01";

export function daysInMonth(iso: string) {
  const d = fromISO(iso);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** 0 = Monday … 6 = Sunday */
export const mondayIndex = (iso: string) => (fromISO(iso).getDay() + 6) % 7;

export function prettyDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  if (!isISO(iso)) return "—";
  return fromISO(iso).toLocaleDateString("en-GB", opts);
}

export const monthLabel = (iso: string) => fromISO(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
