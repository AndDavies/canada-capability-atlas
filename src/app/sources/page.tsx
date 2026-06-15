import manifest from "../../../public/data/manifest.json";
import { getDataStats, getSources } from "@/data/loaders";

function plainSourceType(sourceType: string) {
  if (sourceType.includes("api")) return "official API";
  if (sourceType.includes("csv")) return "official data file";
  if (sourceType.includes("dataset")) return "official dataset";
  if (sourceType.includes("geodata")) return "official map data";
  if (sourceType.includes("html")) return "official web page";
  return sourceType.replaceAll("_", " ");
}

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
        <div className="eyebrow">Data sources</div>
        <h1>Where the evidence comes from.</h1>
        <p>
          Every number on the Atlas should point back to a public source. This page shows what the
          database can use today, what is already feeding scores, and what is waiting for reviewed rows.
        </p>
      </section>

      <section className="manifest-panel">
        <div>
          <span>Data currently served from</span>
          <strong>{stats.backend}</strong>
        </div>
        <div>
          <span>Published records</span>
          <strong>{stats.sources} sources / {stats.regionScores} scores</strong>
        </div>
        <div>
          <span>Feed tables waiting for review</span>
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
          <span>Source rule</span>
          <strong>{manifest.sourcePolicy}</strong>
        </div>
      </section>

      <section className="method-section">
        <h2>How to use this page</h2>
        <p>
          Open a source when you want to check a number, understand a data gap, or see what feed should be
          connected next. A listed source does not always mean it is already used in a regional score.
        </p>
      </section>

      <section className="source-grid">
        {sources.map((source) => (
          <a key={source.id} className="source-card" href={source.url} target="_blank" rel="noreferrer">
            <span>Source confidence tier {source.tier} / {plainSourceType(source.sourceType)}</span>
            <h2>{source.title}</h2>
            <p>{plainSourceUse(source.use)}</p>
            <small>{source.publisher} / {source.cadence}</small>
          </a>
        ))}
      </section>
    </main>
  );
}
