"use client";

import dynamic from "next/dynamic";
import { useAtlasStore } from "@/lib/store";
import { SidebarFilters } from "./SidebarFilters";
import { SeasonReplay } from "./SeasonReplay";
import { Compare } from "./Compare";
import { Landfall } from "./Landfall";
import { StormPanel } from "./StormPanel";
import { SearchCommand } from "./SearchCommand";
import type { StormSummary } from "@/lib/types";

const AtlasMap = dynamic(
  () => import("./AtlasMap").then((m) => ({ default: m.AtlasMap })),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-paper-dim">
      <p className="font-mono text-[11px] uppercase tracking-eyebrow text-ink-mute">
        Loading basin…
      </p>
    </div>
  );
}

export function AtlasShell({ index }: { index: StormSummary[] }) {
  const mode = useAtlasStore((s) => s.mode);

  return (
    <main id="main" className="relative flex min-h-[calc(100vh-130px)]">
      {mode === "atlas" && <SidebarFilters />}
      {mode === "season" && <SeasonReplay />}
      {mode === "compare" && <Compare />}

      {mode === "landfall" ? (
        <Landfall />
      ) : (
        <div className="relative flex-1">
          <AtlasMap index={index} />
        </div>
      )}

      <StormPanel />
      <SearchCommand />
    </main>
  );
}
