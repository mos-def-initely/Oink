"use client";

/**
 * A short cross-fade on every navigation, so tapping a tab acknowledges itself
 * instead of hard-cutting to the next screen.
 *
 * Keyed on the pathname: the key change remounts the wrapper, which is what
 * restarts the CSS animation — a transition on a persistent element would only
 * fire once.
 *
 * Deliberately opacity-only. A translate here would make this element the
 * containing block for every `position: fixed` descendant for the duration of
 * the animation, which would tear the tab bar and any open sheet off the
 * viewport mid-navigation. Opacity creates a stacking context but not a
 * containing block, so it's safe. Screens that want movement animate their own
 * content (see the feed's `main`), well inside their own layout.
 */
import { usePathname } from "next/navigation";

export default function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="screen-in">
      {children}
    </div>
  );
}
