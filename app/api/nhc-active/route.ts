import { NextResponse } from "next/server";
import type { ActiveStorm } from "@/lib/types";

export const revalidate = 300;

const CURRENT_STORMS_URL = "https://www.nhc.noaa.gov/CurrentStorms.json";

interface NhcStormRecord {
  id?: string;
  binNumber?: string;
  name?: string;
  classification?: string;
  intensity?: string | number;
  pressure?: string | number;
  latitude?: string | number;
  latitudeNumeric?: number;
  longitude?: string | number;
  longitudeNumeric?: number;
  movement?: string;
  movementDir?: number;
  movementSpeed?: number;
  lastUpdate?: string;
  forecastTrack?: { kmlFile?: string; geojsonFile?: string };
  forecastCone?: { kmlFile?: string; geojsonFile?: string };
}

interface NhcCurrentPayload {
  activeStorms?: NhcStormRecord[];
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function ktToMph(kt: number): number {
  return Math.round(kt * 1.15078);
}

export async function GET() {
  try {
    const res = await fetch(CURRENT_STORMS_URL, {
      next: { revalidate: 300 },
      headers: {
        "user-agent": "hurricane-atlas/1.0 (+https://hurricane-atlas.vercel.app)",
        accept: "application/json"
      }
    });
    if (!res.ok) {
      return NextResponse.json({ storms: [], error: `upstream ${res.status}` }, { status: 200 });
    }
    const json = (await res.json()) as NhcCurrentPayload;
    const storms: ActiveStorm[] = (json.activeStorms ?? []).map((s) => {
      const lat = s.latitudeNumeric ?? asNumber(s.latitude) ?? 0;
      const lon = s.longitudeNumeric ?? asNumber(s.longitude) ?? 0;
      const intensity = asNumber(s.intensity) ?? 0;
      const pressure = asNumber(s.pressure);
      return {
        id: s.id ?? s.binNumber ?? s.name ?? "unknown",
        name: s.name ?? "UNNAMED",
        classification: s.classification ?? "TC",
        intensity,
        intensityMph: ktToMph(intensity),
        pressureMb: pressure,
        lat,
        lon,
        movement: s.movement ?? "",
        advisoryUtc: s.lastUpdate ?? new Date().toISOString(),
        forecastConeUrl: s.forecastCone?.geojsonFile,
        forecastTrackUrl: s.forecastTrack?.geojsonFile
      };
    });
    return NextResponse.json({ storms });
  } catch (err) {
    return NextResponse.json(
      { storms: [], error: (err as Error).message },
      { status: 200 }
    );
  }
}
