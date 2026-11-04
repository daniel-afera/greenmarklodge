# Green Mark Lodge — website

A luxury lodge site built with Next.js 16, Tailwind CSS 4, Motion, GSAP + ScrollTrigger and Lenis. Content is edited in a custom editor backed by Supabase (Postgres, Storage, Auth). Booking requests are emailed to reception with Nodemailer.

## Run it

```bash
npm install
cp .env.example .env         # optional — works without it (built-in content, demo email)
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

Staff sign in at **`/admin`**. Two ways to edit:

- **On the site:** "Edit on the site" turns on edit mode. Hover any text or photo and click it to change it. Alt/Option-click follows a link. The bar at the bottom has Preview, Discard, Publish and Exit.
- **In the dashboard:** a form for every page, list (rooms, experiences, restaurants, spa treatments, reviews), the gallery and the settings. Lists can be added to, reordered by dragging and deleted.

Edits are saved as **drafts** automatically. Visitors see them only after **Publish**. Reordering and deleting list items apply immediately.

**Accounts:** each person has their own login. **Owners** can do everything, including managing staff (Staff page: add a person, reset a password, change a role, remove someone). **Editors** edit and publish. New accounts and reset passwords get a temporary password that must be changed at first sign-in.

**Photos** are resized to at most 2400px and converted to WebP in the browser before upload. This also strips location data, and iPhone HEIC photos are converted too. Click a photo in the editor to set its focal point, which stays in view when the photo is cropped.

**Title syntax:** in titles, ` / ` starts a new line and `*text*` is italic. For example, `Where the lake / *remembers* your name`.

**Built-in content:** `src/content/fallback.ts` holds the original content. Any empty field falls back to it, and the whole site runs on it when Supabase isn't configured. Bracketed values such as `[RATE]` and `[Guest name]` are placeholders.

| What | Where |
| --- | --- |
| Editable fields per page or list (labels, limits) | `src/cms/fields.ts` |
| Content types / built-in content | `src/content/types.ts`, `src/content/fallback.ts` |
| Server actions (save, publish, upload) | `src/cms/actions.ts`, `src/cms/staff-actions.ts` |
| Navigation links | `src/lib/site.ts` |
| Colours and fonts | `@theme` in `src/app/globals.css`, fonts in `src/app/layout.tsx` |

## Supabase setup

1. Create a project at supabase.com. The Free plan is enough.
2. Add to `.env`. The keys are in Dashboard → Project Settings → API Keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=…
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
   SUPABASE_SECRET_KEY=sb_secret_…        # server only, bypasses RLS
   SUPABASE_DB_PASSWORD=…                 # only for npm run migrate
   SUPABASE_DB_HOST=aws-0-<region>.pooler.supabase.com   # if not eu-west-1 (Dashboard → Connect → Session pooler)
   CRON_SECRET=<random string>            # protects /api/keepalive
   ```
3. Run these:
   ```bash
   npm run migrate                        # tables, security rules, media bucket (supabase/migrations/)
   npm run seed                           # upload public/images + built-in content as published
   npm run create-owner -- you@example.com "Your Name"   # prints a temporary password
   ```
   `npm run seed -- --overwrite` replaces existing content with the built-in content.

**Security model:** the browser never talks to the database. RLS is on with no policies, so the publishable key can't read or write anything. The server checks the session and role (`requireUser()` in `src/cms/auth.ts`) and then uses the secret key. Photos are publicly readable but can only be uploaded through one-time signed URLs that the server creates after that check.

**Caching:** published content is cached with the tag `content`. Publishing clears it, so the change goes live on the next visit. Edit mode (draft mode plus a signed-in staff member) reads drafts uncached.

**Keep-alive:** free Supabase projects pause after 7 days without activity. On Vercel, `vercel.json` runs a daily cron to `/api/keepalive`. Set `CRON_SECRET` in Vercel's environment variables and Vercel sends it automatically.

## Tests

```bash
npm run build
npm run test:e2e        # Playwright, desktop + mobile, against a production build on port 3300
```

The tests use the real Supabase project. Each run creates a temporary owner account and deletes it at the end. Tests that change content restore it afterwards. Covered:
- all public pages, the menu and 404
- sign in → edit → publish → a visitor sees it
- lists, staff, edit mode and photo upload
- booking validation against CMS rooms
- security: logged-out access, draft cookie without a session, publishable-key access, open redirects, and every server action calling `requireUser()`

## Motion

- **Global:** Lenis smooth scroll synced to the GSAP ticker (`components/layout/SmoothScroll.tsx`), a first-load preloader, a curtain transition between pages (`app/(site)/template.tsx`), a trailing cursor, magnetic buttons and a full-screen menu.
- **Home page:** a pinned sideways room carousel on desktop (GSAP ScrollTrigger), stacking experience cards, word-by-word text highlight, parallax and clip-reveal images, and counters.
- **Reduced motion:** everything respects `prefers-reduced-motion`. When it is set, Lenis and the pinned scene are switched off and Motion animations are reduced.
