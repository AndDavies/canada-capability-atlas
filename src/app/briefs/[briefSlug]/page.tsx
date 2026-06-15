import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { getAtlasData, getSources } from "@/data/loaders";
import { buildEvidenceBrief } from "@/lib/memo";
import { parseBriefSlug } from "@/lib/atlas-utils";

export default async function BriefPage({ params }: { params: Promise<{ briefSlug: string }> }) {
  const { briefSlug } = await params;
  const [data, sources] = await Promise.all([getAtlasData(), getSources()]);
  const parsed = parseBriefSlug(data, briefSlug);
  if (!parsed) notFound();

  const brief = buildEvidenceBrief(data, sources, parsed);

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><FileText size={13} /> Evidence brief</div>
        <h1>{brief.title}</h1>
        <p>{brief.summary}</p>
      </section>

      <section className="method-grid">
        <article>
          <span>Scale</span>
          <h2>{brief.signalSummary.scale}</h2>
          <p>Absolute relevant business-location base.</p>
        </article>
        <article>
          <span>Density</span>
          <h2>{brief.signalSummary.density}</h2>
          <p>Relevant business locations relative to the regional business base.</p>
        </article>
        <article>
          <span>Capability signal</span>
          <h2>{brief.signalSummary.readiness}</h2>
          <p>Directional public evidence index, not procurement advice.</p>
        </article>
        <article>
          <span>Source coverage</span>
          <h2>{brief.signalSummary.evidenceCoverage}</h2>
          <p>Share of applicable source layers with usable evidence.</p>
        </article>
      </section>

      <section className="method-section">
        <h2>Measured evidence</h2>
        <ul className="caveat-list">
          {brief.measuredEvidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="method-section">
        <h2>Missing layers</h2>
        {brief.missingLayers.length ? (
          <ul className="caveat-list">
            {brief.missingLayers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No applicable v1 missing layers are published for this brief.</p>
        )}
      </section>

      <section className="method-section">
        <h2>Recommended next investigation</h2>
        <ul className="caveat-list">
          {brief.nextInvestigation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="method-section">
        <h2>Caveats</h2>
        <ul className="caveat-list">
          {brief.caveats.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="method-section">
        <div className="panel-heading">
          <div>
            <h2>Citations</h2>
            <p>Every cited item is a public source used by the stored Atlas data.</p>
          </div>
          <Link className="secondary-link" href={`/api/brief?missionId=${brief.missionId}&regionId=${brief.regionId}&format=markdown`}>
            Markdown
          </Link>
        </div>
        <div className="source-grid">
          {brief.citations.map((citation) => (
            <a key={citation.id} className="source-card" href={citation.url} target="_blank" rel="noreferrer">
              <span>Tier {citation.tier}</span>
              <h2>{citation.title}</h2>
              <p>{citation.publisher}</p>
              <small>{citation.id}</small>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
