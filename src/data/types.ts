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

export const scoreSchema = z.object({
  missionId: z.string(),
  regionId: z.string(),
  readinessScore: z.number().int().min(0).max(100),
  confidence: z.enum(["Low", "Medium", "High"]),
  sourceIds: z.array(z.string()).min(1),
  indicators: z.object({
    firms: indicatorSchema,
    labour: indicatorSchema,
    rd: indicatorSchema,
    exports: indicatorSchema,
    procurementSignals: indicatorSchema,
    infrastructure: indicatorSchema,
  }),
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
});

export type AtlasData = z.infer<typeof atlasDataSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type Score = z.infer<typeof scoreSchema>;
export type Indicator = z.infer<typeof indicatorSchema>;
