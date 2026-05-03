export type SaffirCat = "sub" | "ts" | "c1" | "c2" | "c3" | "c4" | "c5";

export type StormStatus =
  | "TD"
  | "TS"
  | "HU"
  | "EX"
  | "SD"
  | "SS"
  | "LO"
  | "WV"
  | "DB"
  | "TY"
  | "ST"
  | "TC";

export type SubBasin =
  | "Caribbean"
  | "Gulf of Mexico"
  | "Bahamas"
  | "Main Development Region"
  | "Open Atlantic";

export interface Observation {
  date: string;
  time: string;
  iso: string;
  recordId: "" | "L" | "P" | "I" | "C" | "S" | "G" | "T";
  status: StormStatus;
  lat: number;
  lon: number;
  windKt: number;
  pressureMb: number | null;
}

export interface ImpactRecord {
  source: "NOAA NCEI Billion-Dollar Disasters" | "Wikipedia";
  damageUsdCpiAdjusted?: number;
  damageUsdNominal?: number;
  deaths?: number;
  affectedAreas?: string[];
  summary?: string;
  sourceUrl?: string;
  tcrUrl?: string;
}

export interface StormSummary {
  id: string;
  name: string;
  year: number;
  peakCat: SaffirCat;
  peakKt: number;
  minMb: number | null;
  ace: number;
  landfalls: number;
  basins: SubBasin[];
  bbox: [number, number, number, number];
  start: string;
  end: string;
  retired?: boolean;
  retirementYear?: number;
  hasImagery?: boolean;
  impact?: ImpactRecord;
}

export interface Storm extends StormSummary {
  observations: Observation[];
}

export interface StormsIndex {
  generated: string;
  source: string;
  storms: StormSummary[];
}

export interface ActiveStorm {
  id: string;
  name: string;
  classification: string;
  intensity: number;
  intensityMph: number;
  pressureMb: number | null;
  lat: number;
  lon: number;
  movement: string;
  advisoryUtc: string;
  forecastConeUrl?: string;
  forecastTrackUrl?: string;
}

export interface ImageryPair {
  pairId: string;
  stormId: string;
  label: string;
  lat: number;
  lon: number;
  before: { url: string; date: string; source: string; attribution: string };
  after: { url: string; date: string; source: string; attribution: string };
}

export interface NarrativeChapter {
  id: string;
  kind:
    | "genesis"
    | "intensification"
    | "rapid-intensification"
    | "peak"
    | "landfall"
    | "dissipation"
    | "imagery"
    | "comparable";
  title: string;
  prose: string;
  cameraBbox?: [number, number, number, number];
  focusObsIndex?: number;
  imageryPairId?: string;
  comparableIds?: string[];
}
