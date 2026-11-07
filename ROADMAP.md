# Green Mark Lodge — Roadmap

How to pick this project up in a new chat: read this file, `README.md` and `AGENTS.md`, then continue from **Next up**.

## Where things stand (Nov 2026)

The website is done and pushed to `github.com/KalabGebru/green-mark-lodge` (private, `main`). The client is **Green Mark Lodge** (name, logo and photos received 4 Nov 2026). The other copy — location, prices, reviews, contact details — is still placeholder.

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
  - **Production Supabase project `vvrrrbnmrefezqpflsaz`** (the client's account), region eu-central-1 (Frankfurt). Moved here on 7 Nov 2026 from the old dev project `ieuygasvvzgtsizjsfro` (eu-west-1), which can be deleted once the live site runs on the new one. Content, photos and both logins were copied (passwords kept).
  - Scripts connect through the session pooler, set as `SUPABASE_DB_HOST=aws-1-eu-central-1.pooler.supabase.com` in `.env` (the direct DB host is IPv6-only and this machine has no IPv6). Without it, scripts default to the old eu-west-1 pooler and fail.
  - The two logins are test accounts (`test@email.com` owner, `test2@gmail.com` editor). Create the client's real owner with `npm run create-owner`, then delete these.
  - Keys live in `.env`, not `.env.local`. Scripts: `npm run migrate | seed | create-owner | test:e2e`.
  - Pages read content through `src/content/index.ts` → `src/cms/db.ts`. Published content is cached with the tag `content`. Edit mode (draft mode plus a signed-in staff member) reads drafts. With no config or on errors, the built-in `src/content/fallback.ts` is used.
  - `/admin`: login, a forced password change, sidebar dashboard, autosaving forms built from `src/cms/fields.ts`, Publish / Publish all, sortable lists, staff management (owner only), and a **Photos** page (`/admin/media`): storage used vs the 1 GB free limit, every file with where it's used (published or draft), filter by unused, owner-only delete (usage re-checked on the server). Photo fields have **Choose from library** (`MediaPicker.tsx`) to reuse a stored photo.
  - On-site editing: elements carry `data-cms="doc:path"` (via `cms()` in `src/cms/mark.ts`). `EditMode.tsx` is mounted only in edit mode; it draws the hover outline, opens popovers (reusing the admin `FieldView`), and has the edit bar.
  - Photos are shrunk in the browser (`src/cms/image-prep.ts`) and uploaded with signed URLs (`src/cms/upload.ts`).
  - **Titles:** use `/` for a new line and `*italic*`; rendered by `src/lib/title.tsx`.
- **Tests:** `npm run build && npm run test:e2e`. Playwright, desktop and mobile, 50 passing (16 desktop-only skipped on mobile) on 7 Nov 2026. They run against the **production** Supabase project with a temporary owner account and clean up after themselves. A failed run can leave a draft or `uploads/e2e/` photos behind: check the admin's Unpublished count afterwards.
- **Sanity:** tried, then removed by decision. Don't bring it back.

## Next up

- [x] **User:** reset the Supabase database password. Done 4 Nov 2026; the new password works for scripts.
- [x] **User:** create the first owner account. Done 4 Nov 2026: one owner (password set) and one editor (still on a temporary password).
- [x] **Client name, logo and photos** (4 Nov 2026): name "Green Mark Lodge"; round logo in the header, menu, preloader and app icons; 44 of the client's 108 photos on the site (`public/images/*.webp`), Supabase re-seeded.
  - Originals live in `client-assets/` (git-ignored, this machine only). `npm run photos` converts them to WebP (HEIC via `heic-convert`) into `client-assets/converted/` with contact sheets; `npm run photos -- --logo` rebuilds `public/logo.webp`, `src/app/icon.png` and `src/app/apple-icon.png`.
  - No spa, pool, lake or coffee-ceremony photos were supplied: those spots use garden photos for now, and the copy still describes them. Room names and descriptions are placeholders; the four rooms map to the real room types (king room, round cottage, standard double, apartment). A fifth type (wooden-floor room, IMG_3719–3721) is only in the gallery.
- [ ] **Real content:** the rest of the text through the editor (see **Later**).

### How the editor differs from the original plan

- Migrations use `supabase/migrations/20261104000000_init.sql` (the Supabase CLI naming) and run with `scripts/migrate.ts` (pg), not the Supabase CLI. Its npm package needs a blocked install script. Applied versions go in `supabase_migrations.schema_migrations`, the same table the CLI uses.
- There's no browser Supabase auth client. Sign-in and sign-out are server actions; the browser only uses a client for signed uploads.
- On-site editing doesn't use a `useField` hook or an overrides store. It uses `data-cms` attributes and a server re-render after each save, so the page components stay mostly server components and visitors download no editor code.
- `create-owner` takes `<email> [name]` and prints a temporary password, instead of taking a password argument.

### Editor follow-ups (optional)

- [x] Undo for deleting list items (5 Nov 2026): deleting hides the item (`deleted_at`) with an **Undo** banner; a **Recently deleted** section restores items to their old place for 30 days, then they're purged (`purgeDeleted` in `src/cms/store.ts`). Owners can delete for good. Photos of deleted items stay protected until then. Reordering is still immediate.
- [x] Replaced or removed photos stay in the `media` bucket. Owners now delete unused ones on the Photos page (5 Nov 2026).
- [ ] No database backups on the free plan. Add a weekly `content` export, or upgrade to Pro.
- [x] Room web addresses (5 Nov 2026): autosave warns on the field when another room uses the same `slug`; publishing (and restoring a deleted room) is blocked until it's unique, and a room can't be published without one.
- [x] Booking rate limit in Supabase (7 Nov 2026): `public.rate_limits` + `rate_limit_hit()` (`src/lib/rate-limit.ts`). 6 requests / 10 min per visitor (hashed IP), and 300 sent emails a day site-wide (counted only for valid requests). Falls back to memory if Supabase errors. The daily keep-alive purges old rows.

## Later (before launch)

- [ ] **Real content:** swap in the client's name, text, prices (`[RATE]`), sizes (`[SIZE]`), residence count (`[00]`), reviews (`[Guest name]`), phone and email, through `/admin` or edit mode. (Name, logo and photos are done.) Optionally update `src/content/fallback.ts` too, since it's the fallback.
- [ ] **Site improvements from the audit:** do these after the real content is in (see **Site audit** below).
- [x] **Real email** (7 Nov 2026): Gmail `greenmarklodge.support@gmail.com` sends and receives (App Password; login verified). Copy the `SMTP_*`, `MAIL_FROM` and `RECEPTION_EMAIL` values to Vercel.
- [ ] **Deploy:** Vercel project → env vars (Supabase URL, publishable and secret keys, `CRON_SECRET`, the email settings; not the DB password) → custom domain → set `NEXT_PUBLIC_SITE_URL` (sitemap, robots, canonical and share URLs all use it). Set the function region to Frankfurt (`fra1`) to sit next to the eu-central-1 database.
- [ ] **After deploy:** submit `https://<domain>/sitemap.xml` in Google Search Console; check a page in Google's Rich Results Test (Hotel data).
  - **Keep-alive:** the free Supabase plan pauses after ~7 days without activity. `vercel.json` runs `/api/keepalive` daily, which writes the `keepalive` heartbeat row; the admin overview shows the last ping and warns after 3 days. It needs `CRON_SECRET` on Vercel. Nothing pings while the site isn't deployed (by choice). If the project ever pauses: Supabase dashboard → the project → **Restore**.
- [x] Flag images (5 Nov 2026): country pickers use SVGs in `public/flags/` (from `flag-icons`, copied by `npx tsx scripts/copy-flags.ts`).
- [ ] Optional: hook the newsletter signup up to a mailing-list provider (it's UI-only today).

## Site audit (4 Nov 2026; fixes done 7 Nov 2026)

Done on a production build (`next start`) with Lighthouse 12.6 at mobile and desktop settings, plus manual checks of headers, SEO files, meta tags, the booking API and how pages behave without JS. The build and type check were clean; lint was not run. Visual design was not reviewed. **Do the fixes after the real client content is in**, then re-run the audit to compare.

**Re-run 7 Nov 2026 (Lighthouse 12.6, simulated, localhost):** accessibility, best practices and SEO are 100 on every page, mobile and desktop. Desktop performance 89–99. Mobile performance 66–84 (see the LCP note above on why the simulated mobile number overstates it).

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

- [x] **Preloader and LCP** (7 Nov 2026): the preloader plays only on the first home visit of a tab (inline script in `src/app/layout.tsx` sets `html[data-intro]`), lasts ~1.65 s instead of ~2.9 s, and is CSS-driven (`.preloader` in `globals.css`). Hero text rises with CSS (`.rise-*`), not JS. The page-change curtain skips the first load. Mobile LCP with real (devtools) throttling: home 2.4 s, rooms 2.1 s, book 1.8 s, contact 2.8 s.
  - Lighthouse's default *simulated* mobile LCP still reads 4–7 s on localhost: it charges every request that finished before the real LCP, and on localhost everything finishes at once. Re-measure on the deployed site.
  - New finding: the home page has a lot of JS work on a slow phone (TBT ~1.7 s with devtools throttling): GSAP, Lenis, motion. A possible next step is to lazy-load below-the-fold animated sections.
- [x] **SEO** (7 Nov 2026): `app/sitemap.ts` (pages + rooms, hourly), `app/robots.ts`, `app/manifest.ts`, Hotel JSON-LD in the site layout (`hotelJsonLd` in `src/lib/seo.ts`; placeholder phone/prices are left out until real), per-page title/description/canonical/OG/Twitter via `pageMeta()`, and a server-rendered `<h1>` on `/book`. Done items:
  - `app/sitemap.ts` and `app/robots.ts`.
  - `Hotel` JSON-LD with the name, address, geo coordinates, phone, rooms and price range.
  - Per-page OG/Twitter title, description and image; canonical URLs.
  - Apple icon and manifest.
  - Render the `/book` heading on the server.
- [x] **Security** (7 Nov 2026): CSP, `X-Frame-Options`, `nosniff`, Referrer-Policy, Permissions-Policy and HSTS in `next.config.ts`; `poweredByHeader: false`; durable rate limit (see above). The CSP allows inline scripts (Next streams data in them; nonces would make every page dynamic), Supabase (admin uploads) and Google Maps (iframe). Zod runs `jitless` so it doesn't probe `eval`. If you add an outside service (analytics, chat), add its origin to the CSP.
- [x] **Accessibility** (7 Nov 2026): footer/menu labels raised to 60% opacity (5.9:1), scroll-lit words start at 55%, the footer watermark is a CSS pseudo-element, calendar uses labelled `group`s instead of a broken `grid`, and the admin password field's name no longer includes "Show password". Lighthouse accessibility 100 on all pages. Was: fix the contrast, make the logo's label include its visible text, and restructure the calendar grid (rows of `gridcell`s, or drop the ARIA grid roles and rely on button labels).
- [x] **No-JS fallback** (7 Nov 2026): a `<noscript>` style in `src/app/layout.tsx` undoes motion's hidden start states, and the preloader/curtain never cover the page without JS. Was: content stays visible when JS doesn't run, for example a `<noscript>` style that resets `opacity` and `transform`, or start states set by a class JS adds.
- [x] **Contact map** (7 Nov 2026): `contact/MapEmbed.tsx` loads the iframe only near the viewport or on tap, with a light placeholder and an "Open in Google Maps" link. Gallery `sizes` capped at 430px. Was: load the iframe only when it's near the viewport or tapped, with a static preview first. Tighten the gallery's `sizes`.

### Re-running the audit

```bash
npm run build && npx next start -p 3200   # use a free port; something may already be on 3100
CHROME_PATH=~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome \
  npx -y lighthouse@12.6.0 http://localhost:3200/ --quiet --output=json \
  --output-path=./lh-home.json --chrome-flags="--headless=new --no-sandbox"
# add --preset=desktop for desktop; save output outside the repo
```

## Gotchas learned so far

- **No native browser UI.** Never use `window.confirm/alert/prompt` or `<select>`. Confirmations use `useConfirm()` (`src/components/ui/useConfirm.tsx`); dropdowns use `Select` (`src/components/forms/Select.tsx`), or in the admin `SelectInput` / `MiniSelect` (`src/components/admin/inputs.tsx`). Escape always closes the newest open layer (`useEscape` in `src/components/forms/hooks.ts`).

- **Thumbnails can stall the server.** `next/image` resizing (sharp) runs on Node's libuv pool, which also does the DNS lookups for every Supabase call. With the default 4 threads, a page full of fresh thumbnails (the Photos page) made saves and refreshes take 20+ s. `npm run dev`, `npm start` and the Playwright server set `UV_THREADPOOL_SIZE=16`. Vercel optimises images on its own service, so production isn't affected.

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
npm run photos         # client-assets/photos → WebP (+ -- --logo for the logo/icons)
npm run test:e2e       # Playwright (after npm run build)
```
