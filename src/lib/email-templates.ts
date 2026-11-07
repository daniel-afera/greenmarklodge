import type { Booking, Enquiry } from "./booking-schema";
import { nightsBetween } from "./booking-schema";
import { fullName } from "./site";
import type { SiteSettings } from "@/content/types";
import { countryByCode } from "./countries";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const fmtPhone = (p: string) => (p ? (parsePhoneNumberFromString(p)?.formatInternational() ?? p) : "—");

const esc = (s: string | number) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const fmtDate = (iso: string) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/** Context each email needs: lodge settings + the booked room name. */
export type MailCtx = { site: SiteSettings; roomName?: string };

function shell(site: SiteSettings, title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f0e8;font-family:Helvetica,Arial,sans-serif;color:#1c2420">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff">
<tr><td style="background:#1c2420;padding:28px 36px;text-align:center">
<div style="font-family:Georgia,serif;font-size:24px;letter-spacing:8px;color:#f5f0e8;text-transform:uppercase">${esc(site.name)}</div>
<div style="font-size:9px;letter-spacing:4px;color:#c9a46a;text-transform:uppercase;margin-top:6px">${esc(site.tagline)}</div>
</td></tr>
<tr><td style="padding:36px">
<div style="font-family:Georgia,serif;font-size:28px;line-height:1.2;margin-bottom:20px">${title}</div>
${body}
</td></tr>
<tr><td style="padding:20px 36px;border-top:1px solid #ece4d6;font-size:11px;color:#6a6e69">
${esc(fullName(site))} · ${esc(site.address.line1)}, ${esc(site.address.country)} · ${esc(site.phone)}
</td></tr></table></td></tr></table></body></html>`;
}

const rows = (pairs: [string, string][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">${pairs
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 0;border-bottom:1px solid #ece4d6;color:#6a6e69;width:38%;vertical-align:top;font-size:11px;letter-spacing:1.5px;text-transform:uppercase">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid #ece4d6;vertical-align:top">${esc(v).replace(/\n/g, "<br>")}</td></tr>`,
    )
    .join("")}</table>`;

function bookingPairs(b: Booking, roomName = b.room): [string, string][] {
  const nights = nightsBetween(b.checkin, b.checkout);
  return [
    ["Residence", roomName],
    ["Arrival", fmtDate(b.checkin)],
    ["Departure", fmtDate(b.checkout)],
    ["Nights", String(nights)],
    ["Guests", `${b.adults} adult${b.adults > 1 ? "s" : ""}${b.children ? `, ${b.children} child${b.children > 1 ? "ren" : ""}` : ""}`],
    ["Name", b.name],
    ["Email", b.email],
    ["Phone", fmtPhone(b.phone)],
    ["Country", countryByCode(b.country)?.name ?? b.country],
    ["Arrival time", b.eta || "—"],
    ["Special requests", b.notes || "—"],
  ];
}

export function receptionBookingEmail(b: Booking, ref: string, { site, roomName }: MailCtx) {
  return {
    subject: `New booking request ${ref} — ${roomName ?? b.room}, ${b.checkin} → ${b.checkout}`,
    html: shell(
      site,
      `New booking request <span style="color:#7a5a2e">${esc(ref)}</span>`,
      `<p style="font-size:14px;line-height:1.7;color:#4e534f;margin:0 0 20px">A guest has requested a stay via the website. Reply to this email to reach them directly.</p>${rows(bookingPairs(b, roomName))}`,
    ),
    text: `New booking request ${ref}\n\n${bookingPairs(b, roomName)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")}`,
  };
}

export function guestBookingEmail(b: Booking, ref: string, { site, roomName }: MailCtx) {
  const first = b.name.split(" ")[0];
  return {
    subject: `We've received your request — ${fullName(site)} (${ref})`,
    html: shell(
      site,
      `Thank you, <em>${esc(first)}</em>`,
      `<p style="font-size:15px;line-height:1.8;color:#4e534f;margin:0 0 24px">Your booking request has reached our reception team. We'll confirm availability within 24 hours. This is a request only — nothing has been charged.</p>
<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#7a5a2e;margin-bottom:8px">Reference ${esc(ref)}</div>
${rows(bookingPairs(b, roomName).slice(0, 5))}
<p style="font-size:14px;line-height:1.8;color:#4e534f;margin:24px 0 0">Questions in the meantime? Simply reply to this email or call us on ${esc(site.phone)}.</p>`,
    ),
    text: `Thank you, ${first}. Your booking request (${ref}) has reached our reception team. We'll confirm within 24 hours.`,
  };
}

export function receptionEnquiryEmail(e: Enquiry, ref: string, { site }: MailCtx) {
  const pairs: [string, string][] = [
    ["Subject", e.subject],
    ["Name", e.name],
    ["Email", e.email],
    ["Phone", fmtPhone(e.phone)],
    ["Message", e.message],
  ];
  return {
    subject: `Website enquiry ${ref} — ${e.subject}`,
    html: shell(site, `New enquiry <span style="color:#7a5a2e">${esc(ref)}</span>`, rows(pairs)),
    text: pairs.map(([k, v]) => `${k}: ${v}`).join("\n"),
  };
}
