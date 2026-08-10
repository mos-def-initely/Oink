/**
 * Discover — server component wrapper. Fetches the places server-side so the
 * map and list have data in the HTML; the screen itself stays a client
 * component because Leaflet needs the browser.
 */
import { serverFetch } from "@/lib/server-api";
import type { PlaceSummary } from "@/lib/types";
import DiscoverScreen from "@/components/DiscoverScreen";

export default async function DiscoverPage() {
  const initialPlaces = await serverFetch<PlaceSummary[]>("/restaurants");
  return <DiscoverScreen initialPlaces={initialPlaces} />;
}
