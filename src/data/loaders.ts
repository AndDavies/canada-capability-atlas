import "server-only";

import { createClient } from "@supabase/supabase-js";
import atlasDataJson from "@/data/generated/atlas-data.json";
import sourcesJson from "@/data/generated/sources.json";
import { atlasDataSchema, evidenceItemSchema, sourceSchema, type AtlasData, type EvidenceItem, type Source } from "@/data/types";

type SourceRow = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  source_type: string;
  tier: number;
  cadence: string;
  use_text: string;
  freshness_status: "current" | "stale" | "unknown" | "not_checked" | null;
  last_checked_at: string | null;
  license_note: string | null;
  public_use_status: "allowed" | "restricted" | "unknown" | null;
};

type RegionRow = {
  id: string;
  name: string;
  short_name: string;
  dguid: string;
};

type CapabilityAreaRow = {
  id: string;
  name: string;
  short_name: string;
  description: string;
  source_ids: string[];
  taxonomy: unknown;
  weights: unknown;
  national_signals: unknown;
  national_metrics: unknown;
};

type RegionScoreRow = {
  capability_area_id: string;
  region_id: string;
  strength_score: number;
  confidence: "Low" | "Medium" | "High";
  source_ids: string[];
  signals: unknown;
  indicators: unknown;
  generated_at: string;
};

type EvidenceItemRow = {
  id: string;
  capability_area_id: string;
  region_id: string | null;
  entity_id: number | null;
  document_id: number | null;
  evidence_type: EvidenceItem["evidenceType"];
  title: string;
  description: string;
  value: number | null;
  unit: string | null;
  geography: string;
  observed_date: string | null;
  source_date: string | null;
  confidence: "Low" | "Medium" | "High";
  freshness: "current" | "stale" | "unknown" | "not_checked";
  public_url: string;
  source_ids: string[];
  caveat: string;
  status: "draft" | "review" | "published" | "archived";
  is_public: boolean;
  metadata: Record<string, unknown>;
};

export type DataStats = {
  backend: "Supabase Postgres" | "Static JSON";
  sources: number;
  documents: number;
  regions: number;
  searchAreas: number;
  regionScores: number;
  evidenceItems: number;
  companies: number;
  pressReleases: number;
  procurementNotices: number;
};

function getStaticAtlasData(): AtlasData {
  return atlasDataSchema.parse(atlasDataJson);
}

function getStaticSources(): Source[] {
  return sourceSchema.array().parse(sourcesJson.sources);
}

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;
  return { url, key };
}

function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config) return null;

  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mapSource(row: SourceRow): Source {
  return {
    id: row.id,
    title: row.title,
    publisher: row.publisher,
    url: row.url,
    sourceType: row.source_type,
    tier: row.tier,
    cadence: row.cadence,
    use: row.use_text,
    freshnessStatus: row.freshness_status ?? "unknown",
    lastCheckedAt: row.last_checked_at,
    licenseNote: row.license_note ?? "Public Government of Canada or source-publisher terms apply.",
    publicUseStatus: row.public_use_status ?? "allowed",
  };
}

function mapEvidenceItem(row: EvidenceItemRow): EvidenceItem {
  return {
    id: row.id,
    capabilityId: row.capability_area_id,
    regionId: row.region_id,
    entityId: row.entity_id,
    documentId: row.document_id,
    evidenceType: row.evidence_type,
    title: row.title,
    description: row.description,
    value: row.value,
    unit: row.unit,
    geography: row.geography,
    observedDate: row.observed_date,
    sourceDate: row.source_date,
    confidence: row.confidence,
    freshness: row.freshness,
    publicUrl: row.public_url,
    sourceIds: row.source_ids,
    caveat: row.caveat,
    status: row.status,
    isPublic: row.is_public,
    metadata: row.metadata ?? {},
  };
}

