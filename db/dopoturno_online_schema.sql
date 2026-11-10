-- DopoTurno online foundation · schema 2026-11
-- Apply ONLY to a NEW dedicated DopoTurno Supabase project.
-- Do not run against Nexo/SINDRU or any existing app's database.
-- Supabase Data API (2026-10): tables must be explicitly granted/exposed.
-- Requires Supabase Auth email confirmation and production-ready spam moderation.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.dt_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('messaggio','confronto')),
  category text not null check (category in ('sala','cucina','bar','lavoro')),
  title text not null check (char_length(btrim(title)) between 10 and 120),
  body text not null check (char_length(btrim(body)) between 40 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dt_posts_kind_created_idx on public.dt_posts(kind,created_at desc);

create table if not exists public.dt_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.dt_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 2 and 1200),
  created_at timestamptz not null default now()
);
create index if not exists dt_comments_post_created_idx on public.dt_comments(post_id,created_at asc);

create table if not exists public.dt_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.dt_posts(id) on delete cascade,
  reason text not null check (reason in ('spam','privacy','abusi','altro')),
  created_at timestamptz not null default now(),
  unique(reporter_id,post_id)
);

create table if not exists public.dt_progress (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  saved_at timestamptz not null default now(),
  constraint dt_progress_max_json check (octet_length(snapshot::text)<=262144),
  constraint dt_progress_shape check (jsonb_typeof(snapshot)='object')
);

create table if not exists public.dt_cv (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name)<=130),
  professional_title text not null default '' check (char_length(professional_title)<=150),
  area text not null default '' check (char_length(area)<=150),
  summary text not null default '' check (char_length(summary)<=1500),
  skills text not null default '' check (char_length(skills)<=600),
  updated_at timestamptz not null default now()
);

create table if not exists public.dt_cv_grants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  viewer_email text not null check (
     viewer_email=lower(btrim(viewer_email))
     and char_length(viewer_email) between 5 and 254
     and viewer_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique(owner_id,viewer_email),
  constraint dt_cv_grants_max_lifetime check (expires_at<=created_at+interval '90 days')
);
create index if not exists dt_cv_grants_owner_idx on public.dt_cv_grants(owner_id);
create index if not exists dt_cv_grants_viewer_idx on public.dt_cv_grants(viewer_email,expires_at)
where revoked_at is null;

alter table public.dt_posts enable row level security;
alter table public.dt_comments enable row level security;
alter table public.dt_reports enable row level security;
alter table public.dt_progress enable row level security;
alter table public.dt_cv enable row level security;
alter table public.dt_cv_grants enable row level security;

-- Grant only the exact Data API operations needed.
revoke all on public.dt_posts,public.dt_comments,public.dt_reports,
 public.dt_progress,public.dt_cv,public.dt_cv_grants from anon;
grant select,insert,delete on public.dt_posts to authenticated;
grant select,insert,delete on public.dt_comments to authenticated;
grant insert on public.dt_reports to authenticated;
grant select,insert,update,delete on public.dt_progress to authenticated;
grant select,insert,update on public.dt_cv to authenticated;
grant select,insert,update,delete on public.dt_cv_grants to authenticated;

-- Posts and discussion comments visible ONLY to signed-in users.
create policy "dt_posts_read_members" on public.dt_posts
  for select to authenticated using ((select auth.uid()) is not null);
create policy "dt_posts_create_self" on public.dt_posts
  for insert to authenticated with check (author_id=(select auth.uid()));
create policy "dt_posts_delete_self" on public.dt_posts
  for delete to authenticated using (author_id=(select auth.uid()));

create policy "dt_comments_read_members" on public.dt_comments
  for select to authenticated using ((select auth.uid()) is not null);
create policy "dt_comments_create_self" on public.dt_comments
  for insert to authenticated
  with check (
    author_id=(select auth.uid())
    and exists (select 1 from public.dt_posts p where p.id=post_id)
  );
create policy "dt_comments_delete_self" on public.dt_comments
  for delete to authenticated using (author_id=(select auth.uid()));

-- Reports are write-only for members. Moderators need a separate reviewed
-- admin interface; no direct authenticated-user SELECT.
create policy "dt_reports_create_self" on public.dt_reports
  for insert to authenticated with check (reporter_id=(select auth.uid()));

-- Progress is exclusively private, and NEVER synced automatically.
create policy "dt_progress_read_self" on public.dt_progress
  for select to authenticated using (owner_id=(select auth.uid()));
create policy "dt_progress_create_self" on public.dt_progress
  for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "dt_progress_update_self" on public.dt_progress
  for update to authenticated using (owner_id=(select auth.uid()))
  with check (owner_id=(select auth.uid()));
create policy "dt_progress_delete_self" on public.dt_progress
  for delete to authenticated using (owner_id=(select auth.uid()));

-- A recipient sees ONLY grants to their signed email. Email verification
-- must be enabled at the project level before accepting registrations.
create policy "dt_cv_grants_read_owner_or_recipient" on public.dt_cv_grants
  for select to authenticated using (
    owner_id=(select auth.uid()) or
    (revoked_at is null and expires_at>now()
      and viewer_email=lower((select auth.jwt()->>'email')))
  );
create policy "dt_cv_grants_create_self" on public.dt_cv_grants
  for insert to authenticated with check (
    owner_id=(select auth.uid()) and revoked_at is null
    and expires_at>now() and expires_at<=now()+interval '90 days'
  );
create policy "dt_cv_grants_update_self" on public.dt_cv_grants
  for update to authenticated using (owner_id=(select auth.uid()))
  with check (owner_id=(select auth.uid()));
create policy "dt_cv_grants_delete_self" on public.dt_cv_grants
  for delete to authenticated using (owner_id=(select auth.uid()));

-- Never expose CVs by default. A valid nonrevoked, nonexpired grant that
-- matches the recipient's signed account email is necessary.
create policy "dt_cv_read_owner_or_invited" on public.dt_cv
  for select to authenticated using (
    owner_id=(select auth.uid()) or exists (
      select 1 from public.dt_cv_grants g
      where g.owner_id=dt_cv.owner_id
      and g.viewer_email=lower((select auth.jwt()->>'email'))
      and g.revoked_at is null and g.expires_at>now()
    )
  );
create policy "dt_cv_create_self" on public.dt_cv
  for insert to authenticated with check (owner_id=(select auth.uid()));
create policy "dt_cv_update_self" on public.dt_cv
  for update to authenticated using (owner_id=(select auth.uid()))
  with check (owner_id=(select auth.uid()));

comment on table public.dt_cv is 'Private default; viewer authorization requires an explicit dt_cv_grants row and confirmed email.';
comment on table public.dt_progress is 'Explicitly saved user-controlled snapshot; not a professional certificate.';
comment on table public.dt_posts is 'Signed-in online discussion. Must configure rate limits and moderation before open launch.';
