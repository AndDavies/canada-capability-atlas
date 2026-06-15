import { BarChart3, Database, FileWarning, RefreshCw } from "lucide-react";
import { getAtlasData } from "@/data/loaders";

const publicLimits = [
  "Scores show public evidence, not procurement advice.",
  "The Atlas does not use classified, private, or vendor-confidential information.",
  "Companies, press releases, and contract notices only appear after real source rows are added.",
  "A blank or zero feed means no reviewed rows are stored yet, not that activity does not exist.",
];

export default async function MethodologyPage() {
  const data = await getAtlasData();

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><BarChart3 size={13} /> Methodology</div>
        <h1>How the Atlas turns public data into useful lists.</h1>
        <p>We collect public sources, clean the parts we can trust, and show where the evidence is strongest. If a source is not ready for a number yet, we label it clearly.</p>
      </section>

      <section className="method-grid">
        <article>
          <Database size={19} />
          <h2>Trusted sources</h2>
          <p>Numbers on the site start with official or durable public sources. A source can be listed before it is cleaned, but it cannot become a score until the mapping is clear.</p>
        </article>
        <article>
          <BarChart3 size={19} />
          <h2>Strength score</h2>
          <p>The current score combines provincial company/site counts, Canada-wide research context, and source coverage. It is a public evidence score, not a claim about classified capacity.</p>
        </article>
        <article>
          <FileWarning size={19} />
          <h2>Data gaps</h2>
          <p>Workforce, exports, contracts, broadband, and energy layers only appear as numbers after they are cleaned. Until then, the site says “Data not ready yet.”</p>
        </article>
        <article>
          <RefreshCw size={19} />
          <h2>Update cadence</h2>
          <p>Supabase is now the main database. JSON exports remain in the repo so the public data can still be reviewed and rebuilt.</p>
        </article>
      </section>

      <section className="method-section">
        <h2>Search area mapping</h2>
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
        <h2>Limits</h2>
        <ul className="caveat-list">
          {publicLimits.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
