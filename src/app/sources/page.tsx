import manifest from "../../../public/data/manifest.json";
import { getDataStats, getSources } from "@/data/loaders";

function plainSourceUse(use: string) {
  if (use.includes("Catalogued for future")) return "Listed for a future cleaned data layer. Not used as a score yet.";
  if (use.includes("not displayed")) return "Listed for a future cleaned data layer. Not used as a score yet.";
  if (use.includes("Procurement demand")) return "Public contract source. Keyword matching comes later.";
  if (use.includes("Award history")) return "Public award source. Vendor matching comes later.";
  if (use.includes("Provincial firm-count")) return "Used now for company/site counts by province.";
  if (use.includes("National R&D")) return "Used now for Canada-wide research context.";
  return use;
}

export default async function SourcesPage() {
  const [sources, stats] = await Promise.all([getSources(), getDataStats()]);

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow">Source catalogue</div>
        <h1>The public sources behind the Atlas.</h1>
        <p>
          This page shows what the database knows today. Company, press-release, and procurement feeds are ready in the database, but they stay empty until real source rows are added.
        </p>
      </section>

      <section className="manifest-panel">
        <div>
          <span>Data store</span>
          <strong>{stats.backend}</strong>
        </div>
        <div>
          <span>Public rows</span>
          <strong>{stats.sources} sources / {stats.regionScores} scores</strong>
        </div>
        <div>
          <span>Next feeds</span>
          <strong>{stats.companies} companies / {stats.pressReleases} releases / {stats.procurementNotices} notices</strong>
        </div>
      </section>

      <section className="manifest-panel secondary">
        <div>
          <span>Generated export</span>
          <strong>{new Date(manifest.generatedAt).toLocaleString("en-CA")}</strong>
        </div>
        <div>
          <span>Artifact version</span>
          <strong>{manifest.artifactVersion}</strong>
        </div>
        <div>
          <span>Rule</span>
          <strong>{manifest.sourcePolicy}</strong>
        </div>
      </section>

      <section className="source-grid">
        {sources.map((source) => (
          <a key={source.id} className="source-card" href={source.url} target="_blank" rel="noreferrer">
            <span>Tier {source.tier} / {source.sourceType}</span>
            <h2>{source.title}</h2>
            <p>{plainSourceUse(source.use)}</p>
            <small>{source.publisher} / {source.cadence}</small>
          </a>
        ))}
      </section>
    </main>
  );
}
