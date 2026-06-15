import type { AtlasData, Indicator, Score } from "@/data/types";

export const indicatorLabels: Record<keyof Score["indicators"], string> = {
  firms: "Firm base",
  labour: "Labour depth",
  rd: "R&D context",
  exports: "Export signal",
  procurementSignals: "Demand signal",
  infrastructure: "Infrastructure",
};

export const indicatorOrder = Object.keys(indicatorLabels) as Array<keyof Score["indicators"]>;

export function getMission(data: AtlasData, missionId: string) {
  return data.missions.find((mission) => mission.id === missionId);
}

export function getRegion(data: AtlasData, regionId: string) {
  return data.regions.find((region) => region.id === regionId);
}

export function getScore(data: AtlasData, missionId: string, regionId: string) {
  return data.scores.find((score) => score.missionId === missionId && score.regionId === regionId);
}

export function rankScores(data: AtlasData, missionId: string) {
  return data.scores
    .filter((score) => score.missionId === missionId)
    .toSorted((left, right) => right.readinessScore - left.readinessScore);
}

export function getRank(data: AtlasData, missionId: string, regionId: string) {
  return rankScores(data, missionId).findIndex((score) => score.regionId === regionId) + 1;
}

export function measuredIndicators(score: Score) {
  return indicatorOrder.filter((key) => score.indicators[key].status === "measured");
}

export function gapIndicators(score: Score) {
  return indicatorOrder.filter((key) => score.indicators[key].status === "catalogued_not_normalized");
}

export function formatNumber(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "Not yet available";
  return new Intl.NumberFormat("en-CA").format(value);
}

export function formatIndicator(indicator: Indicator) {
  if (indicator.status === "measured") return `${formatNumber(indicator.value)} ${indicator.unit}`;
  if (indicator.status === "national_context_only" && typeof indicator.nationalValue === "number") {
    return `${formatNumber(indicator.nationalValue)} ${indicator.unit} nationally`;
  }
  if (indicator.status === "not_applicable_for_v1") return "Not applicable in v1";
  return "Not yet available";
}

export function statusLabel(status: Indicator["status"]) {
  switch (status) {
    case "measured":
      return "Measured";
    case "national_context_only":
      return "National context";
    case "catalogued_not_normalized":
      return "Source gap";
    case "not_applicable_for_v1":
      return "Not in v1";
  }
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
