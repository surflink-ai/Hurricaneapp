"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl, { type Map as MapboxMap, type LngLatBoundsLike } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { ActiveStorm, StormSummary } from "@/lib/types";
import { useAtlasStore } from "@/lib/store";
import {
  categoryColorExpression,
  dimmedOpacityExpression,
  landfallStrokeColorExpression,
  landfallStrokeExpression,
  lineWidthExpression
} from "@/lib/mapbox-expressions";
import { CAT_COLORS, CAT_LABELS } from "@/lib/saffir";
import { withBase } from "@/lib/base-path";

const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

interface TrackFeatureProps {
  id: string;
  name: string;
  year: number;
  peakCat: string;
}

interface PointFeatureProps {
  id: string;
  cat: string;
  recordId: string;
  windKt: number;
  iso: string;
}

function buildTracksGeoJson(
  storms: ReadonlyArray<{ id: string; name: string; year: number; peakCat: string; coords: [number, number][] }>
): GeoJSON.FeatureCollection<GeoJSON.LineString, TrackFeatureProps> {
  return {
    type: "FeatureCollection",
    features: storms.map((s) => ({
      type: "Feature",
      id: s.id,
      properties: { id: s.id, name: s.name, year: s.year, peakCat: s.peakCat },
      geometry: { type: "LineString", coordinates: s.coords }
    }))
  };
}

interface AtlasMapProps {
  index: ReadonlyArray<StormSummary>;
}

