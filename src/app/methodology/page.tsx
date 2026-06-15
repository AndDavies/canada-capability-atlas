import { BarChart3, Database, FileWarning, RefreshCw } from "lucide-react";
import { getAtlasData } from "@/data/loaders";

const publicLimits = [
  "The score shows public evidence. It is not procurement advice or a complete market map.",
  "The Atlas does not use classified, private, or vendor-confidential information.",
  "Companies, press releases, and contract notices appear only after real source rows are added and reviewed.",
  "A zero feed means no reviewed rows are stored yet. It does not prove that no activity exists.",
];

export default async function MethodologyPage() {
  const data = await getAtlasData();

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><BarChart3 size={13} /> How it works</div>
        <h1>How to read the Atlas.</h1>
        <p>
          The Atlas starts with public sources, cleans the parts that can be compared, and shows where the
          visible evidence is strongest. If a source has not been cleaned into a number yet, the site says so.
        </p>
      </section>

      <section className="method-grid">
        <article>
          <Database size={19} />
          <h2>What counts as evidence</h2>
          <p>Numbers start with official or durable public sources. A source can be listed before it is cleaned, but it cannot become a score until the mapping is clear.</p>
        </article>
        <article>
          <BarChart3 size={19} />
          <h2>What the score means</h2>
          <p>The score combines cleaned company/site counts, Canada-wide research context, and source coverage. It is a public evidence score, not a claim about classified capacity.</p>
        </article>
        <article>
          <FileWarning size={19} />
          <h2>Why data can be missing</h2>
          <p>Workforce, export, contract, broadband, and energy layers only appear as numbers after they are cleaned. Until then, the site says “Data not ready yet.”</p>
        </article>
        <article>
          <RefreshCw size={19} />
          <h2>How updates work</h2>
          <p>Supabase is the main database. JSON exports stay in the repo so the public data can be reviewed, rebuilt, and audited.</p>
        </article>
      </section>

      <section className="method-section">
        <h2>How each capability need is matched</h2>
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
