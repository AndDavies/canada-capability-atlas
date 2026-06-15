import type { AtlasData, Source } from "@/data/types";
import {
  formatIndicator,
  formatSignalValue,
  getBriefSlug,
  getMission,
  getRank,
  getRegion,
  getScore,
  indicatorOrder,
  measuredLayerNames,
  missingLayerNames,
} from "@/lib/atlas-utils";

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

export type EvidenceBrief = {
  missionId: string;
  regionId: string;
  slug: string;
  title: string;
  generatedAt: string;
  artifactVersion: string;
  confidence: "Low" | "Medium" | "High";
  rank: number;
  summary: string;
  signalSummary: {
    scale: string;
    density: string;
    readiness: string;
    evidenceCoverage: string;
    momentum: string;
  };
  measuredEvidence: string[];
  missingLayers: string[];
  nextInvestigation: string[];
  caveats: string[];
  citations: MemoCitation[];
};

export class MemoInputError extends Error {
  status = 400;
}

function getBriefInputs(data: AtlasData, sources: Source[], request: MemoRequest) {
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
  for (const key of Object.keys(score.signals) as Array<keyof typeof score.signals>) {
    score.signals[key].sourceIds.forEach((sourceId) => citationIds.add(sourceId));
  }
  for (const item of data.evidenceItems.filter(
    (evidenceItem) =>
      evidenceItem.capabilityId === mission.id && (evidenceItem.regionId === region.id || evidenceItem.regionId === null),
  )) {
    item.sourceIds.forEach((sourceId) => citationIds.add(sourceId));
  }

  const citations = [...citationIds]
    .map((sourceId) => sourceMap.get(sourceId))
    .filter((source): source is Source => Boolean(source))
    .map(({ id, title, publisher, url, tier }) => ({ id, title, publisher, url, tier }));

  const rank = getRank(data, mission.id, region.id);
  return { mission, region, score, citations, rank };
}

export function buildEvidenceBrief(data: AtlasData, sources: Source[], request: MemoRequest): EvidenceBrief {
  const { mission, region, score, citations, rank } = getBriefInputs(data, sources, request);
  const firmSignal = formatIndicator(score.indicators.firms);
  const rdSignal = formatIndicator(score.indicators.rd);
  const missingLayers = missingLayerNames(score);
  const evidenceItems = data.evidenceItems.filter(
    (evidenceItem) =>
      evidenceItem.capabilityId === mission.id &&
      evidenceItem.isPublic &&
      evidenceItem.status === "published" &&
      (evidenceItem.regionId === region.id || evidenceItem.regionId === null),
  );
  const measuredEvidence = evidenceItems.length
    ? evidenceItems.map((item) => `${item.title}: ${item.value === null ? item.description : `${item.value.toLocaleString("en-CA")} ${item.unit ?? ""}`.trim()}.`)
    : measuredLayerNames(score).map((layer) => `${layer} has usable public evidence in this view.`);

  return {
    missionId: mission.id,
    regionId: region.id,
    slug: getBriefSlug(data, mission.id, region.id),
    title: `${mission.name} in ${region.name}`,
    generatedAt: data.generatedAt,
    artifactVersion: data.methodology.version,
    confidence: score.confidence,
    rank,
    summary: `${region.name} ranks #${rank} of ${data.regions.length} for ${mission.name} on the directional capability signal. The clearest measured regional evidence is ${firmSignal}; the research signal is ${rdSignal}.`,
    signalSummary: {
      scale: formatSignalValue(score.signals.scale),
      density: formatSignalValue(score.signals.density),
      readiness: formatSignalValue(score.signals.readiness),
      evidenceCoverage: formatSignalValue(score.signals.evidenceCoverage),
      momentum: formatSignalValue(score.signals.momentum),
    },
    measuredEvidence,
    missingLayers,
    nextInvestigation: [
      `Review company, institution, and project pages that mention ${mission.taxonomy.procurementKeywords.slice(0, 4).join(", ")} in ${region.name}.`,
      "Normalize CanadaBuys and proactive contract notices into reviewed region/capability evidence items before scoring momentum.",
      missingLayers.length > 0
        ? `Prioritize missing layers: ${missingLayers.join(", ")}.`
        : "Audit the measured layers for source freshness and false positives before using the signal in decisions.",
    ],
    caveats: [
      ...data.methodology.caveats,
      score.signals.scale.caveat,
      score.signals.readiness.caveat,
      "This evidence brief uses only stored public-source facts from the Atlas database or JSON fallback.",
      "Low or medium confidence means the public data is incomplete, not that the real-world capability is weak.",
    ],
    citations,
  };
}

export function buildCapabilityMemo(data: AtlasData, sources: Source[], request: MemoRequest): CapabilityMemo {
  const brief = buildEvidenceBrief(data, sources, request);
  const missingLayers = brief.missingLayers.map((layer) => layer.toLowerCase());

  return {
    missionId: brief.missionId,
    regionId: brief.regionId,
    title: `${brief.title} evidence brief`,
    generatedAt: brief.generatedAt,
    confidence: brief.confidence,
    rank: brief.rank,
    summary: brief.summary,
    findings: [
      `Capability need: ${getMission(data, brief.missionId)?.description ?? brief.missionId}`,
      `Scale signal: ${brief.signalSummary.scale}.`,
      `Density signal: ${brief.signalSummary.density}.`,
      `Source coverage: ${brief.signalSummary.evidenceCoverage}.`,
      missingLayers.length > 0
        ? `Missing layers: ${missingLayers.join(", ")} are source-identified but not normalized or reviewed into this view yet.`
        : "All applicable v1 layers are either measured or provide Canada-wide public context.",
      "This evidence brief only uses cited public sources. It does not infer classified, private, or vendor-confidential information.",
    ],
    caveats: brief.caveats,
    citations: brief.citations,
  };
}

export function evidenceBriefToMarkdown(brief: EvidenceBrief) {
  const citations = brief.citations
    .map((citation) => `- [${citation.title}](${citation.url}) - ${citation.publisher}, Tier ${citation.tier}`)
    .join("\n");

  return [
    `# ${brief.title}`,
    "",
    brief.summary,
    "",
    "## Capability Signals",
    `- Scale: ${brief.signalSummary.scale}`,
    `- Density: ${brief.signalSummary.density}`,
    `- Capability signal: ${brief.signalSummary.readiness}`,
    `- Source coverage: ${brief.signalSummary.evidenceCoverage}`,
    `- Momentum: ${brief.signalSummary.momentum}`,
    "",
    "## Measured Evidence",
    ...brief.measuredEvidence.map((item) => `- ${item}`),
    "",
    "## Missing Layers",
    ...(brief.missingLayers.length ? brief.missingLayers.map((item) => `- ${item}`) : ["- No applicable v1 missing layers."]),
    "",
    "## Next Investigation",
    ...brief.nextInvestigation.map((item) => `- ${item}`),
    "",
    "## Caveats",
    ...brief.caveats.map((item) => `- ${item}`),
    "",
    "## Citations",
    citations,
    "",
    `Generated from artifact version ${brief.artifactVersion} at ${brief.generatedAt}.`,
  ].join("\n");
}
