import { BarChart3, Database, FileWarning, RefreshCw } from "lucide-react";
import { getAtlasData } from "@/data/loaders";

const publicLimits = [
  "Capability signals show public evidence. They are not procurement advice or a complete market map.",
  "The Atlas does not use classified, private, or vendor-confidential information.",
  "Companies, press releases, and contract notices appear only after real source rows are added and reviewed.",
  "A missing layer means the Atlas has not published a reviewed number yet. It does not prove no activity exists.",
];

const workflowStates = [
  "Source identified",
  "Raw data not ingested",
  "Parsed but not reviewed",
  "Reviewed but not published",
  "Not applicable to this capability",
];

export default async function MethodologyPage() {
  const data = await getAtlasData();

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><BarChart3 size={13} /> Methodology</div>
        <h1>How to read the Atlas.</h1>
        <p>
          The Atlas starts with public sources, cleans the parts that can be compared, and separates what is
          measured from what is still missing. Every displayed metric must have a source ID.
        </p>
      </section>

      <section className="method-grid">
        <article>
          <Database size={19} />
          <h2>What counts as evidence</h2>
          <p>Numbers start with official or durable public sources. A source can be listed before it is cleaned, but it cannot become a measured signal until the mapping is clear.</p>
        </article>
        <article>
          <BarChart3 size={19} />
          <h2>What the signal means</h2>
          <p>The capability signal is directional. It combines measured scale, Canada-wide research context, and source coverage, then labels missing layers openly.</p>
        </article>
        <article>
          <FileWarning size={19} />
          <h2>Why layers can be missing</h2>
          <p>Workforce, export, contract, broadband, and energy layers only appear as numbers after they are parsed, normalized, reviewed, and published.</p>
        </article>
        <article>
          <RefreshCw size={19} />
          <h2>How updates work</h2>
          <p>Supabase is the main database. JSON exports stay in the repo so public data can be rebuilt, reviewed, and audited.</p>
        </article>
      </section>

      <section className="method-section">
        <h2>The five signal facets</h2>
        <div className="taxonomy-table">
          <article>
            <h3>Scale signal</h3>
            <p>Absolute relevant business-location base from mission-mapped public industry rows.</p>
          </article>
          <article>
            <h3>Density signal</h3>
            <p>Relevant business locations divided by the regional all-industry business base, scaled per 10,000.</p>
          </article>
          <article>
            <h3>Momentum signal</h3>
            <p>Not yet measured until contract, award, press-release, and source-update time series are normalized.</p>
          </article>
          <article>
            <h3>Capability signal</h3>
            <p>A directional composite. It is useful for discovery, not for procurement decisions or classified assessments.</p>
          </article>
          <article>
            <h3>Source coverage</h3>
            <p>The share of applicable evidence layers with measured or Canada-wide public evidence.</p>
          </article>
        </div>
      </section>

      <section className="method-section">
        <h2>Missing-layer states</h2>
        <p>The Atlas avoids vague empty states. Missing information should be labelled by the work still needed.</p>
        <ul className="caveat-list">
          {workflowStates.map((state) => (
            <li key={state}>{state}</li>
          ))}
        </ul>
      </section>

      <section className="method-section">
        <h2>How each capability is matched</h2>
        <p>
          Each selectable capability is mapped to industry codes, public contract keywords, and defence planning
          labels. That mapping tells the Atlas which sources to use for the selected view.
        </p>
        <div className="taxonomy-table">
          {data.missions.map((mission) => (
            <article key={mission.id}>
              <h3>{mission.name}</h3>
              <dl>
                <div><dt>NAICS</dt><dd>{mission.taxonomy.naics.join(", ")}</dd></div>
                <div><dt>Contract keywords</dt><dd>{mission.taxonomy.procurementKeywords.join(", ")}</dd></div>
                <div><dt>DCB labels</dt><dd>{mission.taxonomy.dcbLabels.join(", ")}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="method-section">
        <h2>What this is not</h2>
        <ul className="caveat-list">
          {publicLimits.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
