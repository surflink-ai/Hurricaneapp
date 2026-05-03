import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ImpactRecord, StormsIndex, StormSummary } from "../lib/types";

const SUMMARY_API = "https://en.wikipedia.org/api/rest_v1/page/summary";
const ACTION_API = "https://en.wikipedia.org/w/api.php";
const CACHE_DIR = ".cache/wiki";
const RATE_MS = 250;

function nameTitleCase(n: string): string {
  return n
    .toLowerCase()
    .split(" ")
    .map((p) => (p.length ? p[0]!.toUpperCase() + p.slice(1) : ""))
    .join(" ");
}

function candidateTitles(storm: StormSummary): string[] {
  const name = nameTitleCase(storm.name);
  return [
    `Hurricane_${name}_(${storm.year})`,
    `Tropical_Storm_${name}_(${storm.year})`,
    `Hurricane_${name}`
  ];
}

async function fetchSummary(title: string): Promise<{ extract?: string; url?: string } | null> {
  try {
    const res = await fetch(`${SUMMARY_API}/${encodeURIComponent(title)}`, {
      headers: {
        "user-agent": "hurricane-atlas/1.0 (https://github.com/)",
        accept: "application/json"
      }
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { extract?: string; content_urls?: { desktop?: { page?: string } } };
    return { extract: json.extract, url: json.content_urls?.desktop?.page };
  } catch {
    return null;
  }
}

async function fetchInfobox(title: string): Promise<string | null> {
  try {
    const url =
      `${ACTION_API}?action=parse&format=json&prop=wikitext&redirects=1&page=` +
      encodeURIComponent(title);
    const res = await fetch(url, {
      headers: { "user-agent": "hurricane-atlas/1.0", accept: "application/json" }
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { parse?: { wikitext?: { "*"?: string } } };
    return json.parse?.wikitext?.["*"] ?? null;
  } catch {
    return null;
  }
}

function extractField(wikitext: string, name: string): string | null {
  const re = new RegExp(`\\|\\s*${name}\\s*=\\s*([^\\n|]+)`, "i");
  const m = wikitext.match(re);
  return m && m[1] ? m[1].trim() : null;
}

function parseUsdToNumber(s: string): number | undefined {
  const cleaned = s.replace(/\[\[|\]\]|\(.*?\)|<.*?>|&nbsp;/g, "").trim();
  const m = cleaned.match(/\$?\s*([\d.]+)\s*(billion|million|trillion)?/i);
  if (!m) return undefined;
  const num = parseFloat(m[1] ?? "");
  if (!Number.isFinite(num)) return undefined;
  const unit = (m[2] ?? "").toLowerCase();
  if (unit === "trillion") return num * 1e12;
  if (unit === "billion") return num * 1e9;
  if (unit === "million") return num * 1e6;
  return num;
}

function parseDeaths(s: string): number | undefined {
  const m = s.replace(/[,]/g, "").match(/(\d+)/);
  if (!m) return undefined;
  const n = parseInt(m[1] ?? "", 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseAreas(s: string): string[] {
  return s
    .replace(/\[\[|\]\]/g, "")
    .split(/[,;]/)
    .map((p) => p.split("|").pop()!.trim())
    .filter((p) => p && p.length < 60);
}

async function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  const idxPath = "public/data/storms-index.json";
  const idx = JSON.parse(await readFile(idxPath, "utf8")) as StormsIndex;
  let enriched = 0;
  let probed = 0;

  const limit = parseInt(process.env.WIKIPEDIA_MAX ?? "120", 10);
  const candidates = [...idx.storms]
    .filter((s) => s.impact?.source !== "NOAA NCEI Billion-Dollar Disasters")
    .sort((a, b) => b.ace - a.ace)
    .slice(0, limit);
  const candidateIds = new Set(candidates.map((s) => s.id));
  console.log(`[enrich-wikipedia] probing top ${candidates.length} by ACE (limit=${limit})`);

  for (const storm of idx.storms) {
    if (!candidateIds.has(storm.id)) continue;
    const cacheFile = join(CACHE_DIR, `${storm.id}.json`);
    if (existsSync(cacheFile)) {
      const s = await stat(cacheFile);
      if (Date.now() - s.mtimeMs < 86_400_000 * 30) {
        const cached = JSON.parse(await readFile(cacheFile, "utf8")) as { impact?: ImpactRecord };
        if (cached.impact) {
          storm.impact = cached.impact;
          enriched += 1;
        }
        continue;
      }
    }

    probed += 1;
    let impact: ImpactRecord | null = null;
    for (const title of candidateTitles(storm)) {
      const summary = await fetchSummary(title);
      await sleep(RATE_MS);
      if (!summary || !summary.extract) continue;
      const wikitext = await fetchInfobox(title);
      await sleep(RATE_MS);
      const damageStr = wikitext ? extractField(wikitext, "Damage|Damages|Damage_total|Damages_total") : null;
      const deathsStr = wikitext ? extractField(wikitext, "Fatalities|Deaths|Total_fatalities|Total_deaths") : null;
      const areasStr = wikitext ? extractField(wikitext, "Areas|Areas_affected") : null;
      const damage = damageStr ? parseUsdToNumber(damageStr) : undefined;
      const deaths = deathsStr ? parseDeaths(deathsStr) : undefined;
      const areas = areasStr ? parseAreas(areasStr) : undefined;
      impact = {
        source: "Wikipedia",
        sourceUrl: summary.url,
        summary: summary.extract,
        ...(damage != null ? { damageUsdCpiAdjusted: damage } : {}),
        ...(deaths != null ? { deaths } : {}),
        ...(areas && areas.length ? { affectedAreas: areas } : {})
      };
      break;
    }
    await writeFile(cacheFile, JSON.stringify({ impact }));
    if (impact) {
      storm.impact = impact;
      enriched += 1;
    }
    if (probed % 50 === 0) console.log(`[enrich-wikipedia] probed=${probed} enriched=${enriched}`);
    if (probed > 0 && probed % 200 === 0) await sleep(1500);
  }
  console.log(`[enrich-wikipedia] done. probed=${probed} enriched=${enriched}`);
  await writeFile(idxPath, JSON.stringify(idx));
}

main().catch((err) => {
  console.error("[enrich-wikipedia] failed:", err);
});
