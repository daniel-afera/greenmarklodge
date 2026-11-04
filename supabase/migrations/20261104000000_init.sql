-- Aberash Lodge CMS — initial schema.
--
-- Security model: the browser never talks to these tables. The Next.js
-- server checks the user's session and role itself, then uses the secret
-- key (which bypasses RLS). RLS is enabled with NO policies, so the
-- publishable key / anonymous and logged-in API access get nothing.

-- ─── Content ──────────────────────────────────────────────────────────
-- Singletons use fixed ids (siteSettings, homePage, roomsPage, diningPage,
-- spaPage, experiencesPage, galleryPage, contactPage) with type 'singleton'.
-- Collection items use type room | experience | venue | treatment | testimonial.
-- JSON shapes follow src/content/types.ts.
create table public.content (
  id          text primary key default gen_random_uuid()::text,
  type        text not null check (type in ('singleton', 'room', 'experience', 'venue', 'treatment', 'testimonial')),
  published   jsonb,            -- what visitors see; null = never published
  draft       jsonb,            -- unpublished edits; null = no pending changes
  sort        integer not null default 0,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null
);

create index content_type_sort_idx on public.content (type, sort);

-- ─── Staff profiles ───────────────────────────────────────────────────
create table public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  name                  text not null default '',
  role                  text not null default 'editor' check (role in ('owner', 'editor')),
  must_change_password  boolean not null default true,
  created_at            timestamptz not null default now()
);

-- ─── updated_at ───────────────────────────────────────────────────────
create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger content_touch before update on public.content
  for each row execute function public.touch_updated_at();

-- ─── Lock down API access ─────────────────────────────────────────────
alter table public.content  enable row level security;
alter table public.profiles enable row level security;
-- (no policies on purpose)

revoke all on public.content, public.profiles from anon, authenticated;
revoke execute on function public.touch_updated_at() from anon, authenticated, public;

-- ─── Media bucket ─────────────────────────────────────────────────────
-- Public read through public URLs. No storage.objects policies, so nobody
-- can upload/delete with the publishable key; uploads go through signed
-- upload URLs the server creates after its own auth check.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
