# Canada Capability Atlas

Canada Capability Atlas is an open-source public data explorer for Canadian defence and dual-use industrial capacity. It uses public, source-backed datasets to make capability, regional capacity, source coverage, and evidence gaps visible without implying access to classified, operational, procurement-confidential, or private company information.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Vitest
- Versioned static data artifacts

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

All public UI values must come from generated artifacts in `src/data/generated/` and source/provenance files in `public/data/`. If a layer has not been defensibly normalized yet, the UI shows `Not yet available` rather than a placeholder value.

## Source Posture

The first release uses public, aggregate, and official sources only:

- Statistics Canada Web Data Service and CSV tables
- DND Defence Capabilities Blueprint
- CanadaBuys procurement datasets
- Open Government proactive contracts
- ISED ITB public policy and obligations pages
- Northern infrastructure public datasets

This project is independent and is not affiliated with Build Canada, the Government of Canada, or any source publisher.
