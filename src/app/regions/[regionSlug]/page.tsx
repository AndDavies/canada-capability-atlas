import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPinned } from "lucide-react";
import { getAtlasData } from "@/data/loaders";
import type { Score } from "@/data/types";
import {
  formatSignalValue,
  getBriefSlug,
  getMission,
  getRank,
  getRegionBySlug,
  getScore,
  measuredLayerNames,
  missingLayerNames,
  signalLabels,
} from "@/lib/atlas-utils";

export default async function RegionDetailPage({ params }: { params: Promise<{ regionSlug: string }> }) {
  const { regionSlug } = await params;
  const data = await getAtlasData();
  const region = getRegionBySlug(data, regionSlug);
  if (!region) notFound();

  const scores = data.missions
    .map((mission) => getScore(data, mission.id, region.id))
    .filter((score): score is Score => Boolean(score))
    .toSorted((left, right) => (right.signals.readiness.normalizedScore ?? 0) - (left.signals.readiness.normalizedScore ?? 0));

  const densityOverperformers = scores.filter(
    (score) => getRank(data, score.missionId, region.id, "density") < getRank(data, score.missionId, region.id, "scale"),
  );

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><MapPinned size={13} /> Region</div>
        <h1>{region.name}</h1>
        <p>
          This page shows how {region.name} appears across the Atlas capabilities. Use it to spot measured
          evidence, missing layers, and density signals that may be hidden by national scale rankings.
        </p>
      </section>

      <section className="method-grid">
        {scores.map((score) => {
          const mission = getMission(data, score.missionId);
          if (!mission) return null;
          return (
            <article key={score.missionId}>
              <span className="status-pill measured">{mission.shortName}</span>
              <h2>{mission.name}</h2>
              <p>{signalLabels.readiness}: {formatSignalValue(score.signals.readiness)}</p>
              <p>{signalLabels.scale}: {formatSignalValue(score.signals.scale)}</p>
              <p>{signalLabels.density}: {formatSignalValue(score.signals.density)}</p>
              <Link className="secondary-link" href={`/briefs/${getBriefSlug(data, mission.id, region.id)}`}>
                Evidence brief
              </Link>
            </article>
          );
        })}
      </section>

      <section className="method-section">
        <h2>Where {region.name} overperforms by density</h2>
        {densityOverperformers.length ? (
          <div className="taxonomy-table">
            {densityOverperformers.map((score) => {
              const mission = getMission(data, score.missionId);
              return (
                <article key={score.missionId}>
                  <h3>{mission?.name}</h3>
                  <p>
                    Density rank #{getRank(data, score.missionId, region.id, "density")} compared with scale rank #
                    {getRank(data, score.missionId, region.id, "scale")}. This can indicate concentration even when
                    absolute scale is smaller.
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="empty-state">
            No density overperformance is published for this region yet. That means the measured concentration rank
            does not currently beat the scale rank; it does not prove the capability is absent.
          </p>
        )}
      </section>

      <section className="method-section">
        <h2>Measured and missing layers</h2>
        <div className="taxonomy-table">
          {scores.map((score) => {
            const mission = getMission(data, score.missionId);
            return (
              <article key={score.missionId}>
                <h3>{mission?.name}</h3>
                <dl>
                  <div><dt>Measured or Canada-wide</dt><dd>{measuredLayerNames(score).join(", ") || "Not yet measured"}</dd></div>
                  <div><dt>Missing layers</dt><dd>{missingLayerNames(score).join(", ") || "No applicable v1 missing layers"}</dd></div>
                </dl>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
