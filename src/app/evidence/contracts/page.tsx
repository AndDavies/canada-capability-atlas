import { Database } from "lucide-react";
import { getDataStats, getSources } from "@/data/loaders";

export default async function ContractEvidencePage() {
  const [sources, stats] = await Promise.all([getSources(), getDataStats()]);
  const contractSources = sources.filter((source) =>
    ["canadabuys-tenders", "canadabuys-awards", "open-contracts"].includes(source.id),
  );

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><Database size={13} /> Procurement signal explorer</div>
        <h1>Contracts are source-ready, not scored yet.</h1>
        <p>
          CanadaBuys and Open Government contract sources are identified for future momentum and demand signals.
          The Atlas does not show contract counts until notices are parsed, matched, reviewed, and published.
        </p>
      </section>

      <section className="manifest-panel">
        <div>
          <span>Reviewed notices</span>
          <strong>{stats.procurementNotices}</strong>
        </div>
        <div>
          <span>Current status</span>
          <strong>{stats.procurementNotices > 0 ? "Published rows available" : "Source identified; raw data not normalized"}</strong>
        </div>
        <div>
          <span>Scoring use</span>
          <strong>Momentum remains not yet measured until reviewed time-series rows exist.</strong>
        </div>
      </section>

      <section className="source-grid">
        {contractSources.map((source) => (
          <a key={source.id} className="source-card" href={source.url} target="_blank" rel="noreferrer">
            <span>{source.freshnessStatus} / {source.sourceType}</span>
            <h2>{source.title}</h2>
            <p>{source.use}</p>
            <small>{source.publisher}</small>
          </a>
        ))}
      </section>
    </main>
  );
}
