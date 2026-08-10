/**
 * Whether someone has been shown the "how Oink works" explainer.
 *
 * Kept per user id in localStorage rather than on the account: it costs no
 * request and no column, and the only cost of it being device-local is that a
 * new phone shows the explainer once more — which is the harmless direction to
 * be wrong in.
 */
const seenKey = (userId: string) => `oink_intro_seen_${userId}`;
const PENDING = "oink_intro_pending";

/** Called at sign-in: queues the explainer if this user hasn't seen it here. */
export function queueIntroIfNew(userId: string) {
  try {
    if (!localStorage.getItem(seenKey(userId))) localStorage.setItem(PENDING, userId);
  } catch {
    /* private mode, or storage disabled — skip the explainer rather than break sign-in */
  }
}

export function introPending(): string | null {
  try {
    return localStorage.getItem(PENDING);
  } catch {
    return null;
  }
}

export function markIntroSeen(userId: string) {
  try {
    localStorage.setItem(seenKey(userId), "1");
    localStorage.removeItem(PENDING);
  } catch {
    /* nothing to do */
  }
}
