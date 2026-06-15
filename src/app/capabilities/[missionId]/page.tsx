import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, FileText, Layers3 } from "lucide-react";
import { StaticSignalMap } from "@/components/static-signal-map";
import { getAtlasData } from "@/data/loaders";
import {
  formatSignalValue,
  getBriefSlug,
  getMission,
  getRegion,
  getScore,
  indicatorLabels,
  indicatorOrder,
  rankScores,
  regionSlug,
  signalLabels,
} from "@/lib/atlas-utils";

export default async function CapabilityDetailPage({ params }: { params: Promise<{ missionId: string }> }) {
  const { missionId } = await params;
  const data = await getAtlasData();
  const mission = getMission(data, missionId);
  if (!mission) notFound();

  const featuredRegionId = mission.id === "naval-autonomy" ? "CA-NS" : rankScores(data, mission.id)[0]?.regionId;
  const featuredScore = featuredRegionId ? getScore(data, mission.id, featuredRegionId) : undefined;
  const featuredRegion = featuredScore ? getRegion(data, featuredScore.regionId) : undefined;
  const scaleRanking = rankScores(data, mission.id, "scale").slice(0, 5);
  const densityRanking = rankScores(data, mission.id, "density").slice(0, 5);

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><Layers3 size={13} /> Capability</div>
        <h1>{mission.name}</h1>
        <p>{mission.description}</p>
      </section>

      {featuredScore && featuredRegion ? (
        <section className="method-section feature-section">
          <div className="panel-heading">
            <div>
              <div className="eyebrow"><FileText size={13} /> Featured proof point</div>
              <h2>{mission.name} in {featuredRegion.name}</h2>
            </div>
            <Link className="secondary-link" href={`/briefs/${getBriefSlug(data, mission.id, featuredRegion.id)}`}>
              Open evidence brief
            </Link>
          </div>
          <p>
            This view highlights {featuredRegion.name} as a useful investigation path while keeping Ontario and
            other larger regions visible in scale rankings.
          </p>
          <div className="signal-grid compact-grid">
            {(["scale", "density", "readiness", "evidenceCoverage"] as const).map((key) => (
              <article key={key} className="metric-card">
                <span>{signalLabels[key]}</span>
                <strong>{formatSignalValue(featuredScore.signals[key])}</strong>
                <p>{featuredScore.signals[key].caveat}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="map-and-rank detail-map">
        <div className="map-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">Capability signal map</div>
              <h2>Directional public evidence by region</h2>
            </div>
          </div>
          <StaticSignalMap data={data} missionId={mission.id} signalKey="readiness" selectedRegionId={featuredRegion?.id} />
        </div>
        <div className="ranking-panel">
          <div className="eyebrow"><BarChart3 size={13} /> Evidence layers</div>
          <h2>What this capability uses</h2>
          <div className="taxonomy-table compact-table">
            {indicatorOrder.map((key) => (
              <article key={key}>
                <h3>{indicatorLabels[key]}</h3>
                <p>{featuredScore ? featuredScore.indicators[key].note : "Not yet measured for this capability."}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="method-section">
        <h2>Scale ranking</h2>
        <p>Scale is the absolute relevant business-location base. Larger provinces often rank higher here.</p>
        <div className="rank-list static-rank-list">
          {scaleRanking.map((score, index) => {
            const region = getRegion(data, score.regionId);
            return (
              <Link key={score.regionId} className="rank-row" href={`/regions/${region ? regionSlug(region.name) : score.regionId}`}>
                <span className="rank-index">{index + 1}</span>
                <span className="rank-name">{region?.name}</span>
                <span className="rank-bar"><span style={{ width: `${score.signals.scale.normalizedScore ?? 0}%` }} /></span>
                <span className="rank-score">{score.signals.scale.normalizedScore ?? "NA"}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="method-section">
        <h2>Density ranking</h2>
        <p>Density compares relevant business locations against the regional all-industry business base.</p>
        <div className="rank-list static-rank-list">
          {densityRanking.map((score, index) => {
            const region = getRegion(data, score.regionId);
            return (
              <Link key={score.regionId} className="rank-row" href={`/regions/${region ? regionSlug(region.name) : score.regionId}`}>
                <span className="rank-index">{index + 1}</span>
                <span className="rank-name">{region?.name}</span>
                <span className="rank-bar"><span style={{ width: `${score.signals.density.normalizedScore ?? 0}%` }} /></span>
                <span className="rank-score">{score.signals.density.normalizedScore ?? "NA"}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
