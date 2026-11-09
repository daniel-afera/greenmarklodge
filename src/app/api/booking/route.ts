import { randomUUID } from "node:crypto";
import { enquirySchema, fieldErrors, makeBookingSchema } from "@/lib/booking-schema";
import { getRoomOptions, getRoomOptionsFresh, getSettings } from "@/content";
import { guestBookingEmail, receptionBookingEmail, receptionEnquiryEmail } from "@/lib/email-templates";
import { receptionEmail, send } from "@/lib/mailer";
import { siteLimited, visitorLimited } from "@/lib/rate-limit";

const makeRef = (prefix: string) => `${prefix}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;

export async function POST(req: Request) {
  if (await visitorLimited(req)) {
    return Response.json({ ok: false, error: "Too many requests — please try again in a few minutes." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const type = (body as { type?: string })?.type;
  const [site, cachedRooms] = await Promise.all([getSettings(), getRoomOptions()]);
  // The booking page and this route can hold different cached room lists for a
  // moment after rooms are edited. Before rejecting an unknown room, re-check
  // against the database itself.
  let rooms = cachedRooms;
  const asked = (body as { room?: unknown })?.room;
  if (type !== "enquiry" && typeof asked === "string" && asked && !rooms.some((r) => r.slug === asked)) {
    rooms = await getRoomOptionsFresh();
    console.warn("[booking] room not in cached list", { asked, cached: cachedRooms.map((r) => r.slug), fresh: rooms.map((r) => r.slug) });
  }
  const schema = type === "enquiry" ? enquirySchema : makeBookingSchema(rooms);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 422 });
  }

  // Honeypot: pretend success for bots.
  if (parsed.data.company) {
    return Response.json({ ok: true, ref: makeRef("AB") });
  }

  if (await siteLimited()) {
    return Response.json({ ok: false, error: "We can't take more online requests today. Please call or email us directly." }, { status: 429 });
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
