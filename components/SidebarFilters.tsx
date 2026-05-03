"use client";

import { useEffect, useMemo } from "react";
import { useAtlasStore, DEFAULT_FILTERS } from "@/lib/store";
import type { SaffirCat, SubBasin } from "@/lib/types";
import { CAT_COLORS, CAT_LABELS, CAT_ORDER } from "@/lib/saffir";
import { SUB_BASIN_ORDER } from "@/lib/geo";
import { cn } from "@/lib/cn";
import { useFilterWorker } from "@/lib/use-filter-worker";

const CURRENT_YEAR = new Date().getFullYear();
const MONTHS = [
  { n: 1, label: "J" },
  { n: 2, label: "F" },
  { n: 3, label: "M" },
  { n: 4, label: "A" },
  { n: 5, label: "M" },
  { n: 6, label: "J" },
  { n: 7, label: "J" },
  { n: 8, label: "A" },
  { n: 9, label: "S" },
  { n: 10, label: "O" },
  { n: 11, label: "N" },
  { n: 12, label: "D" }
];

export function SidebarFilters() {
  const filters = useAtlasStore((s) => s.filters);
  const setFilters = useAtlasStore((s) => s.setFilters);
  const reset = useAtlasStore((s) => s.resetFilters);
  const stormsIndex = useAtlasStore((s) => s.stormsIndex);
  const setFilteredIds = useAtlasStore((s) => s.setFilteredIds);
  const totalStorms = useAtlasStore((s) => s.totalStorms);
  const filteredCount = useAtlasStore((s) => s.filteredIds.length);
  const { init, apply } = useFilterWorker();

  useEffect(() => {
    if (stormsIndex.length === 0) return;
    void init(stormsIndex);
  }, [stormsIndex, init]);

  useEffect(() => {
    if (stormsIndex.length === 0) return;
    let cancelled = false;
    const t = setTimeout(() => {
      void apply(filters).then((r) => {
        if (!cancelled) setFilteredIds(r.ids);
      });
    }, 50);
    return () => { cancelled = true; clearTimeout(t); };
  }, [filters, stormsIndex, apply, setFilteredIds]);

  const yearStops = useMemo(() => {
    const out: number[] = [];
    for (let y = 1953; y <= CURRENT_YEAR; y += 5) out.push(y);
    return out;
  }, []);

  const toggleCat = (c: SaffirCat) => {
    const has = filters.categories.includes(c);
    setFilters({
      categories: has ? filters.categories.filter((x) => x !== c) : [...filters.categories, c]
    });
  };
  const toggleBasin = (b: SubBasin) => {
    const has = filters.basins.includes(b);
    setFilters({
      basins: has ? filters.basins.filter((x) => x !== b) : [...filters.basins, b]
    });
  };
  const toggleMonth = (m: number) => {
    const has = filters.months.includes(m);
    setFilters({
      months: has ? filters.months.filter((x) => x !== m) : [...filters.months, m]
    });
  };

  return (
    <aside className="scroll-thin flex h-full w-[300px] shrink-0 flex-col overflow-y-auto border-r border-rule bg-paper">
      <div className="border-b border-rule px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Filter</p>
        <h2 className="mt-1 font-display text-[20px] leading-tight text-ink">
          The Record
        </h2>
        <p className="mt-2 font-mono text-[12px] text-ink" data-numeric>
          {filteredCount} <span className="text-ink-mute">/ {totalStorms} storms</span>
        </p>
      </div>

      <section className="border-b border-rule px-5 py-4">
        <header className="flex items-baseline justify-between">
          <h3 className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Years</h3>
          <span className="font-mono text-[11px] text-ink" data-numeric>
            {filters.yearMin}–{filters.yearMax}
          </span>
        </header>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="range"
            min={1953}
            max={CURRENT_YEAR}
            step={1}
            value={filters.yearMin}
            onChange={(e) => setFilters({ yearMin: Math.min(parseInt(e.target.value, 10), filters.yearMax) })}
            className="w-full accent-ink"
            aria-label="Year minimum"
          />
        </div>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="range"
            min={1953}
            max={CURRENT_YEAR}
            step={1}
            value={filters.yearMax}
            onChange={(e) => setFilters({ yearMax: Math.max(parseInt(e.target.value, 10), filters.yearMin) })}
            className="w-full accent-ink"
            aria-label="Year maximum"
          />
        </div>
        <div className="mt-1 flex justify-between font-mono text-[9px] text-ink-mute" data-numeric>
          {yearStops.map((y) => <span key={y}>{y}</span>)}
        </div>
      </section>

      <section className="border-b border-rule px-5 py-4">
        <h3 className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
          Saffir-Simpson peak
        </h3>
        <div className="mt-2 flex flex-wrap gap-1">
          {CAT_ORDER.map((c) => {
            const on = filters.categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCat(c)}
                className={cn(
                  "border px-2 py-1 font-mono text-[10px] uppercase tracking-eyebrow transition-colors",
                  on ? "text-paper" : "bg-paper text-ink-soft"
                )}
                style={{
                  backgroundColor: on ? CAT_COLORS[c] : "transparent",
                  borderColor: CAT_COLORS[c]
                }}
                aria-pressed={on}
              >
                {CAT_LABELS[c]}
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-b border-rule px-5 py-4">
        <h3 className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Sub-basins</h3>
        <ul className="mt-2 space-y-1.5">
          {SUB_BASIN_ORDER.map((b) => {
            const on = filters.basins.includes(b);
            return (
              <li key={b}>
                <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] text-ink">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleBasin(b)}
                    className="h-3 w-3 accent-ink"
                  />
                  <span className={on ? "text-ink" : "text-ink-mute"}>{b}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-b border-rule px-5 py-4">
        <h3 className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Month of formation</h3>
        <div className="mt-2 flex justify-between gap-px">
          {MONTHS.map((m) => {
            const on = filters.months.includes(m.n);
            return (
              <button
                key={m.n}
                type="button"
                onClick={() => toggleMonth(m.n)}
                className={cn(
                  "h-7 flex-1 border-y border-rule font-mono text-[10px]",
                  on ? "bg-ink text-paper" : "bg-paper text-ink-mute hover:text-ink"
                )}
                aria-pressed={on}
                aria-label={`Month ${m.n}`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-auto border-t border-rule px-5 py-4">
        <button
          type="button"
          onClick={reset}
          className="w-full border border-rule bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink hover:bg-paper-dim"
        >
          Reset filters
        </button>
        <p className="mt-2 font-mono text-[9px] text-ink-mute">
          Defaults: {DEFAULT_FILTERS.yearMin}–{DEFAULT_FILTERS.yearMax}, all cats, all basins.
        </p>
      </div>
    </aside>
  );
}
