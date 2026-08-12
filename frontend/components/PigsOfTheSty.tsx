"use client";

/**
 * The roster — everyone in the sty as a list, with their numbers.
 *
 * The field is for wandering around and recognising people; this is for
 * settling an argument about who has actually found anything. So it leads on
 * the two numbers the field can't show — what the group made of the places
 * you put on the map — rather than on how much you've logged.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@/lib/types";
import PigAvatar from "@/components/pigs/PigAvatar";
import { Sheet } from "@/components/ui";
import { TIER_LABELS, fatnessTier } from "@/lib/pig";

type Sort = "joined" | "og" | "oinks" | "shames";

const SORTS: [Sort, string][] = [
  ["joined", "Newest"],
  ["og", "OG oinks"],
  ["oinks", "Oinks received"],
  ["shames", "Shames received"],
];

/** Milliseconds since joining, or -Infinity for anyone missing a date, so the
 *  undated sink to the bottom rather than floating to the top of "newest". */
const joined = (u: User) => (u.joined_at ? new Date(u.joined_at).getTime() : -Infinity);

export default function PigsOfTheSty({
  open,
  onClose,
  users,
}: {
  open: boolean;
  onClose: () => void;
  users: User[];
}) {
  const [sort, setSort] = useState<Sort>("joined");

  const ordered = useMemo(() => {
    // Ties settle on the display name, so a sty where nobody has been shamed
    // yet still comes back in a stable, readable order.
    const byName = (a: User, b: User) => a.display_name.localeCompare(b.display_name);
    return [...users].sort((a, b) => {
      if (sort === "joined") return joined(b) - joined(a) || byName(a, b);
      if (sort === "og") return (b.og_oinks ?? 0) - (a.og_oinks ?? 0) || byName(a, b);
      if (sort === "oinks")
        return (b.og_oinks_received ?? 0) - (a.og_oinks_received ?? 0) || byName(a, b);
      return (b.og_shames_received ?? 0) - (a.og_shames_received ?? 0) || byName(a, b);
    });
  }, [users, sort]);

  return (
    <Sheet open={open} onClose={onClose} title="the pigs of the sty">
      <div className="space-y-3 pb-4">
        <div className="flex flex-wrap gap-1.5">
          {SORTS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={`tag ${sort === value ? "bg-plum text-oat" : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className="space-y-2">
          {ordered.map((u) => {
            const tier = fatnessTier(u.places_logged, u.last_logged_at);
            return (
              <li key={u.id}>
                <Link
                  href={`/profile/${u.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-card border-2 border-ink bg-cream p-2.5"
                >
                  <PigAvatar
                    config={u.pig_avatar_config}
                    placesLogged={u.places_logged}
                    lastLoggedAt={u.last_logged_at}
                    size={44}
                    variant="face"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold">{u.display_name}</p>
                    <p className="micro truncate">
                      {tier === "dead" ? "dead pig" : `${TIER_LABELS[tier].toLowerCase()} pig`} ·{" "}
                      {u.places_logged} {u.places_logged === 1 ? "place" : "places"}
                    </p>
                  </div>

                  {/* The three numbers, always in the same order however the
                      list is sorted — a column that moves is a column you have
                      to re-read every time. */}
                  <div className="flex shrink-0 items-center gap-1">
                    <Stat n={u.og_oinks ?? 0} label="og" className="bg-lilac text-ink" />
                    <Stat n={u.og_oinks_received ?? 0} label="oink" className="bg-gold text-ink" />
                    <Stat n={u.og_shames_received ?? 0} label="shame" className="bg-rust text-oat" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="micro">
          og — places you put on the map first. oink and shame — what everyone else made of them.
        </p>
      </div>
    </Sheet>
  );
}

function Stat({ n, label, className }: { n: number; label: string; className: string }) {
  return (
    <span
      className={`flex w-[42px] flex-col items-center rounded-lg border-2 border-ink py-0.5 ${className}`}
      title={label}
    >
      <span className="font-display text-sm font-extrabold leading-none tabular-nums">{n}</span>
      <span className="text-[9px] font-bold uppercase leading-tight tracking-wide">{label}</span>
    </span>
  );
}
