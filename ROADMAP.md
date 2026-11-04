# Aberash Lodge — Roadmap

How to pick this project up in a new chat: read this file, `README.md` and `AGENTS.md`, then continue from **Next up**.

## Where things stand (Nov 2026)

The website is done and pushed to `github.com/KalabGebru/aberash-lodge` (private, `main`). Aberash is a placeholder name; real content comes from the client later.

- **Stack:**
  - Next.js 16.4 (App Router, Turbopack), Tailwind 4, Motion 14, GSAP + ScrollTrigger, Lenis
  - Zod 4, libphonenumber-js, Nodemailer 10
- **Pages:**
  - Home, Rooms (+ one page per room), Dining, Spa, Experiences, Gallery, Contact, Book, 404
  - All are under `src/app/(site)/` (a route group with the header, footer, preloader and smooth scroll).
- **Booking:**
  - A 4-step wizard (`src/components/booking/BookingWizard.tsx`).
  - Custom range calendar, country picker and phone field (`src/components/forms/`).
  - Validation is shared by the browser and the server (`src/lib/booking-schema.ts`).
  - `POST /api/booking` emails reception and the guest (`src/lib/mailer.ts`, `src/lib/email-templates.ts`).
  - Without SMTP settings, mail goes to an Ethereal test inbox, and the success screen shows preview links.
- **Content and editor (Supabase):** done 4 Nov 2026. See the README sections "Editing content" and "Supabase setup".
  - Supabase project `ieuygasvvzgtsizjsfro`, region eu-west-1 (Ireland). Scripts connect through the session pooler `aws-0-eu-west-1.pooler.supabase.com`, because the direct DB host is IPv6-only and this machine has no IPv6.
  - Keys live in `.env`, not `.env.local`. Scripts: `npm run migrate | seed | create-owner | test:e2e`.
  - Pages read content through `src/content/index.ts` → `src/cms/db.ts`. Published content is cached with the tag `content`. Edit mode (draft mode plus a signed-in staff member) reads drafts. With no config or on errors, the built-in `src/content/fallback.ts` is used.
  - `/admin`: login, a forced password change, sidebar dashboard, autosaving forms built from `src/cms/fields.ts`, Publish / Publish all, sortable lists, staff management (owner only).
  - On-site editing: elements carry `data-cms="doc:path"` (via `cms()` in `src/cms/mark.ts`). `EditMode.tsx` is mounted only in edit mode; it draws the hover outline, opens popovers (reusing the admin `FieldView`), and has the edit bar.
  - Photos are shrunk in the browser (`src/cms/image-prep.ts`) and uploaded with signed URLs (`src/cms/upload.ts`).
  - **Titles:** use `/` for a new line and `*italic*`; rendered by `src/lib/title.tsx`.
- **Tests:** `npm run build && npm run test:e2e`. Playwright, desktop and mobile, 40 tests, all passing on 4 Nov 2026. They run against the real Supabase project with a temporary owner account.
- **Sanity:** tried, then removed by decision. Don't bring it back.

## Next up

- [ ] **User:** reset the Supabase database password (part of it was shown in the chat on 4 Nov), then update `SUPABASE_DB_PASSWORD` in `.env`.
- [ ] **User:** create the first owner account. Run `npm run create-owner -- <email> "<name>"` in your own terminal, sign in at `/admin/login` and choose a password.
- [ ] **Real content:** enter it through the editor (see **Later**).

### How the editor differs from the original plan

- Migrations use `supabase/migrations/20261104000000_init.sql` (the Supabase CLI naming) and run with `scripts/migrate.ts` (pg), not the Supabase CLI. Its npm package needs a blocked install script. Applied versions go in `supabase_migrations.schema_migrations`, the same table the CLI uses.
- There's no browser Supabase auth client. Sign-in and sign-out are server actions; the browser only uses a client for signed uploads.
- On-site editing doesn't use a `useField` hook or an overrides store. It uses `data-cms` attributes and a server re-render after each save, so the page components stay mostly server components and visitors download no editor code.
- `create-owner` takes `<email> [name]` and prints a temporary password, instead of taking a password argument.

