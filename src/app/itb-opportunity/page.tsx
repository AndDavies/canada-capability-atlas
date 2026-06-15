import Link from "next/link";
import { Scale } from "lucide-react";
import { getAtlasData, getSources } from "@/data/loaders";

export default async function ItbOpportunityPage() {
  const [data, sources] = await Promise.all([getAtlasData(), getSources()]);
  const itbSources = sources.filter((source) => ["itb-policy", "itb-obligations"].includes(source.id));
  const relevantCapabilities = data.missions.filter((mission) => mission.sourceIds.some((sourceId) => sourceId.startsWith("itb-")));

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><Scale size={13} /> ITB Opportunity Lens</div>
        <h1>ITB context, not opportunity scores.</h1>
        <p>
          This lens explains where Industrial and Technological Benefits policy sources connect to Atlas
          capabilities. It does not score opportunities until public obligation rows, capability matches, and
          regional evidence are normalized and reviewed.
        </p>
      </section>

      <section className="method-grid">
        <article>
          <span>Current status</span>
          <h2>Policy source-ready</h2>
          <p>ITB policy and public obligation sources are catalogued and linked to relevant capabilities.</p>
        </article>
        <article>
          <span>Not yet measured</span>
          <h2>No fake scores</h2>
          <p>Opportunity scoring requires reviewed obligation tables, contractors, projects, regions, and capability matches.</p>
        </article>
        <article>
          <span>Useful today</span>
          <h2>Investigation guide</h2>
          <p>Use this page to identify which capabilities need ITB enrichment in the next ingestion release.</p>
        </article>
        <article>
          <span>Public posture</span>
          <h2>No contact data</h2>
          <p>The Atlas excludes personal contact fields and vendor-confidential claims.</p>
        </article>
      </section>

      <section className="method-section">
        <h2>Relevant capabilities</h2>
        <div className="source-grid">
          {relevantCapabilities.map((mission) => (
            <Link key={mission.id} className="source-card" href={`/capabilities/${mission.id}`}>
              <span>{mission.shortName}</span>
              <h2>{mission.name}</h2>
              <p>{mission.description}</p>
              <small>{mission.sourceIds.filter((sourceId) => sourceId.startsWith("itb-")).join(", ")}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="method-section">
        <h2>Sources</h2>
        <div className="source-grid">
          {itbSources.map((source) => (
            <a key={source.id} className="source-card" href={source.url} target="_blank" rel="noreferrer">
              <span>{source.sourceType}</span>
              <h2>{source.title}</h2>
              <p>{source.use}</p>
              <small>{source.publisher}</small>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
