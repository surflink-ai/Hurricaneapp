"use client";

import { useEffect } from "react";
import { Search, BookOpen } from "lucide-react";
import Link from "next/link";
import { useAtlasStore, type Mode } from "@/lib/store";
import { cn } from "@/lib/cn";

const TABS: ReadonlyArray<{ id: Mode; numeral: string; label: string }> = [
  { id: "atlas", numeral: "I", label: "Atlas" },
  { id: "season", numeral: "II", label: "Season Replay" },
  { id: "compare", numeral: "III", label: "Compare" },
  { id: "landfall", numeral: "IV", label: "Landfall" }
];

export function Header({ totalRecords }: { totalRecords: number }) {
  const mode = useAtlasStore((s) => s.mode);
  const setMode = useAtlasStore((s) => s.setMode);
  const setSearchOpen = useAtlasStore((s) => s.setSearchOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  return (
    <header className="relative z-30 border-b border-rule bg-paper">
      <div className="mx-auto flex max-w-[1700px] items-end justify-between gap-8 px-6 pb-3 pt-5">
        <Link href="/" className="block min-w-0 shrink-0">
          <p className="font-mono text-[11px] uppercase tracking-eyebrow text-ink-soft">
            North Atlantic Basin
          </p>
          <h1 className="mt-0.5 font-display text-[34px] font-medium leading-none tracking-tight text-ink">
            Hurricane Atlas
            <span className="ml-3 font-mono text-[14px] tracking-normal text-ink-mute" data-numeric>
              1953—{new Date().getUTCFullYear()}
            </span>
          </h1>
        </Link>

        <nav aria-label="Modes" className="flex items-end gap-1 self-end">
          {TABS.map((t) => {
            const active = mode === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setMode(t.id)}
                className={cn(
                  "group relative flex flex-col items-start gap-0.5 px-4 py-2 text-left transition-colors",
                  active ? "text-ink" : "text-ink-mute hover:text-ink"
                )}
                aria-pressed={active}
              >
                <span className="font-mono text-[10px] uppercase tracking-eyebrow" data-numeric>
                  {t.numeral}
                </span>
                <span className="font-display text-[15px]">{t.label}</span>
                <span
                  className={cn(
                    "absolute -bottom-[1px] left-3 right-3 h-px",
                    active ? "bg-accent" : "bg-transparent"
                  )}
                />
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-end gap-3">
          <Link
            href="/essay"
            className="hidden items-center gap-1.5 border border-rule bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink hover:bg-paper-dim md:flex"
          >
            <BookOpen size={12} strokeWidth={1.6} />
            Essays
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 border border-rule bg-paper px-3 py-2 font-mono text-[11px] tracking-tight text-ink-soft hover:bg-paper-dim"
            aria-label="Open search"
          >
            <Search size={13} strokeWidth={1.6} />
            <span>Search storms</span>
            <span className="ml-2 hidden border border-rule px-1 py-0 text-[9px] uppercase tracking-eyebrow text-ink-mute md:inline">
              Ctrl K
            </span>
          </button>
          <p className="hidden flex-col items-end self-end text-right md:flex">
            <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">
              Records
            </span>
            <span className="font-mono text-[14px] text-ink" data-numeric>
              {totalRecords.toLocaleString("en-US")}
            </span>
          </p>
        </div>
      </div>
    </header>
  );
}
