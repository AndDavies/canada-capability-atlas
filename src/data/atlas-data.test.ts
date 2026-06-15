import { describe, expect, it } from "vitest";
import atlasDataJson from "@/data/generated/atlas-data.json";
import sourcesJson from "@/data/generated/sources.json";
import { atlasDataSchema, sourceSchema } from "@/data/types";
import { indicatorOrder, signalOrder } from "@/lib/atlas-utils";

describe("generated atlas artifacts", () => {
  const atlasData = atlasDataSchema.parse(atlasDataJson);
  const sources = sourceSchema.array().parse(sourcesJson.sources);
  const sourceIds = new Set(sources.map((source) => source.id));

  it("validates the source catalogue and atlas data", () => {
    expect(atlasData.missions).toHaveLength(3);
    expect(atlasData.regions).toHaveLength(13);
    expect(atlasData.scores).toHaveLength(39);
    expect(sources.length).toBeGreaterThanOrEqual(10);
  });

  it("keeps every score and indicator tied to known sources", () => {
    for (const score of atlasData.scores) {
      expect(score.sourceIds.length).toBeGreaterThan(0);
      for (const sourceId of score.sourceIds) {
        expect(sourceIds.has(sourceId), `${score.missionId}/${score.regionId}/${sourceId}`).toBe(true);
      }

      for (const indicatorKey of indicatorOrder) {
        const indicator = score.indicators[indicatorKey];
        expect(indicator.sourceIds.length, `${score.missionId}/${score.regionId}/${indicatorKey}`).toBeGreaterThan(0);
        for (const sourceId of indicator.sourceIds) {
          expect(sourceIds.has(sourceId), `${score.missionId}/${score.regionId}/${indicatorKey}/${sourceId}`).toBe(true);
        }
      }
    }
  });

  it("uses measured values only where the source layer has been normalized", () => {
    for (const score of atlasData.scores) {
      expect(score.indicators.firms.status).toBe("measured");
      expect(score.indicators.firms.value).not.toBeNull();
      expect(score.indicators.labour.value).toBeNull();
      expect(score.indicators.exports.value).toBeNull();
    }
  });

  it("publishes five explicit signal facets for every score", () => {
    for (const score of atlasData.scores) {
      expect(signalOrder).toEqual(["scale", "density", "momentum", "readiness", "evidenceCoverage"]);

      for (const signalKey of signalOrder) {
        const signal = score.signals[signalKey];
        expect(signal.methodology, `${score.missionId}/${score.regionId}/${signalKey}`).not.toHaveLength(0);
        expect(signal.caveat, `${score.missionId}/${score.regionId}/${signalKey}`).not.toHaveLength(0);

        if (signal.status === "measured" || signal.status === "canada_wide") {
          expect(signal.sourceIds.length, `${score.missionId}/${score.regionId}/${signalKey}`).toBeGreaterThan(0);
          for (const sourceId of signal.sourceIds) {
            expect(sourceIds.has(sourceId), `${score.missionId}/${score.regionId}/${signalKey}/${sourceId}`).toBe(true);
          }
        }
      }
    }
  });

  it("keeps momentum explicitly unmeasured without placeholder numbers", () => {
    for (const score of atlasData.scores) {
      expect(score.signals.momentum.status).toBe("not_yet_measured");
      expect(score.signals.momentum.value).toBeNull();
      expect(score.signals.momentum.normalizedScore).toBeNull();
    }
  });

  it("measures density only when a regional denominator exists", () => {
    for (const score of atlasData.scores) {
      if (score.signals.density.status === "measured") {
        expect(score.signals.density.value).not.toBeNull();
        expect(score.signals.density.sourceIds).toContain("statcan-business-counts-33101095");
      } else {
        expect(score.signals.density.value).toBeNull();
        expect(score.signals.density.normalizedScore).toBeNull();
      }
    }
  });

  it("publishes source-backed evidence items without private rows", () => {
    expect(atlasData.evidenceItems.length).toBeGreaterThan(0);
    for (const item of atlasData.evidenceItems) {
      expect(item.isPublic).toBe(true);
      expect(item.status).toBe("published");
      expect(sourceIds.has(item.sourceIds[0]), item.id).toBe(true);
    }
  });
});
