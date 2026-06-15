alter table public.region_scores
  add column if not exists signals jsonb not null default '{}'::jsonb;

alter table public.sources
  add column if not exists freshness_status text not null default 'unknown',
  add column if not exists last_checked_at timestamptz,
  add column if not exists license_note text not null default 'Public Government of Canada or source-publisher terms apply.',
  add column if not exists public_use_status text not null default 'allowed';

do $$
begin
  alter table public.sources
    add constraint sources_freshness_status_check
    check (freshness_status in ('current', 'stale', 'unknown', 'not_checked'));
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.sources
    add constraint sources_public_use_status_check
    check (public_use_status in ('allowed', 'restricted', 'unknown'));
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.evidence_items (
  id text primary key,
  capability_area_id text not null references public.capability_areas(id) on delete cascade,
  region_id text references public.regions(id) on delete set null,
  entity_id bigint references public.entities(id) on delete set null,
  document_id bigint references public.documents(id) on delete set null,
  evidence_type text not null check (
    evidence_type in (
      'firm_count',
      'research',
      'contract',
      'export',
      'workforce',
      'infrastructure',
      'policy',
      'source_gap'
    )
  ),
  title text not null,
  description text not null,
  value numeric,
  unit text,
  geography text not null,
  observed_date text,
  source_date text,
  confidence text not null check (confidence in ('Low', 'Medium', 'High')),
  freshness text not null default 'unknown' check (freshness in ('current', 'stale', 'unknown', 'not_checked')),
  public_url text not null,
  source_ids text[] not null default '{}',
  caveat text not null,
  status text not null default 'review' check (status in ('draft', 'review', 'published', 'archived')),
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists region_scores_signals_gin on public.region_scores using gin (signals jsonb_path_ops);
create index if not exists evidence_items_capability_region_idx on public.evidence_items (capability_area_id, region_id);
create index if not exists evidence_items_public_status_idx on public.evidence_items (is_public, status, evidence_type);
create index if not exists evidence_items_source_ids_gin on public.evidence_items using gin (source_ids);
create index if not exists evidence_items_metadata_gin on public.evidence_items using gin (metadata jsonb_path_ops);

alter table public.evidence_items enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'evidence_items'
      and policyname = 'Public can read published evidence items'
  ) then
    create policy "Public can read published evidence items"
    on public.evidence_items
    for select
    to anon, authenticated
    using (is_public and status = 'published');
  end if;
end
$$;

grant select on public.evidence_items to anon, authenticated;
grant all on public.evidence_items to service_role;

create table if not exists atlas_private.feedback (
  id bigint generated always as identity primary key,
  feedback_type text not null check (
    feedback_type in ('relevance', 'bad_match', 'useful_source', 'false_positive', 'missing_source')
  ),
  message text not null,
  page_path text,
  capability_area_id text references public.capability_areas(id) on delete set null,
  region_id text references public.regions(id) on delete set null,
  evidence_item_id text references public.evidence_items(id) on delete set null,
  user_agent text,
  status text not null default 'new' check (status in ('new', 'reviewed', 'closed', 'spam')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists feedback_status_idx on atlas_private.feedback (status, created_at desc);
create index if not exists feedback_capability_region_idx on atlas_private.feedback (capability_area_id, region_id);

alter table atlas_private.feedback enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'atlas_private'
      and tablename = 'feedback'
      and policyname = 'Service role can manage feedback'
  ) then
    create policy "Service role can manage feedback"
    on atlas_private.feedback
    for all
    to service_role
    using (true)
    with check (true);
  end if;
end
$$;

grant usage on schema atlas_private to service_role;
grant all on atlas_private.feedback to service_role;
grant usage, select on sequence atlas_private.feedback_id_seq to service_role;

revoke all on atlas_private.feedback from anon, authenticated;
