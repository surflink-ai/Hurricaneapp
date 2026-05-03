import type { SaffirCat } from "./types";

export const CAT_THRESHOLDS_KT: ReadonlyArray<{ cat: SaffirCat; minKt: number; label: string }> = [
  { cat: "c5", minKt: 137, label: "Category 5" },
  { cat: "c4", minKt: 113, label: "Category 4" },
  { cat: "c3", minKt: 96, label: "Category 3" },
  { cat: "c2", minKt: 83, label: "Category 2" },
  { cat: "c1", minKt: 64, label: "Category 1" },
  { cat: "ts", minKt: 34, label: "Tropical Storm" },
  { cat: "sub", minKt: 0, label: "Sub-tropical / Depression" }
];

export const CAT_REFERENCE_KT: ReadonlyArray<number> = [34, 64, 83, 96, 113, 137];

export const CAT_ORDER: ReadonlyArray<SaffirCat> = ["sub", "ts", "c1", "c2", "c3", "c4", "c5"];

export const CAT_COLORS: Readonly<Record<SaffirCat, string>> = {
  sub: "#94a3b8",
  ts: "#0e7490",
  c1: "#a16207",
  c2: "#ea580c",
  c3: "#dc2626",
  c4: "#991b1b",
  c5: "#6b21a8"
};

export const CAT_LABELS: Readonly<Record<SaffirCat, string>> = {
  sub: "Sub",
  ts: "TS",
  c1: "C1",
  c2: "C2",
  c3: "C3",
  c4: "C4",
  c5: "C5"
};

export const CAT_FULL_LABELS: Readonly<Record<SaffirCat, string>> = {
  sub: "Sub-tropical / Depression",
  ts: "Tropical Storm",
  c1: "Category 1",
  c2: "Category 2",
  c3: "Category 3",
  c4: "Category 4",
  c5: "Category 5"
};

export function categoryFromKt(kt: number): SaffirCat {
  for (const t of CAT_THRESHOLDS_KT) {
    if (kt >= t.minKt) return t.cat;
  }
  return "sub";
}

export function isHurricaneCat(cat: SaffirCat): boolean {
  return cat === "c1" || cat === "c2" || cat === "c3" || cat === "c4" || cat === "c5";
}

export function catRank(cat: SaffirCat): number {
  return CAT_ORDER.indexOf(cat);
}
