import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ImageryPair, Storm, StormSummary, StormsIndex } from "./types";

export interface ResolvedImageryPair extends ImageryPair {
  before: ImageryPair["before"] & { resolvedUrl: string };
  after: ImageryPair["after"] & { resolvedUrl: string };
}

let cachedIndex: StormsIndex | null = null;
let cachedStorms: Record<string, Storm> | null = null;
let cachedImagery: ResolvedImageryPair[] | null = null;

export async function loadIndex(): Promise<StormsIndex> {
  if (cachedIndex) return cachedIndex;
  const raw = await readFile(join(process.cwd(), "public", "data", "storms-index.json"), "utf8");
  cachedIndex = JSON.parse(raw) as StormsIndex;
  return cachedIndex;
}

export async function loadStorms(): Promise<Record<string, Storm>> {
  if (cachedStorms) return cachedStorms;
  const raw = await readFile(join(process.cwd(), "public", "data", "storms.json"), "utf8");
  cachedStorms = JSON.parse(raw) as Record<string, Storm>;
  return cachedStorms;
}

export async function loadStorm(id: string): Promise<Storm | null> {
  const all = await loadStorms();
  return all[id] ?? null;
}

export async function loadIndexSummaries(): Promise<StormSummary[]> {
  const idx = await loadIndex();
  return idx.storms;
}

export async function loadImagery(): Promise<ResolvedImageryPair[]> {
  if (cachedImagery) return cachedImagery;
  try {
    const raw = await readFile(join(process.cwd(), "public", "data", "imagery.json"), "utf8");
    cachedImagery = JSON.parse(raw) as ResolvedImageryPair[];
    return cachedImagery;
  } catch {
    cachedImagery = [];
    return cachedImagery;
  }
}

export async function loadImageryForStorm(stormId: string): Promise<ResolvedImageryPair[]> {
  const all = await loadImagery();
  return all.filter((p) => p.stormId === stormId);
}
