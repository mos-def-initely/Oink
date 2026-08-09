"use client";

/** Horizontal place card — discover list view and wishlist (spec §6.3). */
import Link from "next/link";
import type { PlaceSummary } from "@/lib/types";
import PigAvatar from "@/components/pigs/PigAvatar";
import { BudgetTag } from "@/components/pigs/PricePig";
import PlacePhoto from "@/components/PlacePhoto";
import { KIND_LABELS } from "@/components/ui";

export default function PlaceListCard({ place }: { place: PlaceSummary }) {
  return (
    <Link href={`/restaurant/${place.id}`} className="card flex items-stretch overflow-hidden">
      <PlacePhoto src={place.cover_image_url} alt={place.name} className="w-[86px] shrink-0" />
      <div className="min-w-0 flex-1 space-y-1 px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 truncate font-display text-base font-extrabold leading-tight">
            {place.name}
          </h3>
          <BudgetTag budget={place.budget} size={22} />
        </div>

        <p className="truncate text-xs text-ink-soft">
          {[KIND_LABELS[place.kind], ...place.category].filter(Boolean).join(" · ")}
        </p>

        <div className="flex items-center gap-1 pt-0.5">
          {place.recommenders.slice(0, 4).map((u) => (
            <PigAvatar
              key={u.id}
              config={u.pig_avatar_config}
              placesLogged={u.places_logged}
              lastLoggedAt={u.last_logged_at}
              size={22}
              variant="face"
            />
          ))}
          <span className="ml-1 truncate text-xs text-ink-soft">
            {place.recommender_count > 0
              ? place.recommenders.slice(0, 2).map((u) => u.display_name).join(", ") +
                (place.recommender_count > 2 ? ` +${place.recommender_count - 2}` : "")
              : place.shame_count > 0
                ? "shamed, no takers"
                : "not logged yet"}
          </span>
        </div>
      </div>
    </Link>
  );
}
