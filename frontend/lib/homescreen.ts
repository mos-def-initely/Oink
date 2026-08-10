/**
 * Whether someone has been shown how to put Oink on their home screen.
 *
 * Kept per user id in localStorage, the same way the explainer is: no request,
 * no column, and a new phone showing it once more is the harmless direction to
 * be wrong in — that's the device they'd want to install it on anyway.
 *
 * Deliberately separate from the intro flag: everyone already using the app has
 * seen the intro, and this needs to reach them too.
 */
const seenKey = (userId: string) => `oink_a2hs_seen_${userId}`;

export type Platform = "ios" | "android" | "desktop";

export function platform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac, so a touch-capable "Mac" is an iPad.
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/iPhone|iPad|iPod/.test(ua) || iPadOS) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

/** Already launched from the home screen, so there's nothing to suggest. */
export function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone;
  return !!standalone || !!iosStandalone;
}

export function shouldOfferInstall(userId: string): boolean {
  if (isInstalled()) return false;
  try {
    return !localStorage.getItem(seenKey(userId));
  } catch {
    return false;
  }
}

export function markInstallOffered(userId: string) {
  try {
    localStorage.setItem(seenKey(userId), "1");
  } catch {
    /* storage disabled — it simply won't be remembered */
  }
}
