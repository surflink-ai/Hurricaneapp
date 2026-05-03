import type { SubBasin } from "./types";

export type Bbox = readonly [number, number, number, number];

export interface RegionDef {
  id: string;
  name: string;
  shortName: string;
  bbox: Bbox;
}

export const SUB_BASIN_BBOX: Readonly<Record<SubBasin, Bbox>> = {
  "Caribbean": [-89, 9, -60, 22],
  "Gulf of Mexico": [-98, 18, -80.5, 31],
  "Bahamas": [-79.5, 22, -72, 27.5],
  "Main Development Region": [-60, 10, -20, 20],
  "Open Atlantic": [-100, -5, 10, 70]
};

export const SUB_BASIN_ORDER: ReadonlyArray<SubBasin> = [
  "Gulf of Mexico",
  "Caribbean",
  "Bahamas",
  "Main Development Region",
  "Open Atlantic"
];

export function inBbox(lat: number, lon: number, bbox: Bbox): boolean {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
}

export function subBasinsForObservations(
  obs: ReadonlyArray<{ lat: number; lon: number }>
): SubBasin[] {
  const hit = new Set<SubBasin>();
  for (const o of obs) {
    for (const basin of SUB_BASIN_ORDER) {
      if (basin === "Open Atlantic") continue;
      if (inBbox(o.lat, o.lon, SUB_BASIN_BBOX[basin])) hit.add(basin);
    }
  }
  if (hit.size === 0) hit.add("Open Atlantic");
  return SUB_BASIN_ORDER.filter((b) => hit.has(b));
}

export function bboxOfTrack(
  obs: ReadonlyArray<{ lat: number; lon: number }>
): [number, number, number, number] {
  let minLon = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  for (const o of obs) {
    if (o.lon < minLon) minLon = o.lon;
    if (o.lat < minLat) minLat = o.lat;
    if (o.lon > maxLon) maxLon = o.lon;
    if (o.lat > maxLat) maxLat = o.lat;
  }
  return [minLon, minLat, maxLon, maxLat];
}

export function expandBbox(
  bbox: [number, number, number, number],
  padDeg: number
): [number, number, number, number] {
  return [bbox[0] - padDeg, bbox[1] - padDeg, bbox[2] + padDeg, bbox[3] + padDeg];
}

export const LANDFALL_REGIONS: ReadonlyArray<RegionDef> = [
  { id: "yucatan", name: "Yucatán Peninsula", shortName: "Yucatán", bbox: [-92, 17.5, -86.5, 22] },
  { id: "greater-antilles", name: "Greater Antilles", shortName: "Greater Antilles", bbox: [-85, 17, -65, 23.5] },
  { id: "lesser-antilles", name: "Lesser Antilles", shortName: "Lesser Antilles", bbox: [-65, 11, -59, 18.5] },
  { id: "bahamas", name: "Bahamas", shortName: "Bahamas", bbox: [-79.5, 22, -72, 27.5] },
  { id: "florida", name: "Florida", shortName: "Florida", bbox: [-87.5, 24, -79.8, 31] },
  { id: "gulf-coast", name: "Gulf Coast US", shortName: "Gulf Coast", bbox: [-97.5, 26, -82, 31] },
  { id: "carolinas", name: "Carolinas", shortName: "Carolinas", bbox: [-83, 32, -75, 36.6] },
  { id: "bermuda", name: "Bermuda", shortName: "Bermuda", bbox: [-65.5, 31.8, -64.4, 32.6] },
  { id: "ne-us-canada", name: "Northeast US & Atlantic Canada", shortName: "NE US / Canada", bbox: [-77, 36.5, -52, 50] },
  { id: "central-america", name: "Central America", shortName: "Central America", bbox: [-92, 8, -77, 17.5] }
];
