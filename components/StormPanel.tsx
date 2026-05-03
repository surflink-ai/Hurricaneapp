"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { X, ExternalLink, BookmarkX, FileText } from "lucide-react";
import type { Storm } from "@/lib/types";
import { useAtlasStore } from "@/lib/store";
import { CAT_FULL_LABELS, CAT_LABELS } from "@/lib/saffir";
import { fmtAce, fmtKt, fmtLifespan, fmtMb, fmtUsd, fmtInt, ktToKmh, ktToMph } from "@/lib/units";
import { CategoryChip } from "./CategoryChip";
import { StatGrid } from "./StatGrid";
import { IntensityChart } from "./IntensityChart";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import type { ResolvedImageryPair } from "@/lib/data";

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function StormPanel() {
  const id = useAtlasStore((s) => s.selectedStormId);
  const setId = useAtlasStore((s) => s.setSelectedStormId);
  const [storm, setStorm] = useState<Storm | null>(null);
  const [imagery, setImagery] = useState<ResolvedImageryPair[]>([]);

  useEffect(() => {
    if (!id) { setStorm(null); setImagery([]); return; }
    let cancel = false;
    Promise.all([
      fetch(`/api/storm/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/storm/${id}/imagery`).then((r) => (r.ok ? r.json() : { pairs: [] }))
    ]).then(([st, im]) => {
      if (cancel) return;
      setStorm((st as Storm | null) ?? null);
      setImagery((im as { pairs: ResolvedImageryPair[] }).pairs ?? []);
    });
    return () => { cancel = true; };
  }, [id]);

  return (
    <AnimatePresence>
      {id && (
        <motion.aside
          key="storm-panel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="scroll-thin fixed right-0 top-0 z-40 flex h-full w-full max-w-[420px] flex-col overflow-y-auto border-l border-rule bg-paper shadow-paper"
          aria-label={`Storm detail: ${storm?.name ?? id}`}
        >
          <header className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-rule bg-paper/95 px-5 py-4 backdrop-blur">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                <span data-numeric>{id}</span>
                {storm?.retired && (
                  <span className="ml-2 inline-flex items-center gap-1 text-accent">
                    <BookmarkX size={11} strokeWidth={1.6} />
                    Retired by WMO
                  </span>
                )}
              </p>
              <h2 className="mt-1 font-display text-[28px] font-medium leading-tight text-ink">
                {storm ? titleCase(storm.name) : "—"}
                {storm && (
                  <span className="ml-2 font-mono text-[14px] text-ink-mute" data-numeric>
                    {storm.year}
                  </span>
                )}
              </h2>
              {storm && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <CategoryChip cat={storm.peakCat} size="md" full />
                  {storm.basins.slice(0, 3).map((b) => (
                    <span
                      key={b}
                      className="border border-rule px-2 py-0.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setId(null)}
              className="text-ink-soft hover:text-ink"
              aria-label="Close panel"
            >
              <X size={16} strokeWidth={1.6} />
            </button>
          </header>

          {storm ? (
            <div className="px-5 pb-8">
              <StatGrid
                stats={[
                  {
                    label: "Peak wind",
                    value: fmtKt(storm.peakKt),
                    sub: `${ktToMph(storm.peakKt)} mph · ${ktToKmh(storm.peakKt)} km/h`
                  },
                  { label: "Min pressure", value: fmtMb(storm.minMb) },
                  { label: "Lifespan", value: fmtLifespan(storm.start, storm.end) },
                  { label: "ACE", value: fmtAce(storm.ace) },
                  { label: "Landfalls", value: String(storm.landfalls) },
                  { label: "Track points", value: String(storm.observations.length) }
                ]}
              />

              <section className="mt-5">
                <h3 className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                  Intensity over time
                </h3>
                <IntensityChart observations={storm.observations} height={220} />
              </section>

              {imagery.length > 0 && (
                <section className="mt-6">
                  <h3 className="mb-1 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                    Impact · Imagery
                  </h3>
                  {imagery.map((p) => (
                    <BeforeAfterSlider
                      key={p.pairId}
                      label={p.label}
                      before={p.before}
                      after={p.after}
                      height={280}
                    />
                  ))}
                </section>
              )}

              {storm.impact && (
                <section className="mt-5 border-t border-rule pt-5">
                  <h3 className="mb-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                    Impact
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {storm.impact.damageUsdCpiAdjusted != null && (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">
                          Damage (CPI-adj)
                        </p>
                        <p className="mt-1 font-mono text-[20px] text-ink" data-numeric>
                          {fmtUsd(storm.impact.damageUsdCpiAdjusted)}
                        </p>
                      </div>
                    )}
                    {storm.impact.deaths != null && (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">
                          Deaths
                        </p>
                        <p className="mt-1 font-mono text-[20px] text-ink" data-numeric>
                          {fmtInt(storm.impact.deaths)}
                        </p>
                      </div>
                    )}
                  </div>
                  {storm.impact.affectedAreas && storm.impact.affectedAreas.length > 0 && (
                    <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
                      <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">
                        Affected:{" "}
                      </span>
                      {storm.impact.affectedAreas.join(", ")}
                    </p>
                  )}
                  {storm.impact.summary && (
                    <p className="mt-3 text-[13px] leading-relaxed text-ink">
                      {storm.impact.summary}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">
                    {storm.impact.tcrUrl && (
                      <a
                        href={storm.impact.tcrUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 hover:text-ink"
                      >
                        <FileText size={11} strokeWidth={1.6} />
                        NHC Report (PDF)
                      </a>
                    )}
                    {storm.impact.sourceUrl && (
                      <a
                        href={storm.impact.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 hover:text-ink"
                      >
                        <ExternalLink size={11} strokeWidth={1.6} />
                        {storm.impact.source}
                      </a>
                    )}
                  </div>
                </section>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href={`/storm/${storm.id}`}
                  className="inline-flex items-center gap-1.5 border border-rule bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink hover:bg-paper-dim"
                >
                  <FileText size={11} strokeWidth={1.6} />
                  Read full narrative
                </Link>
                <Link
                  href={`/storm/${storm.id}/data`}
                  className="inline-flex items-center gap-1.5 border border-rule bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink hover:bg-paper-dim"
                >
                  Observation table
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-5 py-10 text-center font-mono text-[11px] text-ink-mute">
              Loading storm…
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
