/**
 * Pigsty — server wrapper. The crowd is fetched server-side so the field has
 * pigs in the HTML; the screen itself is a client component because panning
 * and zooming need pointer events.
 */
import { serverFetch } from "@/lib/server-api";
import type { User } from "@/lib/types";
import PigstyScreen from "@/components/PigstyScreen";

export default async function PigstyPage() {
  const initialUsers = await serverFetch<User[]>("/users");
  return <PigstyScreen initialUsers={initialUsers} />;
}
