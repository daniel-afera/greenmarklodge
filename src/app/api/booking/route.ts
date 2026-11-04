import { randomUUID } from "node:crypto";
import { enquirySchema, fieldErrors, makeBookingSchema } from "@/lib/booking-schema";
import { getRoomOptions, getSettings } from "@/content";
import { guestBookingEmail, receptionBookingEmail, receptionEnquiryEmail } from "@/lib/email-templates";
import { receptionEmail, send } from "@/lib/mailer";

// Simple in-memory rate limit: 6 submissions / 10 minutes / IP.
const hits = new Map<string, number[]>();
const WINDOW = 10 * 60_000;
const LIMIT = 6;

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMIT;
}

const makeRef = (prefix: string) => `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) {
    return Response.json({ ok: false, error: "Too many requests — please try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const type = (body as { type?: string })?.type;
  const [site, rooms] = await Promise.all([getSettings(), getRoomOptions()]);
  const schema = type === "enquiry" ? enquirySchema : makeBookingSchema(rooms);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 422 });
  }

  // Honeypot: pretend success for bots.
  if (parsed.data.company) {
    return Response.json({ ok: true, ref: makeRef("AB") });
  }

  try {
    if (parsed.data.type === "enquiry") {
      const ref = makeRef("EQ");
      const mail = receptionEnquiryEmail(parsed.data, ref, { site });
      const r = await send({ to: receptionEmail(), replyTo: parsed.data.email, ...mail });
      return Response.json({ ok: true, ref, previews: [r.preview].filter(Boolean) });
    }

    const booking = parsed.data;
    const ref = makeRef("AB");
    const ctx = { site, roomName: rooms.find((r) => r.slug === booking.room)?.name };
    const toReception = await send({ to: receptionEmail(), replyTo: booking.email, ...receptionBookingEmail(booking, ref, ctx) });
    // The guest copy is best-effort; reception already has the request.
    const toGuest = await send({ to: booking.email, ...guestBookingEmail(booking, ref, ctx) }).catch((err) => {
      console.error("[booking] guest copy failed", err);
      return { preview: null };
    });
    return Response.json({ ok: true, ref, previews: [toReception.preview, toGuest.preview].filter(Boolean) });
  } catch (err) {
    console.error("[booking] send failed", err);
    return Response.json(
      { ok: false, error: "We couldn't send your request just now. Please call or email us directly." },
      { status: 502 },
    );
  }
}
