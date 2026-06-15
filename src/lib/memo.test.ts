import { describe, expect, it } from "vitest";
import atlasDataJson from "@/data/generated/atlas-data.json";
import sourcesJson from "@/data/generated/sources.json";
import { atlasDataSchema, sourceSchema } from "@/data/types";
import { buildCapabilityMemo, MemoInputError } from "@/lib/memo";

const atlasData = atlasDataSchema.parse(atlasDataJson);
const sources = sourceSchema.array().parse(sourcesJson.sources);

describe("capability memo builder", () => {
  it("returns cited deterministic memo content for supported mission and region", () => {
    const memo = buildCapabilityMemo(atlasData, sources, {
      missionId: "arctic-isr-drones",
      regionId: "CA-ON",
    });

    expect(memo.title).toContain("Ontario");
    expect(memo.summary).toContain("Arctic ISR Drones");
    expect(memo.findings.length).toBeGreaterThanOrEqual(4);
    expect(memo.citations.length).toBeGreaterThan(0);
    expect(memo.caveats.some((caveat) => caveat.includes("curated retrieved facts"))).toBe(true);
  });

  it("refuses unsupported missions and regions", () => {
    expect(() =>
      buildCapabilityMemo(atlasData, sources, {
        missionId: "unsupported",
        regionId: "CA-ON",
      }),
    ).toThrow(MemoInputError);

    expect(() =>
      buildCapabilityMemo(atlasData, sources, {
        missionId: "arctic-isr-drones",
        regionId: "CA-XX",
      }),
    ).toThrow(MemoInputError);
  });
});
