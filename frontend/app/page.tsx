/**
 * Home — server component, so the feed arrives in the HTML rather than after a
 * round of hydrate-then-fetch. The screen itself stays a client component; only
 * the first read moves here.
 */
import { serverFetch } from "@/lib/server-api";
import type { FeedItem } from "@/lib/types";
import FeedScreen from "@/components/FeedScreen";

export default async function HomePage() {
  const initialItems = await serverFetch<FeedItem[]>("/feed?limit=30&offset=0");
  return <FeedScreen initialItems={initialItems} />;
}
