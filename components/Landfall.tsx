"use client";

import { useEffect, useMemo, useState } from "react";
import { useAtlasStore } from "@/lib/store";
import { LANDFALL_REGIONS } from "@/lib/geo";
import { CAT_COLORS, CAT_LABELS, CAT_ORDER, catRank } from "@/lib/saffir";
import type { SaffirCat } from "@/lib/types";
import { cn } from "@/lib/cn";

interface RegionStat {
  regionId: string;
  total: number;
  byCat: Record<SaffirCat, number>;
}

export function Landfall() {
  const stormsIndex = useAtlasStore((s) => s.stormsIndex);
  const setSelectedStormId = useAtlasStore((s) => s.setSelectedStormId);
  const [stats, setStats] = useState<RegionStat[] | null>(null);
  const [minCat, setMinCat] = useState<SaffirCat>("ts");
  const [sortBy, setSortBy] = useState<"name" | "total">("total");

  useEffect(() => {
    let cancel = false;
    fetch("/data/storms.json")
      .then((r) => r.json())
      .then((stormsObj: Record<string, { id: string; year: number; observations: { lat: number; lon: number; recordId: string; windKt: number }[] }>) => {
        if (cancel) return;
        const out: RegionStat[] = LANDFALL_REGIONS.map((r) => ({
          regionId: r.id,
          total: 0,
          byCat: { sub: 0, ts: 0, c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 }
        }));
        const byId: Record<string, RegionStat> = {};
        for (const r of out) byId[r.regionId] = r;
        for (const s of Object.values(stormsObj)) {
          if (s.year < 1953) continue;
          for (const region of LANDFALL_REGIONS) {
            const [minLon, minLat, maxLon, maxLat] = region.bbox;
            const hit = s.observations.find(
              (o) => o.recordId === "L" && o.lon >= minLon && o.lon <= maxLon && o.lat >= minLat && o.lat <= maxLat
            );
            if (!hit) continue;
            const summary = stormsIndex.find((x) => x.id === s.id);
            if (!summary) continue;
            const stat = byId[region.id];
            if (!stat) continue;
            stat.total += 1;
            stat.byCat[summary.peakCat] += 1;
          }
        }
        setStats(out);
      });
    return () => { cancel = true; };
  }, [stormsIndex]);

  const filtered = useMemo(() => {
    if (!stats) return [];
    const minRank = catRank(minCat);
    const out = stats.map((s) => {
      const filteredByCat: Record<SaffirCat, number> = { sub: 0, ts: 0, c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
      let total = 0;
      for (const c of CAT_ORDER) {
        if (catRank(c) >= minRank) {
          filteredByCat[c] = s.byCat[c];
          total += s.byCat[c];
        }
      }
      return { ...s, total, byCat: filteredByCat };
    });
    out.sort((a, b) => {
      if (sortBy === "total") return b.total - a.total;
      const ra = LANDFALL_REGIONS.find((r) => r.id === a.regionId)?.shortName ?? "";
      const rb = LANDFALL_REGIONS.find((r) => r.id === b.regionId)?.shortName ?? "";
      return ra.localeCompare(rb);
    });
    return out;
  }, [stats, minCat, sortBy]);

  const maxTotal = useMemo(() => Math.max(1, ...filtered.map((r) => r.total)), [filtered]);

  return (
    <main id="main" className="scroll-thin h-full overflow-y-auto bg-paper">
      <div className="mx-auto max-w-[1200px] px-8 py-8">
        <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">IV — Landfall</p>
        <h2 className="mt-1 font-display text-[36px] leading-tight text-ink">
          Where the hurricanes came ashore
        </h2>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-soft">
          Storms grouped by the named region in which their HURDAT2 best-track record carries an
          official landfall record (record ID <span className="font-mono">L</span>) since 1953.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-rule py-3">
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Min cat</span>
          <div className="flex gap-1">
            {CAT_ORDER.map((c) => {
              const on = c === minCat;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setMinCat(c)}
                  className={cn(
                    "border px-2 py-0.5 font-mono text-[10px] uppercase tracking-eyebrow",
                    on ? "text-paper" : "bg-paper text-ink-soft"
                  )}
                  style={{
                    backgroundColor: on ? CAT_COLORS[c] : "transparent",
                    borderColor: CAT_COLORS[c]
                  }}
                  aria-pressed={on}
                >
                  {CAT_LABELS[c]}+
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
            <span>Sort</span>
            <button
              type="button"
              onClick={() => setSortBy("total")}
              className={cn("border border-rule px-2 py-0.5", sortBy === "total" ? "bg-ink text-paper" : "bg-paper")}
            >
              Frequency
            </button>
            <button
              type="button"
              onClick={() => setSortBy("name")}
              className={cn("border border-rule px-2 py-0.5", sortBy === "name" ? "bg-ink text-paper" : "bg-paper")}
            >
              Region
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {filtered.map((row) => {
            const region = LANDFALL_REGIONS.find((r) => r.id === row.regionId);
            if (!region) return null;
            return (
              <div key={row.regionId} className="border border-rule bg-paper p-4">
                <header className="flex items-baseline justify-between">
                  <h3 className="font-display text-[18px] text-ink">{region.name}</h3>
                  <span className="font-mono text-[18px] text-ink" data-numeric>{row.total}</span>
                </header>
                <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                  Storms with landfall in record
                </p>
                <div className="mt-3 flex h-3 w-full overflow-hidden border border-rule">
                  {CAT_ORDER.map((c) => {
                    const w = row.total === 0 ? 0 : (row.byCat[c] / row.total) * 100;
                    if (w === 0) return null;
                    return (
                      <span
                        key={c}
                        title={`${CAT_LABELS[c]} · ${row.byCat[c]}`}
                        style={{ width: `${w}%`, backgroundColor: CAT_COLORS[c] }}
                      />
                    );
                  })}
                </div>
                <ul className="mt-3 grid grid-cols-7 gap-1">
                  {CAT_ORDER.map((c) => (
                    <li key={c} className="text-center">
                      <p className="font-mono text-[9px] uppercase tracking-eyebrow text-ink-mute" style={{ color: CAT_COLORS[c] }}>
                        {CAT_LABELS[c]}
                      </p>
                      <p className="font-mono text-[12px] text-ink" data-numeric>
                        {row.byCat[c]}
                      </p>
                    </li>
                  ))}
                </ul>
                <div
                  className="mt-3 h-px w-full"
                  style={{
                    background: `linear-gradient(90deg, transparent ${(row.total / maxTotal) * 100}%, transparent 100%)`
                  }}
                />
              </div>
            );
          })}
        </div>

        <p className="mt-8 font-mono text-[10px] text-ink-mute">
          Region polygons are simple bounding boxes; an obs is counted if its <span className="font-mono">L</span> point falls inside.
          Source: NOAA HURDAT2.
        </p>
      </div>
    </main>
  );
}
