"use client";

/**
 * Discover map — spec §6.3.
 *
 * Pins carry the recommenders' pig **faces** (full bodies are reserved for the
 * feed and profile). Where several people rate a place, the extra faces fan out
 * behind the leader like a hand of cards, capped at three plus a count chip.
 * Places with only shame still get a pin, greyed out.
 *
 * Uses Leaflet directly rather than a React wrapper because the pins are custom
 * HTML — a divIcon holding the same pig SVG the rest of the app uses.
 *
 * Basemap is CARTO Positron: near-grey, hairline roads, dimmed labels, so the
 * coral pins are the only loud thing on screen. Needs no API key.
 */
import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Map as LeafletMap, Marker } from "leaflet";
import type { PlaceSummary } from "@/lib/types";
import PigAvatar from "@/components/pigs/PigAvatar";
import { ShamePig } from "@/components/pigs/ReactionPigs";
// Safe as a static import — this component is only loaded via next/dynamic
// with ssr:false.
import "leaflet/dist/leaflet.css";

const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Central London — a sensible opening view before any places load.
const DEFAULT_CENTER: [number, number] = [51.5127, -0.1345];
const DEFAULT_ZOOM = 13;

type Props = {
  places: PlaceSummary[];
  onSelect: (place: PlaceSummary) => void;
  /** Enables tap-to-drop-a-pin while adding a new place. */
  pickMode?: boolean;
  onPick?: (lat: number, lng: number) => void;
  pickedPoint?: { lat: number; lng: number } | null;
  className?: string;
};

function faceMarkup(place: PlaceSummary, index: number, size: number): string {
  const u = place.recommenders[index];
  return renderToStaticMarkup(
    <PigAvatar config={u?.pig_avatar_config} placesLogged={u?.places_logged ?? 0} size={size} bare />
  );
}

function pinHtml(place: PlaceSummary): string {
  const count = place.recommender_count;
  const shamed = place.shamed_only;
  const ring = shamed ? "#9A93A3" : "#FFFDFB";
  const bg = shamed ? "#D8D4DC" : "#FFFDFB";

  const disc = (inner: string, size: number, offset: string) => `
    <div style="
      position:absolute; ${offset}
      width:${size}px; height:${size}px; border-radius:50%;
      background:${bg}; border:2.5px solid ${ring};
      box-shadow:0 2px 8px rgba(43,27,61,.28);
      display:flex; align-items:center; justify-content:center; overflow:hidden;
    ">${inner}</div>`;

  // Fan the extra faces out behind the leader, furthest first so the front one
  // ends up on top.
  const fan = Math.min(count, 3);
  let layers = "";
  if (count === 0) {
    // Logged but unendorsed — the angry pig, not a generic emoji. Every icon in
    // the app is a pig.
    layers = disc(renderToStaticMarkup(<ShamePig size={34} active />), 42, "left:9px; top:0;");
  } else {
    if (fan >= 3) layers += disc(faceMarkup(place, 2, 24), 30, "left:0; top:12px;");
    if (fan >= 2) layers += disc(faceMarkup(place, 1, 26), 32, "right:0; top:10px;");
    layers += disc(faceMarkup(place, 0, 36), 42, "left:9px; top:0;");
  }

  const chip =
    count > 3
      ? `<div style="
           position:absolute; right:-4px; top:-4px;
           min-width:20px; height:20px; padding:0 5px; border-radius:10px;
           background:#FF4D6D; color:#fff; border:2px solid #FFFDFB;
           font-family:var(--font-display),system-ui; font-size:11px; font-weight:800;
           display:flex; align-items:center; justify-content:center;
           box-shadow:0 2px 6px rgba(43,27,61,.3);
         ">${count}</div>`
      : "";

  return `
    <div style="position:relative; width:60px; height:54px; ${shamed ? "filter:grayscale(1);opacity:.85;" : ""}">
      ${layers}${chip}
      <div style="
        position:absolute; left:50%; bottom:-7px; transform:translateX(-50%);
        width:0; height:0;
        border-left:6px solid transparent; border-right:6px solid transparent;
        border-top:9px solid ${shamed ? "#9A93A3" : "#FFFDFB"};
        filter:drop-shadow(0 2px 2px rgba(43,27,61,.22));
      "></div>
    </div>`;
}

export default function MapView({
  places,
  onSelect,
  pickMode = false,
  onPick,
  pickedPoint,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const pickMarkerRef = useRef<Marker | null>(null);
  const framedRef = useRef(false);
  // Leaflet is imported dynamically, so the map exists only after an async
  // tick. The marker effects key off this so they re-run once it's actually
  // ready rather than silently bailing out on first render.
  const [ready, setReady] = useState(false);
  // Kept in a ref so the click handler, bound once, always sees current values.
  const pickHandlers = useRef({ pickMode, onPick });
  pickHandlers.current = { pickMode, onPick };

  // Init once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false,
      });
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 20 }).addTo(map);
      L.control.zoom({ position: "bottomleft" }).addTo(map);

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const { pickMode: active, onPick: pick } = pickHandlers.current;
        if (active && pick) pick(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // Leaflet doesn't recompute its size when the container changes behind an
  // overlay (opening/closing the add-place sheet), which paints the map grey.
  // A resize observer keeps it in step.
  useEffect(() => {
    if (!ready || !containerRef.current) return;
    const observer = new ResizeObserver(() => mapRef.current?.invalidateSize());
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    if (ready) setTimeout(() => mapRef.current?.invalidateSize(), 0);
  }, [ready, pickMode]);

  // Redraw pins when the filtered set changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    (async () => {
      const L = (await import("leaflet")).default;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      places.forEach((place) => {
        const icon = L.divIcon({
          className: "oink-pin",
          html: pinHtml(place),
          iconSize: [60, 61],
          iconAnchor: [30, 61],
        });
        const marker = L.marker([place.lat, place.lng], { icon })
          .addTo(map)
          .on("click", () => onSelect(place));
        markersRef.current.push(marker);
      });

      // Frame the pins once on first load. Re-framing on every filter change
      // yanks the view around while the user is browsing.
      if (places.length && !framedRef.current && !pickHandlers.current.pickMode) {
        framedRef.current = true;
        const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: false });
      }
    })();
  }, [places, onSelect, ready]);

  // The dropped pin while adding a place
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    (async () => {
      const L = (await import("leaflet")).default;
      pickMarkerRef.current?.remove();
      pickMarkerRef.current = null;
      if (!pickedPoint) return;

      const icon = L.divIcon({
        className: "oink-pin",
        html: `<div style="
            width:34px;height:34px;border-radius:50%;
            background:#FF4D6D;border:3px solid #FFFDFB;
            box-shadow:0 3px 10px rgba(43,27,61,.32);
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-family:var(--font-display),system-ui;font-weight:800;font-size:20px;
          ">+</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });
      pickMarkerRef.current = L.marker([pickedPoint.lat, pickedPoint.lng], { icon }).addTo(map);
      map.setView([pickedPoint.lat, pickedPoint.lng], Math.max(map.getZoom(), 15));
    })();
  }, [pickedPoint, ready]);

  // The pick-mode classes go on a wrapper, never on the map element itself.
  // Leaflet adds `leaflet-container` (and `leaflet-touch`, `leaflet-fade-anim`
  // …) to that element imperatively after mount; React rewriting its className
  // on a later render strips them all off, which silently destroys the map's
  // styling — it blanks the moment you switch into pin-dropping.
  return (
    <div
      className={`${className} ${pickMode ? "oink-picking cursor-crosshair" : ""}`}
      aria-label="Map of recommended places"
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
