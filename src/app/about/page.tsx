import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><ShieldCheck size={13} /> About</div>
        <h1>A public map for asking where Canada can build.</h1>
        <p>
          Canada Capability Atlas is an open-source website that gathers public, source-linked evidence about
          Canadian defence and dual-use industrial capacity. It helps users find places and data layers worth
          investigating; it does not claim to be a complete market map or procurement recommendation.
        </p>
      </section>

      <section className="method-grid">
        <article>
          <span>What we do</span>
          <h2>Map public evidence</h2>
          <p>We connect capabilities to public data on business locations, research, contracts, exports, talent, and infrastructure.</p>
        </article>
        <article>
          <span>What users can find</span>
          <h2>Signals and sources</h2>
          <p>Users can compare regions, open evidence briefs, inspect missing layers, and follow source links.</p>
        </article>
        <article>
          <span>What we avoid</span>
          <h2>No unsupported claims</h2>
          <p>The site does not use classified information, private vendor claims, personal contact data, or placeholder metrics.</p>
        </article>
        <article>
          <span>How it improves</span>
          <h2>Review before publishing</h2>
          <p>New company, contract, and news feeds should be parsed, reviewed, and cited before they affect public signals.</p>
        </article>
      </section>

      <section className="method-section">
        <h2>How to use the Atlas</h2>
        <ul className="caveat-list">
          <li>Start with a capability question such as “Where could Canada build naval autonomy?”</li>
          <li>Compare scale and density to distinguish large regions from concentrated smaller regions.</li>
          <li>Open evidence briefs to see measured evidence, missing layers, next investigation steps, and citations.</li>
          <li>Use the Data Library to understand source status and freshness.</li>
        </ul>
      </section>

      <section className="method-section">
        <h2>Independent public resource</h2>
        <p>
          This project is independent and open source. It is not affiliated with Build Canada, the Government
          of Canada, or any source publisher.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" href="/">Explore a capability</Link>
          <Link className="secondary-link" href="/methodology">View the evidence model</Link>
        </div>
      </section>
    </main>
  );
}
