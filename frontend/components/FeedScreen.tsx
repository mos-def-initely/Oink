"use client";

/** Home — recent activity from the whole friend group (spec §6.2). */
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { FeedItem } from "@/lib/types";
import ActivityCard from "@/components/ActivityCard";
import BottomTabBar, { TabBarSpacer } from "@/components/BottomTabBar";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";

export default function FeedScreen({ initialItems }: { initialItems: FeedItem[] | null }) {
  const [items, setItems] = useState<FeedItem[] | null>(initialItems);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Already server-rendered — don't fetch the same thing again on mount.
    if (initialItems) return;
    api
      .feed()
      .then(setItems)
      .catch((e) => setError(e.message ?? "Couldn't load the feed"));
  }, [initialItems]);

  return (
    <>
      <PageHeader title="Oink" />

      <main className="space-y-4 px-3 pb-4">
        {error && <EmptyState title="Couldn't load the feed" body={error} />}
        {!items && !error && <Spinner label="Fetching the goss…" />}
        {items?.length === 0 && (
          <EmptyState title="Nothing here yet" body="Head to Discover and log the first place." />
        )}
        {items?.map((item) => (
          <ActivityCard key={`${item.activity}-${item.id}`} item={item} />
        ))}
      </main>

      <TabBarSpacer />
      <BottomTabBar />
    </>
  );
}
