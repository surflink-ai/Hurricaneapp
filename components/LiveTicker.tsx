"use client";

import { useEffect, useMemo, useState } from "react";
import { Radio, CalendarDays } from "lucide-react";
import type { ActiveStorm, StormSummary } from "@/lib/types";
import { fmtCoord, fmtKt } from "@/lib/units";
import { useAtlasStore } from "@/lib/store";
import { cn } from "@/lib/cn";

interface OnThisDate {
  formed: number;
  landfalls: number;
  notable: string[];
}

function computeOnThisDate(index: ReadonlyArray<StormSummary>): OnThisDate {
  const now = new Date();
  const m = now.getUTCMonth() + 1;
  const d = now.getUTCDate();
  let formed = 0;
  let landfalls = 0;
  const notable: Array<{ name: string; year: number; peakKt: number }> = [];
  for (const s of index) {
    const sd = new Date(s.start);
    if (sd.getUTCMonth() + 1 === m && sd.getUTCDate() === d) {
      formed += 1;
      if (s.peakKt >= 96) {
        notable.push({ name: s.name, year: s.year, peakKt: s.peakKt });
      }
    }
    if (s.landfalls > 0) {
      const landfallDay = new Date(s.start);
      const dur = (new Date(s.end).getTime() - landfallDay.getTime()) / 86_400_000;
      const checkDay = new Date(landfallDay);
      for (let i = 0; i < Math.ceil(dur); i++) {
        if (checkDay.getUTCMonth() + 1 === m && checkDay.getUTCDate() === d) {
          landfalls += 1;
          break;
        }
        checkDay.setUTCDate(checkDay.getUTCDate() + 1);
      }
    }
  }
  notable.sort((a, b) => b.peakKt - a.peakKt);
  return { formed, landfalls, notable: notable.slice(0, 2).map((n) => `${titleCase(n.name)} ${n.year}`) };
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function LiveTicker() {
  const stormsIndex = useAtlasStore((s) => s.stormsIndex);
  const setSelectedStormId = useAtlasStore((s) => s.setSelectedStormId);
  const [active, setActive] = useState<ActiveStorm[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetch("/api/nhc-active")
      .then((r) => (r.ok ? r.json() : { storms: [] }))
      .then((j: { storms?: ActiveStorm[] }) => {
        if (cancel) return;
        setActive(Array.isArray(j.storms) ? j.storms : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => { cancel = true; };
  }, []);

  const otd = useMemo(() => computeOnThisDate(stormsIndex), [stormsIndex]);
  const todayLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).toUpperCase(),
    []
  );

  return (
    <div className="border-b border-rule bg-paper-dim">
      <div className="mx-auto flex max-w-[1700px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-2 font-mono text-[11px] text-ink">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex items-center gap-1.5 uppercase tracking-eyebrow text-ink-soft">
            <Radio size={11} strokeWidth={1.6} />
            Active Now
          </span>
          {!loaded ? (
            <span className="text-ink-mute">…</span>
          ) : active.length === 0 ? (
            <span className="text-ink-mute">No active North Atlantic storms.</span>
          ) : (
            <ul className="flex flex-wrap items-center gap-2">
              {active.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedStormId(a.id)}
                    className="flex items-center gap-1.5 border border-rule bg-paper px-2 py-0.5 hover:bg-paper-deep"
                  >
                    <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                    <span className="text-ink">{titleCase(a.name)}</span>
                    <span className="text-ink-mute" data-numeric>
                      {a.intensity} kt · {fmtCoord(a.lat, a.lon)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex min-w-0 items-center gap-2 text-ink-soft">
          <CalendarDays size={11} strokeWidth={1.6} />
          <span className="uppercase tracking-eyebrow">On {todayLabel}</span>
          <span className={cn("text-ink", otd.formed === 0 && "text-ink-mute")}>
            <span data-numeric>{otd.formed}</span> formed ·{" "}
            <span data-numeric>{otd.landfalls}</span> landfalls in record
          </span>
          {otd.notable.length > 0 && (
            <span className="text-ink-mute">
              · notable: {otd.notable.join(", ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
