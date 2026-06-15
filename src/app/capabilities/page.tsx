import Link from "next/link";
import { Layers3 } from "lucide-react";
import { getAtlasData } from "@/data/loaders";
import { formatSignalValue, getRegion, rankScores, signalLabels } from "@/lib/atlas-utils";

export default async function CapabilitiesPage() {
  const data = await getAtlasData();

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><Layers3 size={13} /> Capabilities</div>
        <h1>Choose a capability question.</h1>
        <p>
          Each capability maps a practical defence or dual-use need to public industry, research, contract,
          export, and infrastructure evidence. Start here when you know the problem area but not the region.
        </p>
      </section>

      <section className="method-grid">
        {data.missions.map((mission) => {
          const topScore = rankScores(data, mission.id)[0];
          const topRegion = topScore ? getRegion(data, topScore.regionId) : null;

          return (
            <Link key={mission.id} className="source-card" href={`/capabilities/${mission.id}`}>
              <span>{mission.shortName}</span>
              <h2>{mission.name}</h2>
              <p>{mission.description}</p>
              <p>
                Top capability signal: {topRegion?.name ?? "Not yet measured"}{" "}
                {topScore ? `at ${formatSignalValue(topScore.signals.readiness)}` : ""}
              </p>
              <small>{signalLabels.scale}, {signalLabels.density}, {signalLabels.evidenceCoverage}</small>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
