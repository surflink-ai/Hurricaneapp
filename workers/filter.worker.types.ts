import type { SaffirCat, StormSummary, SubBasin } from "@/lib/types";

export interface FilterQuery {
  yearMin: number;
  yearMax: number;
  categories: SaffirCat[];
  basins: SubBasin[];
  months: number[];
  search: string;
}

export interface FilterResult {
  ids: string[];
  count: number;
  total: number;
  byCategory: Record<SaffirCat, number>;
  byYear: Record<number, number>;
}

export interface FilterApi {
  init(index: StormSummary[]): void;
  apply(query: FilterQuery): FilterResult;
}
