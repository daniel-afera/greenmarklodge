# Aberash Lodge — website

A luxury lodge site built with Next.js 16, Tailwind CSS 4, Motion, GSAP + ScrollTrigger and Lenis. Booking requests are emailed to reception with Nodemailer; there is no database.

## Run it

```bash
npm install
cp .env.example .env.local   # optional — works without it (demo mode)
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

## Booking emails

`POST /api/booking` validates the form (same Zod schema as the client, in `src/lib/booking-schema.ts`), then sends:

1. **To reception** (`RECEPTION_EMAIL`): every detail of the request, with reply-to set to the guest.
2. **To the guest**: a "we've received your request" confirmation with a reference code (`AB-XXXXXX`).

Contact-page enquiries use the same route (`type: "enquiry"`, reference `EQ-XXXXXX`).

The route also has a honeypot field and a basic in-memory rate limit (6 requests / 10 min / IP).

**Demo mode:** when `SMTP_HOST` is not set, mail goes to a temporary [Ethereal](https://ethereal.email) inbox. The success screen then shows links to preview both emails, which is useful for showing the client. For real delivery, fill in the SMTP values. With Gmail, use an App Password.

## Editing content

All text, photos and room details currently live in **`src/content/fallback.ts`** (photos in `public/images/`). A custom editor is planned: an `/admin` dashboard plus click-to-edit on the site itself, backed by Supabase.

| What | Where |
| --- | --- |
| All page text, rooms, experiences, restaurants, spa menu, reviews, gallery, contact details | `src/content/fallback.ts` |
| Content types | `src/content/types.ts` |
| Navigation links | `src/lib/site.ts` |
| Colours and fonts | `@theme` in `src/app/globals.css`, fonts in `src/app/layout.tsx` |

**Title syntax:** in titles, ` / ` starts a new line and `*text*` is italic. For example, `Where the lake / *remembers* your name`.

Bracketed values such as `[RATE]`, `[SIZE]` and `[Guest name]` are placeholders waiting for real data.

## Motion

- **Global:** Lenis smooth scroll synced to the GSAP ticker (`components/layout/SmoothScroll.tsx`), a first-load preloader, a curtain transition between pages (`app/(site)/template.tsx`), a trailing cursor, magnetic buttons and a full-screen menu.
- **Home page:** a pinned sideways room carousel on desktop (GSAP ScrollTrigger), stacking experience cards, word-by-word text highlight, parallax and clip-reveal images, and counters.
- **Reduced motion:** everything respects `prefers-reduced-motion`. When it is set, Lenis and the pinned scene are switched off and Motion animations are reduced.
