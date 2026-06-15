import manifest from "../../../public/data/manifest.json";
import { getAtlasData, getDataStats, getSources } from "@/data/loaders";

function plainSourceType(sourceType: string) {
  if (sourceType.includes("api")) return "official API";
  if (sourceType.includes("csv")) return "official data file";
  if (sourceType.includes("dataset")) return "official dataset";
  if (sourceType.includes("geodata")) return "official map data";
  if (sourceType.includes("html")) return "official web page";
  return sourceType.replaceAll("_", " ");
}

function plainSourceUse(use: string) {
  if (use.includes("Catalogued for future")) return "Source identified; raw data is not normalized yet.";
  if (use.includes("not displayed")) return "Source identified; raw data is not normalized yet.";
  if (use.includes("Procurement demand")) return "Public contract source. Keyword matching comes after review.";
  if (use.includes("Award history")) return "Public award source. Vendor and region matching comes after review.";
  if (use.includes("Provincial firm-count")) return "Used now for relevant business-location counts by province.";
  if (use.includes("National R&D")) return "Used now for Canada-wide research context.";
  return use;
}

export default async function DataLibraryPage() {
  const [data, sources, stats] = await Promise.all([getAtlasData(), getSources(), getDataStats()]);

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow">Data library</div>
        <h1>Where the evidence comes from.</h1>
        <p>
          The Data Library shows the public sources the Atlas can use, what is feeding visible signals today,
          and which layers still need parsing, normalization, or review before they appear as numbers.
        </p>
      </section>

      <section className="manifest-panel">
        <div>
          <span>Data currently served from</span>
          <strong>{stats.backend}</strong>
        </div>
        <div>
          <span>Published records</span>
          <strong>{stats.sources} sources / {stats.regionScores} scores / {stats.evidenceItems} evidence items</strong>
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
          Open a source when you want to check a signal, understand a missing layer, or decide which feed
          should be connected next. A listed source does not always mean it is already used in a regional score.
        </p>
      </section>

      <section className="source-grid">
        {sources.map((source) => {
          const linkedEvidence = data.evidenceItems.filter((item) => item.sourceIds.includes(source.id)).length;
          return (
            <a key={source.id} className="source-card" href={source.url} target="_blank" rel="noreferrer">
              <span>Tier {source.tier} / {plainSourceType(source.sourceType)} / {source.freshnessStatus}</span>
              <h2>{source.title}</h2>
              <p>{plainSourceUse(source.use)}</p>
              <p>{linkedEvidence} published evidence item{linkedEvidence === 1 ? "" : "s"} linked to this source.</p>
              <small>{source.publisher} / {source.cadence} / {source.publicUseStatus}</small>
            </a>
          );
        })}
      </section>
    </main>
  );
}
