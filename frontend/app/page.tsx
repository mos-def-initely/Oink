/**
 * Home — server component, so the feed arrives in the HTML rather than after a
 * round of hydrate-then-fetch. The screen itself stays a client component; only
 * the first read moves here.
 */
import { serverFetch } from "@/lib/server-api";
import type { FeedItem } from "@/lib/types";
import FeedScreen from "@/components/FeedScreen";
import { FEED_PAGE_SIZE } from "@/lib/feed";

export default async function HomePage() {
  // Just the first page — the screen loads the rest on scroll, so the document
  // isn't held up assembling cards nobody has reached yet.
  const initialItems = await serverFetch<FeedItem[]>(
    `/feed?limit=${FEED_PAGE_SIZE}&offset=0`
  );
  return <FeedScreen initialItems={initialItems} />;
}
