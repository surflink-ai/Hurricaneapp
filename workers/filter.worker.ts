import * as Comlink from "comlink";
import type { SaffirCat, StormSummary } from "@/lib/types";
import type { FilterApi, FilterQuery, FilterResult } from "./filter.worker.types";

let storms: StormSummary[] = [];

const ALL_CATS: ReadonlyArray<SaffirCat> = ["sub", "ts", "c1", "c2", "c3", "c4", "c5"];

const api: FilterApi = {
  init(index: StormSummary[]): void {
    storms = index;
  },
  apply(q: FilterQuery): FilterResult {
    const term = q.search.trim().toLowerCase();
    const cats = new Set(q.categories);
    const basins = new Set(q.basins);
    const months = new Set(q.months);
    const ids: string[] = [];
    const byCategory: Record<SaffirCat, number> = {
      sub: 0, ts: 0, c1: 0, c2: 0, c3: 0, c4: 0, c5: 0
    };
    const byYear: Record<number, number> = {};
    for (const s of storms) {
      if (s.year < q.yearMin || s.year > q.yearMax) continue;
      if (!cats.has(s.peakCat)) continue;
      if (!s.basins.some((b) => basins.has(b))) continue;
      const m = new Date(s.start).getUTCMonth() + 1;
      if (!months.has(m)) continue;
      if (term) {
        const hay = `${s.name.toLowerCase()} ${s.year} ${s.id.toLowerCase()}`;
        if (!hay.includes(term)) continue;
      }
      ids.push(s.id);
      byCategory[s.peakCat] += 1;
      byYear[s.year] = (byYear[s.year] ?? 0) + 1;
    }
    return { ids, count: ids.length, total: storms.length, byCategory, byYear };
  }
};

Comlink.expose(api);

void ALL_CATS;
