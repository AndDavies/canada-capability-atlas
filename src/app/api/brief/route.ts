import { NextResponse } from "next/server";
import { z } from "zod";
import { getAtlasData, getSources } from "@/data/loaders";
import { buildEvidenceBrief, evidenceBriefToMarkdown, MemoInputError } from "@/lib/memo";

const briefRequestSchema = z.object({
  missionId: z.string().min(1),
  regionId: z.string().min(1),
  format: z.enum(["json", "markdown"]).default("json"),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = briefRequestSchema.safeParse({
    missionId: url.searchParams.get("missionId"),
    regionId: url.searchParams.get("regionId"),
    format: url.searchParams.get("format") ?? "json",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid brief request." }, { status: 400 });
  }

  try {
    const [data, sources] = await Promise.all([getAtlasData(), getSources()]);
    const brief = buildEvidenceBrief(data, sources, parsed.data);

    if (parsed.data.format === "markdown") {
      return new Response(evidenceBriefToMarkdown(brief), {
        headers: { "content-type": "text/markdown; charset=utf-8" },
      });
    }

    return NextResponse.json(brief);
  } catch (error) {
    if (error instanceof MemoInputError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
