"use client";

import { useEffect, useRef } from "react";
import mapboxgl, { type Map as MapboxMap } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { CAT_COLORS } from "@/lib/saffir";
import type { Observation } from "@/lib/types";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

interface Props {
  observations: ReadonlyArray<Observation>;
  bbox: [number, number, number, number];
  peakCat: keyof typeof CAT_COLORS;
  cameraBbox: [number, number, number, number] | null;
  focusObsIndex: number | null;
}

export function StoryMap({ observations, bbox, peakCat, cameraBbox, focusObsIndex }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const ready = useRef(false);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    if (!TOKEN) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: ref.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
      zoom: 4,
      attributionControl: true
    });
    mapRef.current = map;
    map.on("load", () => {
      const styleLayers = map.getStyle()?.layers ?? [];
      for (const layer of styleLayers) {
        if (layer.type === "fill" && layer.id.includes("water")) {
          map.setPaintProperty(layer.id, "fill-color", "#e9eef2");
        }
        if (layer.type === "fill" && layer.id.includes("land")) {
          map.setPaintProperty(layer.id, "fill-color", "#fbfaf6");
        }
      }
      const coords = observations.map((o) => [o.lon, o.lat] as [number, number]);
      map.addSource("track", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: coords }
        }
      });
      map.addLayer({
        id: "track-line",
        type: "line",
        source: "track",
        paint: {
          "line-color": CAT_COLORS[peakCat],
          "line-width": 2.4,
          "line-opacity": 0.9
        }
      });
      map.addSource("track-points", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: observations.map((o, i) => ({
            type: "Feature",
            properties: { i, recordId: o.recordId },
            geometry: { type: "Point", coordinates: [o.lon, o.lat] }
          }))
        }
      });
      map.addLayer({
        id: "track-circles",
        type: "circle",
        source: "track-points",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "recordId"], "L"], 5,
            2.6
          ],
          "circle-color": CAT_COLORS[peakCat],
          "circle-stroke-color": "#0a0a08",
          "circle-stroke-width": [
            "case",
            ["==", ["get", "recordId"], "L"], 1.8,
            0.6
          ]
        }
      });
      map.addSource("focus", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      });
      map.addLayer({
        id: "focus-pulse",
        type: "circle",
        source: "focus",
        paint: {
          "circle-radius": 11,
          "circle-color": "transparent",
          "circle-stroke-color": "#9a2a1f",
          "circle-stroke-width": 1.8
        }
      });
      ready.current = true;
      map.fitBounds(
        [
          [bbox[0] - 1, bbox[1] - 1],
          [bbox[2] + 1, bbox[3] + 1]
        ],
        { padding: 60, duration: 0 }
      );
    });
    return () => { map.remove(); mapRef.current = null; ready.current = false; };
  }, [observations, bbox, peakCat]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    if (!cameraBbox) return;
    map.fitBounds(
      [
        [cameraBbox[0], cameraBbox[1]],
        [cameraBbox[2], cameraBbox[3]]
      ],
      { padding: 80, duration: 1100, maxZoom: 6.5, essential: true }
    );
  }, [cameraBbox]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready.current) return;
    const o = focusObsIndex != null ? observations[focusObsIndex] : null;
    const src = map.getSource("focus") as mapboxgl.GeoJSONSource | undefined;
    if (!src) return;
    if (o) {
      src.setData({
        type: "FeatureCollection",
        features: [{ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [o.lon, o.lat] } }]
      });
    } else {
      src.setData({ type: "FeatureCollection", features: [] });
    }
  }, [focusObsIndex, observations]);

  return <div ref={ref} className="absolute inset-0" />;
}
