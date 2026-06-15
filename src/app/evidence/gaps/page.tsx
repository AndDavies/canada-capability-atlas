import Link from "next/link";
import { FileWarning } from "lucide-react";
import { getAtlasData } from "@/data/loaders";
import { getBriefSlug, getMission, getRegion, missingLayerNames } from "@/lib/atlas-utils";

export default async function EvidenceGapsPage() {
  const data = await getAtlasData();
  const gaps = data.scores.flatMap((score) => {
    const missing = missingLayerNames(score);
    const mission = getMission(data, score.missionId);
    const region = getRegion(data, score.regionId);
    if (!mission || !region || missing.length === 0) return [];
    return [{ score, mission, region, missing }];
  });

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><FileWarning size={13} /> Missing layers</div>
        <h1>What data is missing?</h1>
        <p>
          This report shows capability-region views where sources are identified but the data is not normalized
          into public regional values yet.
        </p>
      </section>

      <section className="method-section">
        <h2>{gaps.length} capability-region views have missing layers</h2>
        <div className="taxonomy-table">
          {gaps.map(({ score, mission, region, missing }) => (
            <article key={`${mission.id}-${region.id}`}>
              <h3>{mission.name} in {region.name}</h3>
              <dl>
                <div><dt>Missing layers</dt><dd>{missing.join(", ")}</dd></div>
                <div><dt>Status</dt><dd>Source identified; raw data not normalized or reviewed into this public view.</dd></div>
                <div>
                  <dt>Evidence brief</dt>
                  <dd><Link href={`/briefs/${getBriefSlug(data, mission.id, region.id)}`}>Open evidence brief</Link></dd>
                </div>
              </dl>
              <p>{score.signals.momentum.caveat}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
