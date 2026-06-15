import type { AtlasData, Score } from "@/data/types";
import { getScore, signalLabels } from "@/lib/atlas-utils";

type SignalKey = keyof Score["signals"];

const regionLayout: Record<string, { x: number; y: number; w: number; h: number }> = {
  "CA-YT": { x: 68, y: 52, w: 72, h: 58 },
  "CA-NT": { x: 146, y: 52, w: 88, h: 58 },
  "CA-NU": { x: 242, y: 46, w: 138, h: 64 },
  "CA-BC": { x: 96, y: 176, w: 76, h: 70 },
  "CA-AB": { x: 178, y: 178, w: 72, h: 68 },
  "CA-SK": { x: 256, y: 180, w: 72, h: 66 },
  "CA-MB": { x: 334, y: 184, w: 72, h: 64 },
  "CA-ON": { x: 412, y: 196, w: 112, h: 74 },
  "CA-QC": { x: 532, y: 168, w: 112, h: 78 },
  "CA-NB": { x: 612, y: 260, w: 56, h: 46 },
  "CA-NS": { x: 674, y: 282, w: 58, h: 42 },
  "CA-PE": { x: 674, y: 238, w: 42, h: 30 },
  "CA-NL": { x: 662, y: 122, w: 74, h: 62 },
};

function regionFill(score: number | null, selected: boolean) {
  if (selected) return "var(--red)";
  if (score === null) return "var(--paper)";
  if (score >= 75) return "var(--teal)";
  if (score >= 50) return "var(--green)";
  if (score >= 25) return "var(--yellow)";
  return "var(--paper)";
}

export function StaticSignalMap({
  data,
  missionId,
  signalKey = "readiness",
  selectedRegionId,
}: {
  data: AtlasData;
  missionId: string;
  signalKey?: SignalKey;
  selectedRegionId?: string;
}) {
  const scores = data.scores.filter((score) => score.missionId === missionId);
  const maxScore = Math.max(...scores.map((score) => score.signals[signalKey].normalizedScore ?? 0), 1);

  return (
    <svg className="canada-map" role="img" viewBox="0 0 790 370" aria-label={`${signalLabels[signalKey]} map`}>
      <g transform="matrix(1.15 0 0 1.15 -50 -30)">
        <path className="map-gridline" d="M80 318 C180 292 276 310 364 286 C448 264 546 292 708 240" />
        {data.regions.map((region) => {
          const layout = regionLayout[region.id];
          const score = getScore(data, missionId, region.id);
          if (!layout || !score) return null;
          const value = score.signals[signalKey].normalizedScore;
          const selected = selectedRegionId === region.id;
          const height = Math.max(10, ((value ?? 0) / maxScore) * layout.h);

          return (
            <g key={region.id} className={`map-region ${selected ? "selected" : ""}`}>
              <rect x={layout.x} y={layout.y} width={layout.w} height={layout.h} fill="var(--paper)" stroke="var(--line)" strokeWidth={1.5} />
              <rect
                x={layout.x}
                y={layout.y + layout.h - height}
                width={layout.w}
                height={height}
                fill={regionFill(value, selected)}
                opacity={selected ? 1 : 0.82}
              />
              <text x={layout.x + layout.w / 2} y={layout.y + layout.h / 2 - 1} textAnchor="middle">
                {region.shortName}
              </text>
              <text className="map-score" x={layout.x + layout.w / 2} y={layout.y + layout.h / 2 + 17} textAnchor="middle">
                {value ?? "NA"}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
