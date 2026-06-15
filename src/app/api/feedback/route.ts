import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

const feedbackSchema = z.object({
  feedbackType: z.enum(["relevance", "bad_match", "useful_source", "false_positive", "missing_source"]),
  message: z.string().min(3).max(2000),
  pagePath: z.string().max(300).optional(),
  missionId: z.string().max(80).optional(),
  regionId: z.string().max(20).optional(),
  evidenceItemId: z.string().max(140).optional(),
  honeypot: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid feedback request." }, { status: 400 });
  }

  if (parsed.data.honeypot) {
    return NextResponse.json({ ok: true });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Feedback storage is not configured." }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.schema("atlas_private").from("feedback").insert({
    feedback_type: parsed.data.feedbackType,
    message: parsed.data.message,
    page_path: parsed.data.pagePath ?? null,
    capability_area_id: parsed.data.missionId ?? null,
    region_id: parsed.data.regionId ?? null,
    evidence_item_id: parsed.data.evidenceItemId ?? null,
    user_agent: request.headers.get("user-agent"),
    metadata: { submittedFrom: "public_server_route" },
  });

  if (error) {
    return NextResponse.json({ error: "Feedback could not be stored." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
