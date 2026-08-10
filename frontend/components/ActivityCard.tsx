"use client";

/**
 * Home feed items — spec §6.2.
 *
 * A reaction isn't a small review, it's a different kind of event, so the two
 * get different shapes:
 *
 *   recommendation  a card — thumbnail beside the review text and dish tags
 *   oink / shame    a single compact row — thumbnail, place, verdict, who
 *
 * That's deliberate. An oink carries no text, so a card built around a review
 * would sit half empty; padding it out with cuisine and budget would make an
 * endorsement look like a write-up and flatten the feed into identical blocks.
 * Two shapes give the feed a rhythm, and reviews stand out because they're the
 * thing worth stopping for.
 *
 * No rating appears anywhere (spec §8).
 */
import Link from "next/link";
import { googlePhotoSrc } from "@/lib/api";
import type { FeedItem } from "@/lib/types";
import PigAvatar from "@/components/pigs/PigAvatar";
import { BudgetTag } from "@/components/pigs/PricePig";
import { KIND_LABELS, timeAgo } from "@/components/ui";
import PlacePhoto from "@/components/PlacePhoto";

export default function ActivityCard({ item }: { item: FeedItem }) {
  return item.activity === "recommendation" ? <ReviewCard item={item} /> : <ReactionRow item={item} />;
}

/** Someone wrote something — the full card. */
function ReviewCard({ item }: { item: FeedItem }) {
  const place = item.restaurant;

  return (
    <article className="card overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
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
            className="block truncate font-display text-sm font-bold"
          >
            {item.user.display_name}
          </Link>
          <p className="micro">{timeAgo(item.created_at)}</p>
        </div>
        <span className="sticker bg-lemon text-ink-deep">recommends</span>
      </div>

      <div className="rule-dashed mx-3" />

      <Link href={`/restaurant/${place.id}`} className="flex gap-3 p-3">
        <PlacePhoto
          src={
            place.google_place_id
              ? googlePhotoSrc(place.id)
              : item.images[0]?.url ?? place.cover_image_url
          }
          alt={place.name}
          className="h-[74px] w-[74px] shrink-0 rounded-lg border-2 border-ink"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="min-w-0 truncate font-display text-lg font-bold leading-tight">
              {place.name}
            </h2>
            {/* Budget is never bare `$` text — it always travels with its pig. */}
            <BudgetTag budget={place.budget} size={26} />
          </div>
          <p className="micro mt-0.5">
            {[place.city, KIND_LABELS[place.kind]].filter(Boolean).join(" · ")}
          </p>
          {item.review_text && (
            <p className="mt-1.5 line-clamp-3 text-sm leading-snug">{item.review_text}</p>
          )}
          {item.recommended_dishes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.recommended_dishes.slice(0, 3).map((dish) => (
                <span key={dish} className="dish-tag">{dish}</span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}

/** Someone just reacted — one row, nothing padded out. */
function ReactionRow({ item }: { item: FeedItem }) {
  const place = item.restaurant;
  const shamed = item.activity === "shame";

  return (
    <article className="card">
      <Link href={`/restaurant/${place.id}`} className="flex items-center gap-2.5 p-2.5">
        <PlacePhoto
          src={place.cover_image_url}
          alt={place.name}
          className="h-[46px] w-[46px] shrink-0 rounded-md border-2 border-ink"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="min-w-0 truncate font-display text-base font-bold leading-tight">
              {place.name}
            </h2>
            <span
              className={`micro-pill shrink-0 ${shamed ? "bg-rust text-oat" : "bg-plum text-oat"}`}
            >
              {shamed ? "shamed" : "oinked"}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <p className="micro min-w-0 truncate">
              {[place.city, KIND_LABELS[place.kind]].filter(Boolean).join(" · ")}
            </p>
            <BudgetTag budget={place.budget} size={20} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <PigAvatar
            config={item.user.pig_avatar_config}
            placesLogged={item.user.places_logged}
            lastLoggedAt={item.user.last_logged_at}
            size={24}
            variant="face"
          />
          <span className="micro">{item.user.display_name}</span>
        </div>
      </Link>
    </article>
  );
}
