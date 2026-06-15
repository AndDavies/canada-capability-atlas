import "server-only";

import atlasDataJson from "@/data/generated/atlas-data.json";
import sourcesJson from "@/data/generated/sources.json";
import { atlasDataSchema, sourceSchema, type AtlasData, type Source } from "@/data/types";

export function getAtlasData(): AtlasData {
  return atlasDataSchema.parse(atlasDataJson);
}

export function getSources(): Source[] {
  return sourceSchema.array().parse(sourcesJson.sources);
}

export function getSourceMap(): Map<string, Source> {
  return new Map(getSources().map((source) => [source.id, source]));
}
