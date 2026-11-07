import { z } from "zod";
import { isSupportedCountry, isValidPhoneNumber } from "libphonenumber-js";

// Zod probes `new Function` to compile validators; our CSP forbids eval, so the
// probe shows up as a CSP violation in the browser. These forms are tiny — skip it.
z.config({ jitless: true });

/** What the rules need to know about each room (comes from the content layer). */
export type RoomRule = { slug: string; name: string; maxGuests: number };

export const ETAS = ["Morning (before 12:00)", "Afternoon (12:00–17:00)", "Evening (after 17:00)", "Not sure yet"] as const;
export const SUBJECTS = ["General enquiry", "Table reservation", "Spa booking", "Weddings & events", "Corporate retreat"] as const;

export const MAX_NIGHTS = 30;
export const MAX_DAYS_AHEAD = 540; // ~18 months
export const NOTES_MAX = 1000;
export const MESSAGE_MAX = 2000;

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;

const name = z
  .string()
  .trim()
  .min(2, { error: "Please enter your name" })
  .max(80, { error: "That name is a little long — 80 characters max" })
  .regex(NAME_RE, { error: "Please use letters only" });

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { error: "Please enter your email" })
  .max(120)
  .pipe(z.email({ error: "Please enter a valid email, e.g. name@example.com" }));

const phone = z
  .string()
  .trim()
  .min(1, { error: "Please enter a phone number" })
  .refine((v) => isValidPhoneNumber(v), { error: "That number doesn't look right for the selected country" });

const country = z.string().refine((c) => isSupportedCountry(c), { error: "Please choose your country" });

const bookingBase = z.object({
    type: z.literal("booking"),
    checkin: z.iso.date({ error: "Choose an arrival date" }),
    checkout: z.iso.date({ error: "Choose a departure date" }),
    adults: z.number().int().min(1, { error: "At least one adult is required" }).max(8),
    children: z.number().int().min(0).max(6),
    room: z.string().min(1, { error: "Choose a residence" }),
    name,
    email,
    phone,
    country,
    eta: z.enum(ETAS, { error: "Choose an arrival time" }),
    notes: z.string().trim().max(NOTES_MAX, { error: `Please keep requests under ${NOTES_MAX} characters` }).default(""),
    company: z.string().optional(), // honeypot
});

/** Booking rules for the current list of rooms. */
export const makeBookingSchema = (rooms: RoomRule[]) =>
  bookingBase.superRefine((d, ctx) => {
    for (const [path, message] of Object.entries(stayIssues(d, rooms))) ctx.addIssue({ code: "custom", path: [path], message });
  });

export const enquirySchema = z.object({
  type: z.literal("enquiry"),
  name,
  email,
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || isValidPhoneNumber(v), { error: "That number doesn't look right for the selected country" })
    .default(""),
  subject: z.enum(SUBJECTS).default("General enquiry"),
  message: z
    .string()
    .trim()
    .min(10, { error: "Please write a little more (10 characters minimum)" })
    .max(MESSAGE_MAX, { error: `Please keep it under ${MESSAGE_MAX} characters` }),
  company: z.string().optional(), // honeypot
});

export const newsletterSchema = z.object({ email });

export type BookingInput = z.input<typeof bookingBase>;
export type Booking = z.output<typeof bookingBase>;
export type EnquiryInput = z.input<typeof enquirySchema>;
export type Enquiry = z.output<typeof enquirySchema>;

/** Flatten zod issues into { field: message } for the form UI. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function nightsBetween(checkin: string, checkout: string) {
  const a = Date.parse(checkin);
  const b = Date.parse(checkout);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

const isoDaysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

/**
 * Stay rules (dates + room capacity). Kept separate because zod skips
 * refinements while other fields are still invalid — the wizard needs these
 * on step one, before the guest has typed a name.
 */
export function stayIssues(
  s: { checkin: string; checkout: string; adults: number; children: number; room: string },
  rooms: RoomRule[],
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!s.checkin) out.checkin = "Choose an arrival date";
  else if (s.checkin < isoDaysFromNow(-1)) out.checkin = "Arrival can't be in the past";
  else if (s.checkin > isoDaysFromNow(MAX_DAYS_AHEAD)) out.checkin = "We take bookings up to 18 months ahead";

  if (!s.checkout) out.checkout = "Choose a departure date";
  else if (s.checkin && s.checkout <= s.checkin) out.checkout = "Departure must be at least one night after arrival";
  else if (s.checkin && nightsBetween(s.checkin, s.checkout) > MAX_NIGHTS)
    out.checkout = `For stays longer than ${MAX_NIGHTS} nights, please contact us directly`;

  const room = rooms.find((r) => r.slug === s.room);
  if (s.room && !room) out.room = "Please choose one of our residences";
  else if (room && s.adults + s.children > room.maxGuests)
    out.room = `The ${room.name} sleeps up to ${room.maxGuests} — please choose a larger residence or reduce the party`;
  return out;
}

const TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "yahooo.com": "yahoo.com",
  "yaho.com": "yahoo.com",
  "outlok.com": "outlook.com",
  "outloo.com": "outlook.com",
  "iclod.com": "icloud.com",
};

/** "selam@gmial.com" → "selam@gmail.com" (or null). */
export function emailSuggestion(value: string): string | null {
  const [user, domain] = value.trim().toLowerCase().split("@");
  if (!user || !domain) return null;
  const fixed = TYPOS[domain] ?? (domain.endsWith(".con") ? domain.slice(0, -4) + ".com" : null);
  return fixed ? `${user}@${fixed}` : null;
}
