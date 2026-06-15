import Link from "next/link";
import { FileText } from "lucide-react";
import { getAtlasData } from "@/data/loaders";
import { getBriefSlug } from "@/lib/atlas-utils";

export default async function BriefsIndexPage() {
  const data = await getAtlasData();

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><FileText size={13} /> Evidence briefs</div>
        <h1>Shareable source-backed briefs.</h1>
        <p>
          Evidence briefs turn one capability-region pair into a short page with measured evidence, missing
          layers, next investigation steps, caveats, and citations.
        </p>
      </section>

      <section className="source-grid">
        {data.scores.map((score) => {
          const mission = data.missions.find((item) => item.id === score.missionId);
          const region = data.regions.find((item) => item.id === score.regionId);
          if (!mission || !region) return null;
          return (
            <Link key={`${mission.id}-${region.id}`} className="source-card" href={`/briefs/${getBriefSlug(data, mission.id, region.id)}`}>
              <span>{mission.shortName} / {region.shortName}</span>
              <h2>{mission.name} in {region.name}</h2>
              <p>{score.signals.readiness.caveat}</p>
              <small>{score.confidence} confidence</small>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
