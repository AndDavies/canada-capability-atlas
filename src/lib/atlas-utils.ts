import type { AtlasData, Indicator, Score } from "@/data/types";

export const indicatorLabels: Record<keyof Score["indicators"], string> = {
  firms: "Companies and sites",
  labour: "Workforce",
  rd: "Research",
  exports: "Exports",
  procurementSignals: "Contracts",
  infrastructure: "Northern basics",
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
  if (typeof value !== "number" || Number.isNaN(value)) return "Data not ready yet";
  return new Intl.NumberFormat("en-CA").format(value);
}

export function formatIndicator(indicator: Indicator) {
  if (indicator.status === "measured") return `${formatNumber(indicator.value)} ${indicator.unit}`;
  if (indicator.status === "national_context_only" && typeof indicator.nationalValue === "number") {
    return `${formatNumber(indicator.nationalValue)} ${indicator.unit} nationally`;
  }
  if (indicator.status === "not_applicable_for_v1") return "Not applicable in v1";
  return "Data not ready yet";
}

export function statusLabel(status: Indicator["status"]) {
  switch (status) {
    case "measured":
      return "Ready";
    case "national_context_only":
      return "Canada-wide";
    case "catalogued_not_normalized":
      return "Not ready";
    case "not_applicable_for_v1":
      return "Not used";
  }
}

export function displayIndicatorNote(key: keyof Score["indicators"], indicator: Indicator) {
  if (indicator.status === "measured") {
    if (key === "firms") return "Public StatCan company/site count for selected industries.";
    return "Cleaned public data is ready for this number.";
  }

  if (indicator.status === "national_context_only") {
    if (key === "rd") return "Canada-wide research count. Regional split comes later.";
    if (key === "procurementSignals") return "Public contract sources are listed. Regional matching comes later.";
    return "Canada-wide signal. Regional split comes later.";
  }

  if (indicator.status === "not_applicable_for_v1") return "This layer is not used for this search area yet.";

  if (key === "labour") return "Workforce source is listed, but not cleaned into regional numbers yet.";
  if (key === "exports") return "Trade source is listed, but not cleaned into regional numbers yet.";
  if (key === "infrastructure") return "Broadband and energy sources are listed for future northern checks.";
  return "Source is listed, but not cleaned into a usable number yet.";
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
