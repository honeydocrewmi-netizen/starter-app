-- =====================================================================
-- submissions: anonymous, insert-only quote-request target for the QR page
--
-- Retention: <<DECIDE AND WRITE IT HERE>> — e.g. "delete after 90 days",
-- "keep indefinitely", "delete after the event this QR was printed for".
-- Whatever you pick, actually do it: a dated `delete` you run by hand from
-- the SQL editor below is fine at this scale.
--
-- Do NOT add: passwords, ID numbers, payment data, health data, precise
-- location, or a unique index on any personal column (see the note on
-- Broken #5 below — a unique constraint becomes an enumeration oracle).
--
-- Run this whole file once, top to bottom, in the Supabase SQL editor.
-- Safe to re-run: `create table if not exists` / `drop policy if exists`
-- make it idempotent. NOT safe to re-run after the table already has rows
-- if you change a `check` constraint's allowed values below without also
-- updating existing rows — Postgres validates checks against existing data
-- when you add or replace one.
-- =====================================================================

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
  storeys     text                 check (storeys is null or storeys in ('1', '2', '3+')),
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

-- 2. Explicitly expose the table to the Data API. Required on every project
--    created after 2026-05-30 (and on ALL projects after 2026-10-30) —
--    Supabase no longer auto-exposes public tables. Column-scoped: the
--    anonymous visitor may write these columns and nothing else. Every
--    field on the form MUST be named here or its insert fails with a
--    permission error and no obvious cause.
grant insert (
  name, phone, email, address, services, storeys, trees, urgency, notes, source
) on public.submissions to anon;

-- 3. The one thing an anonymous visitor may do.
drop policy if exists "anon can submit" on public.submissions;
create policy "anon can submit"
  on public.submissions
  for insert
  to anon
  with check (true);

-- 4. Nothing else. No select, update, or delete policy for anon, and no
--    grant beyond the columns above. Read submissions through the Table
--    Editor, the SQL editor below, or a server context using the
--    publishable key (never a secret key needs to exist for this app).

-- =====================================================================
-- Verification queries — run each one after the SQL above. If any of the
-- "expect: no rows" queries returns a row, stop and fix before going live.
-- =====================================================================

-- RLS is on
select relname, relrowsecurity
  from pg_class where relname = 'submissions';

-- Exactly one policy, insert-only, for anon
select policyname, cmd, roles, qual as using_expr, with_check
  from pg_policies where tablename = 'submissions';

-- anon holds ONLY column-level insert, and it covers every form field
select grantee, privilege_type, column_name
  from information_schema.column_privileges
 where table_name = 'submissions' and grantee = 'anon'
 order by column_name;

-- anon holds NO table-level privilege (select/update/delete) -- expect: no rows
select grantee, privilege_type
  from information_schema.table_privileges
 where table_name = 'submissions' and grantee = 'anon';

-- Browse what's come in so far
select id, created_at, name, phone, email, address, services, storeys, trees,
       urgency, left(notes, 80) as notes_preview, source
  from public.submissions
 order by created_at desc;
