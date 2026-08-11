"use client";

/**
 * Primary navigation on a laptop.
 *
 * The phone gets a thumb-reachable bottom bar (BottomTabBar); a mouse has no
 * thumb zone and a 1400px-wide screen has no reason to put four links in a
 * strip along the bottom edge. So above `lg` the bar is hidden and this stands
 * down the left instead, where the pointer already is and where there's room
 * for the labels to sit beside the icons rather than under them.
 *
 * It shares TABS with the bar so the two can't drift apart.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TABS } from "@/components/BottomTabBar";

export default function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 hidden h-screen w-[228px] shrink-0 flex-col gap-1 border-r-2 border-ink bg-cream px-3 py-5 lg:flex">
      <p className="wordmark px-3 pb-4 text-4xl">oink</p>

      {TABS.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href.replace("/me", ""));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-display text-base font-bold
                        transition-colors duration-150 ${
                          active ? "bg-plum text-oat" : "text-ink hover:bg-oat"
                        }`}
          >
            <Icon />
            {label}
          </Link>
        );
      })}

      <p className="mt-auto px-3 text-[11px] text-ink-soft">where your friends actually eat</p>
    </nav>
  );
}
