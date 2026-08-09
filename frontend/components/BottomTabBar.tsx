"use client";

/**
 * Primary navigation — spec §6: a thumb-reachable bottom tab bar, not a
 * desktop-style top nav.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Feed", icon: FeedIcon },
  { href: "/discover", label: "Discover", icon: MapIcon },
  { href: "/profile/me", label: "You", icon: PigIcon },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-[1000] w-full max-w-[480px] -translate-x-1/2 bg-cream pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_14px_rgba(43,27,61,0.10)]">
      <ul className="flex">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href.replace("/me", ""));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-0.5 py-2 font-display text-[11px] font-bold ${
                  active ? "text-coral" : "text-ink-soft"
                }`}
              >
                <Icon active={active} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Spacer so page content isn't hidden behind the fixed bar. */
export function TabBarSpacer() {
  return <div className="h-[74px]" aria-hidden />;
}

function FeedIcon({ active }: { active: boolean }) {
  const c = active ? "#FF4D6D" : "#6A5A7A";
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2">
      <rect x="3" y="4" width="18" height="6" rx="2.5" />
      <rect x="3" y="14" width="18" height="6" rx="2.5" />
    </svg>
  );
}

function MapIcon({ active }: { active: boolean }) {
  const c = active ? "#FF4D6D" : "#6A5A7A";
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2">
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function PigIcon({ active }: { active: boolean }) {
  const c = active ? "#FF4D6D" : "#6A5A7A";
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
      <path d="M6 8 5 4l5 2.5" strokeLinejoin="round" />
      <path d="M18 8l1-4-5 2.5" strokeLinejoin="round" />
      <ellipse cx="12" cy="13" rx="8" ry="7" />
      <ellipse cx="12" cy="15" rx="3.2" ry="2.2" />
    </svg>
  );
}
