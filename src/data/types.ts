import { z } from "zod";

export const sourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  publisher: z.string(),
  url: z.string().url(),
  sourceType: z.string(),
  tier: z.number(),
  cadence: z.string(),
  use: z.string(),
  freshnessStatus: z.enum(["current", "stale", "unknown", "not_checked"]).default("unknown"),
  lastCheckedAt: z.string().nullable().default(null),
  licenseNote: z.string().default("Public Government of Canada or source-publisher terms apply."),
  publicUseStatus: z.enum(["allowed", "restricted", "unknown"]).default("allowed"),
});

export const metricStatusSchema = z.enum([
  "measured",
  "national_context_only",
  "catalogued_not_normalized",
  "not_applicable_for_v1",
]);

export const indicatorSchema = z.object({
  status: metricStatusSchema,
  value: z.number().nullable(),
  nationalValue: z.number().optional(),
  unit: z.string(),
  sourceIds: z.array(z.string()).min(1),
  note: z.string(),
});

export const signalStatusSchema = z.enum(["measured", "canada_wide", "not_yet_measured", "not_applicable"]);

export const scoreSignalSchema = z.object({
  status: signalStatusSchema,
  value: z.number().nullable(),
  normalizedScore: z.number().min(0).max(100).nullable(),
  unit: z.string(),
  sourceIds: z.array(z.string()),
  methodology: z.string(),
  caveat: z.string(),
});

export const scoreSchema = z.object({
  missionId: z.string(),
  regionId: z.string(),
  readinessScore: z.number().int().min(0).max(100),
  confidence: z.enum(["Low", "Medium", "High"]),
  sourceIds: z.array(z.string()).min(1),
  signals: z.object({
    scale: scoreSignalSchema,
    density: scoreSignalSchema,
    momentum: scoreSignalSchema,
    readiness: scoreSignalSchema,
    evidenceCoverage: scoreSignalSchema,
  }),
  indicators: z.object({
    firms: indicatorSchema,
    labour: indicatorSchema,
    rd: indicatorSchema,
    exports: indicatorSchema,
    procurementSignals: indicatorSchema,
    infrastructure: indicatorSchema,
  }),
});

export const evidenceItemSchema = z.object({
  id: z.string(),
  capabilityId: z.string(),
  regionId: z.string().nullable(),
  entityId: z.number().nullable().default(null),
  documentId: z.number().nullable().default(null),
  evidenceType: z.enum(["firm_count", "research", "contract", "export", "workforce", "infrastructure", "policy", "source_gap"]),
  title: z.string(),
  description: z.string(),
  value: z.number().nullable(),
  unit: z.string().nullable(),
  geography: z.string(),
  observedDate: z.string().nullable(),
  sourceDate: z.string().nullable(),
  confidence: z.enum(["Low", "Medium", "High"]),
  freshness: z.enum(["current", "stale", "unknown", "not_checked"]),
  publicUrl: z.string().url(),
  sourceIds: z.array(z.string()).min(1),
  caveat: z.string(),
  status: z.enum(["draft", "review", "published", "archived"]),
  isPublic: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const atlasDataSchema = z.object({
  generatedAt: z.string(),
  name: z.string(),
  methodology: z.object({
    version: z.string(),
    summary: z.string(),
    caveats: z.array(z.string()),
  }),
  regions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      shortName: z.string(),
      dguid: z.string(),
    }),
  ),
  missions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      shortName: z.string(),
      description: z.string(),
      sourceIds: z.array(z.string()),
      taxonomy: z.object({
        naics: z.array(z.string()),
        educationFields: z.array(z.string()),
        tradeCommodities: z.array(z.string()),
        procurementKeywords: z.array(z.string()),
        dcbLabels: z.array(z.string()),
      }),
      weights: z.object({
        firms: z.number(),
        sourceCoverage: z.number(),
        rd: z.number(),
      }),
      nationalSignals: z.array(
        z.object({
          label: z.string(),
          value: z.string(),
          sourceIds: z.array(z.string()),
        }),
      ),
      nationalMetrics: z.object({
        rdPerformers: z.number(),
        rdReferencePeriod: z.string(),
        businessReferencePeriod: z.string(),
      }),
    }),
  ),
  scores: z.array(scoreSchema),
  evidenceItems: z.array(evidenceItemSchema).default([]),
});

export type AtlasData = z.infer<typeof atlasDataSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Score = z.infer<typeof scoreSchema>;
export type Indicator = z.infer<typeof indicatorSchema>;
export type ScoreSignal = z.infer<typeof scoreSignalSchema>;
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;
