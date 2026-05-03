import { categoryFromKt, CAT_FULL_LABELS } from "./saffir";
import { fmtCoord, fmtKt, ktToMph } from "./units";
import { bboxOfTrack, expandBbox, subBasinsForObservations } from "./geo";
import type { NarrativeChapter, Observation, Storm } from "./types";

const STATUS_LABELS: Record<string, string> = {
  TD: "tropical depression",
  TS: "tropical storm",
  HU: "hurricane",
  EX: "extratropical cyclone",
  SD: "subtropical depression",
  SS: "subtropical storm",
  LO: "low-pressure area",
  WV: "tropical wave",
  DB: "remnant low",
  TY: "typhoon",
  ST: "super typhoon",
  TC: "tropical cyclone"
};

function fmtIso(iso: string): string {
  const d = new Date(iso);
  return d.toUTCString().replace(":00 GMT", " UTC").replace(" GMT", " UTC");
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function obsBbox(obs: Observation, pad = 6): [number, number, number, number] {
  return [obs.lon - pad, obs.lat - pad, obs.lon + pad, obs.lat + pad];
}

function categoryNumber(kt: number): number | null {
  const c = categoryFromKt(kt);
  if (c === "c1") return 1;
  if (c === "c2") return 2;
  if (c === "c3") return 3;
  if (c === "c4") return 4;
  if (c === "c5") return 5;
  return null;
}

export function deriveChapters(storm: Storm): NarrativeChapter[] {
  const chapters: NarrativeChapter[] = [];
  const obs = storm.observations;
  if (obs.length === 0) return chapters;

  const first = obs[0];
  const last = obs[obs.length - 1];
  if (!first || !last) return chapters;

  const basin = subBasinsForObservations(obs)[0] ?? "Open Atlantic";
  const statusLabel = STATUS_LABELS[first.status] ?? "tropical system";

  chapters.push({
    id: "genesis",
    kind: "genesis",
    title: "Genesis",
    prose: `${storm.name} began as a ${statusLabel} at ${fmtCoord(first.lat, first.lon)} on ${fmtDay(first.iso)}, in the ${basin}.`,
    cameraBbox: obsBbox(first, 8),
    focusObsIndex: 0
  });

  let currentCat = categoryNumber(first.windKt);
  for (let i = 1; i < obs.length; i++) {
    const o = obs[i];
    if (!o) continue;
    const c = categoryNumber(o.windKt);
    if (c != null && (currentCat == null || c > currentCat)) {
      chapters.push({
        id: `intensify-${i}`,
        kind: "intensification",
        title: `Category ${c}`,
        prose: `By ${fmtIso(o.iso)}, sustained winds reached ${fmtKt(o.windKt)} (${ktToMph(o.windKt)} mph) — ${storm.name} had become a Category ${c} hurricane.`,
        cameraBbox: obsBbox(o, 7),
        focusObsIndex: i
      });
      currentCat = c;
    }
  }

  for (let i = 4; i < obs.length; i++) {
    const cur = obs[i];
    const prev = obs[i - 4];
    if (!cur || !prev) continue;
    const dt = (new Date(cur.iso).getTime() - new Date(prev.iso).getTime()) / 3_600_000;
    if (dt > 25 || dt < 23) continue;
    const delta = cur.windKt - prev.windKt;
    if (delta >= 30) {
      chapters.push({
        id: `ri-${i}`,
        kind: "rapid-intensification",
        title: "Rapid Intensification",
        prose: `Over the 24 hours ending ${fmtIso(cur.iso)}, sustained winds jumped ${delta} kt — a textbook rapid-intensification signature.`,
        cameraBbox: obsBbox(cur, 6),
        focusObsIndex: i
      });
      i += 3;
    }
  }

  let peakIdx = 0;
  let peakKt = -Infinity;
  let minMb = Infinity;
  let minMbIdx = 0;
  for (let i = 0; i < obs.length; i++) {
    const o = obs[i];
    if (!o) continue;
    if (o.windKt > peakKt) {
      peakKt = o.windKt;
      peakIdx = i;
    }
    if (o.pressureMb != null && o.pressureMb < minMb) {
      minMb = o.pressureMb;
      minMbIdx = i;
    }
  }
  const peakObs = obs[peakIdx];
  if (peakObs) {
    chapters.push({
      id: "peak",
      kind: "peak",
      title: "Peak Intensity",
      prose: `Peak intensity arrived ${fmtIso(peakObs.iso)}: ${fmtKt(peakObs.windKt)} (${ktToMph(peakObs.windKt)} mph) sustained${minMb !== Infinity ? `, ${minMb} mb central pressure` : ""}. ${storm.name} was at ${CAT_FULL_LABELS[storm.peakCat]} strength.`,
      cameraBbox: obsBbox(peakObs, 6),
      focusObsIndex: peakIdx
    });
  }

  for (let i = 0; i < obs.length; i++) {
    const o = obs[i];
    if (!o || o.recordId !== "L") continue;
    chapters.push({
      id: `landfall-${i}`,
      kind: "landfall",
      title: "Landfall",
      prose: `${storm.name} made landfall near ${fmtCoord(o.lat, o.lon)} on ${fmtIso(o.iso)} at ${fmtKt(o.windKt)} sustained winds.`,
      cameraBbox: obsBbox(o, 4),
      focusObsIndex: i
    });
  }

  if (last.status === "EX") {
    chapters.push({
      id: "et",
      kind: "dissipation",
      title: "Extratropical Transition",
      prose: `By ${fmtIso(last.iso)}, ${storm.name} had completed its transition to an extratropical cyclone near ${fmtCoord(last.lat, last.lon)}.`,
      cameraBbox: obsBbox(last, 8),
      focusObsIndex: obs.length - 1
    });
  } else {
    chapters.push({
      id: "dissipation",
      kind: "dissipation",
      title: "Dissipation",
      prose: `${storm.name} dissipated by ${fmtIso(last.iso)} near ${fmtCoord(last.lat, last.lon)}, ending a track that crossed the ${subBasinsForObservations(obs).join(", ")}.`,
      cameraBbox: expandBbox(bboxOfTrack(obs), 2),
      focusObsIndex: obs.length - 1
    });
  }

  return chapters;
}

export function pickComparableStormIds(
  storm: Storm,
  index: ReadonlyArray<{ id: string; peakKt: number; basins: string[] }>
): string[] {
  const sameBasin = index.filter((s) => s.id !== storm.id && s.basins.some((b) => storm.basins.includes(b as never)));
  sameBasin.sort((a, b) => Math.abs(a.peakKt - storm.peakKt) - Math.abs(b.peakKt - storm.peakKt));
  return sameBasin.slice(0, 3).map((s) => s.id);
}
