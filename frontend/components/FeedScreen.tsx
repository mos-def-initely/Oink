"use client";

/** Home — recent activity from the whole friend group (spec §6.2). */
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { FeedItem } from "@/lib/types";
import ActivityCard from "@/components/ActivityCard";
import BottomTabBar, { TabBarSpacer } from "@/components/BottomTabBar";
import { EmptyState, PageHeader, Spinner } from "@/components/ui";
import HowItWorks from "@/components/HowItWorks";
import { introPending, markIntroSeen } from "@/lib/intro";

export default function FeedScreen({ initialItems }: { initialItems: FeedItem[] | null }) {
  const [items, setItems] = useState<FeedItem[] | null>(initialItems);
  const [error, setError] = useState<string | null>(null);
  // Set at sign-in for anyone who hasn't seen the explainer on this device.
  const [introFor, setIntroFor] = useState<string | null>(null);

  useEffect(() => setIntroFor(introPending()), []);

  useEffect(() => {
    // Same as Discover: the server payload is a snapshot, so refresh behind it
    // rather than trusting it forever. Errors are only surfaced when there's
    // nothing on screen already — a failed background refresh shouldn't replace
    // a feed that's rendering fine.
    api
      .feed()
      .then(setItems)
      .catch((e) => {
        if (!initialItems) setError(e.message ?? "Couldn't load the feed");
      });
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

      <HowItWorks
        open={!!introFor}
        onClose={() => {
          if (introFor) markIntroSeen(introFor);
          setIntroFor(null);
        }}
      />
    </>
  );
}
