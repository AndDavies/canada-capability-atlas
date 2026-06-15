import { describe, expect, it } from "vitest";
import atlasDataJson from "@/data/generated/atlas-data.json";
import sourcesJson from "@/data/generated/sources.json";
import { atlasDataSchema, sourceSchema } from "@/data/types";
import { buildCapabilityMemo, buildEvidenceBrief, evidenceBriefToMarkdown, MemoInputError } from "@/lib/memo";

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
    expect(memo.caveats.some((caveat) => caveat.includes("stored public-source facts"))).toBe(true);
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

  it("returns a cited evidence brief with missing layers and artifact metadata", () => {
    const brief = buildEvidenceBrief(atlasData, sources, {
      missionId: "naval-autonomy",
      regionId: "CA-NS",
    });

    expect(brief.slug).toBe("naval-autonomy-nova-scotia");
    expect(brief.title).toContain("Naval Autonomy");
    expect(brief.title).toContain("Nova Scotia");
    expect(brief.signalSummary.momentum).toBe("Not yet measured");
    expect(brief.missingLayers.length).toBeGreaterThan(0);
    expect(brief.citations.length).toBeGreaterThan(0);
    expect(brief.artifactVersion).toBe(atlasData.methodology.version);
  });

  it("serializes evidence briefs to cited markdown", () => {
    const brief = buildEvidenceBrief(atlasData, sources, {
      missionId: "naval-autonomy",
      regionId: "CA-NS",
    });
    const markdown = evidenceBriefToMarkdown(brief);

    expect(markdown).toContain("# Naval Autonomy in Nova Scotia");
    expect(markdown).toContain("## Citations");
    expect(markdown).toContain("Generated from artifact version");
  });
});
