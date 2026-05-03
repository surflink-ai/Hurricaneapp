"use client";

import { create } from "zustand";
import type { SaffirCat, StormSummary, SubBasin } from "./types";

export type Mode = "atlas" | "season" | "compare" | "landfall";

export interface FilterState {
  yearMin: number;
  yearMax: number;
  categories: SaffirCat[];
  basins: SubBasin[];
  months: number[];
  search: string;
}

interface AtlasStore {
  mode: Mode;
  setMode: (m: Mode) => void;

  filters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;
  resetFilters: () => void;

  selectedStormId: string | null;
  setSelectedStormId: (id: string | null) => void;

  compareIds: string[];
  toggleCompareId: (id: string) => void;
  clearCompare: () => void;

  seasonYear: number;
  setSeasonYear: (y: number) => void;
  seasonT: number;
  setSeasonT: (t: number) => void;
  seasonPlaying: boolean;
  setSeasonPlaying: (b: boolean) => void;

  filteredIds: string[];
  setFilteredIds: (ids: string[]) => void;

  totalStorms: number;
  setTotalStorms: (n: number) => void;

  searchOpen: boolean;
  setSearchOpen: (b: boolean) => void;

  stormsIndex: StormSummary[];
  setStormsIndex: (s: StormSummary[]) => void;
}

const CURRENT_YEAR = new Date().getFullYear();

export const DEFAULT_FILTERS: FilterState = {
  yearMin: 1953,
  yearMax: CURRENT_YEAR,
  categories: ["sub", "ts", "c1", "c2", "c3", "c4", "c5"],
  basins: ["Gulf of Mexico", "Caribbean", "Bahamas", "Main Development Region", "Open Atlantic"],
  months: [5, 6, 7, 8, 9, 10, 11, 12],
  search: ""
};

export const useAtlasStore = create<AtlasStore>((set) => ({
  mode: "atlas",
  setMode: (m) => set({ mode: m }),

  filters: DEFAULT_FILTERS,
  setFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  selectedStormId: null,
  setSelectedStormId: (id) => set({ selectedStormId: id }),

  compareIds: [],
  toggleCompareId: (id) =>
    set((s) => {
      if (s.compareIds.includes(id)) {
        return { compareIds: s.compareIds.filter((x) => x !== id) };
      }
      if (s.compareIds.length >= 3) return s;
      return { compareIds: [...s.compareIds, id] };
    }),
  clearCompare: () => set({ compareIds: [] }),

  seasonYear: CURRENT_YEAR - 1,
  setSeasonYear: (y) => set({ seasonYear: y, seasonT: 0 }),
  seasonT: 0,
  setSeasonT: (t) => set({ seasonT: t }),
  seasonPlaying: false,
  setSeasonPlaying: (b) => set({ seasonPlaying: b }),

  filteredIds: [],
  setFilteredIds: (ids) => set({ filteredIds: ids }),

  totalStorms: 0,
  setTotalStorms: (n) => set({ totalStorms: n }),

  searchOpen: false,
  setSearchOpen: (b) => set({ searchOpen: b }),

  stormsIndex: [],
  setStormsIndex: (s) => set({ stormsIndex: s })
}));
