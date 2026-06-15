# Canada Capability Atlas

Canada Capability Atlas helps people find Canadian companies, public contracts, research, and news signals tied to strategic defence and dual-use needs. It shows where public evidence is strongest, what sources support it, and what data is still being cleaned.

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

All public UI values must come from Supabase public tables or generated artifacts in `src/data/generated/`. If a layer has not been cleaned yet, the UI shows `Data not ready yet` rather than a placeholder value.

## Database Workflow

The public site reads from Supabase Postgres first and falls back to committed JSON if Supabase is unavailable. There is no browser-write path.

- `public.sources`, `public.documents`, `public.regions`, `public.capability_areas`, and `public.region_scores` feed the current explorer.
- `public.entities`, `public.company_locations`, `public.procurement_notices`, `public.press_releases`, and `public.capability_matches` are ready for cleaned company, contract, and news signals.
- `atlas_private.source_runs`, `atlas_private.raw_documents`, and `atlas_private.review_queue` are for collectors, extraction logs, and human review before facts become public.

Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for public read access. Use `SUPABASE_SERVICE_ROLE_KEY` only in local maintenance scripts or server-side ingestion jobs, never in client code.

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
