import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ImpactRecord, StormsIndex } from "../lib/types";

const NCEI_JSON = "https://www.ncei.noaa.gov/access/monitoring/billions/events.json";
const CACHE = ".cache/ncei/events.json";

interface NceiEvent {
  Name?: string;
  EventName?: string;
  EventType?: string;
  Disaster?: string;
  Begin_Date?: string | number;
  End_Date?: string | number;
  CPI_Adjusted_Cost?: number | string;
  CPI_Cost?: number | string;
  Total_CPI_Adjusted_Cost?: number | string;
  Unadjusted_Cost?: number | string;
  Deaths?: number | string;
  Total_Deaths?: number | string;
  States?: string;
  Year?: number | string;
}

interface NceiPayload {
  events?: { events?: Record<string, NceiEvent> } | Record<string, NceiEvent>;
}

async function fetchEvents(): Promise<Record<string, NceiEvent> | null> {
  try {
    if (existsSync(CACHE)) {
      const s = await stat(CACHE);
      if (Date.now() - s.mtimeMs < 86_400_000 * 7) {
        const raw = await readFile(CACHE, "utf8");
        return JSON.parse(raw) as Record<string, NceiEvent>;
      }
    }
    const res = await fetch(NCEI_JSON, { headers: { "user-agent": "hurricane-atlas/1.0" } });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const json = (await res.json()) as NceiPayload;
    const inner = json.events;
    let map: Record<string, NceiEvent> = {};
    if (inner && typeof inner === "object") {
      const innerEvents = (inner as { events?: Record<string, NceiEvent> }).events;
      if (innerEvents && typeof innerEvents === "object") {
        map = innerEvents;
      } else {
        map = inner as Record<string, NceiEvent>;
      }
    }
    await mkdir(".cache/ncei", { recursive: true });
    await writeFile(CACHE, JSON.stringify(map));
    return map;
  } catch (err) {
    console.warn(`[enrich-billion-dollar] NCEI unreachable: ${(err as Error).message}`);
    return null;
  }
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,]/g, "");
    const n = parseFloat(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function normalizeName(s: string): string {
  return s.toUpperCase().replace(/HURRICANE|TROPICAL STORM|TC|\(|\)|,|'|\./g, "").trim();
}

async function main(): Promise<void> {
  const events = await fetchEvents();
  const idxPath = "public/data/storms-index.json";
  const idx = JSON.parse(await readFile(idxPath, "utf8")) as StormsIndex;
  if (!events) {
    console.log("[enrich-billion-dollar] no NCEI data; skipping");
    return;
  }
  const tropicalEntries: Array<{ key: string; ev: NceiEvent }> = [];
  for (const [key, ev] of Object.entries(events)) {
    const type = (ev.EventType ?? ev.Disaster ?? "").toString().toLowerCase();
    if (type.includes("tropical") || type.includes("hurricane") || type.includes("cyclone")) {
      tropicalEntries.push({ key, ev });
    }
  }
  console.log(`[enrich-billion-dollar] ${tropicalEntries.length} tropical events from NCEI`);

  let matched = 0;
  for (const storm of idx.storms) {
    const name = normalizeName(storm.name);
    const yearStr = String(storm.year);
    for (const { ev } of tropicalEntries) {
      const evName = normalizeName((ev.Name ?? ev.EventName ?? "").toString());
      const evYear =
        typeof ev.Year !== "undefined"
          ? String(ev.Year)
          : (ev.Begin_Date ?? "").toString().slice(0, 4);
      if (evName.includes(name) && evYear === yearStr) {
        const damage =
          asNumber(ev.CPI_Adjusted_Cost) ??
          asNumber(ev.Total_CPI_Adjusted_Cost) ??
          asNumber(ev.CPI_Cost);
        const deaths = asNumber(ev.Deaths) ?? asNumber(ev.Total_Deaths);
        const states = (ev.States ?? "").toString().split(/[,;]/).map((s) => s.trim()).filter(Boolean);
        const impact: ImpactRecord = {
          source: "NOAA NCEI Billion-Dollar Disasters",
          sourceUrl: "https://www.ncei.noaa.gov/access/billions/",
          ...(damage != null ? { damageUsdCpiAdjusted: damage } : {}),
          ...(deaths != null ? { deaths } : {}),
          ...(states.length ? { affectedAreas: states } : {})
        };
        storm.impact = impact;
        matched += 1;
        break;
      }
    }
  }
  console.log(`[enrich-billion-dollar] matched ${matched} storms with NCEI events`);
  await writeFile(idxPath, JSON.stringify(idx));
}

main().catch((err) => {
  console.error("[enrich-billion-dollar] failed:", err);
});
