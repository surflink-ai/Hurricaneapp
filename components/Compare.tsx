"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { useAtlasStore } from "@/lib/store";
import type { Storm } from "@/lib/types";
import { CAT_REFERENCE_KT, CAT_COLORS, CAT_LABELS } from "@/lib/saffir";
import { cn } from "@/lib/cn";
import { withBase } from "@/lib/base-path";

const COMPARE_HUES = ["#0a0a08", "#9a2a1f", "#6b21a8"];

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

interface RowDatum {
  t: number;
  [key: string]: number;
}

export function Compare() {
  const stormsIndex = useAtlasStore((s) => s.stormsIndex);
  const compareIds = useAtlasStore((s) => s.compareIds);
  const toggleCompareId = useAtlasStore((s) => s.toggleCompareId);
  const clearCompare = useAtlasStore((s) => s.clearCompare);
  const [q, setQ] = useState("");
  const [storms, setStorms] = useState<Record<string, Storm>>({});

  useEffect(() => {
    let cancel = false;
    Promise.all(
      compareIds
        .filter((id) => !storms[id])
        .map(async (id) => {
          const r = await fetch(withBase(`/data/storms/${id}.json`));
          if (!r.ok) return null;
          const s = (await r.json()) as Storm;
          return s;
        })
    ).then((arr) => {
      if (cancel) return;
      const next = { ...storms };
      for (const s of arr) if (s) next[s.id] = s;
      setStorms(next);
    });
    return () => { cancel = true; };
  }, [compareIds, storms]);

  const matches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return stormsIndex.slice(0, 30);
    return stormsIndex
      .filter((s) => `${s.name.toLowerCase()} ${s.year}`.includes(term))
      .slice(0, 50);
  }, [q, stormsIndex]);

  const chartData = useMemo<RowDatum[]>(() => {
    const series = compareIds
      .map((id, idx) => {
        const st = storms[id];
        if (!st) return null;
        const t0 = st.observations[0] ? new Date(st.observations[0].iso).getTime() : 0;
        return {
          id,
          color: COMPARE_HUES[idx] ?? "#0a0a08",
          points: st.observations.map((o) => ({
            t: (new Date(o.iso).getTime() - t0) / 3_600_000,
            wind: o.windKt
          }))
        };
      })
      .filter((x): x is { id: string; color: string; points: { t: number; wind: number }[] } => x !== null);
    const buckets = new Map<number, RowDatum>();
    for (const s of series) {
      for (const p of s.points) {
        const key = Math.round(p.t / 6) * 6;
        const existing = buckets.get(key) ?? { t: key };
        existing[s.id] = p.wind;
        buckets.set(key, existing);
      }
    }
    return [...buckets.values()].sort((a, b) => a.t - b.t);
  }, [compareIds, storms]);

  return (
    <aside className="scroll-thin flex h-full w-[360px] shrink-0 flex-col overflow-y-auto border-r border-rule bg-paper">
      <div className="border-b border-rule px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Compare</p>
        <h2 className="mt-1 font-display text-[20px] leading-tight text-ink">Pick up to three</h2>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or year"
          className="mt-3 w-full border border-rule bg-paper px-3 py-2 font-mono text-[12px] text-ink placeholder:text-ink-mute focus:outline-none"
        />
      </div>

      {compareIds.length > 0 && (
        <div className="border-b border-rule px-5 py-3">
          <div className="flex flex-wrap gap-2">
            {compareIds.map((id, idx) => {
              const s = stormsIndex.find((x) => x.id === id);
              if (!s) return null;
              const hue = COMPARE_HUES[idx] ?? "#0a0a08";
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleCompareId(id)}
                  className="inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[11px] text-ink"
                  style={{ borderColor: hue }}
                >
                  <span className="inline-block h-1.5 w-3" style={{ backgroundColor: hue }} />
                  {titleCase(s.name)}
                  <span className="text-ink-mute" data-numeric>{s.year}</span>
                  <X size={10} strokeWidth={1.8} className="text-ink-soft" />
                </button>
              );
            })}
            <button
              type="button"
              onClick={clearCompare}
              className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute hover:text-ink"
            >
              clear
            </button>
          </div>
        </div>
      )}

      <ul className="flex-1 divide-y divide-rule/40">
        {matches.map((s) => {
          const on = compareIds.includes(s.id);
          const disabled = !on && compareIds.length >= 3;
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleCompareId(s.id)}
                className={cn(
                  "flex w-full items-baseline gap-3 px-5 py-2 text-left",
                  on ? "bg-paper-dim" : "hover:bg-paper-dim",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <span
                  className="inline-block h-2 w-3 shrink-0"
                  style={{ backgroundColor: CAT_COLORS[s.peakCat] }}
                />
                <span className="font-display text-[13px] text-ink">{titleCase(s.name)}</span>
                <span className="font-mono text-[10px] text-ink-mute" data-numeric>{s.year}</span>
                <span className="ml-auto font-mono text-[10px] text-ink-soft" data-numeric>
                  {CAT_LABELS[s.peakCat]} · {s.peakKt} kt
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {compareIds.length >= 2 && chartData.length > 0 && (
        <div className="border-t border-rule px-5 py-4">
          <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
            Wind kt vs hours from genesis
          </p>
          <div className="mt-2 h-[180px] border border-rule bg-paper p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 6, right: 6, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="#ebe7dc" strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="t"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tick={{ fill: "#3a3a36", fontSize: 9, fontFamily: "var(--font-jetbrains)" }}
                  stroke="#1a1a17"
                  tickFormatter={(v: number) => `+${Math.round(v)}h`}
                />
                <YAxis
                  domain={[0, 180]}
                  tick={{ fill: "#3a3a36", fontSize: 9, fontFamily: "var(--font-jetbrains)" }}
                  stroke="#1a1a17"
                  width={28}
                />
                {CAT_REFERENCE_KT.map((kt) => (
                  <line key={kt} stroke="#3a3a36" strokeDasharray="2 3" />
                ))}
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fdfdfb",
                    border: "1px solid #1a1a17",
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: 10,
                    color: "#0a0a08"
                  }}
                />
                <Legend wrapperStyle={{ fontFamily: "var(--font-jetbrains)", fontSize: 9 }} />
                {compareIds.map((id, i) => (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={id}
                    stroke={COMPARE_HUES[i] ?? "#0a0a08"}
                    strokeWidth={1.4}
                    dot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </aside>
  );
}
