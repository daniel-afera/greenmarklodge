-- Heartbeat for the free plan: Supabase pauses a project after ~7 days
-- without activity. The daily Vercel cron (/api/keepalive) writes this row,
-- and the admin overview shows when it last ran.

create table public.keepalive (
  id int primary key default 1 check (id = 1),
  pinged_at timestamptz,
  source text
);

insert into public.keepalive (id) values (1);

-- Server-only, like the content tables: RLS on, no policies, no grants.
alter table public.keepalive enable row level security;
revoke all on public.keepalive from anon, authenticated;
