import { describe, expect, it } from "vitest";
import atlasDataJson from "@/data/generated/atlas-data.json";
import sourcesJson from "@/data/generated/sources.json";
import { atlasDataSchema, sourceSchema } from "@/data/types";
import { indicatorOrder } from "@/lib/atlas-utils";

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
});
