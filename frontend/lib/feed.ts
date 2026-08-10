/**
 * Feed folding — spec §6.2.
 *
 * An oink means two different things depending on what it lands on, and the feed
 * should say which:
 *
 *   - Oinking a place nobody has logged is **introducing** it. That's an event
 *     in its own right and gets its own row.
 *   - Oinking a place someone already logged is **agreeing**. That isn't news on
 *     its own, so it folds onto the log it agrees with and shows as a face.
 *
 * The anchor is the **first log of that place in the feed**, whichever kind it
 * is. So a place introduced by an oink collects its agreement on that oink row,
 * and a place introduced by a review collects it on the review card.
 *
 * Two things deliberately never fold:
 *   - **Shames.** Putting a disagreement on somebody's own card is a different
 *     decision from showing agreement, so a shame stays a row of its own.
 *   - **A second recommendation.** Somebody writing their own review is a real
 *     log, not agreement, however many people got there first.
 *
 * The feed is a recent-activity window, so an oink whose original log has
 * scrolled out of that window has nothing to attach to. It becomes its own row
 * rather than vanishing — the alternative loses the event entirely.
 */
import type { FeedItem, User } from "@/lib/types";

export type FoldedFeedItem = {
  item: FeedItem;
  /** Everyone who oinked this place *after* it was first logged. */
  agreed: User[];
};

const keyOf = (item: FeedItem) => `${item.activity}-${item.id}`;

export function foldFeed(items: FeedItem[]): FoldedFeedItem[] {
  // The feed arrives newest-first; anchors are found oldest-first.
  const oldestFirst = [...items].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const anchorByPlace = new Map<string, string>();
  const agreedByAnchor = new Map<string, User[]>();
  const folded = new Set<string>();

  for (const item of oldestFirst) {
    if (item.activity === "shame") continue;

    const placeId = item.restaurant.id;
    const anchor = anchorByPlace.get(placeId);

    if (!anchor) {
      anchorByPlace.set(placeId, keyOf(item));
      continue;
    }
    if (item.activity !== "oink") continue;

    const agreed = agreedByAnchor.get(anchor) ?? [];
    agreed.push(item.user);
    agreedByAnchor.set(anchor, agreed);
    folded.add(keyOf(item));
  }

  return items
    .filter((item) => !folded.has(keyOf(item)))
    .map((item) => ({ item, agreed: agreedByAnchor.get(keyOf(item)) ?? [] }));
}

/** "zeynep oinked this" · "zeynep and mert" · "zeynep and 3 others". */
export function agreementLabel(agreed: User[]): string {
  const [first, ...rest] = agreed.map((u) => u.display_name);
  if (rest.length === 0) return `${first} oinked this`;
  if (rest.length === 1) return `${first} and ${rest[0]} oinked this`;
  return `${first} and ${rest.length} others oinked this`;
}
