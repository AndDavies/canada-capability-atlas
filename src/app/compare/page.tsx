import Link from "next/link";
import { GitCompare } from "lucide-react";
import { getAtlasData, getSources } from "@/data/loaders";
import { buildEvidenceBrief, MemoInputError } from "@/lib/memo";
import {
  formatSignalValue,
  getBriefSlug,
  getMission,
  getRegion,
  getScore,
  measuredLayerNames,
  missingLayerNames,
  signalLabels,
} from "@/lib/atlas-utils";

function firstParam(value: string | string[] | undefined, fallback: string) {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const missionId = firstParam(params.mission, "naval-autonomy");
  const a = firstParam(params.a, "CA-NS");
  const b = firstParam(params.b, "CA-ON");
  const [data, sources] = await Promise.all([getAtlasData(), getSources()]);
  const mission = getMission(data, missionId);
  const leftRegion = getRegion(data, a);
  const rightRegion = getRegion(data, b);
  const leftScore = mission && leftRegion ? getScore(data, mission.id, leftRegion.id) : undefined;
  const rightScore = mission && rightRegion ? getScore(data, mission.id, rightRegion.id) : undefined;

  if (!mission || !leftRegion || !rightRegion || !leftScore || !rightScore) {
    return (
      <main className="content-page">
        <section className="page-hero">
          <div className="eyebrow"><GitCompare size={13} /> Compare</div>
          <h1>Unsupported comparison.</h1>
          <p>Compare mode refuses unsupported missions or regions instead of creating placeholder rows.</p>
        </section>
      </main>
    );
  }

  let leftBrief = null;
  let rightBrief = null;
  try {
    leftBrief = buildEvidenceBrief(data, sources, { missionId: mission.id, regionId: leftRegion.id });
    rightBrief = buildEvidenceBrief(data, sources, { missionId: mission.id, regionId: rightRegion.id });
  } catch (error) {
    if (!(error instanceof MemoInputError)) throw error;
  }

  return (
    <main className="content-page">
      <section className="page-hero">
        <div className="eyebrow"><GitCompare size={13} /> Compare</div>
        <h1>{leftRegion.name} vs. {rightRegion.name}</h1>
        <p>
          Compare {mission.name} signals across two regions. This view shows scale, density, directional
          capability signal, source coverage, measured layers, missing layers, and citations.
        </p>
      </section>

      <section className="compare-grid">
        {[leftScore, rightScore].map((score) => {
          const region = getRegion(data, score.regionId);
          if (!region) return null;
          return (
            <article key={region.id} className="method-section compare-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">{region.shortName}</div>
                  <h2>{region.name}</h2>
                </div>
                <Link className="secondary-link" href={`/briefs/${getBriefSlug(data, mission.id, region.id)}`}>
                  Evidence brief
                </Link>
              </div>
              <dl className="compare-list">
                {(["scale", "density", "readiness", "evidenceCoverage", "momentum"] as const).map((key) => (
                  <div key={key}>
                    <dt>{signalLabels[key]}</dt>
                    <dd>{formatSignalValue(score.signals[key])}</dd>
                  </div>
                ))}
                <div>
                  <dt>Measured layers</dt>
                  <dd>{measuredLayerNames(score).join(", ") || "Not yet measured"}</dd>
                </div>
                <div>
                  <dt>Missing layers</dt>
                  <dd>{missingLayerNames(score).join(", ") || "No applicable v1 missing layers"}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </section>

      <section className="method-section">
        <h2>Citations</h2>
        <div className="source-grid">
          {[...(leftBrief?.citations ?? []), ...(rightBrief?.citations ?? [])]
            .filter((citation, index, citations) => citations.findIndex((item) => item.id === citation.id) === index)
            .map((citation) => (
              <a key={citation.id} className="source-card" href={citation.url} target="_blank" rel="noreferrer">
                <span>Tier {citation.tier}</span>
                <h2>{citation.title}</h2>
                <p>{citation.publisher}</p>
                <small>{citation.id}</small>
              </a>
            ))}
        </div>
      </section>
    </main>
  );
}
