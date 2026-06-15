import Link from "next/link";
import { MapPinned } from "lucide-react";
import { getAtlasData } from "@/data/loaders";
import type { Score } from "@/data/types";
import { formatSignalValue, getScore, regionSlug } from "@/lib/atlas-utils";

export default async function RegionsPage() {
  const data = await getAtlasData();

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><MapPinned size={13} /> Regions</div>
        <h1>Compare provinces and territories.</h1>
        <p>
          Region pages show every capability signal for one province or territory, including where the
          region has unusual concentration or stronger source coverage.
        </p>
      </section>

      <section className="source-grid">
        {data.regions.map((region) => {
          const scores = data.missions
            .map((mission) => getScore(data, mission.id, region.id))
            .filter((score): score is Score => Boolean(score));
          const strongest = scores.toSorted((left, right) => (right.signals.readiness.normalizedScore ?? 0) - (left.signals.readiness.normalizedScore ?? 0))[0];
          const strongestMission = strongest ? data.missions.find((mission) => mission.id === strongest.missionId) : null;

          return (
            <Link key={region.id} className="source-card" href={`/regions/${regionSlug(region.name)}`}>
              <span>{region.shortName}</span>
              <h2>{region.name}</h2>
              <p>
                Strongest visible signal: {strongestMission?.name ?? "Not yet measured"}{" "}
                {strongest ? `at ${formatSignalValue(strongest.signals.readiness)}` : ""}
              </p>
              <small>{scores.length} capability signals</small>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