async function getSupabaseAtlasData(): Promise<AtlasData | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const [regionsResult, areasResult, scoresResult, evidenceResult] = await Promise.all([
    supabase.from("regions").select("id,name,short_name,dguid").order("id"),
    supabase
      .from("capability_areas")
      .select("id,name,short_name,description,source_ids,taxonomy,weights,national_signals,national_metrics")
      .order("id"),
    supabase
      .from("region_scores")
      .select("capability_area_id,region_id,strength_score,confidence,source_ids,signals,indicators,generated_at")
      .order("capability_area_id"),
    supabase
      .from("evidence_items")
      .select(
        "id,capability_area_id,region_id,entity_id,document_id,evidence_type,title,description,value,unit,geography,observed_date,source_date,confidence,freshness,public_url,source_ids,caveat,status,is_public,metadata",
      )
      .eq("status", "published")
      .eq("is_public", true)
      .order("id"),
  ]);

  if (regionsResult.error || areasResult.error || scoresResult.error || evidenceResult.error) return null;

  const regions = (regionsResult.data ?? []) as RegionRow[];
  const areas = (areasResult.data ?? []) as CapabilityAreaRow[];
  const scores = (scoresResult.data ?? []) as RegionScoreRow[];
  const evidenceItems = (evidenceResult.data ?? []) as EvidenceItemRow[];
  const staticData = getStaticAtlasData();
  const missionOrder = new Map(staticData.missions.map((mission, index) => [mission.id, index]));
  const generatedAt = scores[0]?.generated_at ?? staticData.generatedAt;

  const payload = {
    generatedAt,
    name: staticData.name,
    methodology: staticData.methodology,
    regions: regions.map((region) => ({
      id: region.id,
      name: region.name,
      shortName: region.short_name,
      dguid: region.dguid,
    })),
    missions: areas
      .toSorted((left, right) => (missionOrder.get(left.id) ?? 999) - (missionOrder.get(right.id) ?? 999))
      .map((area) => ({
        id: area.id,
        name: area.name,
        shortName: area.short_name,
        description: area.description,
        sourceIds: area.source_ids,
        taxonomy: area.taxonomy,
        weights: area.weights,
        nationalSignals: area.national_signals,
        nationalMetrics: area.national_metrics,
      })),
    scores: scores.map((score) => ({
      missionId: score.capability_area_id,
      regionId: score.region_id,
      readinessScore: score.strength_score,
      confidence: score.confidence,
      sourceIds: score.source_ids,
      signals: score.signals,
      indicators: score.indicators,
    })),
    evidenceItems: evidenceItems.map(mapEvidenceItem),
  };

  const parsed = atlasDataSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

async function getSupabaseSources(): Promise<Source[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("sources")
    .select("id,title,publisher,url,source_type,tier,cadence,use_text,freshness_status,last_checked_at,license_note,public_use_status")
    .order("title");

  if (error) return null;
  const parsed = sourceSchema.array().safeParse(((data ?? []) as SourceRow[]).map(mapSource));
  return parsed.success ? parsed.data : null;
}

async function countTable(table: string): Promise<number | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) return null;
  return count ?? 0;
}

export async function getAtlasData(): Promise<AtlasData> {
  return (await getSupabaseAtlasData()) ?? getStaticAtlasData();
}

export async function getSources(): Promise<Source[]> {
  return (await getSupabaseSources()) ?? getStaticSources();
}

export async function getEvidenceItems(): Promise<EvidenceItem[]> {
  return evidenceItemSchema.array().parse((await getAtlasData()).evidenceItems);
}

export async function getSourceMap(): Promise<Map<string, Source>> {
  return new Map((await getSources()).map((source) => [source.id, source]));
}

export async function getDataStats(): Promise<DataStats> {
  const [atlasData, sources, documents, evidenceItems, companies, pressReleases, procurementNotices] = await Promise.all([
    getAtlasData(),
    getSources(),
    countTable("documents"),
    countTable("evidence_items"),
    countTable("entities"),
    countTable("press_releases"),
    countTable("procurement_notices"),
  ]);

  return {
    backend: getSupabaseConfig() && documents !== null ? "Supabase Postgres" : "Static JSON",
    sources: sources.length,
    documents: documents ?? sources.length,
    regions: atlasData.regions.length,
    searchAreas: atlasData.missions.length,
    regionScores: atlasData.scores.length,
    evidenceItems: evidenceItems ?? atlasData.evidenceItems.length,
    companies: companies ?? 0,
    pressReleases: pressReleases ?? 0,
    procurementNotices: procurementNotices ?? 0,
  };
}
