"use client";

import { useEffect } from "react";
import type { StormSummary } from "@/lib/types";
import { useAtlasStore } from "@/lib/store";

export function IndexHydrator({ index }: { index: StormSummary[] }): null {
  const setStormsIndex = useAtlasStore((s) => s.setStormsIndex);
  const setTotalStorms = useAtlasStore((s) => s.setTotalStorms);

  useEffect(() => {
    setStormsIndex(index);
    setTotalStorms(index.length);
  }, [index, setStormsIndex, setTotalStorms]);

  return null;
}
