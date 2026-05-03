import { mkdir, writeFile, readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  parseHurdat2,
  computeStormSummary,
  isNamedSince1953
} from "../lib/hurdat-parse";
import type { Storm, StormSummary, StormsIndex } from "../lib/types";

const INDEX_URL = "https://www.nhc.noaa.gov/data/hurdat/";
const NHC_FALLBACK_URL = "https://www.nhc.noaa.gov/data/hurdat/hurdat2-1851-2024-040425.txt";
const GITHUB_MIRROR_URL =
  "https://raw.githubusercontent.com/metemaad/HURDAT2_processor/master/hurdat2-1851-2018-051019.txt";
const CACHE_DIR = ".cache/hurdat";

async function discoverCandidateUrls(): Promise<string[]> {
  try {
    const res = await fetch(INDEX_URL, { headers: { "user-agent": "hurricane-atlas/1.0" } });
    if (!res.ok) throw new Error(`index http ${res.status}`);
    const html = await res.text();
    const matches = [...html.matchAll(/hurdat2-1851-(\d{4})-(\d{6})\.txt/g)];
    if (matches.length === 0) throw new Error("no hurdat2 file matches in index");
    matches.sort((a, b) => {
      const ay = parseInt(a[1] ?? "0", 10);
      const by = parseInt(b[1] ?? "0", 10);
      if (ay !== by) return by - ay;
      const ad = parseInt(a[2] ?? "0", 10);
      const bd = parseInt(b[2] ?? "0", 10);
      return bd - ad;
    });
    const top = matches[0]?.[0];
    if (!top) throw new Error("no top match");
    return [new URL(top, INDEX_URL).href, NHC_FALLBACK_URL, GITHUB_MIRROR_URL];
  } catch (err) {
    console.warn(`[fetch-hurdat2] index discovery failed: ${(err as Error).message}`);
    return [NHC_FALLBACK_URL, GITHUB_MIRROR_URL];
  }
}

async function fetchWithCache(url: string): Promise<string> {
  await mkdir(CACHE_DIR, { recursive: true });
  const fname = url.split("/").pop() ?? "hurdat2.txt";
  const cachePath = join(CACHE_DIR, fname);
  if (existsSync(cachePath)) {
    const s = await stat(cachePath);
    if (Date.now() - s.mtimeMs < 86_400_000) {
      console.log(`[fetch-hurdat2] using cached ${cachePath}`);
      return readFile(cachePath, "utf8");
    }
  }
  console.log(`[fetch-hurdat2] downloading ${url}`);
  const res = await fetch(url, { headers: { "user-agent": "hurricane-atlas/1.0" } });
  if (!res.ok) throw new Error(`download http ${res.status}`);
  const text = await res.text();
  await writeFile(cachePath, text, "utf8");
  return text;
}

async function fetchFirstAvailable(urls: string[]): Promise<{ url: string; raw: string }> {
  let lastErr: Error | null = null;
  for (const u of urls) {
    try {
      const raw = await fetchWithCache(u);
      return { url: u, raw };
    } catch (err) {
      lastErr = err as Error;
      console.warn(`[fetch-hurdat2] ${u} failed: ${(err as Error).message}`);
    }
  }
  throw lastErr ?? new Error("no source available");
}

async function main(): Promise<void> {
  const candidates = await discoverCandidateUrls();
  const { url, raw } = await fetchFirstAvailable(candidates);
  const parsed = parseHurdat2(raw);
  console.log(`[fetch-hurdat2] parsed ${parsed.length} total storm records from ${url}`);

  const named = parsed.filter(isNamedSince1953);
  console.log(`[fetch-hurdat2] ${named.length} named storms since 1953`);

  const allStorms: Storm[] = [];
  const summaries: StormSummary[] = [];
  for (const p of named) {
    const { summary, storm } = computeStormSummary(p);
    summaries.push(summary);
    allStorms.push(storm);
  }

  const outDir = "public/data";
  await mkdir(outDir, { recursive: true });

  const stormsObj = Object.fromEntries(allStorms.map((s) => [s.id, s]));
  await writeFile(join(outDir, "storms.json"), JSON.stringify(stormsObj));

  const idx: StormsIndex = {
    generated: new Date().toISOString(),
    source: url,
    storms: summaries
  };
  await writeFile(join(outDir, "storms-index.json"), JSON.stringify(idx));

  console.log(`[fetch-hurdat2] wrote ${summaries.length} storms to ${outDir}/`);
}

main().catch((err) => {
  console.error("[fetch-hurdat2] failed:", err);
  process.exit(1);
});
