import { NextResponse } from "next/server";
import { z } from "zod";
import { getAtlasData, getSources } from "@/data/loaders";
import { buildCapabilityMemo, MemoInputError } from "@/lib/memo";

const memoRequestSchema = z.object({
  missionId: z.string().min(1),
  regionId: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = memoRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid memo request." }, { status: 400 });
  }

  try {
    const [data, sources] = await Promise.all([getAtlasData(), getSources()]);
    return NextResponse.json(buildCapabilityMemo(data, sources, parsed.data));
  } catch (error) {
    if (error instanceof MemoInputError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
