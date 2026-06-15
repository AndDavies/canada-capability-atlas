import type { AtlasData, Source } from "@/data/types";
import { formatIndicator, getMission, getRank, getRegion, getScore, indicatorLabels, indicatorOrder } from "@/lib/atlas-utils";

export type MemoRequest = {
  missionId: string;
  regionId: string;
};

export type MemoCitation = Pick<Source, "id" | "title" | "publisher" | "url" | "tier">;

export type CapabilityMemo = {
  missionId: string;
  regionId: string;
  title: string;
  generatedAt: string;
  confidence: "Low" | "Medium" | "High";
  rank: number;
  summary: string;
  findings: string[];
  caveats: string[];
  citations: MemoCitation[];
};

export class MemoInputError extends Error {
  status = 400;
}

export function buildCapabilityMemo(data: AtlasData, sources: Source[], request: MemoRequest): CapabilityMemo {
  const mission = getMission(data, request.missionId);
  if (!mission) throw new MemoInputError(`Unsupported mission: ${request.missionId}`);

  const region = getRegion(data, request.regionId);
  if (!region) throw new MemoInputError(`Unsupported region: ${request.regionId}`);

  const score = getScore(data, mission.id, region.id);
  if (!score) throw new MemoInputError(`No score exists for ${mission.id} in ${region.id}`);

  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const citationIds = new Set<string>(score.sourceIds);
  for (const key of indicatorOrder) {
    score.indicators[key].sourceIds.forEach((sourceId) => citationIds.add(sourceId));
  }

  const citations = [...citationIds]
    .map((sourceId) => sourceMap.get(sourceId))
    .filter((source): source is Source => Boolean(source))
    .map(({ id, title, publisher, url, tier }) => ({ id, title, publisher, url, tier }));

  const rank = getRank(data, mission.id, region.id);
  const firmSignal = formatIndicator(score.indicators.firms);
  const rdSignal = formatIndicator(score.indicators.rd);
  const gaps = indicatorOrder
    .filter((key) => score.indicators[key].status === "catalogued_not_normalized")
    .map((key) => indicatorLabels[key].toLowerCase());

  return {
    missionId: mission.id,
    regionId: region.id,
    title: `${region.name} summary: ${mission.name}`,
    generatedAt: data.generatedAt,
    confidence: score.confidence,
    rank,
    summary: `${region.name} ranks #${rank} of ${data.regions.length} for ${mission.name}. Its public evidence score is ${score.readinessScore}/100. The clearest measured number right now is ${firmSignal}; the research signal is ${rdSignal}.`,
    findings: [
      `Capability need: ${mission.description}`,
      `Company and site count: ${firmSignal}.`,
      `Research signal: ${rdSignal}.`,
      gaps.length > 0
        ? `Still being cleaned: ${gaps.join(", ")} have source links, but are not ready for regional numbers yet.`
        : "All v1 indicator layers used by the selected mission are either measured or national-context signals.",
      "This brief only uses cited public sources. It does not infer classified, private, or vendor-confidential information.",
    ],
    caveats: [
      ...data.methodology.caveats,
      "This summary uses only stored public-source facts from the Atlas database or JSON fallback.",
      "Low or medium confidence means the public data is incomplete, not that the real-world capability is weak.",
    ],
    citations,
  };
}
