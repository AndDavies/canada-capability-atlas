create schema if not exists atlas_private;

create table if not exists public.sources (
  id text primary key,
  title text not null,
  publisher text not null,
  url text not null,
  source_type text not null,
  tier integer not null check (tier between 1 and 5),
  cadence text not null,
  use_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.regions (
  id text primary key,
  name text not null,
  short_name text not null,
  dguid text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.capability_areas (
  id text primary key,
  name text not null,
  short_name text not null,
  description text not null,
  plain_language_summary text not null,
  source_ids text[] not null default '{}',
  taxonomy jsonb not null default '{}'::jsonb,
  weights jsonb not null default '{}'::jsonb,
  national_signals jsonb not null default '[]'::jsonb,
  national_metrics jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.region_scores (
  capability_area_id text not null references public.capability_areas(id) on delete cascade,
  region_id text not null references public.regions(id) on delete cascade,
  strength_score integer not null check (strength_score between 0 and 100),
  confidence text not null check (confidence in ('Low', 'Medium', 'High')),
  source_ids text[] not null default '{}',
  indicators jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (capability_area_id, region_id)
);

create table if not exists public.documents (
  id bigint generated always as identity primary key,
  source_id text references public.sources(id) on delete set null,
  title text not null,
  url text not null,
  publisher text,
  document_type text not null check (document_type in ('source_page', 'press_release', 'procurement_notice', 'contract', 'research', 'company_page', 'dataset', 'other')),
  published_at timestamptz,
  region_id text references public.regions(id) on delete set null,
  summary text,
  content_hash text,
  status text not null default 'published' check (status in ('draft', 'review', 'published', 'archived')),
  is_public boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (url)
);

create table if not exists public.entities (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('company', 'institution', 'government_program', 'technology', 'place', 'person', 'other')),
  name text not null,
  normalized_name text generated always as (lower(regexp_replace(name, '\s+', ' ', 'g'))) stored,
  website_url text,
  summary text,
  confidence text not null default 'Low' check (confidence in ('Low', 'Medium', 'High')),
  status text not null default 'review' check (status in ('review', 'published', 'archived')),
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, normalized_name)
);

create table if not exists public.company_locations (
  id bigint generated always as identity primary key,
  entity_id bigint not null references public.entities(id) on delete cascade,
  region_id text references public.regions(id) on delete set null,
  city text,
  facility_type text,
  source_document_id bigint references public.documents(id) on delete set null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_entities (
  document_id bigint not null references public.documents(id) on delete cascade,
  entity_id bigint not null references public.entities(id) on delete cascade,
  relationship_type text not null default 'mentioned',
  confidence text not null default 'Low' check (confidence in ('Low', 'Medium', 'High')),
  evidence_quote text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (document_id, entity_id, relationship_type)
);

create table if not exists public.capability_matches (
  id bigint generated always as identity primary key,
  capability_area_id text not null references public.capability_areas(id) on delete cascade,
  entity_id bigint references public.entities(id) on delete cascade,
  document_id bigint references public.documents(id) on delete cascade,
  match_reason text not null,
  confidence text not null default 'Low' check (confidence in ('Low', 'Medium', 'High')),
  status text not null default 'review' check (status in ('review', 'published', 'archived')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (entity_id is not null or document_id is not null)
);

create table if not exists public.procurement_notices (
  id bigint generated always as identity primary key,
  document_id bigint references public.documents(id) on delete cascade,
  source_id text references public.sources(id) on delete set null,
  notice_identifier text,
  title text not null,
  buyer text,
  supplier_name text,
  notice_type text,
  published_at timestamptz,
  closing_at timestamptz,
  value_amount numeric,
  value_currency text,
  region_id text references public.regions(id) on delete set null,
  status text not null default 'review' check (status in ('review', 'published', 'archived')),
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, notice_identifier)
);

create table if not exists public.press_releases (
  id bigint generated always as identity primary key,
  document_id bigint references public.documents(id) on delete cascade,
  source_id text references public.sources(id) on delete set null,
  title text not null,
  publisher text,
  url text not null,
  published_at timestamptz,
  region_id text references public.regions(id) on delete set null,
  status text not null default 'review' check (status in ('review', 'published', 'archived')),
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (url)
);

create table if not exists atlas_private.source_runs (
  id bigint generated always as identity primary key,
  source_id text references public.sources(id) on delete set null,
  run_type text not null default 'manual',
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_seen integer not null default 0,
  records_changed integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists atlas_private.raw_documents (
  id bigint generated always as identity primary key,
  source_id text references public.sources(id) on delete set null,
  url text not null,
  title text,
  document_type text not null default 'other',
  fetched_at timestamptz not null default now(),
  published_at timestamptz,
  content_hash text,
  raw_text text,
  raw_json jsonb not null default '{}'::jsonb,
  extraction_status text not null default 'new' check (extraction_status in ('new', 'parsed', 'review', 'published', 'rejected')),
  unique (url, content_hash)
);

create table if not exists atlas_private.review_queue (
  id bigint generated always as identity primary key,
  item_type text not null,
  item_table text not null,
  item_id bigint,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'approved', 'rejected', 'deferred')),
  priority integer not null default 3 check (priority between 1 and 5),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewer_note text
);

create index if not exists sources_tier_idx on public.sources (tier, source_type);
create index if not exists capability_areas_public_idx on public.capability_areas (is_public);
create index if not exists capability_areas_taxonomy_gin on public.capability_areas using gin (taxonomy jsonb_path_ops);
create index if not exists region_scores_region_id_idx on public.region_scores (region_id);
create index if not exists region_scores_area_score_idx on public.region_scores (capability_area_id, strength_score desc);
create index if not exists region_scores_indicators_gin on public.region_scores using gin (indicators jsonb_path_ops);
create index if not exists documents_source_id_idx on public.documents (source_id);
create index if not exists documents_region_id_idx on public.documents (region_id);
create index if not exists documents_status_published_idx on public.documents (status, published_at desc);
create index if not exists documents_metadata_gin on public.documents using gin (metadata jsonb_path_ops);
create index if not exists entities_public_type_idx on public.entities (is_public, entity_type);
create index if not exists company_locations_entity_id_idx on public.company_locations (entity_id);
create index if not exists company_locations_region_id_idx on public.company_locations (region_id);
create index if not exists document_entities_entity_id_idx on public.document_entities (entity_id);
create index if not exists capability_matches_area_idx on public.capability_matches (capability_area_id, status);
create index if not exists capability_matches_entity_idx on public.capability_matches (entity_id);
create index if not exists capability_matches_document_idx on public.capability_matches (document_id);
create index if not exists procurement_notices_source_id_idx on public.procurement_notices (source_id);
create index if not exists procurement_notices_region_id_idx on public.procurement_notices (region_id);
create index if not exists procurement_notices_status_published_idx on public.procurement_notices (status, published_at desc);
create index if not exists press_releases_source_id_idx on public.press_releases (source_id);
create index if not exists press_releases_region_id_idx on public.press_releases (region_id);
create index if not exists press_releases_status_published_idx on public.press_releases (status, published_at desc);
create index if not exists source_runs_source_id_idx on atlas_private.source_runs (source_id);
create index if not exists source_runs_status_idx on atlas_private.source_runs (status, started_at desc);
create index if not exists raw_documents_source_id_idx on atlas_private.raw_documents (source_id);
create index if not exists raw_documents_extraction_status_idx on atlas_private.raw_documents (extraction_status, fetched_at desc);
create index if not exists raw_documents_raw_json_gin on atlas_private.raw_documents using gin (raw_json jsonb_path_ops);
create index if not exists review_queue_status_idx on atlas_private.review_queue (status, priority, created_at);

alter table public.sources enable row level security;
alter table public.regions enable row level security;
alter table public.capability_areas enable row level security;
alter table public.region_scores enable row level security;
alter table public.documents enable row level security;
alter table public.entities enable row level security;
alter table public.company_locations enable row level security;
alter table public.document_entities enable row level security;
alter table public.capability_matches enable row level security;
alter table public.procurement_notices enable row level security;
alter table public.press_releases enable row level security;
alter table atlas_private.source_runs enable row level security;
alter table atlas_private.raw_documents enable row level security;
alter table atlas_private.review_queue enable row level security;

create policy "Public can read source catalogue" on public.sources for select to anon, authenticated using (true);
create policy "Public can read regions" on public.regions for select to anon, authenticated using (true);
create policy "Public can read capability areas" on public.capability_areas for select to anon, authenticated using (is_public);
create policy "Public can read region scores" on public.region_scores for select to anon, authenticated using (true);
create policy "Public can read published documents" on public.documents for select to anon, authenticated using (is_public and status = 'published');
create policy "Public can read published entities" on public.entities for select to anon, authenticated using (is_public and status = 'published');
create policy "Public can read published company locations" on public.company_locations for select to anon, authenticated using (is_public);
create policy "Public can read published document links" on public.document_entities for select to anon, authenticated using (is_public);
create policy "Public can read published capability matches" on public.capability_matches for select to anon, authenticated using (is_public and status = 'published');
create policy "Public can read published procurement notices" on public.procurement_notices for select to anon, authenticated using (is_public and status = 'published');
create policy "Public can read published press releases" on public.press_releases for select to anon, authenticated using (is_public and status = 'published');

grant usage on schema public to anon, authenticated, service_role;
grant select on
  public.sources,
  public.regions,
  public.capability_areas,
  public.region_scores,
  public.documents,
  public.entities,
  public.company_locations,
  public.document_entities,
  public.capability_matches,
  public.procurement_notices,
  public.press_releases
to anon, authenticated;

grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant usage on schema atlas_private to service_role;
grant all on all tables in schema atlas_private to service_role;
grant usage, select on all sequences in schema atlas_private to service_role;
