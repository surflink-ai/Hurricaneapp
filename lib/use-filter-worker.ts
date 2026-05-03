"use client";

import { useEffect, useRef } from "react";
import * as Comlink from "comlink";
import type { FilterApi, FilterQuery, FilterResult } from "@/workers/filter.worker.types";
import type { StormSummary } from "./types";

export function useFilterWorker(): {
  ready: React.MutableRefObject<boolean>;
  init: (index: StormSummary[]) => Promise<void>;
  apply: (q: FilterQuery) => Promise<FilterResult>;
} {
  const workerRef = useRef<Worker | null>(null);
  const apiRef = useRef<Comlink.Remote<FilterApi> | null>(null);
  const ready = useRef(false);

  useEffect(() => {
    const w = new Worker(new URL("../workers/filter.worker.ts", import.meta.url), {
      type: "module"
    });
    workerRef.current = w;
    apiRef.current = Comlink.wrap<FilterApi>(w);
    return () => { w.terminate(); workerRef.current = null; apiRef.current = null; };
  }, []);

  const init = async (index: StormSummary[]) => {
    if (!apiRef.current) return;
    await apiRef.current.init(index);
    ready.current = true;
  };
  const apply = async (q: FilterQuery): Promise<FilterResult> => {
    if (!apiRef.current) {
      return { ids: [], count: 0, total: 0, byCategory: { sub:0, ts:0, c1:0, c2:0, c3:0, c4:0, c5:0 }, byYear: {} };
    }
    return apiRef.current.apply(q);
  };

  return { ready, init, apply };
}
