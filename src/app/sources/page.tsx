import manifest from "../../../public/data/manifest.json";
import { getSources } from "@/data/loaders";

export default function SourcesPage() {
  const sources = getSources();

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow">Source catalogue</div>
        <h1>Fifteen public sources, one generated manifest.</h1>
        <p>
          The catalogue separates source discovery from normalized metrics. A source can be listed here before it is allowed to drive a public score.
        </p>
      </section>

      <section className="manifest-panel">
        <div>
          <span>Generated</span>
          <strong>{new Date(manifest.generatedAt).toLocaleString("en-CA")}</strong>
        </div>
        <div>
          <span>Artifact version</span>
          <strong>{manifest.artifactVersion}</strong>
        </div>
        <div>
          <span>Source policy</span>
          <strong>{manifest.sourcePolicy}</strong>
        </div>
      </section>

      <section className="source-grid">
        {sources.map((source) => (
          <a key={source.id} className="source-card" href={source.url} target="_blank" rel="noreferrer">
            <span>Tier {source.tier} / {source.sourceType}</span>
            <h2>{source.title}</h2>
            <p>{source.use}</p>
            <small>{source.publisher} / {source.cadence}</small>
          </a>
        ))}
      </section>
    </main>
  );
}
