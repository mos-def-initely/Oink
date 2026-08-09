"use client";

/** Wishlist — spec §6.5: its own page, with the same list/map toggle as Discover. */
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { PlaceSummary } from "@/lib/types";
import PlaceListCard from "@/components/PlaceListCard";
import BottomTabBar, { TabBarSpacer } from "@/components/BottomTabBar";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-oat-deep" />,
});

export default function WishlistPage() {
  const router = useRouter();
  const [places, setPlaces] = useState<PlaceSummary[] | null>(null);
  const [view, setView] = useState<"list" | "map">("list");

  useEffect(() => {
    api.wishlist().then(setPlaces).catch(() => setPlaces([]));
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col">
      <PageHeader
        title="Wishlist"
        back="/profile/me"
        right={
          <div className="flex overflow-hidden rounded-xl border-2 border-ink bg-cream">
            {(["list", "map"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-2 font-display text-sm font-bold ${
                  view === v ? "bg-plum text-oat" : "text-ink"
                }`}
              >
                {v === "list" ? "List" : "Map"}
              </button>
            ))}
          </div>
        }
      />

      <div className="relative flex-1 overflow-hidden">
        {!places && <Spinner />}

        {places?.length === 0 && (
          <EmptyState title="Nothing on the wishlist" body="Find somewhere on Discover and star it." />
        )}

        {places && places.length > 0 && view === "list" && (
          <div className="h-full space-y-3 overflow-y-auto px-3 py-1 pb-24">
            {places.map((p) => (
              <PlaceListCard key={p.id} place={p} />
            ))}
          </div>
        )}

        {places && places.length > 0 && view === "map" && (
          <MapView
            places={places}
            onSelect={(p) => router.push(`/restaurant/${p.id}`)}
            className="h-full w-full"
          />
        )}
      </div>

      <TabBarSpacer />
      <BottomTabBar />
    </div>
  );
}
