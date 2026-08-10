"use client";

/**
 * Home feed card — spec §6.2. No rating anywhere; the review text carries it.
 * The feed is one of only two places showing the full-body pig (the other is
 * the profile) — everywhere else uses the face.
 */
import Link from "next/link";
import { googlePhotoSrc } from "@/lib/api";
import type { FeedItem } from "@/lib/types";
import PigAvatar from "@/components/pigs/PigAvatar";
import { BudgetTag } from "@/components/pigs/PricePig";
import { OinkPig, ShamePig } from "@/components/pigs/ReactionPigs";
import { KIND_LABELS, timeAgo } from "@/components/ui";
import PlacePhoto from "@/components/PlacePhoto";

export default function ActivityCard({ item }: { item: FeedItem }) {
  const place = item.restaurant;

  return (
    <article className="card overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 pt-3">
        <Link href={`/profile/${item.user.username}`} className="shrink-0">
          <PigAvatar
            config={item.user.pig_avatar_config}
            placesLogged={item.user.places_logged}
            lastLoggedAt={item.user.last_logged_at}
            size={34}
            variant="full"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${item.user.username}`}
            className="block truncate font-display text-sm font-extrabold"
          >
            {item.user.display_name}
          </Link>
          <p className="text-xs text-ink-soft">{timeAgo(item.created_at)}</p>
        </div>
        <ActivityBadge activity={item.activity} />
      </div>

      <Link href={`/restaurant/${place.id}`} className="mt-2.5 block">
        {/* Google's listing photo leads; this person's own shot is the fallback. */}
        <PlacePhoto
          src={
            place.google_place_id
              ? googlePhotoSrc(place.id)
              : item.images[0]?.url ?? place.cover_image_url
          }
          alt={place.name}
          className="h-44 w-full border-y-2 border-ink"
        />

        <div className="space-y-2 px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-xl leading-tight">{place.name}</h2>
              <p className="text-sm text-ink-soft">
                {[place.city, KIND_LABELS[place.kind]].filter(Boolean).join(" · ")}
              </p>
            </div>
            <BudgetTag budget={place.budget} />
          </div>

          {item.review_text && <p className="text-sm leading-snug">{item.review_text}</p>}

          {item.recommended_dishes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {item.recommended_dishes.map((dish) => (
                <span key={dish} className="dish-tag">{dish}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}

function ActivityBadge({ activity }: { activity: FeedItem["activity"] }) {
  if (activity === "oink") {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-plum px-2.5 py-1 font-display text-[11px] font-bold text-white">
        <OinkPig size={16} active />
        oinked
      </span>
    );
  }
  if (activity === "shame") {
    return (
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-rust px-2.5 py-1 font-display text-[11px] font-bold text-white">
        <ShamePig size={16} active />
        shamed
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-gold-pale px-2.5 py-1 font-display text-[11px] font-bold text-[#7A6212]">
      recommends
    </span>
  );
}
