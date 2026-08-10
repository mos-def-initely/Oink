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
 * The anchor is **the review if the place has one**, otherwise the first log of
 * it in the feed. A write-up is the thing worth reading, so agreement belongs on
 * that card even when somebody oinked the place first — and a place nobody has
 * written up still keeps the oink row that introduced it.
 *
 * That trades strict chronology for readability: an oink from Tuesday can appear
 * under a review written on Thursday. The feed is already a set of events rather
 * than a timeline, and one card with three people behind it beats three rows
 * saying the same thing.
 *
 * Adding a place auto-oinks it, so anyone who adds somewhere and writes it up
 * holds both rows. The feed endpoint already collapses those to one card per
 * person per place with the review winning, so a self-oink shouldn't arrive
 * here — the guard below is a safety net, because if one ever did, the card
 * would report somebody agreeing with themselves.
 *
 * Two other things deliberately never fold:
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

/**
 * Rows per request. Small on purpose: the first screenful is what the home page
 * waits on, and every card can pull a place photo behind it. The rest arrives
 * as you scroll. Shared with the server render so both pages line up — if they
 * disagreed, the first scroll would either skip rows or repeat them.
 */
export const FEED_PAGE_SIZE = 10;

export type FoldedFeedItem = {
  item: FeedItem;
  /** Everyone who oinked this place *after* it was first logged. */
  agreed: User[];
};

const keyOf = (item: FeedItem) => `${item.activity}-${item.id}`;

export function foldFeed(items: FeedItem[]): FoldedFeedItem[] {
  // The feed arrives newest-first; anchors are found oldest-first.
  const oldestFirst = [...items].sort((a, b) => a.created_at.localeCompare(b.created_at));

  // Reviews claim their place first, so an oink folds onto the write-up rather
  // than anchoring just because it happened to come earlier.
  const anchorByPlace = new Map<string, FeedItem>();
  for (const item of oldestFirst) {
    if (item.activity !== "recommendation") continue;
    if (!anchorByPlace.has(item.restaurant.id)) anchorByPlace.set(item.restaurant.id, item);
  }

  const agreedByAnchor = new Map<string, User[]>();
  const folded = new Set<string>();

  for (const item of oldestFirst) {
    if (item.activity === "shame") continue;

    const placeId = item.restaurant.id;
    const anchor = anchorByPlace.get(placeId);

    if (!anchor) {
      anchorByPlace.set(placeId, item);
      continue;
    }
    if (item.activity !== "oink") continue;

    // Safety net — see the note at the top. Nobody agrees with themselves.
    if (item.user.id === anchor.user.id) {
      folded.add(keyOf(item));
      continue;
    }

    const anchorKey = keyOf(anchor);
    const agreed = agreedByAnchor.get(anchorKey) ?? [];
    agreed.push(item.user);
    agreedByAnchor.set(anchorKey, agreed);
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
