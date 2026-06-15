import Link from "next/link";
import { Scale } from "lucide-react";
import { getAtlasData } from "@/data/loaders";
import { indicatorLabels, indicatorOrder } from "@/lib/atlas-utils";

const layerDescriptions: Record<string, string> = {
  firms: "Relevant business-location counts by province and territory from public industry tables.",
  labour: "Workforce and talent layers. Source identified, but mappings are not normalized yet.",
  rd: "Canada-wide research performer context from public R&D tables.",
  exports: "Trade and export layers. Source identified, but commodity concordance is not normalized yet.",
  procurementSignals: "Tender, award, and contract sources. Regional keyword matching comes after review.",
  infrastructure: "Broadband and energy overlays for northern and remote readiness checks.",
};

export default async function EvidencePage() {
  const data = await getAtlasData();

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><Scale size={13} /> Evidence</div>
        <h1>What the Atlas measures.</h1>
        <p>
          Evidence layers describe the public data behind each capability signal. Some layers are measured
          today; others are source-identified and waiting for normalization or review.
        </p>
      </section>

      <section className="method-grid">
        {indicatorOrder.map((key) => {
          const measuredCount = data.scores.filter(
            (score) => score.indicators[key].status === "measured" || score.indicators[key].status === "national_context_only",
          ).length;

          return (
            <article key={key}>
              <span>{measuredCount} usable views</span>
              <h2>{indicatorLabels[key]}</h2>
              <p>{layerDescriptions[key]}</p>
            </article>
          );
        })}
      </section>

      <section className="method-section">
        <h2>Evidence tools</h2>
        <div className="source-grid">
          <Link className="source-card" href="/evidence/contracts">
            <span>Procurement</span>
            <h2>Contract signal explorer</h2>
            <p>Shows the current CanadaBuys and Open Government source status without fake opportunity scores.</p>
            <small>Source-ready shell</small>
          </Link>
          <Link className="source-card" href="/evidence/gaps">
            <span>Missing layers</span>
            <h2>What data is missing?</h2>
            <p>Review missing layers by capability and region before deciding which ingestion work matters most.</p>
            <small>{data.scores.length} region-capability views</small>
          </Link>
        </div>
      </section>
    </main>
  );
}
