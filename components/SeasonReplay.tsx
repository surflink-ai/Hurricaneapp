"use client";

import { useEffect, useMemo, useRef } from "react";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { useAtlasStore } from "@/lib/store";
import { CAT_COLORS, CAT_LABELS } from "@/lib/saffir";
import { cn } from "@/lib/cn";

const PLAY_DURATION_MS = 60_000;

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function SeasonReplay() {
  const stormsIndex = useAtlasStore((s) => s.stormsIndex);
  const setSelectedStormId = useAtlasStore((s) => s.setSelectedStormId);
  const seasonYear = useAtlasStore((s) => s.seasonYear);
  const setSeasonYear = useAtlasStore((s) => s.setSeasonYear);
  const seasonT = useAtlasStore((s) => s.seasonT);
  const setSeasonT = useAtlasStore((s) => s.setSeasonT);
  const playing = useAtlasStore((s) => s.seasonPlaying);
  const setPlaying = useAtlasStore((s) => s.setSeasonPlaying);
  const startRef = useRef<number | null>(null);

  const yearStorms = useMemo(
    () => [...stormsIndex.filter((s) => s.year === seasonYear)].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    ),
    [stormsIndex, seasonYear]
  );

  const yearsAvailable = useMemo(() => {
    const set = new Set<number>();
    for (const s of stormsIndex) set.add(s.year);
    return [...set].sort((a, b) => b - a);
  }, [stormsIndex]);

  useEffect(() => {
    if (!playing) { startRef.current = null; return; }
    let frame = 0;
    const loop = (now: number) => {
      if (startRef.current == null) startRef.current = now - seasonT * PLAY_DURATION_MS;
      const t = Math.min(1, (now - startRef.current) / PLAY_DURATION_MS);
      setSeasonT(t);
      if (t >= 1) { setPlaying(false); startRef.current = null; return; }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing, setSeasonT, setPlaying, seasonT]);

  const activeNow = useMemo(() => {
    if (yearStorms.length === 0) return new Set<string>();
    const tStart = Math.min(...yearStorms.map((s) => new Date(s.start).getTime()));
    const tEnd = Math.max(...yearStorms.map((s) => new Date(s.end).getTime()));
    const tNow = tStart + (tEnd - tStart) * seasonT;
    const out = new Set<string>();
    for (const s of yearStorms) {
      const start = new Date(s.start).getTime();
      const end = new Date(s.end).getTime();
      if (tNow >= start && tNow <= end + 86_400_000) out.add(s.id);
    }
    return out;
  }, [yearStorms, seasonT]);

  const dateLabel = useMemo(() => {
    if (yearStorms.length === 0) return "";
    const tStart = Math.min(...yearStorms.map((s) => new Date(s.start).getTime()));
    const tEnd = Math.max(...yearStorms.map((s) => new Date(s.end).getTime()));
    const t = tStart + (tEnd - tStart) * seasonT;
    return new Date(t).toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }, [yearStorms, seasonT]);

  const yearIdx = yearsAvailable.indexOf(seasonYear);

  return (
    <aside className="scroll-thin flex h-full w-[320px] shrink-0 flex-col overflow-y-auto border-r border-rule bg-paper">
      <div className="border-b border-rule px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Replay</p>
        <div className="mt-1 flex items-baseline gap-2">
          <h2 className="font-display text-[22px] leading-tight text-ink">Season</h2>
          <span className="font-mono text-[20px] text-ink" data-numeric>{seasonYear}</span>
        </div>
        <div className="mt-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (yearIdx + 1 < yearsAvailable.length) {
                const next = yearsAvailable[yearIdx + 1];
                if (next != null) setSeasonYear(next);
              }
            }}
            className="border border-rule bg-paper px-2 py-1 text-ink-soft hover:bg-paper-dim"
            aria-label="Earlier season"
          >
            <ChevronLeft size={12} strokeWidth={1.6} />
          </button>
          <select
            value={seasonYear}
            onChange={(e) => setSeasonYear(parseInt(e.target.value, 10))}
            className="flex-1 border border-rule bg-paper px-2 py-1 font-mono text-[12px] text-ink"
            aria-label="Season year"
          >
            {yearsAvailable.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (yearIdx > 0) {
                const next = yearsAvailable[yearIdx - 1];
                if (next != null) setSeasonYear(next);
              }
            }}
            className="border border-rule bg-paper px-2 py-1 text-ink-soft hover:bg-paper-dim"
            aria-label="Later season"
          >
            <ChevronRight size={12} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <div className="border-b border-rule px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying(!playing)}
            className="flex h-9 w-9 items-center justify-center border border-rule bg-paper text-ink hover:bg-paper-dim"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={14} strokeWidth={1.6} /> : <Play size={14} strokeWidth={1.6} />}
          </button>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(seasonT * 1000)}
            onChange={(e) => { setSeasonT(parseInt(e.target.value, 10) / 1000); setPlaying(false); }}
            className="w-full accent-ink"
            aria-label="Season scrubber"
          />
        </div>
        <p className="mt-2 font-mono text-[11px] text-ink" data-numeric>
          {dateLabel}
        </p>
        <p className="mt-1 font-mono text-[10px] text-ink-mute">
          {yearStorms.length} named storm{yearStorms.length === 1 ? "" : "s"}
        </p>
      </div>

      <ul className="flex-1 divide-y divide-rule/40">
        {yearStorms.map((s) => {
          const live = activeNow.has(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSelectedStormId(s.id)}
                className={cn(
                  "flex w-full items-baseline gap-3 px-5 py-2 text-left hover:bg-paper-dim",
                  live && "bg-paper-dim"
                )}
              >
                <span
                  className="inline-block h-2 w-3 shrink-0"
                  style={{ backgroundColor: CAT_COLORS[s.peakCat] }}
                />
                <span className={cn("font-display text-[14px]", live ? "text-ink" : "text-ink-soft")}>
                  {titleCase(s.name)}
                </span>
                <span className="ml-auto font-mono text-[10px] text-ink-mute" data-numeric>
                  {CAT_LABELS[s.peakCat]} · {s.peakKt} kt
                </span>
                {live && <span className="pulse-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
