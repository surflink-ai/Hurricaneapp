"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useAtlasStore } from "@/lib/store";
import { CAT_COLORS, CAT_LABELS } from "@/lib/saffir";

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function SearchCommand() {
  const open = useAtlasStore((s) => s.searchOpen);
  const setOpen = useAtlasStore((s) => s.setSearchOpen);
  const stormsIndex = useAtlasStore((s) => s.stormsIndex);
  const setSelectedStormId = useAtlasStore((s) => s.setSelectedStormId);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    if (!open) setQ("");
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) {
      return [...stormsIndex].sort((a, b) => b.year - a.year).slice(0, 30);
    }
    const out = stormsIndex.filter((s) => {
      const name = s.name.toLowerCase();
      const yearStr = String(s.year);
      return name.includes(term) || yearStr.includes(term) || `${name} ${yearStr}`.includes(term);
    });
    out.sort((a, b) => b.year - a.year);
    return out.slice(0, 50);
  }, [q, stormsIndex]);

  useEffect(() => { setHi(0); }, [q]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(results.length - 1, h + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === "Enter") {
      const item = results[hi];
      if (item) {
        setSelectedStormId(item.id);
        setOpen(false);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search storms"
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/35 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
    >
      <div className="w-full max-w-xl border border-rule bg-paper shadow-paper">
        <div className="flex items-center gap-2 border-b border-rule px-4 py-3">
          <Search size={14} strokeWidth={1.6} className="text-ink-soft" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search by name or year — Camille, 2005, Andrew…"
            className="w-full bg-transparent font-mono text-[13px] text-ink placeholder:text-ink-mute focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-ink-soft hover:text-ink"
            aria-label="Close search"
          >
            <X size={14} strokeWidth={1.6} />
          </button>
        </div>
        <ul className="scroll-thin max-h-[60vh] overflow-y-auto">
          {results.length === 0 && (
            <li className="px-4 py-6 text-center font-mono text-[11px] text-ink-mute">
              No matches
            </li>
          )}
          {results.map((s, i) => {
            const c = CAT_COLORS[s.peakCat];
            const active = i === hi;
            return (
              <li key={s.id}>
                <Link
                  href={`/storm/${s.id}`}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setHi(i)}
                  className={`flex items-center gap-3 px-4 py-2 ${active ? "bg-paper-dim" : ""}`}
                >
                  <span className="inline-block h-2 w-2" style={{ backgroundColor: c }} />
                  <span className="font-display text-[14px] text-ink">{titleCase(s.name)}</span>
                  <span className="font-mono text-[11px] text-ink-mute" data-numeric>
                    {s.year} · {CAT_LABELS[s.peakCat]} · {s.peakKt} kt
                  </span>
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">
                    {s.id}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center justify-between border-t border-rule px-4 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">
          <span>Esc to close · Enter to open</span>
          <span data-numeric>{results.length} / {stormsIndex.length}</span>
        </div>
      </div>
    </div>
  );
}
