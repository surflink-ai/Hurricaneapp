import { mkdir, writeFile } from "node:fs/promises";
import type { ActiveStorm } from "../lib/types";

const URL = "https://www.nhc.noaa.gov/CurrentStorms.json";

interface NhcRecord {
  id?: string; binNumber?: string; name?: string; classification?: string;
  intensity?: string | number; pressure?: string | number;
  latitude?: string | number; latitudeNumeric?: number;
  longitude?: string | number; longitudeNumeric?: number;
  movement?: string; lastUpdate?: string;
  forecastTrack?: { kmlFile?: string; geojsonFile?: string };
  forecastCone?: { kmlFile?: string; geojsonFile?: string };
}

function n(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") { const x = parseFloat(v); if (Number.isFinite(x)) return x; }
  return null;
}

async function main(): Promise<void> {
  await mkdir("public/data", { recursive: true });
  let storms: ActiveStorm[] = [];
  try {
    const res = await fetch(URL, {
      headers: { "user-agent": "hurricane-atlas/1.0", accept: "application/json" }
    });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const json = (await res.json()) as { activeStorms?: NhcRecord[] };
    storms = (json.activeStorms ?? []).map((s) => {
      const lat = s.latitudeNumeric ?? n(s.latitude) ?? 0;
      const lon = s.longitudeNumeric ?? n(s.longitude) ?? 0;
      const intensity = n(s.intensity) ?? 0;
      const pressure = n(s.pressure);
      return {
        id: s.id ?? s.binNumber ?? s.name ?? "unknown",
        name: s.name ?? "UNNAMED",
        classification: s.classification ?? "TC",
        intensity,
        intensityMph: Math.round(intensity * 1.15078),
        pressureMb: pressure,
        lat, lon,
        movement: s.movement ?? "",
        advisoryUtc: s.lastUpdate ?? new Date().toISOString(),
        forecastConeUrl: s.forecastCone?.geojsonFile,
        forecastTrackUrl: s.forecastTrack?.geojsonFile
      };
    });
    console.log(`[fetch-active] ${storms.length} active storm(s)`);
  } catch (err) {
    console.warn(`[fetch-active] NHC unreachable: ${(err as Error).message}; writing empty list`);
  }
  await writeFile("public/data/active.json", JSON.stringify({ storms, generated: new Date().toISOString() }));
}

main().catch((err) => {
  console.error("[fetch-active] failed:", err);
});
