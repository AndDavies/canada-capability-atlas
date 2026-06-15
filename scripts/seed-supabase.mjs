import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

function loadLocalEnv() {
  const envPath = join(root, ".env.local");
  try {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const equalsIndex = trimmed.indexOf("=");
      if (equalsIndex === -1) continue;
      const key = trimmed.slice(0, equalsIndex);
      const value = trimmed.slice(equalsIndex + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local is optional in CI.
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

async function upsertOrThrow(supabase, table, rows, onConflict) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`Seeded ${rows.length} ${table} rows`);
}

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or SUPABASE_SERVICE_ROLE_KEY.");
}

const globalHeaders = process.env.ATLAS_SEED_TOKEN
  ? { "x-atlas-seed-token": process.env.ATLAS_SEED_TOKEN }
  : undefined;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: globalHeaders ? { headers: globalHeaders } : undefined,
});

const atlasData = readJson("src/data/generated/atlas-data.json");
const sourceData = readJson("src/data/generated/sources.json");

const plainSummaries = {
  "arctic-isr-drones":
    "Find public evidence of Canadian drone, sensor, satellite, and Arctic monitoring capacity.",
  "secure-communications":
    "Find companies, contracts, and research signals connected to secure networks, cyber tools, cloud, chips, and command systems.",
  "naval-autonomy":
    "Find public evidence for autonomous ships, underwater systems, naval sensors, and marine engineering.",
};

function documentTypeForSource(sourceType) {
  if (sourceType.includes("csv") || sourceType.includes("dataset") || sourceType.includes("geodata")) return "dataset";
  return "source_page";
}

const sources = sourceData.sources.map((source) => ({
  id: source.id,
  title: source.title,
  publisher: source.publisher,
  url: source.url,
  source_type: source.sourceType,
  tier: source.tier,
  cadence: source.cadence,
  use_text: source.use,
}));

const documents = sourceData.sources.map((source) => ({
  source_id: source.id,
  title: source.title,
  url: source.url,
  publisher: source.publisher,
  document_type: documentTypeForSource(source.sourceType),
  summary: source.use,
  content_hash: source.id,
  status: "published",
  is_public: true,
  metadata: { seededFrom: "source_catalogue", generatedAt: sourceData.generatedAt },
}));

const regions = atlasData.regions.map((region) => ({
  id: region.id,
  name: region.name,
  short_name: region.shortName,
  dguid: region.dguid,
}));

const capabilityAreas = atlasData.missions.map((mission) => ({
  id: mission.id,
  name: mission.name,
  short_name: mission.shortName,
  description: mission.description,
  plain_language_summary: plainSummaries[mission.id] ?? mission.description,
  source_ids: mission.sourceIds,
  taxonomy: mission.taxonomy,
  weights: mission.weights,
  national_signals: mission.nationalSignals,
  national_metrics: mission.nationalMetrics,
  is_public: true,
}));

const regionScores = atlasData.scores.map((score) => ({
  capability_area_id: score.missionId,
  region_id: score.regionId,
  strength_score: score.readinessScore,
  confidence: score.confidence,
  source_ids: score.sourceIds,
  indicators: score.indicators,
  generated_at: atlasData.generatedAt,
}));

await upsertOrThrow(supabase, "sources", sources, "id");
await upsertOrThrow(supabase, "documents", documents, "url");
await upsertOrThrow(supabase, "regions", regions, "id");
await upsertOrThrow(supabase, "capability_areas", capabilityAreas, "id");
await upsertOrThrow(supabase, "region_scores", regionScores, "capability_area_id,region_id");
