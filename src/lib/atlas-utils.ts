import type { AtlasData, Indicator, Score, ScoreSignal } from "@/data/types";

export const indicatorLabels: Record<keyof Score["indicators"], string> = {
  firms: "Relevant business locations",
  labour: "Workforce data",
  rd: "Research signal",
  exports: "Export data",
  procurementSignals: "Contract signal",
  infrastructure: "Northern infrastructure",
};

export const indicatorOrder = Object.keys(indicatorLabels) as Array<keyof Score["indicators"]>;

export const signalLabels: Record<keyof Score["signals"], string> = {
  scale: "Scale signal",
  density: "Density signal",
  momentum: "Momentum signal",
  readiness: "Capability signal",
  evidenceCoverage: "Source coverage",
};

export const signalOrder = Object.keys(signalLabels) as Array<keyof Score["signals"]>;

export function getMission(data: AtlasData, missionId: string) {
  return data.missions.find((mission) => mission.id === missionId);
}

export function getRegion(data: AtlasData, regionId: string) {
  return data.regions.find((region) => region.id === regionId);
}

export function getScore(data: AtlasData, missionId: string, regionId: string) {
  return data.scores.find((score) => score.missionId === missionId && score.regionId === regionId);
}

export function rankScores(data: AtlasData, missionId: string, signalKey: keyof Score["signals"] = "readiness") {
  return data.scores
    .filter((score) => score.missionId === missionId)
    .toSorted((left, right) => {
      const rightValue = right.signals[signalKey].normalizedScore ?? -1;
      const leftValue = left.signals[signalKey].normalizedScore ?? -1;
      if (rightValue !== leftValue) return rightValue - leftValue;
      return right.readinessScore - left.readinessScore;
    });
}

export function getRank(data: AtlasData, missionId: string, regionId: string, signalKey: keyof Score["signals"] = "readiness") {
  return rankScores(data, missionId, signalKey).findIndex((score) => score.regionId === regionId) + 1;
}

export function measuredIndicators(score: Score) {
  return indicatorOrder.filter((key) => score.indicators[key].status === "measured");
}

export function gapIndicators(score: Score) {
  return indicatorOrder.filter((key) => score.indicators[key].status === "catalogued_not_normalized");
}

export function formatNumber(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Not yet measured";
  return new Intl.NumberFormat("en-CA").format(value);
}

export function formatIndicator(indicator: Indicator) {
  if (indicator.status === "measured") return `${formatNumber(indicator.value)} ${indicator.unit}`;
  if (indicator.status === "national_context_only" && typeof indicator.nationalValue === "number") {
    return `${formatNumber(indicator.nationalValue)} ${indicator.unit} nationally`;
  }
  if (indicator.status === "not_applicable_for_v1") return "Not used for this view";
  return missingLayerLabel(indicator);
}

export function statusLabel(status: Indicator["status"]) {
  switch (status) {
    case "measured":
      return "Measured";
    case "national_context_only":
      return "Canada-wide";
    case "catalogued_not_normalized":
      return "Not yet measured";
    case "not_applicable_for_v1":
      return "Not used here";
  }
}

export function signalStatusLabel(status: ScoreSignal["status"]) {
  switch (status) {
    case "measured":
      return "Measured";
    case "canada_wide":
      return "Canada-wide";
    case "not_yet_measured":
      return "Not yet measured";
    case "not_applicable":
      return "Not applicable";
  }
}

export function formatSignalValue(signal: ScoreSignal) {
  if (typeof signal.value !== "number" || Number.isNaN(signal.value)) return signalStatusLabel(signal.status);
  if (signal.unit.includes("percent")) return `${Math.round(signal.value)}%`;
  if (signal.unit.includes("per 10,000")) return `${signal.value.toLocaleString("en-CA", { maximumFractionDigits: 2 })} per 10k`;
  if (signal.unit.includes("index score")) return `${Math.round(signal.value)}/100`;
  return `${formatNumber(signal.value)} ${signal.unit}`;
}

export function missingLayerLabel(indicator: Indicator) {
  if (indicator.status === "catalogued_not_normalized") return "Source identified; raw data not normalized";
  if (indicator.status === "not_applicable_for_v1") return "Not applicable to this capability";
  return "Not yet measured";
}

export function displayIndicatorNote(key: keyof Score["indicators"], indicator: Indicator) {
  if (indicator.status === "measured") {
    if (key === "firms") return "A public StatCan count for industries that match this capability.";
    return "This public data has been cleaned into a usable number.";
  }

  if (indicator.status === "national_context_only") {
    if (key === "rd") return "A Canada-wide research count. Provincial and territorial splits come later.";
    if (key === "procurementSignals") return "Public contract sources are listed. Regional matching comes later.";
    return "A Canada-wide signal. Regional splits come later.";
  }

  if (indicator.status === "not_applicable_for_v1") return "This data layer is not used for the selected capability yet.";

  if (key === "labour") return "Source identified; workforce mapping is not normalized into regional numbers yet.";
  if (key === "exports") return "Source identified; trade commodity mapping is not normalized into regional numbers yet.";
  if (key === "infrastructure") return "Source identified; broadband and energy overlays are not reviewed into this capability yet.";
  return "Source identified; raw data is not normalized into a usable number yet.";
}

export function scoreTone(score: number) {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  if (score >= 25) return "watch";
  return "low";
}

export function confidenceTone(confidence: Score["confidence"]) {
  if (confidence === "High") return "high";
  if (confidence === "Medium") return "medium";
  return "low";
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function regionSlug(regionName: string) {
  return slugify(regionName);
}

export function getRegionBySlug(data: AtlasData, slug: string) {
  return data.regions.find((region) => regionSlug(region.name) === slug || region.id.toLowerCase() === slug.toLowerCase());
}

export function getBriefSlug(data: AtlasData, missionId: string, regionId: string) {
  const mission = getMission(data, missionId);
  const region = getRegion(data, regionId);
  if (!mission || !region) return "";
  return `${slugify(mission.id)}-${regionSlug(region.name)}`;
}

export function parseBriefSlug(data: AtlasData, slug: string) {
  for (const mission of data.missions) {
    const prefix = `${slugify(mission.id)}-`;
    if (!slug.startsWith(prefix)) continue;
    const region = getRegionBySlug(data, slug.slice(prefix.length));
    if (region) return { missionId: mission.id, regionId: region.id };
  }
  return null;
}

export function measuredLayerNames(score: Score) {
  return indicatorOrder
    .filter((key) => score.indicators[key].status === "measured" || score.indicators[key].status === "national_context_only")
    .map((key) => indicatorLabels[key]);
}

export function missingLayerNames(score: Score) {
  return indicatorOrder
    .filter((key) => score.indicators[key].status === "catalogued_not_normalized")
    .map((key) => indicatorLabels[key]);
}
