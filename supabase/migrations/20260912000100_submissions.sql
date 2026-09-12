create table if not exists public.submissions (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  name        text        not null check (length(name) between 1 and 120),
  phone       text        not null check (length(phone) between 7 and 30),
  email       text                 check (email is null or length(email) <= 254),
  address     text        not null check (length(address) between 1 and 300),

  -- multi-select: any non-empty combination of the three services offered
  services    text[]      not null check (
                cardinality(services) between 1 and 3
                and services <@ array['gutters', 'roof', 'yard']::text[]
              ),

  -- quoting context — kept small on purpose, all optional
  stories     text                 check (stories is null or stories in ('1', '2', '3+')),
  trees       text                 check (trees is null or trees in ('none', 'a-few', 'a-lot')),
  urgency     text                 check (urgency is null or urgency in ('asap', 'this-month', 'just-pricing')),
  notes       text                 check (notes is null or length(notes) <= 2000),

  -- which poster/placement this scan came from, e.g. ?src=front-counter
  source      text                 check (source is null or length(source) <= 64)
);

create index if not exists submissions_created_at_idx
  on public.submissions (created_at desc);

-- 1. Deny by default.
alter table public.submissions enable row level security;

-- 2a. Drop Supabase's default grants FIRST. A new Supabase project grants
--     anon and authenticated full table-level privileges (select, insert,
--     update, delete, truncate, references, trigger) on everything in the
--     public schema. The column-scoped grant below ADDS to those defaults, it
--     does not replace them — so without this revoke, anon keeps table-wide
--     select/update/delete and only RLS stands between the public and every
--     row. Verified on a real project 2026-09-07: the "expect: no rows" check
--     below returned all seven privileges until this ran.
--     `authenticated` is included because this app never signs anyone in;
--     postgres and service_role keep their grants for dashboard/server use.
revoke all on public.submissions from anon, authenticated;

-- 2b. Explicitly expose the table to the Data API. Required on every project
--    created after 2026-05-30 (and on ALL projects after 2026-10-30) —
--    Supabase no longer auto-exposes public tables. Column-scoped: the
--    anonymous visitor may write these columns and nothing else. Every
--    field on the form MUST be named here or its insert fails with a
--    permission error and no obvious cause.
grant insert (
  name, phone, email, address, services, stories, trees, urgency, notes, source
) on public.submissions to anon;

-- 3. The one thing an anonymous visitor may do.
drop policy if exists "anon can submit" on public.submissions;
create policy "anon can submit"
  on public.submissions
  for insert
  to anon
  with check (true);
