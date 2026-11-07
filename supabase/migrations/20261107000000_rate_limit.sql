-- Durable rate limit for the booking / enquiry form (POST /api/booking).
-- The old in-memory limit reset on every serverless cold start, so on Vercel
-- it didn't stop anyone. Fixed windows: one row per key, counted atomically.
-- Keys are hashed IPs ("ip:<sha256>") plus a site-wide daily cap ("all:day"),
-- so no raw IP addresses are stored.

create table public.rate_limits (
  key           text primary key,
  window_start  timestamptz not null default now(),
  hits          integer not null default 0
);

-- Server-only, like the other tables: RLS on, no policies, no grants.
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;

-- Counts one hit for `p_key` and returns true when it is over `p_limit`
-- within the current `p_window_seconds` window.
create function public.rate_limit_hit(p_key text, p_window_seconds integer, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    hits         = case when r.window_start <= now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
    window_start = case when r.window_start <= now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;
  return v_hits > p_limit;
end $$;

revoke execute on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
