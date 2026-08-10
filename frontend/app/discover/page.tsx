"use client";

/** Discover — map/list toggle, filters, add-place FAB (spec §6.3). */
import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Kind, PlaceSummary } from "@/lib/types";
import { BUDGETS, Budget } from "@/lib/pig";
import { BAR_CATEGORIES } from "@/lib/categories";
import BottomTabBar from "@/components/BottomTabBar";
import PlaceListCard from "@/components/PlaceListCard";
import PigAvatar from "@/components/pigs/PigAvatar";
import { BudgetTag } from "@/components/pigs/PricePig";
import AddPlaceSheet from "@/components/AddPlaceSheet";
import { EmptyState, KIND_LABELS, Sheet, Spinner } from "@/components/ui";

// Leaflet touches `window` at import time, so it can't be server-rendered.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-oat-deep" />,
});

export default function DiscoverPage() {
  const [places, setPlaces] = useState<PlaceSummary[] | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [selected, setSelected] = useState<PlaceSummary | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [pickedPoint, setPickedPoint] = useState<{ lat: number; lng: number } | null>(null);
  // Bumped when starting a genuinely new place, so the sheet blanks itself.
  const [addResetKey, setAddResetKey] = useState(0);

  const [kinds, setKinds] = useState<Kind[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const load = useCallback(() => {
    api.places().then(setPlaces).catch(() => setPlaces([]));
  }, []);

  useEffect(load, [load]);

  // Filtering happens client-side so toggling a filter doesn't refetch. The API
  // supports the same filters for when the dataset outgrows this.
  const filtered = useMemo(() => {
    if (!places) return [];
    return places.filter((p) => {
      if (kinds.length && !kinds.includes(p.kind)) return false;
      if (budgets.length && !budgets.includes(p.budget)) return false;
      if (categories.length) {
        const own = p.category.map((c) => c.toLowerCase());
        if (!categories.some((c) => own.includes(c.toLowerCase()))) return false;
      }
      return true;
    });
  }, [places, kinds, budgets, categories]);

  const allCategories = useMemo(() => {
    const set = new Set<string>(BAR_CATEGORIES);
    places?.forEach((p) => p.category.forEach((c) => set.add(c)));
    return [...set].sort();
  }, [places]);

  const activeFilters = kinds.length + budgets.length + categories.length;

  function toggle<T>(list: T[], setList: (v: T[]) => void, value: T) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <div className="relative flex h-[100dvh] flex-col">
      <header className="z-[900] bg-oat px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h1 className="wordmark flex-1 text-2xl">discover</h1>
          <button
            onClick={() => setFiltersOpen(true)}
            className={`btn px-3 py-2 text-sm ${
              activeFilters ? "bg-plum text-oat" : "bg-cream"
            }`}
          >
            filters{activeFilters ? ` (${activeFilters})` : ""}
          </button>
          <div className="flex overflow-hidden rounded-xl border-2 border-ink bg-cream">
            {(["map", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-2 font-display text-sm font-bold ${
                  view === v ? "bg-plum text-oat" : "text-ink"
                }`}
              >
                {v === "map" ? "map" : "list"}
              </button>
            ))}
          </div>
        </div>
        {pickMode && (
          <p className="mt-2 rounded-lg border-2 border-ink bg-gold px-3 py-2 text-center font-display text-xs font-bold text-ink-deep">
            tap the map to drop your pin
          </p>
        )}
      </header>

      <div className="relative flex-1 overflow-hidden">
        {!places && <Spinner label="finding the good stuff…" />}

        {places && (
          <div className={view === "map" ? "h-full w-full" : "hidden"}>
            <MapView
              places={filtered}
              onSelect={setSelected}
              pickMode={pickMode}
              pickedPoint={pickedPoint}
              onPick={(lat, lng) => {
                setPickedPoint({ lat, lng });
                setPickMode(false);
                setAddOpen(true);
              }}
              className="h-full w-full"
            />
          </div>
        )}

        {places && view === "list" && (
          <div className="h-full space-y-3 overflow-y-auto px-3 py-1 pb-24">
            {filtered.length === 0 && (
              <EmptyState title="nothing matches" body="loosen the filters a bit" />
            )}
            {filtered.map((p) => (
              <PlaceListCard key={p.id} place={p} />
            ))}
          </div>
        )}

        {/* Add-place FAB — bottom right, in the thumb zone (spec §6.3) */}
        <button
          onClick={() => {
            setPickedPoint(null);
            setAddResetKey((k) => k + 1);
            setAddOpen(true);
          }}
          className="absolute bottom-24 right-4 z-[1000] flex h-16 w-16 items-center justify-center rounded-full bg-plum font-display text-4xl font-extrabold text-white transition-transform active:scale-95"
          aria-label="Add a place"
        >
          +
        </button>
      </div>

      <BottomTabBar />

      {/* Pin tap → bottom sheet (spec §6.3) */}
      <Sheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""}>
        {selected && (
          <div className="space-y-3 pb-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-ink-soft">
                {[KIND_LABELS[selected.kind], ...selected.category].filter(Boolean).join(" · ")}
              </p>
              <BudgetTag budget={selected.budget} />
            </div>

            {selected.city && (
              <p className="text-sm">{[selected.area, selected.city].filter(Boolean).join(", ")}</p>
            )}

            <div>
              <p className="font-display text-sm font-bold">
                {selected.recommender_count > 0 ? "recommended by" : "nobody's endorsed this yet"}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {selected.recommenders.map((u) => (
                  <span key={u.id} className="flex items-center gap-1">
                    <PigAvatar
                      config={u.pig_avatar_config}
                      placesLogged={u.places_logged}
                      size={28}
                      variant="face"
                    />
                    <span className="text-xs">{u.display_name}</span>
                  </span>
                ))}
                {selected.shame_count > 0 && (
                  <span className="tag bg-rust text-oat">{selected.shame_count} shame</span>
                )}
              </div>
            </div>

            <Link href={`/restaurant/${selected.id}`} className="btn-primary block text-center">
              View details
            </Link>
          </div>
        )}
      </Sheet>

      {/* Filters */}
      <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="filters">
        <div className="space-y-4 pb-4">
          <section>
            <p className="mb-1.5 font-display text-sm font-bold">type</p>
            <div className="flex gap-2">
              {(["restaurant", "bar", "cafe"] as Kind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => toggle(kinds, setKinds, k)}
                  className={`btn flex-1 text-xs ${
                    kinds.includes(k) ? "bg-plum text-oat" : "bg-cream"
                  }`}
                >
                  {KIND_LABELS[k]}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-1.5 font-display text-sm font-bold">budget</p>
            <div className="grid grid-cols-4 gap-1.5">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  onClick={() => toggle(budgets, setBudgets, b)}
                  className={`btn flex items-center justify-center px-1 py-2 ${
                    budgets.includes(b) ? "bg-lemon" : "bg-cream"
                  }`}
                >
                  <BudgetTag budget={b} size={30} />
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="mb-1.5 font-display text-sm font-bold">category</p>
            <div className="flex flex-wrap gap-1.5">
              {allCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => toggle(categories, setCategories, c)}
                  className={`tag ${categories.includes(c) ? "bg-plum text-oat" : ""}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </section>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setKinds([]);
                setBudgets([]);
                setCategories([]);
              }}
              className="btn-plain flex-1"
            >
              Clear
            </button>
            <button onClick={() => setFiltersOpen(false)} className="btn-primary flex-1">
              Show {filtered.length}
            </button>
          </div>
        </div>
      </Sheet>

      <AddPlaceSheet
        open={addOpen}
        resetKey={addResetKey}
        onClose={() => setAddOpen(false)}
        pickedPoint={pickedPoint}
        onRequestPick={() => {
          setAddOpen(false);
          setPickMode(true);
          setView("map");
        }}
        onPointResolved={(lat, lng) => setPickedPoint({ lat, lng })}
        onCreated={() => {
          load();
          setPickedPoint(null);
          setAddResetKey((k) => k + 1);
        }}
      />
    </div>
  );
}
