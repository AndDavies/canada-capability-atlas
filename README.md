# Canada Capability Atlas

Canada Capability Atlas answers a simple public-data question: **where can Canada build?**

It maps public evidence of firms, research, talent, contracts, exports, and infrastructure behind Canada's defence and dual-use industrial base. It is a source-backed website for discovery: choose a capability need, compare provinces and territories, open evidence briefs, inspect the Data Library, and see which layers are measured or missing.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Vitest
- Supabase Postgres for public read data
- Versioned static JSON exports for transparency and fallback

## Local Development

```bash
pnpm install
pnpm data:refresh
pnpm dev
```

Open `http://127.0.0.1:3000`.

## Validation

```bash
pnpm validate
```

## Data Policy

All public UI values must come from Supabase public tables or generated artifacts in `src/data/generated/`. If a layer has not been cleaned yet, the UI shows a specific missing-layer state such as `Source identified; raw data not normalized` or `Not yet measured` rather than a placeholder value.

The current public artifact includes:

- Five signal facets per region/capability: scale, density, momentum, capability signal, and source coverage.
- Published evidence items for source-backed business-location and Canada-wide R&D observations.
- A static JSON fallback committed under `src/data/generated/`.
- A public manifest under `public/data/manifest.json`.

Momentum is intentionally `not_yet_measured` until reviewed contract, award, company, and news time-series rows exist.

## Public Routes

- `/` - question-led explorer with map, rankings, signal facets, methodology drawers, and evidence brief generation.
- `/capabilities` and `/capabilities/[missionId]` - capability definitions and signal rankings.
- `/regions` and `/regions/[regionSlug]` - all capability signals for one province or territory.
- `/briefs/[briefSlug]` - shareable evidence briefs such as `/briefs/naval-autonomy-nova-scotia`.
- `/compare?mission=naval-autonomy&a=CA-NS&b=CA-ON` - side-by-side signal comparison.
- `/evidence`, `/evidence/contracts`, `/evidence/gaps` - evidence layer status and missing-layer reports.
- `/itb-opportunity` - ITB context lens without fake opportunity scores.
- `/data-library` - source freshness, use, status, and linked evidence counts.
- `/sources` - compatibility redirect to `/data-library`.

## Database Workflow

The public site reads from Supabase Postgres first and falls back to committed JSON if Supabase is unavailable or returns an invalid artifact shape. There is no direct browser-write path.

- `public.sources`, `public.documents`, `public.regions`, `public.capability_areas`, and `public.region_scores` feed the current explorer.
- `public.evidence_items` stores source-backed observations used by evidence briefs.
- `public.entities`, `public.company_locations`, `public.procurement_notices`, `public.press_releases`, and `public.capability_matches` are ready for cleaned company, contract, and news signals.
- `atlas_private.source_runs`, `atlas_private.raw_documents`, `atlas_private.review_queue`, and `atlas_private.feedback` are for collectors, extraction logs, review, and private relevance feedback before facts become public.

Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for public read access. Use `SUPABASE_SERVICE_ROLE_KEY` only in local maintenance scripts, server-side ingestion jobs, or the `/api/feedback` server route, never in client code.

If `SUPABASE_SERVICE_ROLE_KEY` is not configured, `/api/feedback` returns `503` and no public write is attempted.

```bash
pnpm db:seed:build
pnpm db:seed
```

Future collectors should write raw source captures to `atlas_private.raw_documents`, create review items when confidence is low, and publish only source-backed cleaned rows into the public tables.

## Source Posture

The first release uses public, aggregate, and official sources only:

- Statistics Canada Web Data Service and CSV tables
- DND Defence Capabilities Blueprint
- CanadaBuys procurement datasets
- Open Government proactive contracts
- ISED ITB public policy and obligations pages
- Northern infrastructure public datasets

This project is independent and is not affiliated with Build Canada, the Government of Canada, or any source publisher.