### Editor follow-ups (optional)

- [ ] Deleting a list item or reordering takes effect immediately (no draft step). Add an "undo" or a soft delete if that turns out to be risky.
- [ ] Replaced or removed photos stay in the `media` bucket. Add a cleanup script for unreferenced `uploads/*` files.
- [ ] No database backups on the free plan. Add a weekly `content` export, or upgrade to Pro.
- [ ] Two rooms could end up with the same web address (`slug`). Add a uniqueness check on publish.
- [ ] Use a Supabase table for the booking rate limit (from the audit).

## Later (before launch)

- [ ] **Real content:** swap in the client's name, text, prices (`[RATE]`), sizes (`[SIZE]`), residence count (`[00]`), reviews (`[Guest name]`), phone and email, and their own photos, through `/admin` or edit mode. The current photos are Unsplash placeholders. Optionally update `src/content/fallback.ts` too, since it's the fallback.
- [ ] **Site improvements from the audit:** do these after the real content is in (see **Site audit** below).
- [ ] **Real email:** fill `SMTP_*`, `MAIL_FROM` and `RECEPTION_EMAIL` in `.env` and on Vercel. For Gmail, use an App Password.
- [ ] **Deploy:** Vercel project → env vars (Supabase URL, publishable and secret keys, `CRON_SECRET`; not the DB password) → custom domain → set `NEXT_PUBLIC_SITE_URL`. Set the function region to Dublin (`dub1`) to sit next to the eu-west-1 database.
- [ ] Optional: replace the emoji flags with small flag images (Windows shows letters instead of flags).
- [ ] Optional: hook the newsletter signup up to a mailing-list provider (it's UI-only today).

## Site audit (4 Nov 2026)

Done on a production build (`next start`) with Lighthouse 12.6 at mobile and desktop settings, plus manual checks of headers, SEO files, meta tags, the booking API and how pages behave without JS. The build and type check were clean; lint was not run. Visual design was not reviewed. **Do the fixes after the real client content is in**, then re-run the audit to compare.

### Lighthouse results (Performance / Accessibility / Best practices / SEO)

| Page | Mobile | Desktop | Mobile LCP |
|---|---|---|---|
| Home | 83 / 96 / 100 / 100 | 94 / 96 / 100 / 100 | 3.4 s |
| Rooms | 92 / 96 / 100 / 100 | 95 / 96 / 100 / 100 | 3.2 s |
| Room page | 92 / 96 / 100 / 100 | 96 / 96 / 100 / 100 | 3.2 s |
| Dining | 91 / 96 / 100 / 100 | 95 / 96 / 100 / 100 | 3.2 s |
| Spa | 92 / 96 / 100 / 100 | 96 / 96 / 100 / 100 | 3.2 s |
| Experiences | 90 / 96 / 100 / 100 | 95 / 96 / 100 / 100 | 3.5 s |
| Gallery | 91 / 96 / 100 / 100 | 93 / 96 / 100 / 100 | 3.3 s |
| Contact | 71 / 96 / 100 / 100 | 83 / 96 / 100 / 100 | 7.3 s |
| Book | 82 / 86 / 100 / 100 | 98 / 88 / 100 / 100 | 4.3 s |

CLS was ≤ 0.005 everywhere.

### Ratings

- **Performance 7/10:** LCP is almost all render delay, not download. The preloader (`Preloader.tsx`) takes about 2.9 s on the first visit to any page, and headings and sections start hidden (`MaskText`, `Reveal`). Contact is the worst page, probably because of the Google Maps iframe (not confirmed). About 110 KB of unused JS per page; the gallery could save about 180 KB with better `sizes`.
- **Accessibility 8/10:** has a skip link, focus-visible styles and reduced motion. Failing checks: contrast of `text-ivory/40` eyebrows on dark backgrounds (3.5:1, needs 4.5:1) and the faint background words on home; the logo link's `aria-label` doesn't contain its visible text (`Header.tsx`); the calendar's `role="grid"` / `role="row"` structure is invalid (`Calendar.tsx`).
- **Best practices 10/10.**
- **SEO 6/10:** Lighthouse gives 100, but these are missing: `sitemap.xml`, `robots.txt`, `Hotel` / `LodgingBusiness` JSON-LD, per-page OG and Twitter data (every page shares the home title and image), canonical URLs, an apple icon and a manifest. `/book` renders client-only, so its HTML has no `<h1>`. The localhost OG URLs are only because `NEXT_PUBLIC_SITE_URL` isn't set.
- **Security 6/10:** zod validation on the server and a honeypot are good. There are no security headers (CSP, frame-ancestors, Referrer-Policy, Permissions-Policy), and `X-Powered-By` is exposed. The in-memory rate limit in `api/booking` doesn't hold up on Vercel, so it doesn't protect against email spam.
- **Works without JS 5/10:** 55 elements on home start at `opacity: 0`, so the page is mostly blank if JS fails or is slow.
- **Code quality 9/10.**

### Fixes, in priority order

- [ ] **Preloader and LCP:** play the preloader only on the first visit to home, and shorten it. Show hero headings immediately instead of masking them in. Target: mobile LCP under 2.5 s.
- [ ] **SEO:**
  - `app/sitemap.ts` and `app/robots.ts`.
  - `Hotel` JSON-LD with the name, address, geo coordinates, phone, rooms and price range.
  - Per-page OG/Twitter title, description and image; canonical URLs.
  - Apple icon and manifest.
  - Render the `/book` heading on the server.
- [ ] **Security:** add security headers in `next.config.ts`, set `poweredByHeader: false`, and replace the in-memory rate limit with a durable one (a Supabase table once Phase 1 exists).
- [ ] **Accessibility:** fix the contrast, make the logo's label include its visible text, and restructure the calendar grid (rows of `gridcell`s, or drop the ARIA grid roles and rely on button labels).
- [ ] **No-JS fallback:** content stays visible when JS doesn't run, for example a `<noscript>` style that resets `opacity` and `transform`, or start states set by a class JS adds.
- [ ] **Contact map:** load the iframe only when it's near the viewport or tapped, with a static preview first. Tighten the gallery's `sizes`.

### Re-running the audit

```bash
npm run build && npx next start -p 3200   # use a free port; something may already be on 3100
CHROME_PATH=~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome \
  npx -y lighthouse@12.6.0 http://localhost:3200/ --quiet --output=json \
  --output-path=./lh-home.json --chrome-flags="--headless=new --no-sandbox"
# add --preset=desktop for desktop; save output outside the repo
```

## Gotchas learned so far

- **Next 16 differs from older versions.** Read `node_modules/next/dist/docs/` before using an API (see `AGENTS.md`). Middleware is now `proxy.ts`, `revalidateTag` needs a second argument, and `PageProps<"/route">` / `LayoutProps` are generated globals.
- **`cacheComponents` is off on purpose.** It keeps old pages mounted in the background, which clashes with Lenis and GSAP.
- **Memory:** the machine has about 7.7 GB of RAM. Heavy builds alongside VS Code got killed (exit 137). Run type check, lint and build one at a time. Stop stray `next start` / `next dev` processes by PID; `pkill -f` patterns can kill the shell running them.
- **Stale route types:** after moving or deleting routes, run `rm -rf .next && npx next typegen` before `tsc`.
- **Zod 4:** object refinements are skipped while other fields are invalid. That's why `stayIssues()` runs separately in the wizard.
- **Text in arrays:** JSX elements in arrays passed from server to client components need `key`s. `titleLines()` handles this.

## Commands

```bash
npm run dev            # http://localhost:3000
npx tsc --noEmit       # type check
npx eslint src         # lint
npm run build          # production build
npm run migrate        # apply supabase/migrations (needs SUPABASE_DB_PASSWORD)
npm run seed           # built-in content + images → Supabase (--overwrite to replace)
npm run create-owner -- <email> "<name>"
npm run test:e2e       # Playwright (after npm run build)
```