export function AtlasMap({ index }: AtlasMapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [tracksReady, setTracksReady] = useState(false);
  const filteredIds = useAtlasStore((s) => s.filteredIds);
  const selectedStormId = useAtlasStore((s) => s.selectedStormId);
  const setSelectedStormId = useAtlasStore((s) => s.setSelectedStormId);
  const compareIds = useAtlasStore((s) => s.compareIds);
  const mode = useAtlasStore((s) => s.mode);
  const seasonYear = useAtlasStore((s) => s.seasonYear);
  const seasonT = useAtlasStore((s) => s.seasonT);
  const indexById = useMemo(() => {
    const m = new Map<string, StormSummary>();
    for (const s of index) m.set(s.id, s);
    return m;
  }, [index]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    if (!TOKEN) {
      console.warn("Missing NEXT_PUBLIC_MAPBOX_TOKEN");
      return;
    }
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: ref.current,
      style: MAP_STYLE,
      center: [-60, 26],
      zoom: 3.1,
      attributionControl: true,
      projection: "mercator",
      maxBounds: [[-130, -10], [25, 70]] as LngLatBoundsLike
    });
    mapRef.current = map;

    map.on("load", async () => {
      const styleLayers = map.getStyle()?.layers ?? [];
      for (const layer of styleLayers) {
        if (layer.type === "fill" && layer.id.includes("water")) {
          map.setPaintProperty(layer.id, "fill-color", "#e9eef2");
        }
        if (layer.type === "fill" && layer.id.includes("land")) {
          map.setPaintProperty(layer.id, "fill-color", "#fbfaf6");
        }
      }
      try {
        const res = await fetch(withBase("/data/storms.json"));
        const stormsObj = (await res.json()) as Record<string, { id: string; name: string; year: number; peakCat: string; observations: { lat: number; lon: number; recordId: string; status: string; windKt: number; iso: string }[] }>;
        const tracks = Object.values(stormsObj).map((s) => ({
          id: s.id,
          name: s.name,
          year: s.year,
          peakCat: s.peakCat,
          coords: s.observations.map((o) => [o.lon, o.lat] as [number, number])
        }));

        map.addSource("tracks", {
          type: "geojson",
          data: buildTracksGeoJson(tracks),
          promoteId: "id"
        });

        map.addLayer({
          id: "tracks-line",
          type: "line",
          source: "tracks",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": categoryColorExpression("peakCat"),
            "line-width": lineWidthExpression(2.4, 1.1),
            "line-opacity": dimmedOpacityExpression(1.0, 0.08, 0.65)
          }
        });

        const pointFeatures: GeoJSON.Feature<GeoJSON.Point, PointFeatureProps>[] = [];
        for (const s of Object.values(stormsObj)) {
          for (const o of s.observations) {
            pointFeatures.push({
              type: "Feature",
              properties: {
                id: s.id,
                cat: catFromKt(o.windKt),
                recordId: o.recordId,
                windKt: o.windKt,
                iso: o.iso
              },
              geometry: { type: "Point", coordinates: [o.lon, o.lat] }
            });
          }
        }
        map.addSource("points", {
          type: "geojson",
          data: { type: "FeatureCollection", features: pointFeatures },
          promoteId: "id"
        });
        map.addLayer({
          id: "track-points",
          type: "circle",
          source: "points",
          minzoom: 4,
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4, 1.4,
              7, 3.2,
              10, 5
            ],
            "circle-color": categoryColorExpression("cat"),
            "circle-stroke-color": landfallStrokeColorExpression(),
            "circle-stroke-width": landfallStrokeExpression(),
            "circle-opacity": dimmedOpacityExpression(1.0, 0.05, 0.55)
          }
        });

        map.addSource("active", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] }
        });
        map.addLayer({
          id: "active-pulse",
          type: "circle",
          source: "active",
          paint: {
            "circle-radius": [
              "interpolate", ["linear"], ["zoom"],
              3, 6, 7, 14, 10, 22
            ],
            "circle-color": "#9a2a1f",
            "circle-opacity": 0.18,
            "circle-stroke-color": "#9a2a1f",
            "circle-stroke-width": 1.4
          }
        });

        map.on("click", "tracks-line", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const id = (f.properties as { id?: string } | null)?.id;
          if (id) setSelectedStormId(id);
        });
        map.on("mouseenter", "tracks-line", () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", "tracks-line", () => { map.getCanvas().style.cursor = ""; });

        map.on("click", "track-points", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const props = f.properties as PointFeatureProps | null;
          if (!props) return;
          const lng = (f.geometry as GeoJSON.Point).coordinates[0]!;
          const lat = (f.geometry as GeoJSON.Point).coordinates[1]!;
          const summary = indexById.get(props.id);
          const date = new Date(props.iso).toUTCString().replace(":00 GMT", " UTC");
          new mapboxgl.Popup({ closeButton: false, maxWidth: "260px", offset: 10 })
            .setLngLat([lng, lat])
            .setHTML(`
<div style="background:#fdfdfb;color:#0a0a08;padding:10px 12px;font-family:'Geist Sans',ui-sans-serif,system-ui,sans-serif;">
  <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:9px;letter-spacing:0.18em;color:#3a3a36;text-transform:uppercase;">
    ${summary ? `${summary.name} ${summary.year}` : props.id}
  </div>
  <div style="font-family:Fraunces,ui-serif,Georgia,serif;font-size:18px;margin-top:4px;">
    ${props.windKt} kt · ${CAT_LABELS[props.cat as keyof typeof CAT_LABELS] ?? props.cat}
  </div>
  <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;color:#3a3a36;margin-top:4px;">
    ${date}${props.recordId === "L" ? " · LANDFALL" : ""}
  </div>
</div>
`)
            .addTo(map);
        });

        setTracksReady(true);
      } catch (err) {
        console.error("[AtlasMap] data load failed", err);
      }
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [indexById, setSelectedStormId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tracksReady) return;
    if (!map.isStyleLoaded()) return;

    const visible = new Set(filteredIds);
    const cmp = new Set(compareIds);

    if (mode === "compare") {
      for (const f of map.querySourceFeatures("tracks")) {
        const id = (f.properties as { id?: string } | null)?.id;
        if (!id) continue;
        const isSel = cmp.has(id);
        map.setFeatureState({ source: "tracks", id }, { selected: isSel, dimmed: !isSel });
      }
    } else {
      for (const f of map.querySourceFeatures("tracks")) {
        const id = (f.properties as { id?: string } | null)?.id;
        if (!id) continue;
        const inFilter = visible.has(id);
        const sel = id === selectedStormId;
        map.setFeatureState({ source: "tracks", id }, { selected: sel, dimmed: !inFilter });
      }
    }
  }, [filteredIds, compareIds, mode, selectedStormId, tracksReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tracksReady) return;
    if (mode !== "season") return;
    const seasonStorms = index.filter((s) => s.year === seasonYear);
    if (seasonStorms.length === 0) return;
    const tStart = Math.min(...seasonStorms.map((s) => new Date(s.start).getTime()));
    const tEnd = Math.max(...seasonStorms.map((s) => new Date(s.end).getTime()));
    const t = tStart + (tEnd - tStart) * seasonT;
    for (const s of index) {
      const inSeason = s.year === seasonYear;
      const start = inSeason ? new Date(s.start).getTime() : 0;
      const end = inSeason ? new Date(s.end).getTime() : 0;
      const active = inSeason && t >= start;
      const expired = inSeason && t > end + 86_400_000;
      map.setFeatureState(
        { source: "tracks", id: s.id },
        { selected: active && !expired, dimmed: !inSeason || expired }
      );
    }
  }, [seasonYear, seasonT, mode, index, tracksReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tracksReady) return;
    let cancel = false;
    fetch(withBase("/data/active.json"))
      .then((r) => (r.ok ? r.json() : { storms: [] }))
      .then((j: { storms?: ActiveStorm[] }) => {
        if (cancel) return;
        const features: GeoJSON.Feature<GeoJSON.Point, { name: string }>[] = (j.storms ?? []).map((s) => ({
          type: "Feature",
          properties: { name: s.name },
          geometry: { type: "Point", coordinates: [s.lon, s.lat] }
        }));
        const src = map.getSource("active") as mapboxgl.GeoJSONSource | undefined;
        if (src) src.setData({ type: "FeatureCollection", features });
      });
    return () => { cancel = true; };
  }, [tracksReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tracksReady || !selectedStormId) return;
    const s = indexById.get(selectedStormId);
    if (!s) return;
    map.fitBounds(
      [
        [s.bbox[0] - 2, s.bbox[1] - 2],
        [s.bbox[2] + 2, s.bbox[3] + 2]
      ],
      { padding: 80, duration: 700, maxZoom: 6 }
    );
  }, [selectedStormId, indexById, tracksReady]);

  return (
    <div className="relative h-full w-full">
      <div ref={ref} className="absolute inset-0" />
      <Legend />
    </div>
  );
}

function catFromKt(kt: number): string {
  if (kt >= 137) return "c5";
  if (kt >= 113) return "c4";
  if (kt >= 96) return "c3";
  if (kt >= 83) return "c2";
  if (kt >= 64) return "c1";
  if (kt >= 34) return "ts";
  return "sub";
}

function Legend() {
  const cats: Array<keyof typeof CAT_COLORS> = ["sub", "ts", "c1", "c2", "c3", "c4", "c5"];
  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10 border border-rule bg-paper/95 px-3 py-2 backdrop-blur-sm">
      <p className="font-mono text-[9px] uppercase tracking-eyebrow text-ink-soft">Saffir-Simpson</p>
      <ul className="mt-1.5 flex items-center gap-2">
        {cats.map((c) => (
          <li key={c} className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-3" style={{ backgroundColor: CAT_COLORS[c] }} />
            <span className="font-mono text-[10px] text-ink">{CAT_LABELS[c]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
