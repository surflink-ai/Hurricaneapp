import { categoryFromKt, isHurricaneCat, CAT_ORDER } from "./saffir";
import { bboxOfTrack, subBasinsForObservations } from "./geo";
import type {
  Observation,
  SaffirCat,
  Storm,
  StormStatus,
  StormSummary,
  SubBasin
} from "./types";

const HEADER_RE = /^([A-Z]{2})(\d{2})(\d{4}),\s*([A-Z0-9_\- ]+?)\s*,\s*(\d+)\s*,?\s*$/;

function parseLat(token: string): number {
  const t = token.trim();
  const v = parseFloat(t.slice(0, -1));
  return t.endsWith("S") ? -v : v;
}

function parseLon(token: string): number {
  const t = token.trim();
  const v = parseFloat(t.slice(0, -1));
  return t.endsWith("W") ? -v : v;
}

function intOrNull(token: string): number | null {
  const t = token.trim();
  if (t === "" || t === "-99" || t === "-999") return null;
  const n = parseInt(t, 10);
  if (Number.isNaN(n)) return null;
  return n;
}

function parseRecordId(token: string): Observation["recordId"] {
  const t = token.trim();
  if (t === "") return "";
  if (t === "L" || t === "P" || t === "I" || t === "C" || t === "S" || t === "G" || t === "T") {
    return t;
  }
  return "";
}

function parseStatus(token: string): StormStatus {
  const t = token.trim() as StormStatus;
  return t;
}

function toIso(date: string, time: string): string {
  const y = date.slice(0, 4);
  const m = date.slice(4, 6);
  const d = date.slice(6, 8);
  const hh = time.padStart(4, "0").slice(0, 2);
  const mm = time.padStart(4, "0").slice(2, 4);
  return `${y}-${m}-${d}T${hh}:${mm}:00Z`;
}

export interface ParsedStorm {
  id: string;
  basinCode: string;
  num: number;
  year: number;
  name: string;
  observations: Observation[];
}

export function parseHurdat2(raw: string): ParsedStorm[] {
  const lines = raw.split(/\r?\n/);
  const storms: ParsedStorm[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line || line.trim() === "") { i++; continue; }
    const headerMatch = line.match(HEADER_RE);
    if (!headerMatch) { i++; continue; }
    const basinCode = headerMatch[1] ?? "AL";
    const numStr = headerMatch[2] ?? "00";
    const yearStr = headerMatch[3] ?? "0000";
    const name = (headerMatch[4] ?? "").trim();
    const count = parseInt(headerMatch[5] ?? "0", 10);
    const id = `${basinCode}${numStr}${yearStr}`;
    const observations: Observation[] = [];
    for (let k = 1; k <= count; k++) {
      const obsLine = lines[i + k];
      if (!obsLine) break;
      const cols = obsLine.split(",").map((c) => c.trim());
      if (cols.length < 7) continue;
      const date = cols[0] ?? "";
      const time = cols[1] ?? "";
      const recordId = parseRecordId(cols[2] ?? "");
      const status = parseStatus(cols[3] ?? "");
      const lat = parseLat(cols[4] ?? "0");
      const lon = parseLon(cols[5] ?? "0");
      const windKt = intOrNull(cols[6] ?? "") ?? 0;
      const pressureMb = intOrNull(cols[7] ?? "");
      observations.push({
        date,
        time,
        iso: toIso(date, time),
        recordId,
        status,
        lat,
        lon,
        windKt,
        pressureMb
      });
    }
    storms.push({
      id,
      basinCode,
      num: parseInt(numStr, 10),
      year: parseInt(yearStr, 10),
      name,
      observations
    });
    i += count + 1;
  }
  return storms;
}

const SYNOPTIC_TIMES = new Set(["0000", "0600", "1200", "1800"]);

function tropicalLikeStatus(s: StormStatus): boolean {
  return s === "TS" || s === "HU" || s === "SS" || s === "SD" || s === "TC" || s === "TY" || s === "ST";
}

export function computeStormSummary(p: ParsedStorm): { summary: StormSummary; storm: Storm } {
  let peakKt = 0;
  let minMb: number | null = null;
  let landfalls = 0;
  let ace = 0;
  for (const o of p.observations) {
    if (o.windKt > peakKt) peakKt = o.windKt;
    if (o.pressureMb != null && (minMb == null || o.pressureMb < minMb)) minMb = o.pressureMb;
    if (o.recordId === "L") landfalls += 1;
    const t = o.time.padStart(4, "0");
    if (SYNOPTIC_TIMES.has(t) && tropicalLikeStatus(o.status) && o.windKt >= 34) {
      ace += (o.windKt * o.windKt) / 10_000;
    }
  }
  const peakCat: SaffirCat = categoryFromKt(peakKt);
  const basins: SubBasin[] = subBasinsForObservations(p.observations);
  const bbox = bboxOfTrack(p.observations);
  const start = p.observations[0]?.iso ?? `${p.year}-01-01T00:00:00Z`;
  const end = p.observations[p.observations.length - 1]?.iso ?? start;
  const summary: StormSummary = {
    id: p.id,
    name: p.name,
    year: p.year,
    peakCat,
    peakKt,
    minMb,
    ace: Math.round(ace * 1000) / 1000,
    landfalls,
    basins,
    bbox,
    start,
    end
  };
  const storm: Storm = { ...summary, observations: p.observations };
  return { summary, storm };
}

export function isNamedSince1953(p: ParsedStorm): boolean {
  if (p.year < 1953) return false;
  if (!p.name) return false;
  if (p.name === "UNNAMED") return false;
  return true;
}

export function categoryRankCheck(cat: SaffirCat): number {
  return CAT_ORDER.indexOf(cat);
}

export function isHurricane(cat: SaffirCat): boolean {
  return isHurricaneCat(cat);
}
