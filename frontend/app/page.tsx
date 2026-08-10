"use client";

/** Home — recent activity from the whole friend group (spec §6.2). */
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { FeedItem } from "@/lib/types";
import ActivityCard from "@/components/ActivityCard";
import BottomTabBar, { TabBarSpacer } from "@/components/BottomTabBar";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";

export default function HomePage() {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .feed()
      .then(setItems)
      .catch((e) => setError(e.message ?? "Couldn't load the feed"));
  }, []);

  return (
    <>
      <header className="sticky top-0 z-[900] flex items-baseline justify-between bg-oat/95 px-3 py-3 backdrop-blur">
        <span className="wordmark text-3xl">oink</span>
        <span className="micro">feed</span>
      </header>

      <main className="space-y-4 px-3 pb-4">
        {error && <EmptyState title="couldn't load the feed" body={error} />}
        {!items && !error && <Spinner label="fetching the goss…" />}
        {items?.length === 0 && (
          <EmptyState title="nothing here yet" body="head to discover and log the first place" />
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
